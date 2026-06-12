const { Setting } = require('../models');

const DEFAULTS = {
  check_interval_seconds: '60',
  request_timeout_ms: '10000',
  alerts_enabled: 'true',
  recovery_alerts_enabled: 'true',
  site_title_en: 'Link Status Dashboard',
  site_title_zh: '链接状态面板',
};

async function getAll() {
  const rows = await Setting.findAll();
  const map = { ...DEFAULTS };
  rows.forEach((r) => { map[r.key] = r.value; });
  return map;
}

async function get(key) {
  const row = await Setting.findOne({ where: { key } });
  return row ? row.value : DEFAULTS[key];
}

async function getInt(key) {
  const value = Number(await get(key));
  return Number.isFinite(value) ? value : Number(DEFAULTS[key]);
}

async function getBool(key) {
  return String(await get(key)) === 'true';
}

async function set(key, value) {
  const [row, created] = await Setting.findOrCreate({ where: { key }, defaults: { value: String(value) } });
  if (!created) {
    row.value = String(value);
    await row.save();
  }
  return row;
}

async function setMany(entries) {
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined && value !== null) await set(key, value);
  }
}

async function ensureDefaults() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    await Setting.findOrCreate({ where: { key }, defaults: { value } });
  }
}

module.exports = { DEFAULTS, getAll, get, getInt, getBool, set, setMany, ensureDefaults };
