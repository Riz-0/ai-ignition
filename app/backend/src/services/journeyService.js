/**
 * Journey service — business logic for triggering, advancing and
 * exiting customer journeys.
 *
 * This service is called by the routes layer and encapsulates the
 * rules described in the markdown spec (§7 Business Process).
 *
 * Key rules enforced here:
 *   - Contact limit per customer per day.
 *   - Block customers with unresolved issues or opted-out status.
 *   - Recheck stock and price before presenting an offer.
 *   - Escalate to support when needed; pause sales prompts.
 *   - Exit after purchase, opt-out or contact limit.
 */
import { getDb }  from '../db/init.js';
import { v4 as uuid } from 'uuid';

// Weekly push cap per shopper (spec: 2 pushes per week per user).
const WEEKLY_PUSH_CAP = 2;
// Days of inactivity before a customer is considered inactive.
const INACTIVITY_DAYS = 45;

/**
 * Derive a customer's segment from their actual order data.
 * This is the segmentation ENGINE — it reads order count, last order
 * and recorded interest rather than relying on a hand-set value.
 *
 * Priority order: hard states first, then evidence-based segments.
 *
 * @param {object} customer  — row from the customers table
 * @returns {string} segment
 */
export function deriveSegment(customer) {
  if (!customer) return 'first_time';

  // Hard states are never overwritten by derivation.
  if (customer.segment === 'opted_out')        return 'opted_out';
  if (customer.segment === 'unresolved_issue') return 'unresolved_issue';
  // A merchant/agent may explicitly mark a saved-item customer as interested.
  if (customer.segment === 'interested')       return 'interested';

  const orders    = Number(customer.orders) || 0;
  const lastOrder = customer.last_order ? new Date(customer.last_order) : null;
  const daysSince = lastOrder ? Math.floor((Date.now() - lastOrder.getTime()) / 86400000) : Infinity;

  if (orders === 0) return 'first_time';
  if (daysSince > INACTIVITY_DAYS) return 'inactive';
  if (orders >= 3) return 'replenishment';   // frequent buyer → likely repeat-use
  if (orders >= 2) return 'returning_customer';
  return 'first_time';
}

/**
 * Re-segment every customer for a merchant from their order data.
 * Returns the number of customers whose segment changed.
 */
export function resegmentMerchant(merchantId) {
  const db        = getDb();
  const customers = db.prepare('SELECT * FROM customers WHERE merchant_id = ?').all(merchantId);
  const update    = db.prepare('UPDATE customers SET segment = ? WHERE id = ?');
  let changed = 0;
  const tx = db.transaction(() => {
    for (const c of customers) {
      const next = deriveSegment(c);
      if (next !== c.segment) { update.run(next, c.id); changed++; }
    }
  });
  tx();
  return changed;
}

/**
 * Quiet-hours check. Returns true if NOW is inside the shopper's quiet
 * window, meaning a push must be held.
 *
 * @param {{ quiet_start?: string, quiet_end?: string }} profile
 * @param {Date} [now]
 */
export function isWithinQuietHours(profile, now = new Date()) {
  if (!profile?.quiet_start || !profile?.quiet_end) return false;
  const toMins = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const start = toMins(profile.quiet_start);
  const end   = toMins(profile.quiet_end);
  const cur   = now.getHours() * 60 + now.getMinutes();
  // Overnight window (e.g. 22:00 → 08:00) wraps midnight.
  return start > end ? (cur >= start || cur < end) : (cur >= start && cur < end);
}

/**
 * Can we send a push to this shopper right now?
 * Enforces quiet hours and the weekly cap.
 *
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canSendPush(shopperId, profile) {
  if (isWithinQuietHours(profile)) {
    return { allowed: false, reason: 'within quiet hours' };
  }
  const db       = getDb();
  const weekAgo  = new Date(Date.now() - 7 * 86400000).toISOString();
  const sent     = db.prepare(
    "SELECT COUNT(*) AS n FROM reminders WHERE shopper_id = ? AND created_at >= ?"
  ).get(shopperId, weekAgo)?.n ?? 0;
  if (sent >= WEEKLY_PUSH_CAP) {
    return { allowed: false, reason: `weekly cap of ${WEEKLY_PUSH_CAP} reached` };
  }
  return { allowed: true };
}

/**
 * Determine the most appropriate next conversation for a customer.
 * Uses the DERIVED segment, not just the stored one.
 *
 * @param {string} merchantId
 * @param {string} customerId
 * @returns {{ trigger: string, reason: string, productId?: string } | null}
 */
export function selectNextConversation(merchantId, customerId) {
  const db       = getDb();
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
  if (!customer) return null;

  const segment = deriveSegment(customer);

  // Hard exits
  if (segment === 'opted_out')        return null;
  if (segment === 'unresolved_issue') return null;

  // Daily contact limit
  const merchant   = db.prepare('SELECT * FROM merchant_profiles WHERE id = ?').get(merchantId);
  const limit      = merchant?.contact_limit_daily ?? 2;
  const today      = new Date().toISOString().slice(0, 10);
  const todayCount = db.prepare(
    "SELECT COUNT(*) AS n FROM journeys WHERE merchant_id = ? AND customer_id = ? AND date(created_at) = ?"
  ).get(merchantId, customerId, today)?.n ?? 0;
  if (todayCount >= limit) return null;

  switch (segment) {
    case 'first_time':
      return { trigger: 'first_order',   reason: 'First order delivered — offer product guidance and a satisfaction check.' };
    case 'returning_customer':
      return { trigger: 'complementary', reason: 'Multiple orders — suggest a relevant complementary product.' };
    case 'replenishment':
      return { trigger: 'replenishment', reason: 'Repeat-use product and regular intervals — ask whether more is needed.' };
    case 'interested':
      return { trigger: 'saved_item',    reason: 'Saved item or recent authorised interest — clarify budget, preference or hesitation.' };
    case 'inactive':
      return { trigger: 'inactivity',    reason: `No order in ${INACTIVITY_DAYS}+ days — ask what changed and offer relevant help.` };
    default:
      return null;
  }
}

/**
 * Verify a product is still available before presenting an offer.
 * Returns { available: boolean, currentPrice: number | null, note?: string }
 */
export function verifyProductAvailability(productId) {
  const db      = getDb();
  const product = db.prepare('SELECT * FROM catalogue WHERE id = ?').get(productId);
  if (!product) return { available: false, currentPrice: null, note: 'Product not found in catalogue.' };
  if (!product.in_stock) return { available: false, currentPrice: product.price, note: 'Product is currently out of stock.' };
  return { available: true, currentPrice: product.price };
}

/**
 * Create a support handover and update the customer segment.
 * Called when a journey is escalated.
 */
export function escalateToSupport(merchantId, journeyId, customerId, customerName, reason) {
  const db = getDb();
  db.prepare(`
    INSERT INTO support_handovers (id, merchant_id, journey_id, customer_name, reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(uuid(), merchantId, journeyId, customerName, reason ?? 'Escalated from journey');
  db.prepare("UPDATE customers SET segment = 'unresolved_issue' WHERE id = ?").run(customerId);
  db.prepare("UPDATE journeys SET status = 'closed', outcome = 'support_needed', closed_at = datetime('now') WHERE id = ?")
    .run(journeyId);
}
