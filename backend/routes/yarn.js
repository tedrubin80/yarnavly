const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const yarnController = require('../controllers/yarnController');
const { upload } = require('../middleware/upload');

// Yarn inventory CRUD
router.get('/', auth, yarnController.getUserYarnInventory);
router.post('/', auth, upload.array('photos', 10), yarnController.createYarnEntry);
router.get('/low-stock', auth, yarnController.getLowStockYarn);
router.get('/:id', auth, yarnController.getYarnById);
router.put('/:id', auth, upload.array('photos', 10), yarnController.updateYarnEntry);
router.delete('/:id', auth, yarnController.deleteYarnEntry);

// Yarn search and filtering
router.post('/search', auth, yarnController.searchYarn);
router.get('/brands', auth, yarnController.getAllBrands);
router.get('/brands/:brandId/lines', auth, yarnController.getYarnLinesByBrand);

// Yarn usage tracking
router.get('/:id/usage', auth, yarnController.getYarnUsage);
router.post('/:id/use', auth, yarnController.recordYarnUsage);

// Shopping list integration
router.post('/:id/add-to-shopping-list', auth, yarnController.addToShoppingList);

// Admin routes
router.post('/brands', adminAuth, yarnController.createBrand);
router.post('/lines', adminAuth, yarnController.createYarnLine);

module.exports = router;