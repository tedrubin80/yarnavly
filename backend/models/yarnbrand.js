// backend/models/YarnBrand.js
module.exports = (sequelize, DataTypes) => {
  const YarnBrand = sequelize.define('YarnBrand', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    manufacturer: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    ravelry_brand_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    logo_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'yarn_brands',
    underscored: true,
    timestamps: true,
    updatedAt: false
  });

  YarnBrand.associate = function(models) {
    YarnBrand.hasMany(models.YarnLine, { foreignKey: 'brand_id' });
  };

  return YarnBrand;
};