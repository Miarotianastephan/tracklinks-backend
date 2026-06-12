const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Link = sequelize.define('Link', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(190), allowNull: true },
  url: { type: DataTypes.STRING(1000), allowNull: false },
  groupId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  lastStatus: { type: DataTypes.ENUM('pending', 'up', 'down'), allowNull: false, defaultValue: 'pending' },
  lastStatusCode: { type: DataTypes.INTEGER, allowNull: true },
  lastResponseTimeMs: { type: DataTypes.INTEGER, allowNull: true },
  lastCheckedAt: { type: DataTypes.DATE, allowNull: true },
  lastError: { type: DataTypes.STRING(500), allowNull: true },
  failCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'links',
});

module.exports = Link;
