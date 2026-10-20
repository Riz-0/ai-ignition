import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/init.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { deriveSegment, resegmentMerchant, selectNextConversation } from '../services/journeyService.js';

const router = Router();

// 'interested' added per checklist (Phase 1 segmentation)
const VALID_SEGMENTS = [
  'first_time', 'returning_customer', 'replenishment', 'interested',
  'inactive', 'unresolved_issue', 'opted_out',
];

// GET /api/customers?merchant_id=&segment=
router.get('/', asyncHandler(async (req, res) => {
  const { merchant_id, segment } = req.query;
  if (!merchant_id) return res.status(400).json({ error: 'merchant_id required' });
  let sql    = 'SELECT * FROM customers WHERE merchant_id = ?';
  const args = [merchant_id];
  if (segment) { sql += ' AND segment = ?'; args.push(segment); }
  sql += ' ORDER BY name';
  res.json(getDb().prepare(sql).all(...args));
}));

// GET /api/customers/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const row = getDb().prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Customer not found' });
  res.json(row);
}));

// GET /api/customers/:id/next  — what should the agent do next?
router.get('/:id/next', asyncHandler(async (req, res) => {
  const row = getDb().prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Customer not found' });
  const next = selectNextConversation(row.merchant_id, row.id);
  res.json({ derivedSegment: deriveSegment(row), next });
}));

// POST /api/customers
router.post('/', asyncHandler(async (req, res) => {
  const { merchant_id, name, email, segment, orders, last_order, notes } = req.body;
  if (!merchant_id || !name) return res.status(400).json({ error: 'merchant_id and name required' });
  const id  = uuid();
  // Insert, then derive the segment from order data (unless explicitly set to a hard state)
  const seg = VALID_SEGMENTS.includes(segment)
    ? segment
    : deriveSegment({ orders: orders ?? 0, last_order: last_order ?? null, segment: 'first_time' });
  getDb().prepare(`
    INSERT INTO customers (id, merchant_id, name, email, segment, orders, last_order, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, merchant_id, name, email ?? null, seg, orders ?? 0, last_order ?? null, notes ?? null);
  res.status(201).json(getDb().prepare('SELECT * FROM customers WHERE id = ?').get(id));
}));

// POST /api/customers/import  — bulk import (JSON array OR raw CSV text)
router.post('/import', asyncHandler(async (req, res) => {
  const { merchant_id, records, csv } = req.body;
  if (!merchant_id) return res.status(400).json({ error: 'merchant_id required' });

  let rows = Array.isArray(records) ? records : null;

  // CSV support (Phase 4): header row + comma-separated values.
  // Expected headers: name,email,orders,last_order,notes
  if (!rows && typeof csv === 'string') {
    rows = parseCsv(csv);
  }
  if (!rows) return res.status(400).json({ error: 'Provide records[] or csv string' });

  const db     = getDb();
  const insert = db.prepare(`
    INSERT INTO customers (id, merchant_id, name, email, segment, orders, last_order, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const ids = [];
  const skipped = [];
  db.transaction(() => {
    for (const r of rows) {
      if (!r.name) { skipped.push(r); continue; }
      const orders    = Number(r.orders) || 0;
      const lastOrder = r.last_order || null;
      // Derive the segment unless the row explicitly carries a valid one
      const seg = VALID_SEGMENTS.includes(r.segment)
        ? r.segment
        : deriveSegment({ orders, last_order: lastOrder, segment: 'first_time' });
      const id = uuid();
      insert.run(id, merchant_id, r.name, r.email ?? null, seg, orders, lastOrder, r.notes ?? null);
      ids.push(id);
    }
  })();
  res.status(201).json({ imported: ids.length, skipped: skipped.length });
}));

// POST /api/customers/resegment  — recompute all segments from order data
router.post('/resegment', asyncHandler(async (req, res) => {
  const { merchant_id } = req.body;
  if (!merchant_id) return res.status(400).json({ error: 'merchant_id required' });
  const changed = resegmentMerchant(merchant_id);
  res.json({ changed });
}));

// PATCH /api/customers/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const allowed = ['name', 'email', 'segment', 'orders', 'last_order', 'notes'];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
  const segUpdate = updates.find(([k]) => k === 'segment');
  if (segUpdate && !VALID_SEGMENTS.includes(segUpdate[1])) {
    return res.status(400).json({ error: `Invalid segment. Must be one of: ${VALID_SEGMENTS.join(', ')}` });
  }
  const set = updates.map(([k]) => `${k} = ?`).join(', ');
  getDb().prepare(`UPDATE customers SET ${set} WHERE id = ?`).run(...updates.map(([, v]) => v), req.params.id);
  res.json(getDb().prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id));
}));

/**
 * Minimal CSV parser. Handles a header row and comma separation.
 * Does not handle quoted commas — adequate for the demo; swap for a
 * library (e.g. csv-parse) in production.
 */
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const cells = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h] = (cells[i] ?? '').trim(); });
    return row;
  });
}

export default router;
