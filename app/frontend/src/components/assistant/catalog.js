import { getPersonaFeed } from '../../store/personaFeeds.js';
import { DEMO_PRODUCTS, PLATFORM_META } from '../../data/demoProducts.js';

/**
 * The products Hoot may recommend for this account: the account's own
 * Discover picks first (Emily's beauty and travel finds, John's fitness
 * gear…), then the demo shop items. One flat shape for the chat cards:
 *   { id, title, price, merchant, category, emoji, url }
 */
export function buildCatalog(accountId, profile) {
  const persona = (getPersonaFeed(accountId, profile?.userType) ?? []).map(p => ({
    id: p.id,
    title: p.title,
    price: typeof p.price === 'number' ? p.price : null,
    merchant: p.merchant ?? null,
    category: p.category ?? null,
    emoji: p.emoji ?? '🛍️',
    url: p.url ?? null,
  }));
  const shop = DEMO_PRODUCTS.map(p => ({
    id: p.id,
    title: p.name,
    price: p.price,
    merchant: PLATFORM_META[p.platform]?.name ?? p.platform,
    category: p.category,
    emoji: p.emoji,
    url: p.url,
  }));
  return [...persona, ...shop];
}
