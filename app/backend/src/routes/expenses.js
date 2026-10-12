/**
 * Expense routes — shopper spending records for budget calculation.
 *
 * Budget formula (from spec §9):
 *   Remaining discretionary = confirmed income − essential reserves
 *                           − savings allocations − buffer
 *                           − recorded discretionary spending
 *
 * Labels as a recorded plan; missing imports are surfaced separately.
 * These records are NEVER shared with the merchant side.
 */
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/init.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/expenses?shopper_id=&from=&to=&category=
router.get('/', asyncHandler(async (req, res) => {
  const { shopper_id, from, to, category } = req.query;
  if (!shopper_id) return res.status(400).json({ error: 'shopper_id required' });
  let sql  = 'SELECT * FROM expenses WHERE shopper_id = ?';
  const args = [shopper_id];
  if (from)     { sql += ' AND date >= ?'; args.push(from); }
  if (to)       { sql += ' AND date <= ?'; args.push(to); }
  if (category) { sql += ' AND category = ?'; args.push(category); }
  sql += ' ORDER BY date DESC, created_at DESC';
  res.json(getDb().prepare(sql).all(...args));
}));

// GET /api/expenses/summary?shopper_id=&period=week|month
router.get('/summary', asyncHandler(async (req, res) => {
  const { shopper_id, period } = req.query;
  if (!shopper_id) return res.status(400).json({ error: 'shopper_id required' });

  const profile = getDb().prepare('SELECT * FROM shopper_profiles WHERE id = ?').get(shopper_id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const now    = new Date();
  let   from;
  if (period === 'week' || profile.user_type === 'student') {
    from = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  }

  const rows = getDb().prepare(`
    SELECT category, SUM(amount) AS total FROM expenses
    WHERE shopper_id = ? AND date >= ?
    GROUP BY category ORDER BY total DESC
  `).all(shopper_id, from);

  const totalDiscretionary = rows
    .filter(r => r.category !== 'essential')
    .reduce((s, r) => s + r.total, 0);

  // Deterministic budget calculation
  let remaining = null;
  if (profile.user_type === 'student') {
    remaining = (profile.allowance || 0)
      - (profile.essential_student || 0)
      - (profile.savings_allocation || 0)
      - totalDiscretionary;
  } else {
    remaining = (profile.income || 0)
      - (profile.essential_reserve || 0)
      - (profile.savings_allocation || 0)
      - (profile.buffer || 0)
      - totalDiscretionary;
  }

  res.json({
    from,
    to: now.toISOString().slice(0, 10),
    categories: rows,
    totalDiscretionary: Math.max(0, totalDiscretionary),
    remaining: Math.max(0, remaining ?? 0),
    note: 'Recorded plan. Missing expenses or unconfirmed imports shown separately.',
  });
}));

// POST /api/expenses
router.post('/', asyncHandler(async (req, res) => {
  const { shopper_id, category, amount, description, date, source } = req.body;
  if (!shopper_id || !amount) return res.status(400).json({ error: 'shopper_id and amount required' });
  const id = uuid();
  getDb().prepare(`
    INSERT INTO expenses (id, shopper_id, category, amount, description, date, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, shopper_id, category ?? 'shopping', Number(amount), description ?? null,
         date ?? new Date().toISOString().slice(0, 10), source ?? 'manual');
  res.status(201).json(getDb().prepare('SELECT * FROM expenses WHERE id = ?').get(id));
}));

// DELETE /api/expenses/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  getDb().prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  res.status(204).end();
}));

export default router;
