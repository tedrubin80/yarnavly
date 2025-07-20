// backend/models/YarnInventory.js
module.exports = (sequelize, DataTypes) => {
  const YarnInventory = sequelize.define('YarnInventory', {
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
    yarn_line_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'yarn_lines',
        key: 'id'
      }
    },
    colorway: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    color_family: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    lot_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    dye_lot: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    skeins_total: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    skeins_remaining: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 1
    },
    total_yardage: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    remaining_yardage: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    purchase_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    purchase_price: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    vendor: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    storage_location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    storage_bin: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    condition: {
      type: DataTypes.STRING(50),
      defaultValue: 'excellent',
      validate: {
        isIn: [['excellent', 'good', 'fair', 'poor']]
      }
    },
    ravelry_stash_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    google_drive_folder_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    photos: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    is_favorite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    last_sync_ravelry: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'yarn_inventory',
    underscored: true,
    timestamps: true
  });

  YarnInventory.associate = function(models) {
    YarnInventory.belongsTo(models.User, { foreignKey: 'user_id' });
    YarnInventory.belongsTo(models.YarnLine, { foreignKey: 'yarn_line_id' });
    YarnInventory.hasMany(models.ProjectYarnUsage, { foreignKey: 'yarn_inventory_id' });
  };

  return YarnInventory;
};