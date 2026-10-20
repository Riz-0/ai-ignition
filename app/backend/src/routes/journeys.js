import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/init.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { verifyProductAvailability } from '../services/journeyService.js';

const router = Router();

// GET /api/journeys?merchant_id=&status=
router.get('/', asyncHandler(async (req, res) => {
  const { merchant_id, status } = req.query;
  if (!merchant_id) return res.status(400).json({ error: 'merchant_id required' });
  const db   = getDb();
  let sql    = 'SELECT * FROM journeys WHERE merchant_id = ?';
  const args = [merchant_id];
  if (status) { sql += ' AND status = ?'; args.push(status); }
  sql += ' ORDER BY created_at DESC';
  const journeys = db.prepare(sql).all(...args);
  const withEvents = journeys.map(j => ({
    ...j,
    events: db.prepare('SELECT * FROM journey_events WHERE journey_id = ? ORDER BY created_at').all(j.id),
  }));
  res.json(withEvents);
}));

// POST /api/journeys  — start a journey
router.post('/', asyncHandler(async (req, res) => {
  const { merchant_id, customer_id, customer_name, product_id, product_name, trigger, reason } = req.body;
  if (!merchant_id || !customer_id) return res.status(400).json({ error: 'merchant_id and customer_id required' });

  // Enforce contact limit: count active journeys for this customer today
  const db    = getDb();
  const merchant = db.prepare('SELECT * FROM merchant_profiles WHERE id = ?').get(merchant_id);
  const limit = merchant?.contact_limit_daily ?? 2;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = db.prepare(`
    SELECT COUNT(*) AS n FROM journeys
    WHERE merchant_id = ? AND customer_id = ? AND date(created_at) = ?
  `).get(merchant_id, customer_id, today)?.n ?? 0;
  if (todayCount >= limit) {
    return res.status(429).json({ error: `Contact limit of ${limit} per day reached for this customer.` });
  }

  // Block customers with unresolved issues / opt-out / holdout
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
  if (customer?.segment === 'unresolved_issue') {
    return res.status(409).json({ error: 'Cannot start journey: customer has an unresolved support issue.' });
  }
  if (customer?.segment === 'opted_out') {
    return res.status(409).json({ error: 'Cannot start journey: customer has opted out.' });
  }
  if (customer?.holdout === 1) {
    return res.status(409).json({ error: 'Customer is in the holdout (control) group and is excluded from journeys.' });
  }

  // Recheck stock/price before presenting an offer (spec §7.7).
  // journeyService is now actually used here.
  let availability = null;
  if (product_id) {
    availability = verifyProductAvailability(product_id);
    if (!availability.available) {
      return res.status(409).json({
        error: `Cannot start journey: ${availability.note ?? 'product unavailable'}`,
        availability,
      });
    }
  }

  const id = uuid();
  db.prepare(`
    INSERT INTO journeys (id, merchant_id, customer_id, customer_name, product_id, product_name, trigger, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, merchant_id, customer_id, customer_name ?? null, product_id ?? null,
         product_name ?? null, trigger ?? null, reason ?? null);

  res.status(201).json({
    ...db.prepare('SELECT * FROM journeys WHERE id = ?').get(id),
    events: [],
    availability,
  });
}));

// GET /api/journeys/:id/recheck  — re-verify stock/price before a reminder fires
router.get('/:id/recheck', asyncHandler(async (req, res) => {
  const db      = getDb();
  const journey = db.prepare('SELECT * FROM journeys WHERE id = ?').get(req.params.id);
  if (!journey) return res.status(404).json({ error: 'Journey not found' });
  if (!journey.product_id) return res.json({ available: true, note: 'No product linked.' });
  res.json(verifyProductAvailability(journey.product_id));
}));

// POST /api/journeys/:id/event  — log a customer response
router.post('/:id/event', asyncHandler(async (req, res) => {
  const { type, note } = req.body;
  if (!type) return res.status(400).json({ error: 'type required' });
  const db      = getDb();
  const journey = db.prepare('SELECT * FROM journeys WHERE id = ?').get(req.params.id);
  if (!journey) return res.status(404).json({ error: 'Journey not found' });

  const evId = uuid();
  db.prepare('INSERT INTO journey_events (id, journey_id, type, note) VALUES (?, ?, ?, ?)')
    .run(evId, req.params.id, type, note ?? null);

  // Auto-close on terminal outcomes
  const TERMINAL = ['purchased', 'opted_out', 'support_needed'];
  if (TERMINAL.includes(type)) {
    db.prepare(`UPDATE journeys SET status = 'closed', outcome = ?, closed_at = datetime('now') WHERE id = ?`)
      .run(type, req.params.id);

    // If support needed, create a handover and update customer segment
    if (type === 'support_needed') {
      db.prepare(`
        INSERT INTO support_handovers (id, merchant_id, journey_id, customer_name, reason)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuid(), journey.merchant_id, journey.id, journey.customer_name, note ?? 'Escalated from journey');
      db.prepare("UPDATE customers SET segment = 'unresolved_issue' WHERE id = ?").run(journey.customer_id);
    }

    if (type === 'opted_out') {
      db.prepare("UPDATE customers SET segment = 'opted_out' WHERE id = ?").run(journey.customer_id);
    }
  }

  res.json({ event: db.prepare('SELECT * FROM journey_events WHERE id = ?').get(evId) });
}));

// POST /api/journeys/:id/close
router.post('/:id/close', asyncHandler(async (req, res) => {
  const { outcome } = req.body;
  getDb().prepare(`UPDATE journeys SET status = 'closed', outcome = ?, closed_at = datetime('now') WHERE id = ?`)
    .run(outcome ?? 'closed', req.params.id);
  res.json({ status: 'closed', outcome: outcome ?? 'closed' });
}));

export default router;
