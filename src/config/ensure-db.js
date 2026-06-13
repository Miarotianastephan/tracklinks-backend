'use strict';

const env = require('./env');
const mysql = require('mysql2/promise');

const DB_NAME = env.db.database;

async function ensureDatabase() {
  const connection = await mysql.createConnection({
    host:     env.db.host,
    port:     env.db.port,
    user:     env.db.user,
    password: env.db.password,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Base de données "${DB_NAME}" prête.`);
  } finally {
    await connection.end();
  }
}

ensureDatabase().catch((err) => {
  console.error('❌ Impossible de créer la base de données :', err.message);
  process.exit(1);
});
