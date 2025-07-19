const { Pattern, PatternCategory, PatternDesigner, User } = require('../models');
const { Op } = require('sequelize');
const { uploadToGoogleDrive } = require('../services/googleDriveService');
const { logger } = require('../middleware/errorHandler');
const path = require('path');

class PatternController {
  async getUserPatterns(req, res) {
    try {
      const { page = 1, limit = 20, search, category, craft_type, difficulty } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = { user_id: req.user.id };

      // Build search filters
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { pattern_notes: { [Op.iLike]: `%${search}%` } },
          { personal_notes: { [Op.iLike]: `%${search}%` } },
          { '$PatternDesigner.name$': { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (craft_type) {
        whereClause.craft_type = craft_type;
      }

      if (difficulty) {
        whereClause.difficulty_level = difficulty;
      }

      const includeClause = [
        {
          model: PatternCategory,
          where: category ? { id: category } : undefined
        },
        {
          model: PatternDesigner
        }
      ];

      const patterns = await Pattern.findAndCountAll({
        where: whereClause,
        include: includeClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        patterns: patterns.rows,
        total: patterns.count,
        page: parseInt(page),
        totalPages: Math.ceil(patterns.count / limit)
      });
    } catch (error) {
      logger.error('Error fetching patterns:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createPattern(req, res) {
    try {
      const patternData = {
        ...req.body,
        user_id: req.user.id
      };

      // Parse JSON fields if they're strings
      if (typeof patternData.needle_sizes === 'string') {
        patternData.needle_sizes = JSON.parse(patternData.needle_sizes);
      }
      if (typeof patternData.sizes_available === 'string') {
        patternData.sizes_available = JSON.parse(patternData.sizes_available);
      }
      if (typeof patternData.techniques === 'string') {
        patternData.techniques = JSON.parse(patternData.techniques);
      }
      if (typeof patternData.tags === 'string') {
        patternData.tags = JSON.parse(patternData.tags);
      }

      // Handle file upload to Google Drive
      if (req.file && req.user.google_drive_token) {
        const googleDriveService = require('../services/googleDriveService');
        await googleDriveService.initializeClient(req.user);
        
        const fileUpload = await googleDriveService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          null, // Let service determine folder
          req.user.id
        );

        patternData.original_filename = req.file.originalname;
        patternData.file_type = path.extname(req.file.originalname).substring(1);
        patternData.google_drive_file_id = fileUpload.fileId;
        patternData.file_size_bytes = req.file.size;

        // Generate thumbnail for PDFs if possible
        if (req.file.mimetype === 'application/pdf') {
          // TODO: Implement PDF thumbnail generation
        }
      } else if (req.file) {
        // Store locally if Google Drive not connected
        patternData.original_filename = req.file.originalname;
        patternData.file_type = path.extname(req.file.originalname).substring(1);
        patternData.file_size_bytes = req.file.size;
        // TODO: Implement local file storage
      }

      // Handle designer
      if (patternData.designer_name && !patternData.designer_id) {
        const [designer] = await PatternDesigner.findOrCreate({
          where: { name: patternData.designer_name },
          defaults: { name: patternData.designer_name }
        });
        patternData.designer_id = designer.id;
      }

      const pattern = await Pattern.create(patternData);

      // Fetch with associations
      const createdPattern = await Pattern.findByPk(pattern.id, {
        include: [PatternCategory, PatternDesigner]
      });

      res.status(201).json(createdPattern);
    } catch (error) {
      logger.error('Error creating pattern:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getPatternById(req, res) {
    try {
      const pattern = await Pattern.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        },
        include: [PatternCategory, PatternDesigner]
      });

      if (!pattern) {
        return res.status(404).json({ error: 'Pattern not found' });
      }

      res.json(pattern);
    } catch (error) {
      logger.error('Error fetching pattern:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updatePattern(req, res) {
    try {
      const pattern = await Pattern.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!pattern) {
        return res.status(404).json({ error: 'Pattern not found' });
      }

      // Parse JSON fields if needed
      const updateData = { ...req.body };
      ['needle_sizes', 'sizes_available', 'techniques', 'tags'].forEach(field => {
        if (typeof updateData[field] === 'string') {
          updateData[field] = JSON.parse(updateData[field]);
        }
      });

      // Handle file upload if new file provided
      if (req.file && req.user.google_drive_token) {
        const googleDriveService = require('../services/googleDriveService');
        await googleDriveService.initializeClient(req.user);
        
        // Delete old file if exists
        if (pattern.google_drive_file_id) {
          try {
            await googleDriveService.deleteFile(pattern.google_drive_file_id, req.user.id);
          } catch (error) {
            logger.error('Error deleting old file:', error);
          }
        }

        // Upload new file
        const fileUpload = await googleDriveService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          null,
          req.user.id
        );

        updateData.original_filename = req.file.originalname;
        updateData.file_type = path.extname(req.file.originalname).substring(1);
        updateData.google_drive_file_id = fileUpload.fileId;
        updateData.file_size_bytes = req.file.size;
      }

      await pattern.update(updateData);

      const updatedPattern = await Pattern.findByPk(pattern.id, {
        include: [PatternCategory, PatternDesigner]
      });

      res.json(updatedPattern);
    } catch (error) {
      logger.error('Error updating pattern:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deletePattern(req, res) {
    try {
      const pattern = await Pattern.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!pattern) {
        return res.status(404).json({ error: 'Pattern not found' });
      }

      // Delete file from Google Drive
      if (pattern.google_drive_file_id && req.user.google_drive_token) {
        const googleDriveService = require('../services/googleDriveService');
        await googleDriveService.initializeClient(req.user);
        
        try {
          await googleDriveService.deleteFile(pattern.google_drive_file_id, req.user.id);
        } catch (error) {
          logger.error('Error deleting file from Google Drive:', error);
        }
      }

      await pattern.destroy();

      res.json({ message: 'Pattern deleted successfully' });
    } catch (error) {
      logger.error('Error deleting pattern:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async searchPatterns(req, res) {
    try {
      const { query, filters = {} } = req.body;
      const whereClause = { user_id: req.user.id };

      if (query) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${query}%` } },
          { pattern_notes: { [Op.iLike]: `%${query}%` } },
          { personal_notes: { [Op.iLike]: `%${query}%` } },
          { '$PatternDesigner.name$': { [Op.iLike]: `%${query}%` } },
          { '$PatternCategory.name$': { [Op.iLike]: `%${query}%` } }
        ];
      }

      // Apply filters
      if (filters.craft_type) {
        whereClause.craft_type = filters.craft_type;
      }

      if (filters.difficulty_level) {
        whereClause.difficulty_level = filters.difficulty_level;
      }

      if (filters.is_free !== undefined) {
        whereClause.is_free = filters.is_free;
      }

      if (filters.has_file) {
        whereClause.google_drive_file_id = { [Op.not]: null };
      }

      if (filters.min_yardage) {
        whereClause.yardage_required = { [Op.gte]: filters.min_yardage };
      }

      if (filters.max_yardage) {
        whereClause.yardage_max = { [Op.lte]: filters.max_yardage };
      }

      const results = await Pattern.findAll({
        where: whereClause,
        include: [PatternCategory, PatternDesigner],
        limit: 50,
        order: [['created_at', 'DESC']]
      });

      res.json(results);
    } catch (error) {
      logger.error('Error searching patterns:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCategories(req, res) {
    try {
      const categories = await PatternCategory.findAll({
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      });

      res.json(categories);
    } catch (error) {
      logger.error('Error fetching categories:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async viewPattern(req, res) {
    try {
      const pattern = await Pattern.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!pattern) {
        return res.status(404).json({ error: 'Pattern not found' });
      }

      if (!pattern.google_drive_file_id) {
        return res.status(404).json({ error: 'Pattern file not found' });
      }

      // Generate a temporary viewing URL
      // This would integrate with Google Drive API to generate a web view link
      const viewUrl = `/api/patterns/${pattern.id}/file`;

      res.json({ viewUrl, pattern });
    } catch (error) {
      logger.error('Error viewing pattern:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async downloadPattern(req, res) {
    try {
      const pattern = await Pattern.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!pattern) {
        return res.status(404).json({ error: 'Pattern not found' });
      }

      if (!pattern.google_drive_file_id || !req.user.google_drive_token) {
        return res.status(404).json({ error: 'Pattern file not available' });
      }

      const googleDriveService = require('../services/googleDriveService');
      await googleDriveService.initializeClient(req.user);
      
      const fileContent = await googleDriveService.downloadFile(pattern.google_drive_file_id);

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${pattern.original_filename}"`);
      res.send(fileContent);
    } catch (error) {
      logger.error('Error downloading pattern:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getPatternsByStash(req, res) {
    try {
      // Find patterns that match user's available yarn
      const userYarn = await YarnInventory.findAll({
        where: {
          user_id: req.user.id,
          remaining_yardage: { [Op.gt]: 0 }
        },
        include: [YarnLine]
      });

      const availableYardage = userYarn.reduce((sum, yarn) => sum + yarn.remaining_yardage, 0);
      const weightCategories = [...new Set(userYarn.map(y => y.YarnLine.weight_category))];

      const patterns = await Pattern.findAll({
        where: {
          user_id: req.user.id,
          yardage_required: { [Op.lte]: availableYardage }
        },
        include: [PatternCategory, PatternDesigner],
        order: [['yardage_required', 'DESC']]
      });

      res.json({
        patterns,
        availableYardage,
        weightCategories
      });
    } catch (error) {
      logger.error('Error getting patterns by stash:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getSimilarPatterns(req, res) {
    try {
      const pattern = await Pattern.findByPk(req.params.id, {
        include: [PatternCategory]
      });

      if (!pattern) {
        return res.status(404).json({ error: 'Pattern not found' });
      }

      // Find similar patterns based on category, craft type, and difficulty
      const similarPatterns = await Pattern.findAll({
        where: {
          user_id: req.user.id,
          id: { [Op.ne]: pattern.id },
          [Op.or]: [
            { category_id: pattern.category_id },
            { craft_type: pattern.craft_type },
            { difficulty_level: { [Op.between]: [pattern.difficulty_level - 1, pattern.difficulty_level + 1] } }
          ]
        },
        include: [PatternCategory, PatternDesigner],
        limit: 10,
        order: [['created_at', 'DESC']]
      });

      res.json(similarPatterns);
    } catch (error) {
      logger.error('Error getting similar patterns:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PatternController();