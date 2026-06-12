const bcrypt = require('bcryptjs');
const { User, Group, Link } = require('../models');
const settings = require('../services/settingsService');
const env = require('../config/env');

const DEFAULT_GROUPS = [
  {
    key: 'gateway',
    nameEn: 'Gateway Domains',
    nameZh: '口子域名集合',
    descriptionEn: '1) Check blocking status every cycle. 2) Open each link on mobile to confirm accessibility.',
    descriptionZh: '1) 每个周期检测链接屏蔽情况。2) 用手机访问一次链接看看能否正常访问。',
    sortOrder: 1,
  },
  {
    key: 'landing',
    nameEn: 'Landing Pages',
    nameZh: '落地页集合',
    descriptionEn: '1) Check blocking status every cycle. 2) Open each link on mobile to confirm accessibility.',
    descriptionZh: '1) 每个周期检测链接屏蔽情况。2) 用手机访问一次链接看看能否正常访问。',
    sortOrder: 2,
  },
  {
    key: 'api',
    nameEn: 'API Endpoints',
    nameZh: '接口链接集合',
    descriptionEn: '1) Check blocking status every cycle. 2) Open each link on mobile to confirm accessibility.',
    descriptionZh: '1) 每个周期检测链接屏蔽情况。2) 用手机访问一次链接看看能否正常访问。',
    sortOrder: 3,
  },
  {
    key: 'ads',
    nameEn: 'Ads URLs',
    nameZh: '投流URL集合',
    descriptionEn: '1) Check blocking status every cycle. 2) Open each link on mobile to confirm accessibility.',
    descriptionZh: '1) 每个周期检测链接屏蔽情况。2) 用手机访问一次链接看看能否正常访问。',
    sortOrder: 4,
  },
  {
    key: 'cover',
    nameEn: 'Cover URLs',
    nameZh: '封面链接集合',
    descriptionEn: '1) Check blocking status every cycle. 2) Open each link on mobile to confirm accessibility.',
    descriptionZh: '1) 每个周期检测链接屏蔽情况。2) 用手机访问一次链接看看能否正常访问。',
    sortOrder: 5,
  },
];

async function seed() {
  // Default admin user
  const adminEmail = env.admin.email;
  const adminPassword = env.admin.password;
  const existingAdmin = await User.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await User.create({
      name: 'Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, env.bcryptRounds),
    });
    console.log(`[seed] Created admin user ${adminEmail}`);
  }

  // Default settings
  await settings.ensureDefaults();

  // Default groups
  for (const group of DEFAULT_GROUPS) {
    await Group.findOrCreate({ where: { key: group.key }, defaults: group });
  }

  // A couple of sample links so the dashboard is not empty on first run
  if (await Link.count() === 0) {
    const gateway = await Group.findOne({ where: { key: 'gateway' } });
    const api = await Group.findOne({ where: { key: 'api' } });
    await Link.bulkCreate([
      { name: 'Example site', url: 'https://example.com', groupId: gateway.id, sortOrder: 1 },
      { name: 'HTTPBin status', url: 'https://httpbin.org/status/200', groupId: api.id, sortOrder: 1 },
    ]);
    console.log('[seed] Created sample links');
  }
}

module.exports = seed;
