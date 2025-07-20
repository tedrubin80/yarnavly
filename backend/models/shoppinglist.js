// backend/models/ShoppingList.js
module.exports = (sequelize, DataTypes) => {
  const ShoppingList = sequelize.define('ShoppingList', {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'shopping_lists',
    underscored: true,
    timestamps: true,
    updatedAt: false
  });

  ShoppingList.associate = function(models) {
    ShoppingList.belongsTo(models.User, { foreignKey: 'user_id' });
    ShoppingList.hasMany(models.ShoppingListItem, { foreignKey: 'shopping_list_id' });
  };

  return ShoppingList;
};