import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/init.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/wishlist?shopper_id=
router.get('/', asyncHandler(async (req, res) => {
  const shopper_id = req.query.shopper_id ?? req.query.customer_id; // accept legacy param
  if (!shopper_id) return res.status(400).json({ error: 'shopper_id required' });
  const rows = getDb().prepare(
    'SELECT * FROM wishlist WHERE shopper_id = ? ORDER BY saved_at DESC'
  ).all(shopper_id);
  res.json(rows);
}));

// POST /api/wishlist
router.post('/', asyncHandler(async (req, res) => {
  const shopper_id = req.body.shopper_id ?? req.body.customer_id;
  const { title, url, price, budget, reminder_date, notes, goal_id } = req.body;
  if (!shopper_id || !title) return res.status(400).json({ error: 'shopper_id and title required' });
  const id = uuid();
  getDb().prepare(`
    INSERT INTO wishlist (id, shopper_id, title, url, price, budget, reminder_date, notes, goal_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, shopper_id, title, url ?? null, price ?? null, budget ?? null, reminder_date ?? null, notes ?? null, goal_id ?? null);
  res.status(201).json(getDb().prepare('SELECT * FROM wishlist WHERE id = ?').get(id));
}));

// PATCH /api/wishlist/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const allowed = ['title', 'url', 'price', 'budget', 'reminder_date', 'notes', 'goal_id'];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
  const set = updates.map(([k]) => `${k} = ?`).join(', ');
  getDb().prepare(`UPDATE wishlist SET ${set} WHERE id = ?`).run(...updates.map(([, v]) => v), req.params.id);
  res.json(getDb().prepare('SELECT * FROM wishlist WHERE id = ?').get(req.params.id));
}));

// DELETE /api/wishlist/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  getDb().prepare('DELETE FROM wishlist WHERE id = ?').run(req.params.id);
  res.status(204).end();
}));

export default router;
