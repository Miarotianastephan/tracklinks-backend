const express = require('express');
const { Group, Link } = require('../models');
const settings = require('../services/settingsService');
const monitor = require('../services/monitor');

const router = express.Router();

// Public dashboard data: groups with their links and latest statuses.
router.get('/status', async (req, res, next) => {
  try {
    const groups = await Group.findAll({
      order: [['sortOrder', 'ASC'], ['id', 'ASC']],
      include: [{
        model: Link,
        as: 'links',
        where: { isActive: true },
        required: false,
      }],
    });
    // Sequelize cannot order included rows reliably across dialect versions; sort in JS.
    const payload = groups.map((g) => {
      const json = g.toJSON();
      json.links.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      return json;
    });

    const allLinks = payload.flatMap((g) => g.links);
    const summary = {
      total: allLinks.length,
      up: allLinks.filter((l) => l.lastStatus === 'up').length,
      down: allLinks.filter((l) => l.lastStatus === 'down').length,
      pending: allLinks.filter((l) => l.lastStatus === 'pending').length,
    };

    const allSettings = await settings.getAll();
    res.json({
      lastUpdated: monitor.getLastRunAt(),
      intervalSeconds: Math.max(5, Number(allSettings.check_interval_seconds) || 60),
      siteTitleEn: allSettings.site_title_en,
      siteTitleZh: allSettings.site_title_zh,
      summary,
      groups: payload,
    });
  } catch (err) { next(err); }
});

module.exports = router;
