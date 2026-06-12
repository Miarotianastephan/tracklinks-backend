const express = require('express');
const { Group, Link, AlertEmail } = require('../models');
const { requireAuth } = require('../middleware/auth');
const settings = require('../services/settingsService');
const monitor = require('../services/monitor');
const mailer = require('../services/mailer');

const router = express.Router();
router.use(requireAuth);

/* ---------------- Groups ---------------- */

router.get('/groups', async (req, res, next) => {
  try {
    const groups = await Group.findAll({ order: [['sortOrder', 'ASC'], ['id', 'ASC']] });
    res.json(groups);
  } catch (err) { next(err); }
});

router.post('/groups', async (req, res, next) => {
  try {
    const { key, nameEn, nameZh, descriptionEn, descriptionZh, sortOrder } = req.body || {};
    if (!key || !nameEn || !nameZh) return res.status(400).json({ error: 'key, nameEn and nameZh are required' });
    const group = await Group.create({ key, nameEn, nameZh, descriptionEn, descriptionZh, sortOrder: sortOrder ?? 0 });
    res.status(201).json(group);
  } catch (err) { next(err); }
});

router.put('/groups/:id', async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const { key, nameEn, nameZh, descriptionEn, descriptionZh, sortOrder } = req.body || {};
    await group.update({
      key: key ?? group.key,
      nameEn: nameEn ?? group.nameEn,
      nameZh: nameZh ?? group.nameZh,
      descriptionEn: descriptionEn ?? group.descriptionEn,
      descriptionZh: descriptionZh ?? group.descriptionZh,
      sortOrder: sortOrder ?? group.sortOrder,
    });
    res.json(group);
  } catch (err) { next(err); }
});

router.delete('/groups/:id', async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    await Link.destroy({ where: { groupId: group.id } });
    await group.destroy();
    res.json({ ok: true });
  } catch (err) { next(err); }
});

/* ---------------- Links ---------------- */

router.get('/links', async (req, res, next) => {
  try {
    const links = await Link.findAll({
      order: [['groupId', 'ASC'], ['sortOrder', 'ASC'], ['id', 'ASC']],
      include: [{ model: Group, as: 'group' }],
    });
    res.json(links);
  } catch (err) { next(err); }
});

router.post('/links', async (req, res, next) => {
  try {
    const { name, url, groupId, isActive, sortOrder } = req.body || {};
    if (!url || !groupId) return res.status(400).json({ error: 'url and groupId are required' });
    const group = await Group.findByPk(groupId);
    if (!group) return res.status(400).json({ error: 'Unknown groupId' });
    const link = await Link.create({
      name: name || null,
      url,
      groupId,
      isActive: isActive ?? true,
      sortOrder: sortOrder ?? 0,
    });
    res.status(201).json(link);
  } catch (err) { next(err); }
});

router.put('/links/:id', async (req, res, next) => {
  try {
    const link = await Link.findByPk(req.params.id);
    if (!link) return res.status(404).json({ error: 'Link not found' });
    const { name, url, groupId, isActive, sortOrder } = req.body || {};
    if (groupId !== undefined && groupId !== link.groupId) {
      const group = await Group.findByPk(groupId);
      if (!group) return res.status(400).json({ error: 'Unknown groupId' });
    }
    await link.update({
      name: name !== undefined ? name : link.name,
      url: url ?? link.url,
      groupId: groupId ?? link.groupId,
      isActive: isActive ?? link.isActive,
      sortOrder: sortOrder ?? link.sortOrder,
    });
    res.json(link);
  } catch (err) { next(err); }
});

router.delete('/links/:id', async (req, res, next) => {
  try {
    const deleted = await Link.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Link not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Re-check a single link immediately
router.post('/links/:id/check', async (req, res, next) => {
  try {
    const link = await Link.findByPk(req.params.id);
    if (!link) return res.status(404).json({ error: 'Link not found' });
    const timeoutMs = await settings.getInt('request_timeout_ms');
    await monitor.checkOneLink(link, timeoutMs);
    res.json(link);
  } catch (err) { next(err); }
});

// Re-check everything immediately
router.post('/check-all', async (req, res, next) => {
  try {
    await monitor.runChecks();
    res.json({ ok: true, lastRunAt: monitor.getLastRunAt() });
  } catch (err) { next(err); }
});

/* ---------------- Settings ---------------- */

router.get('/settings', async (req, res, next) => {
  try {
    res.json(await settings.getAll());
  } catch (err) { next(err); }
});

router.put('/settings', async (req, res, next) => {
  try {
    const allowed = [
      'check_interval_seconds', 'request_timeout_ms', 'alerts_enabled',
      'recovery_alerts_enabled', 'site_title_en', 'site_title_zh',
    ];
    const entries = {};
    for (const key of allowed) {
      if (req.body && req.body[key] !== undefined) entries[key] = req.body[key];
    }
    if (entries.check_interval_seconds !== undefined && Number(entries.check_interval_seconds) < 5) {
      return res.status(400).json({ error: 'check_interval_seconds must be at least 5' });
    }
    await settings.setMany(entries);
    await monitor.restart(); // apply new interval right away
    res.json(await settings.getAll());
  } catch (err) { next(err); }
});

/* ---------------- Alert emails ---------------- */

router.get('/alert-emails', async (req, res, next) => {
  try {
    res.json(await AlertEmail.findAll({ order: [['id', 'ASC']] }));
  } catch (err) { next(err); }
});

router.post('/alert-emails', async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required' });
    const [row, created] = await AlertEmail.findOrCreate({ where: { email }, defaults: { isActive: true } });
    res.status(created ? 201 : 200).json(row);
  } catch (err) { next(err); }
});

router.put('/alert-emails/:id', async (req, res, next) => {
  try {
    const row = await AlertEmail.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Alert email not found' });
    const { email, isActive } = req.body || {};
    await row.update({ email: email ?? row.email, isActive: isActive ?? row.isActive });
    res.json(row);
  } catch (err) { next(err); }
});

router.delete('/alert-emails/:id', async (req, res, next) => {
  try {
    const deleted = await AlertEmail.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Alert email not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Send a test email to all active recipients
router.post('/alert-emails/test', async (req, res, next) => {
  try {
    const sent = await mailer.sendToRecipients(
      '[Link Monitor] Test notification / 测试通知',
      '<p>This is a test notification from the Link Status Dashboard. / 这是来自链接状态面板的测试通知。</p>'
    );
    res.json({ sent });
  } catch (err) { next(err); }
});

module.exports = router;
