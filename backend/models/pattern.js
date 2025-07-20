// backend/models/Pattern.js
module.exports = (sequelize, DataTypes) => {
  const Pattern = sequelize.define('Pattern', {
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    designer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'pattern_designers',
        key: 'id'
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'pattern_categories',
        key: 'id'
      }
    },
    craft_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['knitting', 'crochet', 'weaving', 'spinning', 'dyeing']]
      }
    },
    difficulty_level: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    ravelry_pattern_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    pattern_source: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    source_details: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    original_filename: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_type: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    google_drive_file_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    google_drive_folder_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    thumbnail_drive_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_size_bytes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    yardage_required: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    yardage_max: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    needle_sizes: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    hook_sizes: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    gauge_stitches: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true
    },
    gauge_rows: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true
    },
    gauge_measurement: {
      type: DataTypes.STRING(20),
      defaultValue: '4 inches'
    },
    finished_measurements: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    sizes_available: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    techniques: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    price: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    purchase_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_free: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    pattern_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    personal_notes: {
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
    ravelry_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true
    },
    ravelry_rating_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ravelry_difficulty_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true
    },
    ravelry_projects_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ravelry_queued_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    last_sync_ravelry: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'patterns',
    underscored: true,
    timestamps: true
  });

  Pattern.associate = function(models) {
    Pattern.belongsTo(models.User, { foreignKey: 'user_id' });
    Pattern.belongsTo(models.PatternDesigner, { foreignKey: 'designer_id' });
    Pattern.belongsTo(models.PatternCategory, { foreignKey: 'category_id' });
    Pattern.hasMany(models.Project, { foreignKey: 'pattern_id' });
    Pattern.hasMany(models.ShoppingListItem, { foreignKey: 'pattern_id' });
  };

  return Pattern;
};