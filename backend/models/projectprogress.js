// backend/models/ProjectProgress.js
module.exports = (sequelize, DataTypes) => {
  const ProjectProgress = sequelize.define('ProjectProgress', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    progress_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    progress_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['rows_completed', 'percentage', 'milestone']]
      }
    },
    progress_value: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    progress_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    hours_worked: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    photo_drive_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'project_progress',
    underscored: true,
    timestamps: true,
    updatedAt: false
  });

  ProjectProgress.associate = function(models) {
    ProjectProgress.belongsTo(models.Project, { foreignKey: 'project_id' });
  };

  return ProjectProgress;
};