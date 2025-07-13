const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  first_name: DataTypes.STRING,
  last_name: DataTypes.STRING,
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  ravelry_username: DataTypes.STRING,
  ravelry_access_key: DataTypes.STRING,
  ravelry_personal_key: DataTypes.STRING,
  google_drive_token: DataTypes.TEXT,
  google_drive_refresh_token: DataTypes.TEXT,
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'users',
  underscored: true
});

// Yarn Brand Model
const YarnBrand = sequelize.define('YarnBrand', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  manufacturer: DataTypes.STRING,
  website: DataTypes.STRING,
  