const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlertEmail = sequelize.define('AlertEmail', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING(190), allowNull: false, unique: true, validate: { isEmail: true } },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'alert_emails',
});

module.exports = AlertEmail;
