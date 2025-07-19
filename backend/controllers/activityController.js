// backend/controllers/activityController.js
const { 
  sequelize,
  YarnInventory,
  Pattern,
  Project,
  ProjectProgress,
  YarnLine,
  YarnBrand,
  PatternDesigner
} = require('../models');
const { Op } = require('sequelize');
const { logger } = require('../middleware/errorHandler');

class ActivityController {
  async getRecentActivity(req, res) {
    try {
      const { limit = 20, page = 1, type } = req.query;
      const offset = (page - 1) * limit;
      const userId = req.user.id;

      const activities = [];
      const whereClause = { user_id: userId };
      
      // Filter by type if specified
      const includeTypes = type ? [type] : ['yarn', 'pattern', 'project', 'progress'];

      // Fetch different activity types
      const promises = [];

      if (includeTypes.includes('yarn')) {
        promises.push(
          YarnInventory.findAll({
            where: whereClause,
            include: [{
              model: YarnLine,
              include: [YarnBrand]
            }],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            raw: false
          })
        );
      }

      if (includeTypes.includes('pattern')) {
        promises.push(
          Pattern.findAll({
            where: whereClause,
            include: [PatternDesigner],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit)
          })
        );
      }

      if (includeTypes.includes('project')) {
        promises.push(
          Project.findAll({
            where: whereClause,
            include: [Pattern],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit)
          })
        );
      }

      if (includeTypes.includes('progress')) {
        promises.push(
          ProjectProgress.findAll({
            include: [{
              model: Project,
              where: { user_id: userId },
              include: [Pattern]
            }],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit)
          })
        );
      }

      const results = await Promise.all(promises);

      // Format activities
      let typeIndex = 0;
      
      if (includeTypes.includes('yarn')) {
        results[typeIndex]?.forEach(yarn => {
          activities.push({
            id: `yarn-${yarn.id}`,
            type: 'yarn',
            action: 'added',
            description: `Added ${yarn.colorway} to inventory`,
            details: {
              brand: yarn.YarnLine?.YarnBrand?.name,
              line: yarn.YarnLine?.name,
              colorway: yarn.colorway,
              skeins: yarn.skeins_total
            },
            entityId: yarn.id,
            created_at: yarn.created_at
          });
        });
        typeIndex++;
      }

      if (includeTypes.includes('pattern')) {
        results[typeIndex]?.forEach(pattern => {
          activities.push({
            id: `pattern-${pattern.id}`,
            type: 'pattern',
            action: 'added',
            description: `Added pattern: ${pattern.title}`,
            details: {
              title: pattern.title,
              designer: pattern.PatternDesigner?.name,
              craft_type: pattern.craft_type
            },
            entityId: pattern.id,
            created_at: pattern.created_at
          });
        });
        typeIndex++;
      }

      if (includeTypes.includes('project')) {
        results[typeIndex]?.forEach(project => {
          activities.push({
            id: `project-${project.id}`,
            type: 'project',
            action: project.status === 'completed' ? 'completed' : 'started',
            description: `${project.status === 'completed' ? 'Completed' : 'Started'} project: ${project.project_name}`,
            details: {
              name: project.project_name,
              pattern: project.Pattern?.title,
              status: project.status
            },
            entityId: project.id,
            created_at: project.status === 'completed' ? project.completion_date : project.created_at
          });
        });
        typeIndex++;
      }

      if (includeTypes.includes('progress')) {
        results[typeIndex]?.forEach(progress => {
          activities.push({
            id: `progress-${progress.id}`,
            type: 'progress',
            action: 'updated',
            description: `Updated progress on ${progress.Project?.project_name}`,
            details: {
              project: progress.Project?.project_name,
              type: progress.progress_type,
              value: progress.progress_value,
              notes: progress.notes
            },
            entityId: progress.project_id,
            created_at: progress.created_at
          });
        });
      }

      // Sort all activities by date
      activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Paginate
      const paginatedActivities = activities.slice(offset, offset + parseInt(limit));

      res.json({
        activities: paginatedActivities,
        total: activities.length,
        page: parseInt(page),
        totalPages: Math.ceil(activities.length / limit)
      });
    } catch (error) {
      logger.error('Error fetching recent activity:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getActivitySummary(req, res) {
    try {
      const { period = 'week' } = req.query;
      const userId = req.user.id;

      let startDate = new Date();
      switch (period) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const whereClause = {
        user_id: userId,
        created_at: { [Op.gte]: startDate }
      };

      const [
        yarnAdded,
        patternsAdded,
        projectsStarted,
        projectsCompleted,
        progressUpdates
      ] = await Promise.all([
        YarnInventory.count({ where: whereClause }),
        Pattern.count({ where: whereClause }),
        Project.count({ where: whereClause }),
        Project.count({
          where: {
            user_id: userId,
            status: 'completed',
            completion_date: { [Op.gte]: startDate }
          }
        }),
        ProjectProgress.count({
          where: {
            created_at: { [Op.gte]: startDate }
          },
          include: [{
            model: Project,
            where: { user_id: userId },
            required: true
          }]
        })
      ]);

      res.json({
        period,
        startDate,
        summary: {
          yarnAdded,
          patternsAdded,
          projectsStarted,
          projectsCompleted,
          progressUpdates,
          totalActivities: yarnAdded + patternsAdded + projectsStarted + projectsCompleted + progressUpdates
        }
      });
    } catch (error) {
      logger.error('Error fetching activity summary:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getActivityCalendar(req, res) {
    try {
      const { year, month } = req.query;
      const userId = req.user.id;

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Get all activities for the month
      const [
        yarnActivities,
        patternActivities,
        projectActivities,
        progressActivities
      ] = await Promise.all([
        YarnInventory.findAll({
          where: {
            user_id: userId,
            created_at: {
              [Op.between]: [startDate, endDate]
            }
          },
          attributes: ['id', 'created_at', 'colorway']
        }),
        Pattern.findAll({
          where: {
            user_id: userId,
            created_at: {
              [Op.between]: [startDate, endDate]
            }
          },
          attributes: ['id', 'created_at', 'title']
        }),
        Project.findAll({
          where: {
            user_id: userId,
            [Op.or]: [
              {
                created_at: {
                  [Op.between]: [startDate, endDate]
                }
              },
              {
                completion_date: {
                  [Op.between]: [startDate, endDate]
                }
              }
            ]
          },
          attributes: ['id', 'created_at', 'completion_date', 'project_name', 'status']
        }),
        ProjectProgress.findAll({
          where: {
            progress_date: {
              [Op.between]: [startDate, endDate]
            }
          },
          include: [{
            model: Project,
            where: { user_id: userId },
            attributes: ['project_name']
          }],
          attributes: ['id', 'progress_date', 'progress_type']
        })
      ]);

      // Organize by date
      const calendar = {};

      const addToCalendar = (date, activity) => {
        const dateKey = date.toISOString().split('T')[0];
        if (!calendar[dateKey]) {
          calendar[dateKey] = [];
        }
        calendar[dateKey].push(activity);
      };

      yarnActivities.forEach(yarn => {
        addToCalendar(yarn.created_at, {
          type: 'yarn',
          id: yarn.id,
          title: `Added yarn: ${yarn.colorway}`,
          time: yarn.created_at
        });
      });

      patternActivities.forEach(pattern => {
        addToCalendar(pattern.created_at, {
          type: 'pattern',
          id: pattern.id,
          title: `Added pattern: ${pattern.title}`,
          time: pattern.created_at
        });
      });

      projectActivities.forEach(project => {
        if (project.created_at >= startDate && project.created_at <= endDate) {
          addToCalendar(project.created_at, {
            type: 'project',
            id: project.id,
            title: `Started: ${project.project_name}`,
            time: project.created_at
          });
        }
        if (project.completion_date && project.completion_date >= startDate && project.completion_date <= endDate) {
          addToCalendar(project.completion_date, {
            type: 'project-complete',
            id: project.id,
            title: `Completed: ${project.project_name}`,
            time: project.completion_date
          });
        }
      });

      progressActivities.forEach(progress => {
        addToCalendar(progress.progress_date, {
          type: 'progress',
          id: progress.id,
          title: `Progress: ${progress.Project.project_name}`,
          time: progress.progress_date
        });
      });

      res.json({
        year: parseInt(year),
        month: parseInt(month),
        calendar
      });
    } catch (error) {
      logger.error('Error fetching activity calendar:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async exportActivityLog(req, res) {
    try {
      const { startDate, endDate, format = 'json' } = req.query;
      const userId = req.user.id;

      const whereClause = {
        user_id: userId
      };

      if (startDate && endDate) {
        whereClause.created_at = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      // Fetch all activities
      const [yarn, patterns, projects] = await Promise.all([
        YarnInventory.findAll({
          where: whereClause,
          include: [{
            model: YarnLine,
            include: [YarnBrand]
          }],
          order: [['created_at', 'DESC']]
        }),
        Pattern.findAll({
          where: whereClause,
          include: [PatternDesigner],
          order: [['created_at', 'DESC']]
        }),
        Project.findAll({
          where: whereClause,
          include: [Pattern],
          order: [['created_at', 'DESC']]
        })
      ]);

      const activityLog = {
        exportDate: new Date(),
        user: req.user.email,
        period: {
          start: startDate || 'beginning',
          end: endDate || 'present'
        },
        activities: {
          yarn: yarn.map(y => ({
            date: y.created_at,
            brand: y.YarnLine?.YarnBrand?.name,
            line: y.YarnLine?.name,
            colorway: y.colorway,
            skeins: y.skeins_total,
            yardage: y.total_yardage
          })),
          patterns: patterns.map(p => ({
            date: p.created_at,
            title: p.title,
            designer: p.PatternDesigner?.name,
            craft_type: p.craft_type,
            difficulty: p.difficulty_level
          })),
          projects: projects.map(p => ({
            date: p.created_at,
            name: p.project_name,
            pattern: p.Pattern?.title,
            status: p.status,
            startDate: p.start_date,
            completionDate: p.completion_date
          }))
        },
        summary: {
          totalYarnAdded: yarn.length,
          totalPatternsAdded: patterns.length,
          totalProjectsStarted: projects.length,
          totalProjectsCompleted: projects.filter(p => p.status === 'completed').length
        }
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csv = this.convertToCSV(activityLog);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="activity-log.csv"');
        res.send(csv);
      } else {
        res.json(activityLog);
      }
    } catch (error) {
      logger.error('Error exporting activity log:', error);
      res.status(500).json({ error: error.message });
    }
  }

  convertToCSV(activityLog) {
    const rows = [];
    rows.push(['Activity Log Export']);
    rows.push([`Export Date: ${activityLog.exportDate}`]);
    rows.push([`User: ${activityLog.user}`]);
    rows.push(['']);
    
    // Yarn activities
    rows.push(['YARN INVENTORY']);
    rows.push(['Date', 'Brand', 'Line', 'Colorway', 'Skeins', 'Yardage']);
    activityLog.activities.yarn.forEach(y => {
      rows.push([
        y.date,
        y.brand || '',
        y.line || '',
        y.colorway,
        y.skeins,
        y.yardage
      ]);
    });
    
    rows.push(['']);
    
    // Pattern activities
    rows.push(['PATTERNS']);
    rows.push(['Date', 'Title', 'Designer', 'Craft Type', 'Difficulty']);
    activityLog.activities.patterns.forEach(p => {
      rows.push([
        p.date,
        p.title,
        p.designer || '',
        p.craft_type,
        p.difficulty || ''
      ]);
    });
    
    rows.push(['']);
    
    // Project activities
    rows.push(['PROJECTS']);
    rows.push(['Date', 'Name', 'Pattern', 'Status', 'Start Date', 'Completion Date']);
    activityLog.activities.projects.forEach(p => {
      rows.push([
        p.date,
        p.name,
        p.pattern || '',
        p.status,
        p.startDate || '',
        p.completionDate || ''
      ]);
    });
    
    // Convert to CSV string
    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }
}

module.exports = new ActivityController();