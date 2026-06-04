import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../lib/auth.js';

const router = Router();

router.post('/view', (req, res) => {
  const { sessionId, path, referrer, language, device } = req.body ?? {};
  if (typeof sessionId !== 'string' || !sessionId || typeof path !== 'string') {
    res.status(400).json({ error: 'invalid view' }); return;
  }
  db.prepare(`INSERT INTO page_views (session_id, path, referrer, language, device)
    VALUES (?, ?, ?, ?, ?)`).run(
      sessionId.slice(0, 100), path.slice(0, 300),
      typeof referrer === 'string' ? referrer.slice(0, 500) : null,
      typeof language === 'string' ? language.slice(0, 20) : null,
      typeof device === 'string' ? device.slice(0, 30) : null
    );
  res.status(204).end();
});

router.get('/admin', requireAdmin, (_req, res) => {
  const totals = db.prepare(`SELECT
    COUNT(*) AS views,
    COUNT(DISTINCT session_id) AS visitors,
    SUM(CASE WHEN created_at >= datetime('now','-1 day') THEN 1 ELSE 0 END) AS viewsToday,
    COUNT(DISTINCT CASE WHEN created_at >= datetime('now','-1 day') THEN session_id END) AS visitorsToday,
    SUM(CASE WHEN created_at >= datetime('now','-30 days') THEN 1 ELSE 0 END) AS views30
    FROM page_views`).get();
  const daily = db.prepare(`SELECT substr(created_at,1,10) AS date, COUNT(*) AS views,
    COUNT(DISTINCT session_id) AS visitors FROM page_views
    WHERE created_at >= datetime('now','-14 days')
    GROUP BY substr(created_at,1,10) ORDER BY date`).all();
  const topPages = db.prepare(`SELECT path, COUNT(*) AS views FROM page_views
    GROUP BY path ORDER BY views DESC LIMIT 8`).all();
  const devices = db.prepare(`SELECT COALESCE(device,'unknown') AS device, COUNT(*) AS views
    FROM page_views GROUP BY device ORDER BY views DESC`).all();
  res.json({ totals, daily, topPages, devices });
});

export default router;
