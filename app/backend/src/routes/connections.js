/**
 * Connections Hub routes — Shopee, SHEIN, TikTok Shop, Taobao, Pinduoduo.
 *
 * Four integration routes per spec §10:
 *   1. Link-only   — paste/share a product URL
 *   2. Import      — upload receipt or order export (simulated in MVP)
 *   3. Live        — authorised merchant API connection (future)
 *   4. Handoff     — open listing and track via authorised callback
 *
 * Never set status to 'live' if only a product link was saved.
 * All price/stock claims must come from verified merchant catalogue data.
 */
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/init.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
const VALID_PLATFORMS = ['shopee', 'shein', 'tiktok', 'taobao', 'pinduoduo'];
const VALID_STATUSES  = ['live', 'imported', 'link-only', 'needs-attention', 'demo'];

// GET /api/connections?shopper_id=
router.get('/', asyncHandler(async (req, res) => {
  const { shopper_id } = req.query;
  if (!shopper_id) return res.status(400).json({ error: 'shopper_id required' });
  const rows = getDb().prepare('SELECT * FROM connections WHERE shopper_id = ?').all(shopper_id);
  res.json(rows);
}));

// PATCH /api/connections/:platform — update status
router.patch('/:platform', asyncHandler(async (req, res) => {
  const { platform } = req.params;
  const { shopper_id, status, route } = req.body;
  if (!shopper_id)                        return res.status(400).json({ error: 'shopper_id required' });
  if (!VALID_PLATFORMS.includes(platform)) return res.status(400).json({ error: 'Unknown platform' });
  if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const db  = getDb();
  const id  = uuid();
  db.prepare(`
    INSERT INTO connections (id, shopper_id, platform, status, route, connected_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(shopper_id, platform)
    DO UPDATE SET status = excluded.status, route = excluded.route, connected_at = excluded.connected_at
  `).run(id, shopper_id, platform, status ?? 'link-only', route ?? 'link-only');

  res.json(db.prepare('SELECT * FROM connections WHERE shopper_id = ? AND platform = ?').get(shopper_id, platform));
}));

// ── Saved product links ──────────────────────────────────────

// GET /api/connections/links?shopper_id=&platform=
router.get('/links', asyncHandler(async (req, res) => {
  const { shopper_id, platform } = req.query;
  if (!shopper_id) return res.status(400).json({ error: 'shopper_id required' });
  let sql  = 'SELECT * FROM saved_links WHERE shopper_id = ?';
  const args = [shopper_id];
  if (platform) { sql += ' AND platform = ?'; args.push(platform); }
  sql += ' ORDER BY saved_at DESC';
  res.json(getDb().prepare(sql).all(...args));
}));

// POST /api/connections/links
router.post('/links', asyncHandler(async (req, res) => {
  const { shopper_id, platform, url, title, price, currency } = req.body;
  if (!shopper_id || !platform || !url) {
    return res.status(400).json({ error: 'shopper_id, platform and url required' });
  }
  if (!VALID_PLATFORMS.includes(platform)) return res.status(400).json({ error: 'Unknown platform' });

  const db = getDb();
  const id = uuid();
  db.prepare(`
    INSERT INTO saved_links (id, shopper_id, platform, url, title, price, currency, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `).run(id, shopper_id, platform, url, title ?? null, price ? Number(price) : null, currency ?? 'SGD');

  // Bump connection status to link-only if it was demo
  const conn = db.prepare('SELECT * FROM connections WHERE shopper_id = ? AND platform = ?').get(shopper_id, platform);
  if (!conn || conn.status === 'demo') {
    db.prepare(`
      INSERT INTO connections (id, shopper_id, platform, status, route, connected_at)
      VALUES (?, ?, ?, 'link-only', 'link-only', datetime('now'))
      ON CONFLICT(shopper_id, platform)
      DO UPDATE SET status = 'link-only', route = 'link-only'
    `).run(uuid(), shopper_id, platform);
  }

  res.status(201).json({ ...db.prepare('SELECT * FROM saved_links WHERE id = ?').get(id), note: 'Price is unverified — sharing a link does not confirm a current price.' });
}));

// DELETE /api/connections/links/:id
router.delete('/links/:id', asyncHandler(async (req, res) => {
  getDb().prepare('DELETE FROM saved_links WHERE id = ?').run(req.params.id);
  res.status(204).end();
}));

// ── Simulated import ─────────────────────────────────────────
// POST /api/connections/:platform/import
// In the MVP this extracts sample records and returns them for
// user confirmation. Real OCR/API parsing is a later build.
router.post('/:platform/import', asyncHandler(async (req, res) => {
  const { platform } = req.params;
  if (!VALID_PLATFORMS.includes(platform)) return res.status(400).json({ error: 'Unknown platform' });

  res.json({
    platform,
    status:  'demo',
    records: [
      { date: '2026-09-15', item: 'Sample product A', amount: 24.90, currency: 'SGD', confirmed: false },
      { date: '2026-09-22', item: 'Sample product B', amount: 12.50, currency: 'SGD', confirmed: false },
      { date: '2026-10-01', item: 'Sample product C', amount: 38.00, currency: 'SGD', confirmed: false },
    ],
    note: 'SIMULATED — label: Demo data. User must confirm each record before it updates the spending plan. Real file parsing is a later build.',
  });
}));

export default router;
