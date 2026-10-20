import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/init.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/reminders?shopper_id=
router.get('/', asyncHandler(async (req, res) => {
  const shopper_id = req.query.shopper_id ?? req.query.customer_id;
  if (!shopper_id) return res.status(400).json({ error: 'shopper_id required' });
  res.json(getDb().prepare('SELECT * FROM reminders WHERE shopper_id = ? ORDER BY date').all(shopper_id));
}));

// POST /api/reminders
router.post('/', asyncHandler(async (req, res) => {
  const shopper_id = req.body.shopper_id ?? req.body.customer_id;
  const { product_id, date } = req.body;
  if (!shopper_id || !date) return res.status(400).json({ error: 'shopper_id and date required' });
  const id = uuid();
  getDb().prepare('INSERT INTO reminders (id, shopper_id, product_id, date) VALUES (?, ?, ?, ?)')
    .run(id, shopper_id, product_id ?? null, date);
  res.status(201).json(getDb().prepare('SELECT * FROM reminders WHERE id = ?').get(id));
}));

// DELETE /api/reminders/:id  (dismiss — mark fired)
router.delete('/:id', asyncHandler(async (req, res) => {
  getDb().prepare('UPDATE reminders SET fired = 1 WHERE id = ?').run(req.params.id);
  res.status(204).end();
}));

export default router;
