const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Setting = sequelize.define('Setting', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  value: { type: DataTypes.STRING(1000), allowNull: false },
}, {
  tableName: 'settings',
});

module.exports = Setting;
