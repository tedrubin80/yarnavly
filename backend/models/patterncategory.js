// backend/models/PatternCategory.js
module.exports = (sequelize, DataTypes) => {
  const PatternCategory = sequelize.define('PatternCategory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'pattern_categories',
        key: 'id'
      }
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'pattern_categories',
    underscored: true,
    timestamps: false
  });

  PatternCategory.associate = function(models) {
    PatternCategory.hasMany(models.Pattern, { foreignKey: 'category_id' });
    PatternCategory.hasMany(models.PatternCategory, { foreignKey: 'parent_id', as: 'subcategories' });
    PatternCategory.belongsTo(models.PatternCategory, { foreignKey: 'parent_id', as: 'parent' });
  };

  return PatternCategory;
};