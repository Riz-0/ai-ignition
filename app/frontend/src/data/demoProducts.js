/* ============================================================
   In-app product catalog — demo data for the Connections Hub.
   Represents what a live platform integration would surface.
   Clearly labelled as demo data; real integrations require
   platform approval and verified price/stock (see 2amdepoloyers.md).
   ============================================================ */

export const DEMO_PRODUCTS = [
  // ── Shopee ──
  { id: 'sh-1', platform: 'shopee', name: 'Canvas sneakers — white', price: 32.90, currency: 'SGD', emoji: '👟', category: 'Fashion', rating: 4.6, url: 'https://shopee.com', demo: true },
  { id: 'sh-2', platform: 'shopee', name: 'Wireless earbuds (basic)', price: 19.90, currency: 'SGD', emoji: '🎧', category: 'Electronics', rating: 4.3, url: 'https://shopee.com', demo: true },
  { id: 'sh-3', platform: 'shopee', name: 'Study lamp LED', price: 14.50, currency: 'SGD', emoji: '💡', category: 'Stationery', rating: 4.7, url: 'https://shopee.com', demo: true },

  // ── SHEIN ──
  { id: 'shn-1', platform: 'shein', name: 'Oversized hoodie', price: 24.00, currency: 'SGD', emoji: '🧥', category: 'Fashion', rating: 4.4, url: 'https://www.shein.com', demo: true },
  { id: 'shn-2', platform: 'shein', name: 'Pleated skirt', price: 18.50, currency: 'SGD', emoji: '👗', category: 'Fashion', rating: 4.2, url: 'https://www.shein.com', demo: true },
  { id: 'shn-3', platform: 'shein', name: 'Knit beanie', price: 8.90, currency: 'SGD', emoji: '🧢', category: 'Accessories', rating: 4.5, url: 'https://www.shein.com', demo: true },

  // ── TikTok Shop ──
  { id: 'tt-1', platform: 'tiktok', name: 'Office coffee beans 500g', price: 28.00, currency: 'SGD', emoji: '☕', category: 'Coffee', rating: 4.8, url: 'https://shop.tiktok.com', demo: true },
  { id: 'tt-2', platform: 'tiktok', name: 'Desk organiser set', price: 16.90, currency: 'SGD', emoji: '🗂️', category: 'Stationery', rating: 4.5, url: 'https://shop.tiktok.com', demo: true },
  { id: 'tt-3', platform: 'tiktok', name: 'Skincare starter kit', price: 35.00, currency: 'SGD', emoji: '🧴', category: 'Beauty', rating: 4.6, url: 'https://shop.tiktok.com', demo: true },

  // ── Taobao ──
  { id: 'tb-1', platform: 'taobao', name: 'Mechanical keyboard', price: 65.00, currency: 'SGD', emoji: '⌨️', category: 'Electronics', rating: 4.7, url: 'https://www.taobao.com', demo: true },
  { id: 'tb-2', platform: 'taobao', name: 'Bamboo tea set', price: 22.00, currency: 'SGD', emoji: '🍵', category: 'Home', rating: 4.9, url: 'https://www.taobao.com', demo: true },
  { id: 'tb-3', platform: 'taobao', name: 'Running shoes', price: 48.00, currency: 'SGD', emoji: '🏃', category: 'Sports', rating: 4.4, url: 'https://www.taobao.com', demo: true },

  // ── Pinduoduo ──
  { id: 'pd-1', platform: 'pinduoduo', name: 'Snack bundle (colleague pack)', price: 12.00, currency: 'SGD', emoji: '🍿', category: 'Food', rating: 4.3, url: 'https://www.pinduoduo.com', demo: true, bundle: true },
  { id: 'pd-2', platform: 'pinduoduo', name: 'Coffee group deal × 6', price: 42.00, currency: 'SGD', emoji: '🛒', category: 'Coffee', rating: 4.6, url: 'https://www.pinduoduo.com', demo: true, bundle: true },
  { id: 'pd-3', platform: 'pinduoduo', name: 'Stationery pack', price: 9.90, currency: 'SGD', emoji: '✏️', category: 'Stationery', rating: 4.5, url: 'https://www.pinduoduo.com', demo: true, bundle: true },
];

export const PLATFORM_META = {
  shopee:    { name: 'Shopee',      emoji: '🛍️', url: 'https://shopee.com' },
  shein:     { name: 'SHEIN',      emoji: '👗', url: 'https://www.shein.com' },
  tiktok:    { name: 'TikTok Shop', emoji: '📱', url: 'https://shop.tiktok.com' },
  taobao:    { name: 'Taobao',     emoji: '🏪', url: 'https://www.taobao.com' },
  pinduoduo: { name: 'Pinduoduo',  emoji: '🤝', url: 'https://www.pinduoduo.com' },
};
