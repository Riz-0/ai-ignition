/* ============================================================
   assistantBus — a tiny pub/sub so the Discovery feed can tell the
   globally-mounted FloatingAssistant which product is on screen.

   Kept separate from the Zustand app store on purpose: this is
   transient UI signalling (what's visible right now), not persisted
   state, so it never touches localStorage or the privacy-walled data.
   ============================================================ */

const listeners = new Set();

/** The feed calls this as the user scrolls to a new product (or null). */
export function setFocusedProduct(product) {
  for (const fn of listeners) {
    try { fn(product); } catch { /* ignore listener errors */ }
  }
}

/** The FloatingAssistant subscribes; returns an unsubscribe fn. */
export function onFocusedProduct(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
