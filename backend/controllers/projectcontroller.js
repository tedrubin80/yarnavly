const { Project, Pattern, ProjectYarnUsage, YarnInventory, ProjectProgress, YarnLine, YarnBrand } = require('../models');
const { Op } = require('sequelize');
const { uploadToGoogleDrive } = require('../services/googleDriveService');
const { logger } = require('../middleware/errorHandler');

class ProjectController {
  async getUserProjects(req, res) {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = { user_id: req.user.id };

      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause[Op.or] = [
          { project_name: { [Op.iLike]: `%${search}%` } },
          { modifications: { [Op.iLike]: `%${search}%` } },
          { recipient: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const projects = await Project.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Pattern,
            include: ['PatternCategory', 'PatternDesigner']
          },
          {
            model: ProjectYarnUsage,
            include: [
              {
                model: YarnInventory,
                include: [
                  {
                    model: YarnLine,
                    include: [YarnBrand]
                  }
                ]
              }
            ]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [
          ['priority', 'DESC'],
          ['updated_at', 'DESC']
        ]
      });

      res.json({
        projects: projects.rows,
        total: projects.count,
        page: parseInt(page),
        totalPages: Math.ceil(projects.count / limit)
      });
    } catch (error) {
      logger.error('Error fetching projects:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createProject(req, res) {
    try {
      const projectData = {
        ...req.body,
        user_id: req.user.id,
        status: req.body.status || 'queued'
      };

      const project = await Project.create(projectData);

      // If yarn is specified, add yarn usage
      if (req.body.yarn_inventory_ids && req.body.yarn_inventory_ids.length > 0) {
        const yarnUsagePromises = req.body.yarn_inventory_ids.map(yarnId => 
          ProjectYarnUsage.create({
            project_id: project.id,
            yarn_inventory_id: yarnId,
            skeins_used: 0,
            yardage_used: 0
          })
        );
        await Promise.all(yarnUsagePromises);
      }

      const createdProject = await Project.findByPk(project.id, {
        include: [
          {
            model: Pattern,
            include: ['PatternCategory', 'PatternDesigner']
          },
          {
            model: ProjectYarnUsage,
            include: [YarnInventory]
          }
        ]
      });

      res.status(201).json(createdProject);
    } catch (error) {
      logger.error('Error creating project:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getProjectById(req, res) {
    try {
      const project = await Project.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        },
        include: [
          {
            model: Pattern,
            include: ['PatternCategory', 'PatternDesigner']
          },
          {
            model: ProjectYarnUsage,
            include: [
              {
                model: YarnInventory,
                include: [
                  {
                    model: YarnLine,
                    include: [YarnBrand]
                  }
                ]
              }
            ]
          },
          {
            model: ProjectProgress,
            order: [['progress_date', 'DESC']]
          }
        ]
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      logger.error('Error fetching project:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateProject(req, res) {
    try {
      const project = await Project.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // If status is changing to completed, set completion date
      if (req.body.status === 'completed' && project.status !== 'completed') {
        req.body.completion_date = new Date();
      }

      await project.update(req.body);

      const updatedProject = await Project.findByPk(project.id, {
        include: [
          {
            model: Pattern,
            include: ['PatternCategory', 'PatternDesigner']
          },
          {
            model: ProjectYarnUsage,
            include: [YarnInventory]
          }
        ]
      });

      res.json(updatedProject);
    } catch (error) {
      logger.error('Error updating project:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteProject(req, res) {
    try {
      const project = await Project.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Delete associated photos from Google Drive
      if (req.user.google_drive_token) {
        const allPhotos = [
          ...(project.progress_photos || []),
          ...(project.finished_photos || [])
        ];

        if (allPhotos.length > 0) {
          const googleDriveService = require('../services/googleDriveService');
          await googleDriveService.initializeClient(req.user);
          
          for (const photo of allPhotos) {
            if (photo.drive_id) {
              try {
                await googleDriveService.deleteFile(photo.drive_id, req.user.id);
              } catch (error) {
                logger.error('Error deleting photo:', error);
              }
            }
          }
        }
      }

      await project.destroy();

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      logger.error('Error deleting project:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateProjectStatus(req, res) {
    try {
      const { status } = req.body;

      const project = await Project.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const updateData = { status };

      // Set dates based on status
      if (status === 'active' && !project.start_date) {
        updateData.start_date = new Date();
      } else if (status === 'completed') {
        updateData.completion_date = new Date();
      }

      await project.update(updateData);

      res.json(project);
    } catch (error) {
      logger.error('Error updating project status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getProjectsByStatus(req, res) {
    try {
      const { status } = req.params;

      const projects = await Project.findAll({
        where: {
          user_id: req.user.id,
          status: status
        },
        include: [
          {
            model: Pattern,
            include: ['PatternCategory', 'PatternDesigner']
          }
        ],
        order: [
          ['priority', 'DESC'],
          ['updated_at', 'DESC']
        ]
      });

      res.json(projects);
    } catch (error) {
      logger.error('Error fetching projects by status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async addProgress(req, res) {
    try {
      const project = await Project.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const progressData = {
        ...req.body,
        project_id: project.id
      };

      // Handle photo upload
      if (req.file && req.user.google_drive_token) {
        const googleDriveService = require('../services/googleDriveService');
        await googleDriveService.initializeClient(req.user);
        
        const fileUpload = await googleDriveService.uploadFile(
          req.file.buffer,
          `progress_${project.id}_${Date.now()}_${req.file.originalname}`,
          req.file.mimetype,
          project.google_drive_folder_id,
          req.user.id
        );

        progressData.photo_drive_id = fileUpload.fileId;

        // Add to project's progress photos
        const progressPhotos = project.progress_photos || [];
        progressPhotos.push({
          drive_id: fileUpload.fileId,
          filename: req.file.originalname,
          uploaded_at: new Date(),
          thumbnail_url: fileUpload.thumbnailLink
        });
        await project.update({ progress_photos: progressPhotos });
      }

      const progress = await ProjectProgress.create(progressData);

      // Update project's total hours if provided
      if (progressData.hours_worked) {
        await project.increment('total_hours_worked', { by: progressData.hours_worked });
      }

      res.status(201).json(progress);
    } catch (error) {
      logger.error('Error adding progress:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getProjectProgress(req, res) {
    try {
      const project = await Project.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const progress = await ProjectProgress.findAll({
        where: { project_id: project.id },
        order: [['progress_date', 'DESC']]
      });

      res.json(progress);
    } catch (error) {
      logger.error('Error fetching project progress:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async assignYarnToProject(req, res) {
    try {
      const { yarn_inventory_id, skeins_allocated, yardage_allocated } = req.body;

      const project = await Project.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Verify yarn belongs to user
      const yarn = await YarnInventory.findOne({
        where: {
          id: yarn_inventory_id,
          user_id: req.user.id
        }
      });

      if (!yarn) {
        return res.status(404).json({ error: 'Yarn not found' });
      }

      // Check if yarn is already assigned
      let yarnUsage = await ProjectYarnUsage.findOne({
        where: {
          project_id: project.id,
          yarn_inventory_id: yarn.id
        }
      });

      if (yarnUsage) {
        // Update existing assignment
        await yarnUsage.update({
          skeins_used: skeins_allocated || yarnUsage.skeins_used,
          yardage_used: yardage_allocated || yarnUsage.yardage_used
        });
      } else {
        // Create new assignment
        yarnUsage = await ProjectYarnUsage.create({
          project_id: project.id,
          yarn_inventory_id: yarn.id,
          skeins_used: skeins_allocated || 0,
          yardage_used: yardage_allocated || 0
        });
      }

      res.json(yarnUsage);
    } catch (error) {
      logger.error('Error assigning yarn to project:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async removeYarnFromProject(req, res) {
    try {
      const project = await Project.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const deleted = await ProjectYarnUsage.destroy({
        where: {
          project_id: project.id,
          yarn_inventory_id: req.params.yarnId
        }
      });

      if (!deleted) {
        return res.status(404).json({ error: 'Yarn assignment not found' });
      }

      res.json({ message: 'Yarn removed from project successfully' });
    } catch (error) {
      logger.error('Error removing yarn from project:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async addProjectPhotos(req, res) {
    try {
      const project = await Project.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No photos provided' });
      }

      const uploadedPhotos = [];

      if (req.user.google_drive_token) {
        const googleDriveService = require('../services/googleDriveService');
        await googleDriveService.initializeClient(req.user);
        
        for (const file of req.files) {
          const fileUpload = await googleDriveService.uploadFile(
            file.buffer,
            `project_${project.id}_${Date.now()}_${file.originalname}`,
            file.mimetype,
            project.google_drive_folder_id,
            req.user.id
          );

          uploadedPhotos.push({
            drive_id: fileUpload.fileId,
            filename: file.originalname,
            uploaded_at: new Date(),
            thumbnail_url: fileUpload.thumbnailLink
          });
        }
      }

      // Determine which array to update based on project status
      const photoField = project.status === 'completed' ? 'finished_photos' : 'progress_photos';
      const existingPhotos = project[photoField] || [];
      const updatedPhotos = [...existingPhotos, ...uploadedPhotos];

      await project.update({ [photoField]: updatedPhotos });

      res.json({ photos: uploadedPhotos });
    } catch (error) {
      logger.error('Error adding project photos:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteProjectPhoto(req, res) {
    try {
      const project = await Project.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const photoId = req.params.photoId;

      // Check both photo arrays
      let photos = project.progress_photos || [];
      let photoField = 'progress_photos';
      let photoIndex = photos.findIndex(p => p.drive_id === photoId);

      if (photoIndex === -1) {
        photos = project.finished_photos || [];
        photoField = 'finished_photos';
        photoIndex = photos.findIndex(p => p.drive_id === photoId);
      }

      if (photoIndex === -1) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      // Delete from Google Drive
      if (req.user.google_drive_token) {
        const googleDriveService = require('../services/googleDriveService');
        await googleDriveService.initializeClient(req.user);
        
        try {
          await googleDriveService.deleteFile(photoId, req.user.id);
        } catch (error) {
          logger.error('Error deleting photo from Google Drive:', error);
        }
      }

      // Remove from array
      photos.splice(photoIndex, 1);
      await project.update({ [photoField]: photos });

      res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
      logger.error('Error deleting project photo:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ProjectController();