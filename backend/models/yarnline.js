// backend/models/YarnLine.js
module.exports = (sequelize, DataTypes) => {
  const YarnLine = sequelize.define('YarnLine', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'yarn_brands',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    fiber_content: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    weight_category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['Lace', 'Light Fingering', 'Fingering', 'Sport', 'DK', 'Worsted', 'Aran', 'Chunky', 'Super Chunky', 'Jumbo']]
      }
    },
    weight_grams: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    yardage_per_skein: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ravelry_yarn_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    discontinued: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'yarn_lines',
    underscored: true,
    timestamps: true,
    updatedAt: false
  });

  YarnLine.associate = function(models) {
    YarnLine.belongsTo(models.YarnBrand, { foreignKey: 'brand_id' });
    YarnLine.hasMany(models.YarnInventory, { foreignKey: 'yarn_line_id' });
    YarnLine.hasMany(models.ShoppingListItem, { foreignKey: 'yarn_line_id' });
  };

  return YarnLine;
};