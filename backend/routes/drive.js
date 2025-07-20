// backend/routes/drive.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const driveController = require('../controllers/driveController');
const { upload } = require('../middleware/upload');

// Authentication
router.post('/connect', auth, driveController.connectGoogleDrive);
router.get('/callback', auth, driveController.handleGoogleDriveCallback);
router.delete('/disconnect', auth, driveController.disconnectGoogleDrive);
router.get('/status', auth, driveController.getDriveStatus);

// File operations
router.post('/upload', auth, upload.single('file'), driveController.uploadFile);
router.get('/download/:fileId', auth, driveController.downloadFile);
router.delete('/delete/:fileId', auth, driveController.deleteFile);

// Backup operations
router.post('/backup/full', auth, driveController.createFullBackup);
router.post('/backup/patterns', auth, driveController.backupPatterns);
router.post('/backup/photos', auth, driveController.backupPhotos);
router.get('/backups', auth, driveController.listBackups);
router.post('/restore/:backupId', auth, driveController.restoreFromBackup);
router.delete('/backups/cleanup', auth, driveController.cleanupOldBackups);

// Folder management
router.post('/folders', auth, driveController.createFolder);
router.get('/folders', auth, driveController.listFolders);

module.exports = router;