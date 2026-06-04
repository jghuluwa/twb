/**
 * Audit log helper — records who did what, for the admin "审计日志" page.
 * Always fire-and-forget; failures here must NEVER break a real write.
 */
import { db } from '../db.js';

export function logAction(actor: string, action: string, target?: string, payload?: unknown): void {
  try {
    const p = payload === undefined ? null
      : JSON.stringify(payload).slice(0, 2000);
    db.prepare('INSERT INTO audit_log (actor, action, target, payload) VALUES (?, ?, ?, ?)')
      .run(actor, action, target || null, p);
  } catch (err) {
    // never throw
    // eslint-disable-next-line no-console
    console.warn('[audit] failed to log', err);
  }
}
