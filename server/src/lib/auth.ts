import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.warn('[therabo] WARNING: JWT_SECRET is not set; using insecure default. Set JWT_SECRET in .env for production.');
}
const SECRET = JWT_SECRET || 'dev-only-insecure-secret-change-me';

const ADMIN_COOKIE = 'therabo_admin';
const CUST_COOKIE  = 'therabo_cust';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

type AdminTokenPayload = { kind: 'admin'; username: string; role: 'admin' | 'editor' };
type CustomerTokenPayload = { kind: 'customer'; customerId: string; email: string };

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    maxAge: SEVEN_DAYS_MS,
    path: '/'
  };
}

export function issueAdminCookie(res: Response, payload: Omit<AdminTokenPayload, 'kind'>): void {
  const token = jwt.sign({ kind: 'admin', ...payload } as AdminTokenPayload, SECRET, { expiresIn: '7d' });
  res.cookie(ADMIN_COOKIE, token, cookieOptions());
}

export function issueCustomerCookie(res: Response, payload: Omit<CustomerTokenPayload, 'kind'>): void {
  const token = jwt.sign({ kind: 'customer', ...payload } as CustomerTokenPayload, SECRET, { expiresIn: '7d' });
  res.cookie(CUST_COOKIE, token, cookieOptions());
}

export function clearAdminCookie(res: Response): void {
  res.clearCookie(ADMIN_COOKIE, { path: '/' });
}

export function clearCustomerCookie(res: Response): void {
  res.clearCookie(CUST_COOKIE, { path: '/' });
}

function readToken<T>(req: Request, name: string): T | null {
  const raw = req.cookies?.[name];
  if (!raw) return null;
  try { return jwt.verify(raw, SECRET) as T; } catch { return null; }
}

export interface AuthRequest extends Request {
  admin?: { username: string; role: 'admin' | 'editor' };
  customer?: { customerId: string; email: string };
}

export function attachAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const admin = readToken<AdminTokenPayload>(req, ADMIN_COOKIE);
  if (admin?.kind === 'admin') req.admin = { username: admin.username, role: admin.role };
  const cust = readToken<CustomerTokenPayload>(req, CUST_COOKIE);
  if (cust?.kind === 'customer') req.customer = { customerId: cust.customerId, email: cust.email };
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.admin) { res.status(401).json({ error: 'admin login required' }); return; }
  next();
}

export function requireCustomer(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.customer) { res.status(401).json({ error: 'login required' }); return; }
  next();
}
