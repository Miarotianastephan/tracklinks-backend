const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Group = sequelize.define('Group', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  nameEn: { type: DataTypes.STRING(190), allowNull: false },
  nameZh: { type: DataTypes.STRING(190), allowNull: false },
  descriptionEn: { type: DataTypes.TEXT, allowNull: true },
  descriptionZh: { type: DataTypes.TEXT, allowNull: true },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'link_groups',
});

module.exports = Group;
