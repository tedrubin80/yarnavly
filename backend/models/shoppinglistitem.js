// backend/models/ShoppingListItem.js
module.exports = (sequelize, DataTypes) => {
  const ShoppingListItem = sequelize.define('ShoppingListItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    shopping_list_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'shopping_lists',
        key: 'id'
      }
    },
    item_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['yarn', 'pattern', 'notion', 'tool']]
      }
    },
    yarn_line_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'yarn_lines',
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
    item_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    colorway: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    estimated_price: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    vendor: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    purchased: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    purchase_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actual_price: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'shopping_list_items',
    underscored: true,
    timestamps: true,
    updatedAt: false
  });

  ShoppingListItem.associate = function(models) {
    ShoppingListItem.belongsTo(models.ShoppingList, { foreignKey: 'shopping_list_id' });
    ShoppingListItem.belongsTo(models.YarnLine, { foreignKey: 'yarn_line_id' });
    ShoppingListItem.belongsTo(models.Pattern, { foreignKey: 'pattern_id' });
  };

  return ShoppingListItem;
};