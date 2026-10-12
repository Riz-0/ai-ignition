/**
 * Savings routes — goal pockets and ledger entries.
 *
 * All values are planning records. Recording a contribution does
 * not transfer funds; money stays in the user's existing accounts.
 */
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/init.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// ── Goals ────────────────────────────────────────────────────

// GET /api/savings/goals?shopper_id=
router.get('/goals', asyncHandler(async (req, res) => {
  const { shopper_id } = req.query;
  if (!shopper_id) return res.status(400).json({ error: 'shopper_id required' });
  res.json(getDb().prepare('SELECT * FROM savings_goals WHERE shopper_id = ? ORDER BY created_at DESC').all(shopper_id));
}));

// POST /api/savings/goals
router.post('/goals', asyncHandler(async (req, res) => {
  const { shopper_id, name, icon, target_amount, contribution_amount, contribution_frequency, linked_wishlist_id } = req.body;
  if (!shopper_id || !name || !target_amount) return res.status(400).json({ error: 'shopper_id, name and target_amount required' });
  const id = uuid();
  getDb().prepare(`
    INSERT INTO savings_goals (id, shopper_id, name, icon, target_amount, contribution_amount, contribution_frequency, linked_wishlist_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, shopper_id, name, icon ?? '🎯', Number(target_amount), Number(contribution_amount) || 0,
         contribution_frequency ?? 'weekly', linked_wishlist_id ?? null);
  res.status(201).json(getDb().prepare('SELECT * FROM savings_goals WHERE id = ?').get(id));
}));

// PATCH /api/savings/goals/:id
router.patch('/goals/:id', asyncHandler(async (req, res) => {
  const allowed = ['name', 'icon', 'target_amount', 'current_amount', 'contribution_amount', 'contribution_frequency', 'status', 'linked_wishlist_id'];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
  const set = updates.map(([k]) => `${k} = ?`).join(', ');
  getDb().prepare(`UPDATE savings_goals SET ${set} WHERE id = ?`).run(...updates.map(([, v]) => v), req.params.id);
  res.json(getDb().prepare('SELECT * FROM savings_goals WHERE id = ?').get(req.params.id));
}));

// DELETE /api/savings/goals/:id
router.delete('/goals/:id', asyncHandler(async (req, res) => {
  getDb().prepare('DELETE FROM savings_goals WHERE id = ?').run(req.params.id);
  res.status(204).end();
}));

// ── Ledger entries ───────────────────────────────────────────

// GET /api/savings/ledger?shopper_id=&goal_id=
router.get('/ledger', asyncHandler(async (req, res) => {
  const { shopper_id, goal_id } = req.query;
  if (!shopper_id) return res.status(400).json({ error: 'shopper_id required' });
  let sql  = 'SELECT * FROM savings_ledger WHERE shopper_id = ?';
  const args = [shopper_id];
  if (goal_id) { sql += ' AND goal_id = ?'; args.push(goal_id); }
  sql += ' ORDER BY date DESC, created_at DESC';
  res.json(getDb().prepare(sql).all(...args));
}));

// POST /api/savings/ledger
router.post('/ledger', asyncHandler(async (req, res) => {
  const { shopper_id, goal_id, type, amount, note, date } = req.body;
  if (!shopper_id || !goal_id || !type || !amount) {
    return res.status(400).json({ error: 'shopper_id, goal_id, type and amount required' });
  }
  if (!['contribution', 'withdrawal', 'planned'].includes(type)) {
    return res.status(400).json({ error: 'type must be contribution, withdrawal or planned' });
  }
  const id = uuid();
  getDb().prepare(`
    INSERT INTO savings_ledger (id, goal_id, shopper_id, type, amount, note, date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, goal_id, shopper_id, type, Number(amount), note ?? null, date ?? new Date().toISOString().slice(0, 10));

  // Update goal current_amount for completed (non-planned) entries
  if (type !== 'planned') {
    const goal = getDb().prepare('SELECT * FROM savings_goals WHERE id = ?').get(goal_id);
    if (goal) {
      const delta = type === 'withdrawal' ? -Number(amount) : Number(amount);
      const next  = Math.max(0, (goal.current_amount || 0) + delta);
      getDb().prepare('UPDATE savings_goals SET current_amount = ? WHERE id = ?').run(next, goal_id);
    }
  }

  res.status(201).json(getDb().prepare('SELECT * FROM savings_ledger WHERE id = ?').get(id));
}));

// DELETE /api/savings/ledger/:id — correct a mistaken record
router.delete('/ledger/:id', asyncHandler(async (req, res) => {
  const entry = getDb().prepare('SELECT * FROM savings_ledger WHERE id = ?').get(req.params.id);
  if (entry && entry.type !== 'planned') {
    const goal  = getDb().prepare('SELECT * FROM savings_goals WHERE id = ?').get(entry.goal_id);
    if (goal) {
      const delta = entry.type === 'withdrawal' ? Number(entry.amount) : -Number(entry.amount);
      const next  = Math.max(0, (goal.current_amount || 0) + delta);
      getDb().prepare('UPDATE savings_goals SET current_amount = ? WHERE id = ?').run(next, entry.goal_id);
    }
  }
  getDb().prepare('DELETE FROM savings_ledger WHERE id = ?').run(req.params.id);
  res.status(204).end();
}));

export default router;
