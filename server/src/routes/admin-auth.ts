import { Router } from 'express';
import { db } from '../db.js';
import {
  clearAdminCookie, hashPassword, issueAdminCookie, requireAdmin, verifyPassword,
  type AuthRequest
} from '../lib/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'invalid payload' }); return;
  }
  const row = db.prepare(
    'SELECT username, password_hash, role FROM admin_users WHERE username = ?'
  ).get(username) as { username: string; password_hash: string; role: 'admin' | 'editor' } | undefined;
  if (!row) { res.status(401).json({ error: '账号或密码错误' }); return; }
  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) { res.status(401).json({ error: '账号或密码错误' }); return; }
  issueAdminCookie(res, { username: row.username, role: row.role });
  res.json({ username: row.username, role: row.role });
});

router.post('/logout', (_req, res) => {
  clearAdminCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAdmin, (req: AuthRequest, res) => {
  res.json(req.admin);
});

// Admin-user CRUD (only admin role can manage)
router.get('/users', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT username, role, created_at AS createdAt FROM admin_users ORDER BY created_at').all();
  res.json(rows);
});

router.post('/users', requireAdmin, async (req: AuthRequest, res) => {
  if (req.admin?.role !== 'admin') { res.status(403).json({ error: '需要超级管理员权限' }); return; }
  const { username, password, role } = req.body ?? {};
  if (!username || !password || !['admin', 'editor'].includes(role)) {
    res.status(400).json({ error: '参数无效' }); return;
  }
  if (String(password).length < 8) {
    res.status(400).json({ error: '密码至少 8 位' }); return;
  }
  const exists = db.prepare('SELECT 1 FROM admin_users WHERE username = ?').get(username);
  if (exists) { res.status(409).json({ error: '用户名已存在' }); return; }
  const hash = await hashPassword(password);
  db.prepare('INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)').run(username, hash, role);
  res.status(201).json({ username, role });
});

router.delete('/users/:username', requireAdmin, (req: AuthRequest, res) => {
  if (req.admin?.role !== 'admin') { res.status(403).json({ error: '需要超级管理员权限' }); return; }
  const count = (db.prepare('SELECT COUNT(*) AS n FROM admin_users').get() as { n: number }).n;
  if (count <= 1) { res.status(400).json({ error: '至少需保留一个管理员账号' }); return; }
  if (req.params.username === req.admin.username) {
    res.status(400).json({ error: '不能删除当前登录账号' }); return;
  }
  db.prepare('DELETE FROM admin_users WHERE username = ?').run(req.params.username);
  res.json({ ok: true });
});

router.post('/password', requireAdmin, async (req: AuthRequest, res) => {
  const { oldPassword, newPassword } = req.body ?? {};
  if (!oldPassword || !newPassword) { res.status(400).json({ error: '参数无效' }); return; }
  if (String(newPassword).length < 8) { res.status(400).json({ error: '新密码至少 8 位' }); return; }
  const row = db.prepare('SELECT password_hash FROM admin_users WHERE username = ?')
    .get(req.admin!.username) as { password_hash: string } | undefined;
  if (!row) { res.status(404).json({ error: '账号不存在' }); return; }
  const ok = await verifyPassword(oldPassword, row.password_hash);
  if (!ok) { res.status(400).json({ error: '原密码不正确' }); return; }
  const hash = await hashPassword(newPassword);
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE username = ?').run(hash, req.admin!.username);
  res.json({ ok: true });
});

export default router;
