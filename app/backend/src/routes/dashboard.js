import { Router } from 'express';
import { getDb } from '../db/init.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/dashboard/summary?merchant_id=
router.get('/summary', asyncHandler(async (req, res) => {
  const { merchant_id } = req.query;
  if (!merchant_id) return res.status(400).json({ error: 'merchant_id required' });

  const db = getDb();

  const totalCustomers   = db.prepare('SELECT COUNT(*) AS n FROM customers WHERE merchant_id = ?').get(merchant_id).n;
  const activeJourneys   = db.prepare("SELECT COUNT(*) AS n FROM journeys WHERE merchant_id = ? AND status = 'active'").get(merchant_id).n;
  const closedJourneys   = db.prepare("SELECT COUNT(*) AS n FROM journeys WHERE merchant_id = ? AND status = 'closed'").get(merchant_id).n;
  const purchases        = db.prepare("SELECT COUNT(*) AS n FROM journeys WHERE merchant_id = ? AND outcome = 'purchased'").get(merchant_id).n;
  const openHandovers    = db.prepare('SELECT COUNT(*) AS n FROM support_handovers WHERE merchant_id = ? AND resolved = 0').get(merchant_id).n;
  const optOuts          = db.prepare("SELECT COUNT(*) AS n FROM customers WHERE merchant_id = ? AND segment = 'opted_out'").get(merchant_id).n;

  const convToPurchase = closedJourneys > 0
    ? Math.round((purchases / closedJourneys) * 100)
    : 0;

  res.json({
    totalCustomers,
    activeJourneys,
    closedJourneys,
    purchases,
    openHandovers,
    optOuts,
    convToPurchaseRate: convToPurchase,
    note: 'Figures are based on demo data. They do not prove real retention improvements.',
  });
}));

// GET /api/dashboard/segments?merchant_id=
router.get('/segments', asyncHandler(async (req, res) => {
  const { merchant_id } = req.query;
  if (!merchant_id) return res.status(400).json({ error: 'merchant_id required' });

  const db   = getDb();
  const rows = db.prepare(`
    SELECT segment, COUNT(*) AS count
    FROM customers
    WHERE merchant_id = ?
    GROUP BY segment
    ORDER BY count DESC
  `).all(merchant_id);

  res.json(rows);
}));

/**
 * GET /api/dashboard/metrics?merchant_id=
 * Holdout vs journey comparison (Phase 4 / spec §13).
 * Everything is labelled as demo data — this does NOT prove real lift.
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  const { merchant_id } = req.query;
  if (!merchant_id) return res.status(400).json({ error: 'merchant_id required' });
  const db = getDb();

  // Split customers into journey group vs holdout (control) group
  const journeyGroup = db.prepare('SELECT * FROM customers WHERE merchant_id = ? AND holdout = 0').all(merchant_id);
  const holdoutGroup = db.prepare('SELECT * FROM customers WHERE merchant_id = ? AND holdout = 1').all(merchant_id);

  // Repeat-purchase = a customer with a 'purchased' journey outcome
  const purchasedIds = new Set(
    db.prepare("SELECT DISTINCT customer_id FROM journeys WHERE merchant_id = ? AND outcome = 'purchased'")
      .all(merchant_id).map(r => r.customer_id)
  );

  const repeatRate = (group) => {
    if (group.length === 0) return 0;
    const buyers = group.filter(c => purchasedIds.has(c.id)).length;
    return Math.round((buyers / group.length) * 100);
  };

  // Opt-out rate across all customers
  const total   = journeyGroup.length + holdoutGroup.length;
  const optOuts = db.prepare("SELECT COUNT(*) AS n FROM customers WHERE merchant_id = ? AND segment = 'opted_out'").get(merchant_id).n;

  // Average time-to-next-purchase (days) from journey start to purchase event
  const purchaseEvents = db.prepare(`
    SELECT j.created_at AS started, e.created_at AS purchased
    FROM journeys j
    JOIN journey_events e ON e.journey_id = j.id AND e.type = 'purchased'
    WHERE j.merchant_id = ?
  `).all(merchant_id);
  let avgDays = null;
  if (purchaseEvents.length) {
    const totalDays = purchaseEvents.reduce((sum, r) => {
      const d = (new Date(r.purchased) - new Date(r.started)) / 86400000;
      return sum + (isFinite(d) && d >= 0 ? d : 0);
    }, 0);
    avgDays = Math.round((totalDays / purchaseEvents.length) * 10) / 10;
  }

  res.json({
    journeyGroup: { size: journeyGroup.length, repeatPurchaseRate: repeatRate(journeyGroup) },
    holdoutGroup: { size: holdoutGroup.length, repeatPurchaseRate: repeatRate(holdoutGroup) },
    timeToNextPurchaseDays: avgDays,
    optOutRate: total > 0 ? Math.round((optOuts / total) * 100) : 0,
    note: 'DEMO DATA. For a real pilot, assign the holdout group randomly. Sample figures do not prove a real increase in retention or lifetime value.',
  });
}));

/**
 * GET /api/dashboard/rejections?merchant_id=
 * Aggregate why journeys did not convert — "45% said too expensive" view.
 */
router.get('/rejections', asyncHandler(async (req, res) => {
  const { merchant_id } = req.query;
  if (!merchant_id) return res.status(400).json({ error: 'merchant_id required' });
  const db = getDb();

  const rows = db.prepare(`
    SELECT e.type AS reason, COUNT(*) AS count
    FROM journey_events e
    JOIN journeys j ON j.id = e.journey_id
    WHERE j.merchant_id = ?
      AND e.type IN ('too_expensive','wrong_style','not_interested','opted_out','no_response','reminded_later','support_needed')
    GROUP BY e.type
    ORDER BY count DESC
  `).all(merchant_id);

  const total = rows.reduce((s, r) => s + r.count, 0);
  const withPct = rows.map(r => ({
    reason: r.reason.replace(/_/g, ' '),
    count: r.count,
    percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
  }));

  res.json({ total, reasons: withPct, note: 'Aggregated from recorded journey events (demo data).' });
}));

/**
 * GET /api/dashboard/explainer?merchant_id=
 * "Why this journey fired" log — reason + trigger for each journey.
 */
router.get('/explainer', asyncHandler(async (req, res) => {
  const { merchant_id } = req.query;
  if (!merchant_id) return res.status(400).json({ error: 'merchant_id required' });
  const rows = getDb().prepare(`
    SELECT id, customer_name, product_name, trigger, reason, status, outcome, created_at
    FROM journeys
    WHERE merchant_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(merchant_id);
  res.json(rows);
}));

export default router;
