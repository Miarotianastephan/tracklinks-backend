const axios = require('axios');
const { Link } = require('../models');
const settings = require('./settingsService');
const mailer = require('./mailer');

let timer = null;
let checking = false;
let lastRunAt = null;

async function checkUrl(url, timeoutMs) {
  const startedAt = Date.now();
  try {
    const res = await axios.get(url, {
      timeout: timeoutMs,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: { 'User-Agent': 'LinkStatusMonitor/1.0 (+https://localhost)' },
    });
    const ok = res.status < 400;
    return {
      status: ok ? 'up' : 'down',
      code: res.status,
      ms: Date.now() - startedAt,
      error: ok ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      status: 'down',
      code: null,
      ms: Date.now() - startedAt,
      error: (err.code || err.message || 'request failed').slice(0, 480),
    };
  }
}

async function checkOneLink(link, timeoutMs) {
  const result = await checkUrl(link.url, timeoutMs);
  const previousStatus = link.lastStatus;
  link.lastStatus = result.status;
  link.lastStatusCode = result.code;
  link.lastResponseTimeMs = result.ms;
  link.lastCheckedAt = new Date();
  link.lastError = result.error;
  link.failCount = result.status === 'down' ? link.failCount + 1 : 0;
  await link.save();
  return { link, previousStatus, newStatus: result.status };
}

async function runChecks() {
  if (checking) return; // a previous round is still in flight
  checking = true;
  try {
    const timeoutMs = await settings.getInt('request_timeout_ms');
    const links = await Link.findAll({ where: { isActive: true } });

    const results = [];
    const CONCURRENCY = 10;
    for (let i = 0; i < links.length; i += CONCURRENCY) {
      const chunk = links.slice(i, i + CONCURRENCY);
      const settled = await Promise.allSettled(chunk.map((l) => checkOneLink(l, timeoutMs)));
      settled.forEach((s) => { if (s.status === 'fulfilled') results.push(s.value); });
    }

    lastRunAt = new Date();

    const wentDown = results
      .filter((r) => r.newStatus === 'down' && r.previousStatus !== 'down')
      .map((r) => r.link);
    const recovered = results
      .filter((r) => r.newStatus === 'up' && r.previousStatus === 'down')
      .map((r) => r.link);

    if (wentDown.length > 0 && await settings.getBool('alerts_enabled')) {
      await mailer.sendDownAlert(wentDown);
    }
    if (recovered.length > 0 && await settings.getBool('recovery_alerts_enabled')) {
      await mailer.sendRecoveryAlert(recovered);
    }

    const downCount = results.filter((r) => r.newStatus === 'down').length;
    console.log(`[monitor] Checked ${results.length} link(s) — ${downCount} down`);
  } catch (err) {
    console.error('[monitor] Check round failed:', err.message);
  } finally {
    checking = false;
  }
}

// Self-rescheduling loop: the interval is re-read from settings after every
// round, so back-office changes take effect on the next cycle automatically.
async function scheduleNext() {
  const intervalSeconds = Math.max(5, await settings.getInt('check_interval_seconds'));
  timer = setTimeout(async () => {
    await runChecks();
    scheduleNext();
  }, intervalSeconds * 1000);
}

async function start() {
  await runChecks();
  await scheduleNext();
  console.log('[monitor] Monitoring loop started');
}

async function restart() {
  if (timer) clearTimeout(timer);
  await scheduleNext();
}

function getLastRunAt() {
  return lastRunAt;
}

module.exports = { start, restart, runChecks, checkOneLink, getLastRunAt };
