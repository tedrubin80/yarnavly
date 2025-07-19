const { YarnInventory, YarnLine, YarnBrand, ProjectYarnUsage } = require('../models');
const { Op } = require('sequelize');
const { uploadToGoogleDrive } = require('../services/googleDriveService');
const { syncToRavelry } = require('../services/ravelryService');
const { logger } = require('../middleware/errorHandler');

class YarnController {
  async getUserYarnInventory(req, res) {
    try {
      const { page = 1, limit = 20, search, brand, weight, color } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = { user_id: req.user.id };

      // Build search filters
      if (search) {
        whereClause[Op.or] = [
          { colorway: { [Op.iLike]: `%${search}%` } },
          { notes: { [Op.iLike]: `%${search}%` } },
          { storage_location: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (color) {
        whereClause.color_family = color;
      }

      const includeClause = [
        {
          model: YarnLine,
          include: [YarnBrand],
          where: {}
        }
      ];

      if (brand) {
        includeClause[0].where = {
          '$YarnLine.YarnBrand.id$': brand
        };
      }

      if (weight) {
        includeClause[0].where.weight_category = weight;
      }

      const yarn = await YarnInventory.findAndCountAll({
        where: whereClause,
        include: includeClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        yarn: yarn.rows,
        total: yarn.count,
        page: parseInt(page),
        totalPages: Math.ceil(yarn.count / limit)
      });
    } catch (error) {
      logger.error('Error fetching yarn inventory:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createYarnEntry(req, res) {
    try {
      const yarnData = {
        ...req.body,
        user_id: req.user.id
      };

      // Handle photo uploads to Google Drive
      if (req.files && req.files.length > 0 && req.user.google_drive_token) {
        const googleDriveService = require('../services/googleDriveService');
        await googleDriveService.initializeClient(req.user);
        
        const photoPromises = req.files.map(file => 
          googleDriveService.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            null, // Let service determine folder
            req.user.id
          )
        );
        const uploadedPhotos = await Promise.all(photoPromises);
        yarnData.photos = uploadedPhotos;
      }

      const yarn = await YarnInventory.create(yarnData);

      // Sync to Ravelry if connected
      if (req.user.ravelry_access_key) {
        // await syncToRavelry('stash', yarn, req.user);
      }

      res.status(201).json(yarn);
    } catch (error) {
      logger.error('Error creating yarn entry:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getYarnById(req, res) {
    try {
      const yarn = await YarnInventory.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        },
        include: [
          {
            model: YarnLine,
            include: [YarnBrand]
          }
        ]
      });

      if (!yarn) {
        return res.status(404).json({ error: 'Yarn not found' });
      }

      res.json(yarn);
    } catch (error) {
      logger.error('Error fetching yarn:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateYarnEntry(req, res) {
    try {
      const yarn = await YarnInventory.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!yarn) {
        return res.status(404).json({ error: 'Yarn not found' });
      }

      // Handle new photo uploads
      if (req.files && req.files.length > 0 && req.user.google_drive_token) {
        const googleDriveService = require('../services/googleDriveService');
        await googleDriveService.initializeClient(req.user);
        
        const photoPromises = req.files.map(file => 
          googleDriveService.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            null,
            req.user.id
          )
        );
        const uploadedPhotos = await Promise.all(photoPromises);
        
        // Merge with existing photos
        const existingPhotos = yarn.photos || [];
        req.body.photos = [...existingPhotos, ...uploadedPhotos];
      }

      await yarn.update(req.body);

      res.json(yarn);
    } catch (error) {
      logger.error('Error updating yarn:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteYarnEntry(req, res) {
    try {
      const yarn = await YarnInventory.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!yarn) {
        return res.status(404).json({ error: 'Yarn not found' });
      }

      // Delete associated photos from Google Drive
      if (yarn.photos && yarn.photos.length > 0 && req.user.google_drive_token) {
        const googleDriveService = require('../services/googleDriveService');
        await googleDriveService.initializeClient(req.user);
        
        for (const photo of yarn.photos) {
          if (photo.drive_id) {
            try {
              await googleDriveService.deleteFile(photo.drive_id, req.user.id);
            } catch (error) {
              logger.error('Error deleting photo:', error);
            }
          }
        }
      }

      await yarn.destroy();

      res.json({ message: 'Yarn deleted successfully' });
    } catch (error) {
      logger.error('Error deleting yarn:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async searchYarn(req, res) {
    try {
      const { query, filters = {} } = req.body;
      const whereClause = { user_id: req.user.id };

      if (query) {
        whereClause[Op.or] = [
          { colorway: { [Op.iLike]: `%${query}%` } },
          { notes: { [Op.iLike]: `%${query}%` } },
          { storage_location: { [Op.iLike]: `%${query}%` } },
          { '$YarnLine.name$': { [Op.iLike]: `%${query}%` } },
          { '$YarnLine.YarnBrand.name$': { [Op.iLike]: `%${query}%` } }
        ];
      }

      // Apply filters
      if (filters.color_family) {
        whereClause.color_family = filters.color_family;
      }

      if (filters.weight_category) {
        whereClause['$YarnLine.weight_category$'] = filters.weight_category;
      }

      if (filters.available_only) {
        whereClause.skeins_remaining = { [Op.gt]: 0 };
      }

      const results = await YarnInventory.findAll({
        where: whereClause,
        include: [
          {
            model: YarnLine,
            include: [YarnBrand]
          }
        ],
        limit: 50
      });

      res.json(results);
    } catch (error) {
      logger.error('Error searching yarn:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAllBrands(req, res) {
    try {
      const brands = await YarnBrand.findAll({
        order: [['name', 'ASC']]
      });

      res.json(brands);
    } catch (error) {
      logger.error('Error fetching brands:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getYarnLinesByBrand(req, res) {
    try {
      const yarnLines = await YarnLine.findAll({
        where: { brand_id: req.params.brandId },
        order: [['name', 'ASC']]
      });

      res.json(yarnLines);
    } catch (error) {
      logger.error('Error fetching yarn lines:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getYarnUsage(req, res) {
    try {
      const usage = await ProjectYarnUsage.findAll({
        where: { yarn_inventory_id: req.params.id },
        include: ['Project']
      });

      res.json(usage);
    } catch (error) {
      logger.error('Error fetching yarn usage:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async recordYarnUsage(req, res) {
    try {
      const { skeins_used, yardage_used, project_id } = req.body;

      const yarn = await YarnInventory.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!yarn) {
        return res.status(404).json({ error: 'Yarn not found' });
      }

      // Update remaining amounts
      yarn.skeins_remaining -= skeins_used;
      yarn.remaining_yardage -= yardage_used;

      if (yarn.skeins_remaining < 0 || yarn.remaining_yardage < 0) {
        return res.status(400).json({ error: 'Insufficient yarn available' });
      }

      await yarn.save();

      // Record usage
      const usage = await ProjectYarnUsage.create({
        project_id,
        yarn_inventory_id: yarn.id,
        skeins_used,
        yardage_used,
        usage_notes: req.body.usage_notes
      });

      res.json({ yarn, usage });
    } catch (error) {
      logger.error('Error recording yarn usage:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async addToShoppingList(req, res) {
    try {
      const { ShoppingList, ShoppingListItem } = require('../models');

      // Get or create active shopping list
      let shoppingList = await ShoppingList.findOne({
        where: {
          user_id: req.user.id,
          is_active: true
        }
      });

      if (!shoppingList) {
        shoppingList = await ShoppingList.create({
          user_id: req.user.id,
          name: 'My Shopping List',
          is_active: true
        });
      }

      const yarn = await YarnInventory.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        },
        include: [
          {
            model: YarnLine,
            include: [YarnBrand]
          }
        ]
      });

      if (!yarn) {
        return res.status(404).json({ error: 'Yarn not found' });
      }

      // Add to shopping list
      const item = await ShoppingListItem.create({
        shopping_list_id: shoppingList.id,
        item_type: 'yarn',
        yarn_line_id: yarn.yarn_line_id,
        item_name: `${yarn.YarnLine.YarnBrand.name} ${yarn.YarnLine.name}`,
        colorway: yarn.colorway,
        quantity: req.body.quantity || 1
      });

      res.json(item);
    } catch (error) {
      logger.error('Error adding to shopping list:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createBrand(req, res) {
    try {
      const brand = await YarnBrand.create(req.body);
      res.status(201).json(brand);
    } catch (error) {
      logger.error('Error creating brand:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createYarnLine(req, res) {
    try {
      const yarnLine = await YarnLine.create(req.body);
      res.status(201).json(yarnLine);
    } catch (error) {
      logger.error('Error creating yarn line:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getLowStockYarn(req, res) {
    try {
      const { limit = 10 } = req.query;

      const lowStockYarn = await YarnInventory.findAll({
        where: {
          user_id: req.user.id,
          [Op.or]: [
            { skeins_remaining: { [Op.lt]: 2 } },
            { remaining_yardage: { [Op.lt]: 100 } }
          ]
        },
        include: [
          {
            model: YarnLine,
            include: [YarnBrand]
          }
        ],
        order: [['skeins_remaining', 'ASC']],
        limit: parseInt(limit)
      });

      res.json(lowStockYarn);
    } catch (error) {
      logger.error('Error fetching low stock yarn:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new YarnController();