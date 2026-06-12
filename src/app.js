require('./config/env');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err);
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Duplicate value', details: err.errors?.map((e) => e.message) });
  }
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: 'Validation error', details: err.errors?.map((e) => e.message) });
  }
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
