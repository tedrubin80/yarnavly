// backend/controllers/dashboardController.js
const { 
  YarnInventory, 
  Pattern, 
  Project, 
  ProjectProgress,
  YarnLine,
  YarnBrand,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');
const { logger } = require('../middleware/errorHandler');

class DashboardController {
  async getStats(req, res) {
    try {
      const userId = req.user.id;

      // Get counts
      const [
        totalYarn,
        totalPatterns,
        activeProjects,
        completedProjects,
        totalProjects
      ] = await Promise.all([
        YarnInventory.count({ where: { user_id: userId } }),
        Pattern.count({ where: { user_id: userId } }),
        Project.count({ where: { user_id: userId, status: 'active' } }),
        Project.count({ where: { user_id: userId, status: 'completed' } }),
        Project.count({ where: { user_id: userId } })
      ]);

      // Calculate total yarn value
      const yarnValue = await YarnInventory.sum('purchase_price', {
        where: { user_id: userId }
      }) || 0;

      // Get yarn weight distribution
      const yarnByWeight = await YarnInventory.findAll({
        where: { user_id: userId },
        include: [{
          model: YarnLine,
          attributes: ['weight_category']
        }],
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('YarnInventory.id')), 'count'],
          [sequelize.col('YarnLine.weight_category'), 'weight_category']
        ],
        group: ['YarnLine.weight_category'],
        raw: true
      });

      // Get recent activity metrics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentMetrics = await Promise.all([
        YarnInventory.count({
          where: {
            user_id: userId,
            created_at: { [Op.gte]: thirtyDaysAgo }
          }
        }),
        Pattern.count({
          where: {
            user_id: userId,
            created_at: { [Op.gte]: thirtyDaysAgo }
          }
        }),
        Project.count({
          where: {
            user_id: userId,
            created_at: { [Op.gte]: thirtyDaysAgo }
          }
        })
      ]);

      res.json({
        totalYarn,
        totalPatterns,
        activeProjects,
        completedProjects,
        totalProjects,
        yarnValue: parseFloat(yarnValue).toFixed(2),
        yarnByWeight,
        recentActivity: {
          newYarn: recentMetrics[0],
          newPatterns: recentMetrics[1],
          newProjects: recentMetrics[2]
        },
        lastUpdated: new Date()
      });
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getRecentProjects(req, res) {
    try {
      const { limit = 5 } = req.query;

      const recentProjects = await Project.findAll({
        where: {
          user_id: req.user.id,
          status: { [Op.in]: ['active', 'hibernating'] }
        },
        include: [{
          model: Pattern,
          attributes: ['title', 'craft_type']
        }],
        order: [['updated_at', 'DESC']],
        limit: parseInt(limit)
      });

      // Calculate progress for each project
      const projectsWithProgress = await Promise.all(
        recentProjects.map(async (project) => {
          const progress = await ProjectProgress.findOne({
            where: { project_id: project.id },
            order: [['created_at', 'DESC']]
          });

          return {
            ...project.toJSON(),
            progress_percentage: progress?.progress_value || 0
          };
        })
      );

      res.json(projectsWithProgress);
    } catch (error) {
      logger.error('Error fetching recent projects:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getYarnUsageStats(req, res) {
    try {
      const userId = req.user.id;

      // Get total yarn statistics
      const yarnStats = await YarnInventory.findAll({
        where: { user_id: userId },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('total_yardage')), 'totalYardage'],
          [sequelize.fn('SUM', sequelize.col('remaining_yardage')), 'remainingYardage'],
          [sequelize.fn('SUM', sequelize.col('skeins_total')), 'totalSkeins'],
          [sequelize.fn('SUM', sequelize.col('skeins_remaining')), 'remainingSkeins']
        ],
        raw: true
      });

      const stats = yarnStats[0] || {
        totalYardage: 0,
        remainingYardage: 0,
        totalSkeins: 0,
        remainingSkeins: 0
      };

      // Calculate usage percentages
      const yardageUsed = stats.totalYardage - stats.remainingYardage;
      const skeinsUsed = stats.totalSkeins - stats.remainingSkeins;
      const usagePercentage = stats.totalYardage > 0 
        ? ((yardageUsed / stats.totalYardage) * 100).toFixed(1)
        : 0;

      // Get yarn by color family distribution
      const colorDistribution = await YarnInventory.findAll({
        where: { user_id: userId },
        attributes: [
          'color_family',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('remaining_yardage')), 'totalYardage']
        ],
        group: ['color_family'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
      });

      res.json({
        totalYardage: parseInt(stats.totalYardage) || 0,
        remainingYardage: parseInt(stats.remainingYardage) || 0,
        yardageUsed,
        totalSkeins: parseFloat(stats.totalSkeins) || 0,
        remainingSkeins: parseFloat(stats.remainingSkeins) || 0,
        skeinsUsed,
        usagePercentage,
        colorDistribution
      });
    } catch (error) {
      logger.error('Error fetching yarn usage stats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getUpcomingDeadlines(req, res) {
    try {
      const { days = 30 } = req.query;
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + parseInt(days));

      const projectsWithDeadlines = await Project.findAll({
        where: {
          user_id: req.user.id,
          status: { [Op.in]: ['active', 'queued'] },
          target_completion_date: {
            [Op.and]: [
              { [Op.not]: null },
              { [Op.lte]: futureDate },
              { [Op.gte]: new Date() }
            ]
          }
        },
        include: [{
          model: Pattern,
          attributes: ['title']
        }],
        order: [['target_completion_date', 'ASC']],
        limit: 10
      });

      res.json(projectsWithDeadlines);
    } catch (error) {
      logger.error('Error fetching upcoming deadlines:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getProjectCompletionRate(req, res) {
    try {
      const { period = 'year' } = req.query;
      const userId = req.user.id;

      let startDate = new Date();
      switch (period) {
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
        default:
          startDate.setFullYear(startDate.getFullYear() - 1);
      }

      const [started, completed] = await Promise.all([
        Project.count({
          where: {
            user_id: userId,
            created_at: { [Op.gte]: startDate }
          }
        }),
        Project.count({
          where: {
            user_id: userId,
            status: 'completed',
            completion_date: { [Op.gte]: startDate }
          }
        })
      ]);

      const completionRate = started > 0 
        ? ((completed / started) * 100).toFixed(1)
        : 0;

      res.json({
        period,
        projectsStarted: started,
        projectsCompleted: completed,
        completionRate: parseFloat(completionRate)
      });
    } catch (error) {
      logger.error('Error calculating completion rate:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new DashboardController();