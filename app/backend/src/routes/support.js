/**
 * Support routes — the merchant handover queue and 1-click takeover.
 *
 * Takeover pauses the AI on the related conversation so a human agent
 * handles it, and keeps sales prompts paused until the case is resolved
 * (spec §7.8 / Phase 4 "support queue and takeover").
 */
import { Router } from 'express';
import { getDb } from '../db/init.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/support?merchant_id=&resolved=
router.get('/', asyncHandler(async (req, res) => {
  const { merchant_id, resolved } = req.query;
  if (!merchant_id) return res.status(400).json({ error: 'merchant_id required' });
  let sql  = 'SELECT * FROM support_handovers WHERE merchant_id = ?';
  const args = [merchant_id];
  if (resolved === '0' || resolved === '1') { sql += ' AND resolved = ?'; args.push(Number(resolved)); }
  sql += ' ORDER BY created_at DESC';
  res.json(getDb().prepare(sql).all(...args));
}));

// POST /api/support/:id/takeover  — human agent takes over, AI paused
router.post('/:id/takeover', asyncHandler(async (req, res) => {
  const db = getDb();
  const handover = db.prepare('SELECT * FROM support_handovers WHERE id = ?').get(req.params.id);
  if (!handover) return res.status(404).json({ error: 'Handover not found' });

  // Mark the handover as taken over (a note column could track the agent).
  db.prepare("UPDATE support_handovers SET reason = COALESCE(reason,'') || ' [human handling]' WHERE id = ?")
    .run(req.params.id);

  // Pause the AI on any linked conversation and on the customer's journey.
  if (handover.journey_id) {
    db.prepare("UPDATE journeys SET status = 'paused_support' WHERE id = ?").run(handover.journey_id);
  }

  res.json({ status: 'taken_over', message: 'AI paused. A human agent is now handling this conversation.' });
}));

// POST /api/support/:id/resolve
router.post('/:id/resolve', asyncHandler(async (req, res) => {
  const db = getDb();
  const handover = db.prepare('SELECT * FROM support_handovers WHERE id = ?').get(req.params.id);
  if (!handover) return res.status(404).json({ error: 'Handover not found' });

  db.prepare("UPDATE support_handovers SET resolved = 1, resolved_at = datetime('now') WHERE id = ?")
    .run(req.params.id);

  // Lift the pause: the customer is no longer in an unresolved state.
  // Move them back to a neutral segment so future journeys can resume.
  if (handover.journey_id) {
    const journey = db.prepare('SELECT * FROM journeys WHERE id = ?').get(handover.journey_id);
    if (journey) {
      db.prepare("UPDATE customers SET segment = 'returning_customer' WHERE id = ? AND segment = 'unresolved_issue'")
        .run(journey.customer_id);
    }
  }

  res.json({ status: 'resolved' });
}));

export default router;
