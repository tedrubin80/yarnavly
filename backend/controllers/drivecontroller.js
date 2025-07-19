const googleDriveService = require('../services/googleDriveService');
const { User } = require('../models');
const { logger } = require('../middleware/errorHandler');

class DriveController {
  async connectGoogleDrive(req, res) {
    try {
      const authUrl = googleDriveService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      logger.error('Error getting Google Drive auth URL:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async handleGoogleDriveCallback(req, res) {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({ error: 'Authorization code not provided' });
      }

      const tokens = await googleDriveService.getTokensFromCode(code);
      
      // Save tokens to user
      await req.user.update({
        google_drive_token: tokens.access_token,
        google_drive_refresh_token: tokens.refresh_token
      });

      // Initialize client and create folder structure
      await googleDriveService.initializeClient(req.user);
      await googleDriveService.createAppFolderStructure(req.user);

      res.redirect(`${process.env.FRONTEND_URL}/settings?connected=google_drive`);
    } catch (error) {
      logger.error('Error handling Google Drive callback:', error);
      res.redirect(`${process.env.FRONTEND_URL}/settings?error=google_drive_connection_failed`);
    }
  }

  async disconnectGoogleDrive(req, res) {
    try {
      await req.user.update({
        google_drive_token: null,
        google_drive_refresh_token: null
      });

      res.json({ message: 'Google Drive disconnected successfully' });
    } catch (error) {
      logger.error('Error disconnecting Google Drive:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getDriveStatus(req, res) {
    try {
      const isConnected = !!req.user.google_drive_token;
      
      if (!isConnected) {
        return res.json({ connected: false });
      }

      // Get storage info
      await googleDriveService.initializeClient(req.user);
      const storageInfo = await googleDriveService.getStorageInfo(req.user);

      res.json({
        connected: true,
        storage: storageInfo
      });
    } catch (error) {
      logger.error('Error getting Drive status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      if (!req.user.google_drive_token) {
        return res.status(400).json({ error: 'Google Drive not connected' });
      }

      await googleDriveService.initializeClient(req.user);
      
      const result = await googleDriveService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.body.folderId,
        req.user.id
      );

      res.json(result);
    } catch (error) {
      logger.error('Error uploading file:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async downloadFile(req, res) {
    try {
      if (!req.user.google_drive_token) {
        return res.status(400).json({ error: 'Google Drive not connected' });
      }

      await googleDriveService.initializeClient(req.user);
      const fileContent = await googleDriveService.downloadFile(req.params.fileId);

      // Set appropriate headers
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${req.query.filename || 'download'}"`);
      
      res.send(fileContent);
    } catch (error) {
      logger.error('Error downloading file:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteFile(req, res) {
    try {
      if (!req.user.google_drive_token) {
        return res.status(400).json({ error: 'Google Drive not connected' });
      }

      await googleDriveService.initializeClient(req.user);
      await googleDriveService.deleteFile(req.params.fileId, req.user.id);

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      logger.error('Error deleting file:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createFullBackup(req, res) {
    try {
      if (!req.user.google_drive_token) {
        return res.status(400).json({ error: 'Google Drive not connected' });
      }

      await googleDriveService.initializeClient(req.user);
      const backupResult = await googleDriveService.createFullBackup(req.user);

      res.json({
        message: 'Backup created successfully',
        backup: backupResult
      });
    } catch (error) {
      logger.error('Error creating backup:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async backupPatterns(req, res) {
    try {
      if (!req.user.google_drive_token) {
        return res.status(400).json({ error: 'Google Drive not connected' });
      }

      const { Pattern } = require('../models');
      
      const patterns = await Pattern.findAll({
        where: { 
          user_id: req.user.id,
          google_drive_file_id: null
        }
      });

      await googleDriveService.initializeClient(req.user);
      const results = await googleDriveService.uploadPatterns(patterns, req.user);

      res.json({
        message: 'Pattern backup completed',
        uploaded: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length,
        results
      });
    } catch (error) {
      logger.error('Error backing up patterns:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async backupPhotos(req, res) {
    try {
      if (!req.user.google_drive_token) {
        return res.status(400).json({ error: 'Google Drive not connected' });
      }

      await googleDriveService.initializeClient(req.user);
      await googleDriveService.syncPhotosToGoogleDrive(req.user);

      res.json({ message: 'Photo backup started' });
    } catch (error) {
      logger.error('Error backing up photos:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async listBackups(req, res) {
    try {
      if (!req.user.google_drive_token) {
        return res.status(400).json({ error: 'Google Drive not connected' });
      }

      await googleDriveService.initializeClient(req.user);
      const backupsFolder = await googleDriveService.getOrCreateFolder('Backups', req.user);
      const backups = await googleDriveService.listFiles(backupsFolder);

      res.json(backups);
    } catch (error) {
      logger.error('Error listing backups:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async restoreFromBackup(req, res) {
    try {
      if (!req.user.google_drive_token) {
        return res.status(400).json({ error: 'Google Drive not connected' });
      }

      // This would be a complex operation that:
      // 1. Downloads the backup file
      // 2. Parses the JSON
      // 3. Restores data to database
      // 4. Re-downloads any referenced files

      res.status(501).json({ 
        error: 'Restore functionality not yet implemented',
        message: 'This feature is coming soon!'
      });
    } catch (error) {
      logger.error('Error restoring from backup:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createFolder(req, res) {
    try {
      if (!req.user.google_drive_token) {
        return res.status(400).json({ error: 'Google Drive not connected' });
      }

      const { name, parentId } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Folder name is required' });
      }

      await googleDriveService.initializeClient(req.user);
      const folderId = await googleDriveService.createFolder(name, parentId);

      res.json({ folderId, name });
    } catch (error) {
      logger.error('Error creating folder:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async listFolders(req, res) {
    try {
      if (!req.user.google_drive_token) {
        return res.status(400).json({ error: 'Google Drive not connected' });
      }

      await googleDriveService.initializeClient(req.user);
      
      // List main app folders
      const folders = [
        { name: 'Yarn Management', id: null },
        { name: 'Patterns', id: null },
        { name: 'Yarn Photos', id: null },
        { name: 'Project Photos', id: null },
        { name: 'Backups', id: null }
      ];

      res.json(folders);
    } catch (error) {
      logger.error('Error listing folders:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async cleanupOldBackups(req, res) {
    try {
      if (!req.user.google_drive_token) {
        return res.status(400).json({ error: 'Google Drive not connected' });
      }

      const keepCount = parseInt(req.query.keepCount) || 10;

      await googleDriveService.initializeClient(req.user);
      const deletedCount = await googleDriveService.cleanupOldBackups(req.user, keepCount);

      res.json({
        message: `Cleaned up ${deletedCount} old backups`,
        deletedCount
      });
    } catch (error) {
      logger.error('Error cleaning up backups:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new DriveController();