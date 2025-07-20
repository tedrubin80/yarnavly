// backend/models/SyncLog.js
module.exports = (sequelize, DataTypes) => {
  const SyncLog = sequelize.define('SyncLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sync_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    google_drive_file_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['success', 'error', 'pending']]
      }
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    file_size_bytes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sync_duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'sync_log',
    underscored: true,
    timestamps: true,
    updatedAt: false
  });

  SyncLog.associate = function(models) {
    SyncLog.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return SyncLog;
};