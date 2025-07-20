// backend/models/Project.js
module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
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
    pattern_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'patterns',
        key: 'id'
      }
    },
    project_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'queued',
      validate: {
        isIn: [['queued', 'active', 'completed', 'frogged', 'hibernating']]
      }
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    target_completion_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completion_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    total_hours_worked: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true
    },
    size_making: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    modifications: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    progress_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    final_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recipient: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    occasion: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    google_drive_folder_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    progress_photos: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    finished_photos: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    ravelry_project_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ravelry_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    share_on_ravelry: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_sync_ravelry: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'projects',
    underscored: true,
    timestamps: true
  });

  Project.associate = function(models) {
    Project.belongsTo(models.User, { foreignKey: 'user_id' });
    Project.belongsTo(models.Pattern, { foreignKey: 'pattern_id' });
    Project.hasMany(models.ProjectYarnUsage, { foreignKey: 'project_id' });
    Project.hasMany(models.ProjectProgress, { foreignKey: 'project_id' });
  };

  return Project;
};