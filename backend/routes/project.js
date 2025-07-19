const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const projectController = require('../controllers/projectController');
const { upload } = require('../middleware/upload');

// Project CRUD
router.get('/', auth, projectController.getUserProjects);
router.post('/', auth, projectController.createProject);
router.get('/:id', auth, projectController.getProjectById);
router.put('/:id', auth, projectController.updateProject);
router.delete('/:id', auth, projectController.deleteProject);

// Project status management
router.patch('/:id/status', auth, projectController.updateProjectStatus);
router.get('/by-status/:status', auth, projectController.getProjectsByStatus);

// Progress tracking
router.post('/:id/progress', auth, upload.single('progressPhoto'), projectController.addProgress);
router.get('/:id/progress', auth, projectController.getProjectProgress);

// Yarn assignment
router.post('/:id/yarn', auth, projectController.assignYarnToProject);
router.delete('/:id/yarn/:yarnId', auth, projectController.removeYarnFromProject);

// Photos
router.post('/:id/photos', auth, upload.array('photos', 20), projectController.addProjectPhotos);
router.delete('/:id/photos/:photoId', auth, projectController.deleteProjectPhoto);

module.exports = router;