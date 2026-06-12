const sequelize = require('../config/database');
const User = require('./User');
const Group = require('./Group');
const Link = require('./Link');
const Setting = require('./Setting');
const AlertEmail = require('./AlertEmail');

Group.hasMany(Link, { as: 'links', foreignKey: 'groupId', onDelete: 'CASCADE', hooks: true });
Link.belongsTo(Group, { as: 'group', foreignKey: 'groupId' });

module.exports = { sequelize, User, Group, Link, Setting, AlertEmail };
