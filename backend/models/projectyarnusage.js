// backend/models/ProjectYarnUsage.js
module.exports = (sequelize, DataTypes) => {
  const ProjectYarnUsage = sequelize.define('ProjectYarnUsage', {
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
    yarn_inventory_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'yarn_inventory',
        key: 'id'
      }
    },
    skeins_used: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    yardage_used: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    usage_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    added_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'project_yarn_usage',
    underscored: true,
    timestamps: false
  });

  ProjectYarnUsage.associate = function(models) {
    ProjectYarnUsage.belongsTo(models.Project, { foreignKey: 'project_id' });
    ProjectYarnUsage.belongsTo(models.YarnInventory, { foreignKey: 'yarn_inventory_id' });
  };

  return ProjectYarnUsage;
};