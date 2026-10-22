import { getPersonaFeed } from '../../store/personaFeeds.js';
import { DEMO_PRODUCTS, PLATFORM_META } from '../../data/demoProducts.js';
import { getFeedVideos } from '../../data/feedVideos.js';

/**
 * The products Hoot may recommend for this account: the products in the
 * account's Discover videos first, then its saved persona picks (Emily's
 * beauty and travel finds, John's fitness gear…), then the demo shop items.
 * One flat shape for the chat cards:
 *   { id, title, price, merchant, category, emoji, url }
 */
export function buildCatalog(accountId, profile) {
  const videos = getFeedVideos(accountId, profile).map(v => ({
    id: v.id,
    title: v.title,
    price: v.price,
    merchant: v.merchant,
    category: v.category,
    emoji: v.emoji,
    url: v.url,
  }));
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
  return [...videos, ...persona, ...shop];
}
