// src/services/googleDriveService.js
const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { SyncLog } = require('../models');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.oauth2Client = null;
  }

  // Initialize OAuth2 client with user credentials
  async initializeClient(user) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      access_token: user.google_drive_token,
      refresh_token: user.google_drive_refresh_token
    });

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    return this.drive;
  }

  // Get authorization URL for user consent
  getAuthUrl() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata'
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Exchange authorization code for tokens
  async getTokensFromCode(code) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  // Create main application folder structure
  async createAppFolderStructure(user) {
    await this.initializeClient(user);

    const folders = [
      { name: 'Yarn Management', parent: null },
      { name: 'Patterns', parent: 'Yarn Management' },
      { name: 'Yarn Photos', parent: 'Yarn Management' },
      { name: 'Project Photos', parent: 'Yarn Management' },
      { name: 'Backups', parent: 'Yarn Management' }
    ];

    const createdFolders = {};

    for (const folder of folders) {
      const parentId = folder.parent ? createdFolders[folder.parent] : null;
      const folderId = await this.createFolder(folder.name, parentId);
      createdFolders[folder.name] = folderId;
    }

    return createdFolders;
  }

  // Create a folder in Google Drive
  async createFolder(name, parentId = null) {
    const fileMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined
    };

    try {
      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id'
      });
      return response.data.id;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  // Upload file to Google Drive
  async uploadFile(fileBuffer, filename, mimeType, folderId, userId) {
    const startTime = Date.now();
    
    try {
      // Create thumbnail for images
      let thumbnailBuffer = null;
      if (mimeType.startsWith('image/')) {
        thumbnailBuffer = await sharp(fileBuffer)
          .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
      }

      const fileMetadata = {
        name: filename,
        parents: folderId ? [folderId] : undefined
      };

      const media = {
        mimeType: mimeType,
        body: fileBuffer
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, size, webViewLink, thumbnailLink'
      });

      // Upload thumbnail if created
      let thumbnailId = null;
      if (thumbnailBuffer) {
        const thumbnailMetadata = {
          name: `thumb_${filename}`,
          parents: folderId ? [folderId] : undefined
        };

        const thumbnailResponse = await this.drive.files.create({
          resource: thumbnailMetadata,
          media: {
            mimeType: 'image/jpeg',
            body: thumbnailBuffer
          },
          fields: 'id, webViewLink'
        });
        thumbnailId = thumbnailResponse.data.id;
      }

      // Log the upload
      await SyncLog.create({
        user_id: userId,
        sync_type: 'file_upload',
        entity_type: 'file',
        action: 'upload',
        google_drive_file_id: response.data.id,
        file_path: filename,
        status: 'success',
        file_size_bytes: fileBuffer.length,
        sync_duration_ms: Date.now() - startTime
      });

      return {
        fileId: response.data.id,
        thumbnailId: thumbnailId,
        filename: response.data.name,
        size: response.data.size,
        webViewLink: response.data.webViewLink,
        thumbnailLink: response.data.thumbnailLink
      };
    } catch (error) {
      // Log the error
      await SyncLog.create({
        user_id: userId,
        sync_type: 'file_upload',
        entity_type: 'file',
        action: 'upload',
        file_path: filename,
        status: 'error',
        error_message: error.message,
        sync_duration_ms: Date.now() - startTime
      });
      throw error;
    }
  }

  // Download file from Google Drive
  async downloadFile(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // Delete file from Google Drive
  async deleteFile(fileId, userId) {
    try {
      await this.drive.files.delete({
        fileId: fileId
      });

      await SyncLog.create({
        user_id: userId,
        sync_type: 'file_delete',
        entity_type: 'file',
        action: 'delete',
        google_drive_file_id: fileId,
        status: 'success'
      });
    } catch (error) {
      await SyncLog.create({
        user_id: userId,
        sync_type: 'file_delete',
        entity_type: 'file',
        action: 'delete',
        google_drive_file_id: fileId,
        status: 'error',
        error_message: error.message
      });
      throw error;
    }
  }

  // Create full backup of user data
  async createFullBackup(user) {
    const startTime = Date.now();
    
    try {
      // Get all user data
      const userData = await this.getUserBackupData(user.id);
      
      // Create backup file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `backup_${user.id}_${timestamp}.json`;
      const backupData = JSON.stringify(userData, null, 2);
      
      // Upload to Drive
      const backupFolder = await this.getOrCreateFolder('Backups', user);
      const uploadResult = await this.uploadFile(
        Buffer.from(backupData),
        backupFilename,
        'application/json',
        backupFolder,
        user.id
      );

      await SyncLog.create({
        user_id: user.id,
        sync_type: 'full_backup',
        entity_type: 'backup',
        action: 'create',
        google_drive_file_id: uploadResult.fileId,
        file_path: backupFilename,
        status: 'success',
        sync_duration_ms: Date.now() - startTime
      });

      return uploadResult;
    } catch (error) {
      await SyncLog.create({
        user_id: user.id,
        sync_type: 'full_backup',
        entity_type: 'backup',
        action: 'create',
        status: 'error',
        error_message: error.message,
        sync_duration_ms: Date.now() - startTime
      });
      throw error;
    }
  }

  // Get or create a folder
  async getOrCreateFolder(folderName, user, parentId = null) {
    // Search for existing folder
    const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder'${
      parentId ? ` and '${parentId}' in parents` : ''
    } and trashed=false`;

    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name)'
    });

    if (response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Create folder if it doesn't exist
    return await this.createFolder(folderName, parentId);
  }

  // Get user data for backup
  async getUserBackupData(userId) {
    const { YarnInventory, Pattern, Project, YarnLine, YarnBrand } = require('../models');
    
    const [yarnInventory, patterns, projects] = await Promise.all([
      YarnInventory.findAll({
        where: { user_id: userId },
        include: [{ model: YarnLine, include: [YarnBrand] }]
      }),
      Pattern.findAll({ where: { user_id: userId } }),
      Project.findAll({ where: { user_id: userId } })
    ]);

    return {
      backup_date: new Date().toISOString(),
      user_id: userId,
      yarn_inventory: yarnInventory,
      patterns: patterns,
      projects: projects
    };
  }

  // Batch upload patterns
  async uploadPatterns(patterns, user) {
    const patternsFolder = await this.getOrCreateFolder('Patterns', user);
    const results = [];

    for (const pattern of patterns) {
      try {
        if (pattern.file_buffer) {
          const uploadResult = await this.uploadFile(
            pattern.file_buffer,
            pattern.filename,
            pattern.mime_type,
            patternsFolder,
            user.id
          );
          results.push({ pattern_id: pattern.id, ...uploadResult });
        }
      } catch (error) {
        console.error(`Error uploading pattern ${pattern.id}:`, error);
        results.push({ pattern_id: pattern.id, error: error.message });
      }
    }

    return results;
  }

  // Sync all photos to Google Drive
  async syncPhotosToGoogleDrive(user) {
    const photosFolder = await this.getOrCreateFolder('Photos', user);
    const yarnPhotosFolder = await this.getOrCreateFolder('Yarn', user, photosFolder);
    const projectPhotosFolder = await this.getOrCreateFolder('Projects', user, photosFolder);

    // Implementation for syncing photos
    // This would iterate through local photos and upload to appropriate folders
  }

  // Monitor storage usage
  async getStorageInfo(user) {
    await this.initializeClient(user);
    
    try {
      const response = await this.drive.about.get({
        fields: 'storageQuota'
      });
      
      return {
        limit: response.data.storageQuota.limit,
        usage: response.data.storageQuota.usage,
        usageInDrive: response.data.storageQuota.usageInDrive,
        usageInDriveTrash: response.data.storageQuota.usageInDriveTrash
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      throw error;
    }
  }

  // List files in a folder
  async listFiles(folderId, pageSize = 100) {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        pageSize: pageSize,
        fields: 'files(id, name, size, createdTime, modifiedTime, mimeType, thumbnailLink)'
      });
      
      return response.data.files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  // Clean up old backups (keep only last N backups)
  async cleanupOldBackups(user, keepCount = 10) {
    const backupsFolder = await this.getOrCreateFolder('Backups', user);
    const files = await this.listFiles(backupsFolder);
    
    // Sort by creation date, newest first
    const backupFiles = files
      .filter(file => file.name.startsWith('backup_'))
      .sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
    
    // Delete old backups beyond keepCount
    const filesToDelete = backupFiles.slice(keepCount);
    
    for (const file of filesToDelete) {
      try {
        await this.deleteFile(file.id, user.id);
        console.log(`Deleted old backup: ${file.name}`);
      } catch (error) {
        console.error(`Error deleting backup ${file.name}:`, error);
      }
    }
    
    return filesToDelete.length;
  }
}

module.exports = new GoogleDriveService();