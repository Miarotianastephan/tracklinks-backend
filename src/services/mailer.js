const nodemailer = require('nodemailer');
const { AlertEmail } = require('../models');

function buildTransport() {
  if (!process.env.SMTP_HOST) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
}

async function getRecipients() {
  const rows = await AlertEmail.findAll({ where: { isActive: true } });
  return rows.map((r) => r.email);
}

/**
 * Send a notification to all active alert recipients.
 * Silently no-ops (with a console warning) when SMTP is not configured
 * or no recipient is registered, so monitoring never crashes on mail issues.
 */
async function sendToRecipients(subject, html) {
  const transport = buildTransport();
  if (!transport) {
    console.warn('[mailer] SMTP_HOST not configured, skipping email:', subject);
    return false;
  }
  const recipients = await getRecipients();
  if (recipients.length === 0) {
    console.warn('[mailer] No active alert recipients, skipping email:', subject);
    return false;
  }
  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || 'Link Status Monitor <no-reply@localhost>',
      to: recipients.join(', '),
      subject,
      html,
    });
    console.log(`[mailer] Sent "${subject}" to ${recipients.length} recipient(s)`);
    return true;
  } catch (err) {
    console.error('[mailer] Failed to send email:', err.message);
    return false;
  }
}

function linksTable(links) {
  const rows = links.map((l) => `
    <tr>
      <td style="padding:6px 12px;border:1px solid #e2e8f0;">${l.name || '-'}</td>
      <td style="padding:6px 12px;border:1px solid #e2e8f0;"><a href="${l.url}">${l.url}</a></td>
      <td style="padding:6px 12px;border:1px solid #e2e8f0;">${l.lastStatusCode || ''} ${l.lastError || ''}</td>
    </tr>`).join('');
  return `
    <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
      <tr style="background:#f8fafc;">
        <th style="padding:6px 12px;border:1px solid #e2e8f0;">Name</th>
        <th style="padding:6px 12px;border:1px solid #e2e8f0;">URL</th>
        <th style="padding:6px 12px;border:1px solid #e2e8f0;">Detail</th>
      </tr>
      ${rows}
    </table>`;
}

async function sendDownAlert(links) {
  const subject = `[Link Monitor] ${links.length} link(s) DOWN / ${links.length} 条链接访问失败`;
  const html = `
    <h2 style="font-family:Arial,sans-serif;color:#dc2626;">Links unreachable / 链接无法访问</h2>
    <p style="font-family:Arial,sans-serif;">The following link(s) failed the latest check (${new Date().toISOString()}):</p>
    ${linksTable(links)}`;
  return sendToRecipients(subject, html);
}

async function sendRecoveryAlert(links) {
  const subject = `[Link Monitor] ${links.length} link(s) recovered / ${links.length} 条链接已恢复`;
  const html = `
    <h2 style="font-family:Arial,sans-serif;color:#16a34a;">Links recovered / 链接已恢复访问</h2>
    <p style="font-family:Arial,sans-serif;">The following link(s) are reachable again (${new Date().toISOString()}):</p>
    ${linksTable(links)}`;
  return sendToRecipients(subject, html);
}

module.exports = { sendDownAlert, sendRecoveryAlert, sendToRecipients };
