'use strict';
const env = require('./env');

module.exports = {
  development: {
    username: env.db.user,
    password: env.db.password,
    database: env.db.database,
    host:     env.db.host,
    port:     env.db.port,
    dialect:  'mysql',
    timezone: '+00:00',
    logging:  console.log,  
    define: {
      charset:         'utf8mb4',
      collate:         'utf8mb4_unicode_ci',
      underscored:     false,  // garde le camelCase de tes colonnes
      freezeTableName: true,   // Sequelize ne pluralise pas les noms de tables
      timestamps:      true,   // ajoute createdAt et updatedAt automatiquement
    },
  },
  production: {
    username: env.db.user,
    password: env.db.password,
    database: env.db.database,
    host:     env.db.host,
    port:     env.db.port,
    dialect:  'mysql',
    timezone: '+00:00',
    logging:  false,  
    define: {
      charset:         'utf8mb4',
      collate:         'utf8mb4_unicode_ci',
      underscored:     false,
      freezeTableName: true,
      timestamps:      true,
    },
  },
};