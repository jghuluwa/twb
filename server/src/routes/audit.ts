/**
 * Audit log read API (write happens via lib/audit.ts).
 *   GET /api/audit              — admin: last 500 entries
 *   GET /api/audit?actor=xxx    — filter by user
 *   GET /api/audit?action=xxx   — filter by action
 */
import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../lib/auth.js';

const router = Router();

router.get('/', requireAdmin, (req, res) => {
  const wheres: string[] = [];
  const params: unknown[] = [];
  if (req.query.actor)  { wheres.push('actor = ?');  params.push(req.query.actor); }
  if (req.query.action) { wheres.push('action LIKE ?'); params.push(`${req.query.action}%`); }
  const where = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';
  const rows = db.prepare(`SELECT id, ts, actor, action, target, payload
    FROM audit_log ${where} ORDER BY id DESC LIMIT 500`).all(...params);
  res.json(rows);
});

export default router;
