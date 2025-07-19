const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const patternController = require('../controllers/patternController');
const { upload } = require('../middleware/upload');

// Pattern CRUD
router.get('/', auth, patternController.getUserPatterns);
router.post('/', auth, upload.single('patternFile'), patternController.createPattern);
router.get('/categories', auth, patternController.getCategories);
router.get('/:id', auth, patternController.getPatternById);
router.put('/:id', auth, upload.single('patternFile'), patternController.updatePattern);
router.delete('/:id', auth, patternController.deletePattern);

// Pattern search and filtering
router.post('/search', auth, patternController.searchPatterns);

// Pattern viewing and download
router.get('/:id/view', auth, patternController.viewPattern);
router.get('/:id/download', auth, patternController.downloadPattern);

// Pattern recommendations
router.get('/recommendations/by-stash', auth, patternController.getPatternsByStash);
router.get('/recommendations/similar/:id', auth, patternController.getSimilarPatterns);

module.exports = router;