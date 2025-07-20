// backend/models/SystemSettings.js
module.exports = (sequelize, DataTypes) => {
  const SystemSettings = sequelize.define('SystemSettings', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    setting_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    setting_value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'system_settings',
    underscored: true,
    timestamps: true,
    createdAt: false
  });

  SystemSettings.associate = function(models) {
    SystemSettings.belongsTo(models.User, { foreignKey: 'updated_by' });
  };

  return SystemSettings;
};