// backend/models/PatternDesigner.js
module.exports = (sequelize, DataTypes) => {
  const PatternDesigner = sequelize.define('PatternDesigner', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ravelry_designer_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    photo_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'pattern_designers',
    underscored: true,
    timestamps: false
  });

  PatternDesigner.associate = function(models) {
    PatternDesigner.hasMany(models.Pattern, { foreignKey: 'designer_id' });
  };

  return PatternDesigner;
};