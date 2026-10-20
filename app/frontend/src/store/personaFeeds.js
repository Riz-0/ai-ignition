/**
 * Personalised discovery feeds per persona.
 *
 * These are real, well-known products sourced from the web, matched to
 * each persona's interests so the "Discover" tab feels genuinely tailored:
 *   - Emily  → Sephora beauty, fashion, travel/vlogging gear
 *   - John   → fitness supplements, activewear, Shinchan collectibles
 *
 * Prices are indicative (USD) and clearly labelled as sample data in the UI.
 * `url` deep-links to the real product/brand page so "View product" works.
 *
 * Keyed first by account id, then by userType as a fallback for any
 * student/working account without a bespoke feed.
 */

/* ───────────────── Emily — Student / KOL (beauty, fashion, travel) ───────────────── */
const EMILY_FEED = [
  {
    id: 'em1', type: 'demo', merchant: 'Sephora', category: 'Beauty',
    title: 'Rare Beauty Soft Pinch Liquid Blush',
    desc: 'Selena Gomez\'s cult liquid blush — one dot blends into a lit-from-within flush. A KOL staple for GRWM videos.',
    price: 23.00, emoji: '🌸', tags: ['interest_match', 'trending'],
    cta: 'View on Sephora', url: 'https://www.sephora.com/product/rare-beauty-by-selena-gomez-soft-pinch-liquid-blush-P97989778',
  },
  {
    id: 'em2', type: 'demo', merchant: 'Sephora', category: 'Fragrance',
    title: 'Sol de Janeiro Cheirosa 62 Bum Bum Mist',
    desc: 'The viral beachy hair & body mist — pistachio + salted caramel. Perfect travel-size scent for vlogs.',
    price: 39.00, emoji: '🥥', tags: ['trending', 'within_budget'],
    cta: 'View on Sephora', url: 'https://www.sephora.com/product/brazilian-crush-cheirosa-62-perfume-mist-P454071',
  },
  {
    id: 'em3', type: 'comparison', merchant: 'Sephora', category: 'Skincare',
    title: 'Laneige Lip Glowy Balm vs. Lip Sleeping Mask',
    desc: 'Glowy Balm: on-the-go shine for filming. Sleeping Mask: overnight repair. Both berry-scented K-beauty icons.',
    price: 24.00, emoji: '💋', tags: ['comparison'],
    cta: 'Compare both', url: 'https://www.sephora.com/brand/laneige',
  },
  {
    id: 'em4', type: 'demo', merchant: 'Sephora', category: 'Beauty',
    title: 'Sephora Favorites — Vacay All Day Value Set',
    desc: 'Travel-size makeup + skincare minis, ideal for a carry-on. Great $-per-ml for a trip creator on a budget.',
    price: 42.00, emoji: '✈️', tags: ['travel', 'within_budget', 'value_set'],
    cta: 'View set', url: 'https://www.sephora.com/product/vacay-all-day-makeup-skincare-value-set-P521683',
  },
  {
    id: 'em5', type: 'demo', merchant: 'Amazon', category: 'Content Creation',
    title: 'UBeesize 10" Selfie Ring Light + Tripod',
    desc: 'Clip-on ring light with phone tripod — soft, even light for Reels and TikToks. Links to your "Ring light" goal.',
    price: 32.99, emoji: '🎥', tags: ['interest_match', 'goal_linked'],
    cta: 'View product', url: 'https://www.amazon.com/s?k=ubesize+ring+light+tripod',
  },
  {
    id: 'em6', type: 'bundle', merchant: 'SHEIN', category: 'Fashion',
    title: 'SHEIN Travel Capsule — 5-Piece Mix & Match',
    desc: 'Lightweight neutral pieces that pack flat and film well. Build-a-set deal for your Korea trip wardrobe.',
    price: 48.00, emoji: '👗', tags: ['travel', 'group_deal'],
    cta: 'View capsule', url: 'https://www.shein.com',
    note: 'SIMULATED bundle — illustrative pricing',
  },
];

/* ───────────────── John — Working adult (fitness, supplements, Shinchan) ───────────────── */
const JOHN_FEED = [
  {
    id: 'jn1', type: 'demo', merchant: 'Optimum Nutrition', category: 'Supplements',
    title: 'Optimum Nutrition Gold Standard 100% Whey (2lb)',
    desc: '24g protein, 5.5g BCAAs per scoop. The go-to post-workout shake. Double Rich Chocolate. Time to reorder?',
    price: 39.99, emoji: '🥤', tags: ['replenishment', 'interest_match'],
    cta: 'View product', url: 'https://www.optimumnutrition.com/en-us/products/gold-standard-100-whey-protein-powder',
  },
  {
    id: 'jn2', type: 'comparison', merchant: 'Optimum Nutrition', category: 'Supplements',
    title: 'Gold Standard Whey vs. Isolate — which for you?',
    desc: 'Whey: best all-round value. Isolate: leaner, faster-absorbing, lower lactose. Both banned-substance tested.',
    price: null, emoji: '⚖️', tags: ['comparison'],
    cta: 'Compare both', url: 'https://www.optimumnutrition.com/en-us/collections/whey-protein',
  },
  {
    id: 'jn3', type: 'demo', merchant: 'Gymshark', category: 'Activewear',
    title: 'Gymshark Power Stringer Tank',
    desc: 'Breathable, sweat-wicking tank built for heavy lifting days. Pairs with your new lifting-shoes goal.',
    price: 30.00, emoji: '🎽', tags: ['interest_match', 'within_budget'],
    cta: 'View on Gymshark', url: 'https://www.gymshark.com/collections/all-products/mens',
  },
  {
    id: 'jn4', type: 'demo', merchant: 'Nike', category: 'Activewear',
    title: 'Nike Metcon 9 Training Shoes',
    desc: 'Flat, stable heel for squats and lifts — exactly what your "New lifting shoes" goal is saving for.',
    price: 150.00, emoji: '👟', tags: ['goal_linked', 'interest_match'],
    cta: 'View product', url: 'https://www.nike.com/w/training-gym-shoes',
  },
  {
    id: 'jn5', type: 'demo', merchant: 'Amazon', category: 'Collectibles',
    title: 'Crayon Shin-chan Action Figure — Blind Box',
    desc: 'New Shinchan mini-figure series for your collection. One of 8 to collect. Ships from your saved seller.',
    price: 14.90, emoji: '🧸', tags: ['interest_match', 'collectible'],
    cta: 'View product', url: 'https://www.amazon.com/s?k=crayon+shin-chan+figure',
  },
  {
    id: 'jn6', type: 'bundle', merchant: 'MyProtein', category: 'Supplements',
    title: 'MyProtein Post-Workout Stack — Whey + Creatine',
    desc: 'Bundle creatine monohydrate with your whey and save vs. buying separately. Colleague group-buy eligible.',
    price: 55.00, emoji: '💪', tags: ['group_deal', 'replenishment'],
    cta: 'View stack', url: 'https://www.myprotein.com',
    note: 'SIMULATED bundle — illustrative pricing',
  },
];

/* Keyed by the demo account ids from demoAccounts.js */
const BY_ACCOUNT = {
  'demo-emily': EMILY_FEED,
  'demo-john':  JOHN_FEED,
};

/* Fallback by user type for generic student / working accounts */
const BY_TYPE = {
  student: EMILY_FEED,
  working: JOHN_FEED,
};

/**
 * Return the personalised feed for the active account.
 * @param {string} accountId  activeAccountId from the app store
 * @param {string} userType   'student' | 'working'
 * @returns {Array|null}  persona feed, or null to use the generic demo feed
 */
export function getPersonaFeed(accountId, userType) {
  if (accountId && BY_ACCOUNT[accountId]) return BY_ACCOUNT[accountId];
  if (userType && BY_TYPE[userType])      return BY_TYPE[userType];
  return null;
}

export { EMILY_FEED, JOHN_FEED };
