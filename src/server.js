require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const seed = require('./utils/seed');
const monitor = require('./services/monitor');

const PORT = Number(process.env.PORT || 4000);

async function main() {
  await sequelize.authenticate();
  console.log('[db] Connected to MySQL');

  await sequelize.sync({ alter: false });
  console.log('[db] Schema synchronized');

  await seed();

  app.listen(PORT, () => {
    console.log(`[server] Listening on http://localhost:${PORT}`);
  });

  // Start monitoring after the server is up; never block startup on it.
  monitor.start().catch((err) => console.error('[monitor] Failed to start:', err));
}

main().catch((err) => {
  console.error('[server] Fatal startup error:', err.message);
  process.exit(1);
});
