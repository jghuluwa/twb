/**
 * Email center:
 *   GET/PUT  /api/emails/templates           — list / upsert templates
 *   DELETE   /api/emails/templates/:id       — delete (non-system)
 *   POST     /api/emails/test                — send a test mail with given template
 *   GET      /api/emails/campaigns           — list campaigns
 *   POST     /api/emails/campaigns           — create + (optionally) send
 *   POST     /api/emails/campaigns/:id/send  — send a draft now
 *   GET      /api/emails/logs                — recent send log (last 500)
 *   GET      /api/emails/settings            — get SMTP config (sans password)
 *   PUT      /api/emails/settings            — save SMTP config
 *   GET      /api/emails/subscribers         — list newsletter subscribers
 *   DELETE   /api/emails/subscribers/:email  — remove
 *
 *   POST     /api/emails/subscribe           — PUBLIC: front-end footer signup
 *   GET      /api/emails/unsubscribe?email=  — PUBLIC: one-click unsubscribe link
 */
import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin, type AuthRequest } from '../lib/auth.js';
import { logAction } from '../lib/audit.js';
import { renderTemplate, sendEmail } from '../lib/email.js';

const router = Router();

interface TemplateRow {
  id: string; name: string; subject: string; body_html: string; kind: string; updated_at: string;
}

// ── Templates ──
router.get('/templates', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM email_templates ORDER BY kind, name').all() as TemplateRow[];
  res.json(rows);
});

router.put('/templates/:id', requireAdmin, (req: AuthRequest, res) => {
  const { name, subject, body_html, kind } = req.body ?? {};
  const exists = db.prepare('SELECT id FROM email_templates WHERE id = ?').get(req.params.id);
  if (exists) {
    db.prepare(`UPDATE email_templates SET name = ?, subject = ?, body_html = ?, updated_at = datetime('now')
      WHERE id = ?`).run(name, subject, body_html, req.params.id);
  } else {
    db.prepare(`INSERT INTO email_templates (id, name, subject, body_html, kind) VALUES (?, ?, ?, ?, ?)`)
      .run(req.params.id, name, subject, body_html, kind === 'system' ? 'system' : 'marketing');
  }
  logAction(req.admin!.username, 'email.template.update', req.params.id);
  res.json({ ok: true });
});

router.delete('/templates/:id', requireAdmin, (req: AuthRequest, res) => {
  const row = db.prepare('SELECT kind FROM email_templates WHERE id = ?').get(req.params.id) as { kind: string } | undefined;
  if (row?.kind === 'system') { res.status(400).json({ error: '系统模板不可删除' }); return; }
  db.prepare('DELETE FROM email_templates WHERE id = ?').run(req.params.id);
  logAction(req.admin!.username, 'email.template.delete', req.params.id);
  res.json({ ok: true });
});

router.post('/test', requireAdmin, async (req, res) => {
  const { to, templateId, subject, body_html } = req.body ?? {};
  if (!to) { res.status(400).json({ error: '请填收件人' }); return; }
  let s = subject || '(test)';
  let h = body_html || '(empty)';
  if (templateId) {
    const tpl = db.prepare('SELECT subject, body_html FROM email_templates WHERE id = ?')
      .get(templateId) as { subject: string; body_html: string } | undefined;
    if (tpl) { s = tpl.subject; h = tpl.body_html; }
  }
  s = renderTemplate(s, { customerName: 'Test User', orderId: 'TEST-0000', currencySymbol: '¥',
    subtotal: '100', discount: '10', shipping: '0', total: '90', trackingNumber: 'TEST123' });
  h = renderTemplate(h, { customerName: 'Test User', orderId: 'TEST-0000', currencySymbol: '¥',
    subtotal: '100', discount: '10', shipping: '0', total: '90', trackingNumber: 'TEST123' });
  const ok = await sendEmail({ to, subject: s, html: h, kind: 'test' });
  res.json({ ok });
});

// ── Audience resolver ──
type Audience = { kind: 'all_customers'|'registered'|'subscribers'|'recent_buyers'; days?: number };
function resolveAudience(a: Audience): { email: string; name: string }[] {
  if (a.kind === 'registered') {
    return db.prepare('SELECT email, name FROM customers WHERE status = ?').all('active') as { email: string; name: string }[];
  }
  if (a.kind === 'subscribers') {
    return db.prepare('SELECT email, "" as name FROM newsletter_subscribers WHERE unsubscribed = 0 AND confirmed = 1').all() as { email: string; name: string }[];
  }
  if (a.kind === 'recent_buyers') {
    const days = Math.max(1, Math.min(365, Number(a.days) || 30));
    const rows = db.prepare(`SELECT DISTINCT customer_email AS email, customer_name AS name
      FROM orders WHERE created_at >= datetime('now', '-' || ? || ' days')`).all(days) as { email: string; name: string }[];
    return rows;
  }
  // all_customers = registered ∪ everyone who placed an order ∪ subscribers
  const a1 = db.prepare('SELECT email, name FROM customers WHERE status = ?').all('active') as { email: string; name: string }[];
  const a2 = db.prepare('SELECT DISTINCT customer_email AS email, customer_name AS name FROM orders').all() as { email: string; name: string }[];
  const a3 = db.prepare('SELECT email, "" as name FROM newsletter_subscribers WHERE unsubscribed = 0').all() as { email: string; name: string }[];
  const map = new Map<string, { email: string; name: string }>();
  [...a1, ...a2, ...a3].forEach((r) => { if (r.email && !map.has(r.email)) map.set(r.email, r); });
  return Array.from(map.values());
}

// ── Campaigns ──
router.get('/campaigns', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM email_campaigns ORDER BY created_at DESC LIMIT 200').all();
  res.json(rows);
});

router.post('/campaigns', requireAdmin, async (req: AuthRequest, res) => {
  const { name, templateId, subject, body_html, audience, sendNow } = req.body ?? {};
  if (!name || !subject || !body_html) { res.status(400).json({ error: '参数无效' }); return; }
  const id = 'CAMP-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  db.prepare(`INSERT INTO email_campaigns (id, name, template_id, subject, body_html, audience, status)
    VALUES (?, ?, ?, ?, ?, ?, 'draft')`).run(
      id, name, templateId || null, subject, body_html, JSON.stringify(audience || { kind: 'subscribers' })
    );
  logAction(req.admin!.username, 'email.campaign.create', id);
  if (sendNow) await sendCampaign(id);
  res.status(201).json({ id });
});

router.post('/campaigns/:id/send', requireAdmin, async (req: AuthRequest, res) => {
  const result = await sendCampaign(req.params.id);
  logAction(req.admin!.username, 'email.campaign.send', req.params.id, result);
  res.json(result);
});

async function sendCampaign(id: string): Promise<{ sent: number; failed: number }> {
  const c = db.prepare('SELECT * FROM email_campaigns WHERE id = ?').get(id) as
    { id: string; subject: string; body_html: string; audience: string } | undefined;
  if (!c) return { sent: 0, failed: 0 };
  db.prepare("UPDATE email_campaigns SET status = 'sending' WHERE id = ?").run(id);
  let aud: Audience;
  try { aud = JSON.parse(c.audience) as Audience; } catch { aud = { kind: 'subscribers' }; }
  const recipients = resolveAudience(aud);
  let sent = 0, failed = 0;
  for (const r of recipients) {
    const html = renderTemplate(c.body_html, { customerName: r.name || '', email: r.email,
      unsubscribeUrl: `${process.env.APP_URL || ''}/api/emails/unsubscribe?email=${encodeURIComponent(r.email)}` });
    const subject = renderTemplate(c.subject, { customerName: r.name || '', email: r.email });
    const ok = await sendEmail({ to: r.email, subject, html, kind: 'campaign', campaignId: id });
    if (ok) sent++; else failed++;
  }
  db.prepare(`UPDATE email_campaigns SET status = 'sent', sent_count = ?, failed_count = ?, sent_at = datetime('now')
    WHERE id = ?`).run(sent, failed, id);
  return { sent, failed };
}

// ── Logs ──
router.get('/logs', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 500').all();
  res.json(rows);
});

// ── SMTP settings ──
router.get('/settings', requireAdmin, (_req, res) => {
  const row = db.prepare(`SELECT value FROM settings WHERE key = 'smtp'`).get() as { value: string } | undefined;
  if (!row) { res.json({}); return; }
  try {
    const v = JSON.parse(row.value);
    res.json({ ...v, pass: v.pass ? '••••••' : '' });
  } catch { res.json({}); }
});

router.put('/settings', requireAdmin, (req: AuthRequest, res) => {
  const v = req.body ?? {};
  // Preserve existing password if the client sent the masked placeholder
  if (v.pass === '••••••') {
    const cur = db.prepare(`SELECT value FROM settings WHERE key = 'smtp'`).get() as { value: string } | undefined;
    if (cur) {
      try { const old = JSON.parse(cur.value); v.pass = old.pass; } catch { /* ignore */ }
    }
  }
  db.prepare(`INSERT INTO settings (key, value) VALUES ('smtp', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(JSON.stringify(v));
  logAction(req.admin!.username, 'email.settings.update');
  res.json({ ok: true });
});

// ── Subscribers ──
router.get('/subscribers', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC').all();
  res.json(rows);
});

router.delete('/subscribers/:email', requireAdmin, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM newsletter_subscribers WHERE email = ?').run(req.params.email.toLowerCase());
  logAction(req.admin!.username, 'subscriber.delete', req.params.email);
  res.json({ ok: true });
});

// ── Public subscribe / unsubscribe ──
router.post('/subscribe', (req, res) => {
  const { email, language, source } = req.body ?? {};
  const key = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) {
    res.status(400).json({ error: '邮箱格式无效' }); return;
  }
  db.prepare(`INSERT INTO newsletter_subscribers (email, language, source)
    VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET unsubscribed = 0, language = excluded.language`)
    .run(key, language || null, source || 'footer');
  res.json({ ok: true });
});

router.get('/unsubscribe', (req, res) => {
  const key = String(req.query.email || '').trim().toLowerCase();
  if (!key) { res.status(400).send('missing email'); return; }
  db.prepare('UPDATE newsletter_subscribers SET unsubscribed = 1 WHERE email = ?').run(key);
  res.set('Content-Type', 'text/html; charset=utf-8').send(`
    <div style="font-family:sans-serif;max-width:520px;margin:64px auto;text-align:center">
      <h2>已退订</h2><p>${key} 不再收到我们的营销邮件。</p>
    </div>`);
});

export default router;
