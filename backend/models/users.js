// backend/models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    role: {
      type: DataTypes.STRING(20),
      defaultValue: 'user',
      validate: {
        isIn: [['admin', 'user']]
      }
    },
    ravelry_username: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    ravelry_access_key: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ravelry_personal_key: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    google_drive_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    google_drive_refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true
  });

  User.associate = function(models) {
    User.hasMany(models.YarnInventory, { foreignKey: 'user_id' });
    User.hasMany(models.Pattern, { foreignKey: 'user_id' });
    User.hasMany(models.Project, { foreignKey: 'user_id' });
    User.hasMany(models.ShoppingList, { foreignKey: 'user_id' });
    User.hasMany(models.SyncLog, { foreignKey: 'user_id' });
  };

  return User;
};