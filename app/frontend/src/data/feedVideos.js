/**
 * Discover feed videos, per persona.
 *
 * Each clip was matched to the product it shows. `linkType` says how sure
 * the link is:
 *   - 'product': the exact product page (prices checked at the time of writing)
 *   - 'brand':   the brand's own shop (couldn't reach a single product page)
 *   - 'search':  a Shopee Singapore search for that exact item, for generic
 *                TikTok-shop products that have no single official listing
 * `approx: true` means the price is a typical price for that item, not a
 * checked one; the feed shows it as "~$".
 *
 * Videos live in public/videos/<emily|john|shared>/. Clips that suit both
 * personas are stored once in shared/ and listed for both.
 */

const shopee = (q) => `https://shopee.sg/search?keyword=${encodeURIComponent(q)}`;

const SHARED = [
  {
    id: 'v-minicam', videoUrl: '/videos/shared/mini-security-camera.mp4',
    title: 'Mini Magnetic Security Camera', merchant: 'Shopee', category: 'Gadgets', emoji: '📷',
    description: 'Thumb-sized magnetic camera with motion alerts to your phone. Hide it on any shelf.',
    price: 29.90, approx: true, linkType: 'search', url: shopee('mini magnetic security camera motion detection'),
  },
  {
    id: 'v-perfume', videoUrl: '/videos/shared/inspired-perfume.mp4',
    title: 'Designer-Inspired Perfume (ginger notes)', merchant: 'Shopee', category: 'Fragrance', emoji: '🧴',
    description: 'Fresh, ginger-forward "inspired-by" scents at a fraction of designer prices.',
    price: 39.90, approx: true, linkType: 'search', url: shopee('inspired perfume dupe ginger'),
  },
  {
    id: 'v-whitetomato', videoUrl: '/videos/shared/white-tomato-drink.mp4',
    title: 'OXYENERGY White Tomato Drink', merchant: 'Shopee', category: 'Wellness', emoji: '🍅',
    description: 'Drinkable white tomato sachets marketed for brighter skin and UV protection from the inside.',
    price: 39.90, approx: true, linkType: 'search', url: shopee('oxyenergy white tomato drink'),
  },
];

const EMILY = [
  {
    id: 'v-bodysuit', videoUrl: '/videos/emily/yoga-bodysuit.mp4',
    title: 'Seamless One-Piece Yoga Bodysuit', merchant: 'TikTok Shop', category: 'Fashion', emoji: '🖤',
    description: 'Padded, sculpting one-piece with a strappy back. Pilates to brunch in one outfit.',
    price: 22.34, approx: true, linkType: 'search', url: shopee('seamless one piece yoga bodysuit padded'),
  },
  {
    id: 'v-seamlessbra', videoUrl: '/videos/emily/seamless-bra.mp4',
    title: 'Seamless Wireless Bra (no visible lines)', merchant: 'TikTok Shop', category: 'Fashion', emoji: '🤍',
    description: 'Smooth, invisible under fitted tees. Comfy enough to forget you are wearing it.',
    price: 19.90, approx: true, linkType: 'search', url: shopee('seamless wireless bra invisible'),
  },
  {
    id: 'v-sweatpants', videoUrl: '/videos/emily/wide-leg-sweatpants.mp4',
    title: 'Wide-Leg Grey Sweatpants', merchant: 'Shopee', category: 'Fashion', emoji: '👖',
    description: 'The gym, shopping, bouldering, anything-type fit. Relaxed wide leg in heather grey.',
    price: 29.90, approx: true, linkType: 'search', url: shopee('wide leg grey sweatpants women'),
  },
  {
    id: 'v-matcha', videoUrl: '/videos/emily/naoki-matcha.mp4',
    title: 'Naoki Matcha (homemade iced matcha)', merchant: 'Naoki Matcha', category: 'Food & Drinks', emoji: '🍵',
    description: 'A $1.50 homemade iced matcha beats a $7 café one. Singapore matcha brand.',
    price: 32.00, approx: true, linkType: 'brand', url: 'https://www.naokimatcha.com/',
  },
  {
    id: 'v-charger', videoUrl: '/videos/emily/glowing-charger.mp4',
    title: 'Iedo Glowing Fast Charger + Cable', merchant: 'Shopee', category: 'Gadgets', emoji: '🔌',
    description: 'Cute bauble-style charger that lights up so you can plug in in the dark.',
    price: 25.90, approx: true, linkType: 'search', url: shopee('iedo charger glowing'),
  },
  {
    id: 'v-catsquishy', videoUrl: '/videos/emily/fluffy-cat-squishy.mp4',
    title: 'Fluffy Himalayan Cat Squishy', merchant: 'Shopee', category: 'Toys & Gifts', emoji: '🐱',
    description: 'Super-soft slow-rise cat you can squish flat and watch puff back up.',
    price: 19.90, approx: true, linkType: 'search', url: shopee('fluffy cat squishy himalayan'),
  },
  {
    id: 'v-coconutsquishy', videoUrl: '/videos/emily/coconut-oil-squishy.mp4',
    title: 'Coconut Oil Squishy Stress Ball', merchant: 'TikTok Shop', category: 'Toys & Gifts', emoji: '🫧',
    description: 'Silky, jelly-soft stress ball. No crumbs, no mess, very satisfying.',
    price: 9.90, approx: true, linkType: 'search', url: shopee('coconut oil squishy stress ball'),
  },
  {
    id: 'v-toothbrush', videoUrl: '/videos/emily/travel-toothbrush-case.mp4',
    title: 'Portable Travel Toothbrush Case Set', merchant: 'Shopee', category: 'Travel', emoji: '🪥',
    description: 'Pocket-size toothbrush and toothpaste case for travel and after-lunch touch-ups.',
    price: 12.90, approx: true, linkType: 'search', url: shopee('portable travel toothbrush case set'),
  },
];

const JOHN = [
  {
    id: 'v-shaver', videoUrl: '/videos/john/smoothoperator-shaver.mp4',
    title: 'Ubersuave SmoothOperator Pro Tri-Blade Shaver', merchant: 'SG Pomades', category: 'Grooming', emoji: '🪒',
    description: 'One device for face, body and nose: foil, trimmer and nose heads. Waterproof.',
    price: 44.95, linkType: 'product', url: 'https://sgpomades.com/products/ubersuave-smoothoperator-pro-manscape',
  },
  {
    id: 'v-nethers', videoUrl: '/videos/john/nethers-intimate-wash.mp4',
    title: "Nethers Down Under Men's Intimate Wash 120ml", merchant: 'SG Pomades', category: 'Grooming', emoji: '🧼',
    description: 'pH-balanced foaming wash with tea tree and witch hazel. Stay fresh after the gym.',
    price: 12.00, linkType: 'product', url: 'https://sgpomades.com/products/nethers-intimate-wash-120ml',
  },
  {
    id: 'v-cheekies', videoUrl: '/videos/john/cheekies-satay-chicken.mp4',
    title: 'Cheekies Satay Chicken Breasts (1kg)', merchant: 'Cheekies', category: 'Food & Protein', emoji: '🍗',
    description: 'Pre-marinated high-protein chicken breast. Air-fry and meal-prep the week.',
    price: 24.99, linkType: 'product', url: 'https://www.cheekies.sg/products/tandoori-chicken-breasts-1kg',
  },
  {
    id: 'v-bcaa', videoUrl: '/videos/john/ehplabs-beyond-bcaa.mp4',
    title: 'EHPlabs Beyond BCAA + EAA (Kiwi Strawberry)', merchant: 'Shopee', category: 'Supplements', emoji: '🥤',
    description: 'Intra-workout aminos for recovery and hydration. Caffeine-free.',
    price: 59.90, approx: true, linkType: 'search', url: shopee('ehplabs beyond bcaa eaa kiwi strawberry'),
  },
  {
    id: 'v-hairremoval', videoUrl: '/videos/john/herbmical-hair-removal.mp4',
    title: 'Herbmical Hair Removal Cream', merchant: 'Shopee', category: 'Grooming', emoji: '🌿',
    description: 'Botanical hair removal cream with a scraper. Smooth legs without razor nicks.',
    price: 19.90, approx: true, linkType: 'search', url: shopee('herbmical hair removal cream'),
  },
  {
    id: 'v-cardholder', videoUrl: '/videos/john/popup-card-holder.mp4',
    title: 'XPOVOS Pop-Up Card Holder Wallet', merchant: 'Shopee', category: 'Accessories', emoji: '💳',
    description: 'Slim aluminium wallet. One push and your cards fan out.',
    price: 29.90, approx: true, linkType: 'search', url: shopee('xpovos pop up card holder wallet'),
  },
  {
    id: 'v-belt', videoUrl: '/videos/john/hidden-elastic-belt.mp4',
    title: 'Buckle-Free Hidden Elastic Belt', merchant: 'Shopee', category: 'Accessories', emoji: '🩳',
    description: 'No buckle, no bulge. Clips inside your jeans and stays invisible.',
    price: 19.90, approx: true, linkType: 'search', url: shopee('buckle free hidden elastic belt men'),
  },
  {
    id: 'v-lighter', videoUrl: '/videos/john/keychain-match-lighter.mp4',
    title: 'Keychain Permanent Match Lighter', merchant: 'Shopee', category: 'Gadgets', emoji: '🔥',
    description: 'Strike-anywhere metal match on a carabiner keychain, with a bottle opener.',
    price: 12.90, approx: true, linkType: 'search', url: shopee('permanent match keychain lighter'),
  },
  {
    id: 'v-hoop', videoUrl: '/videos/john/indoor-basketball-hoop.mp4',
    title: 'Indoor Mini Basketball Hoop + Silent Ball', merchant: 'Shopee', category: 'Sports', emoji: '🏀',
    description: 'Wall-mount indoor hoop with a foam silent ball. Shoot around without the noise.',
    price: 29.90, approx: true, linkType: 'search', url: shopee('indoor basketball hoop silent ball set'),
  },
];

const BY_PERSONA = {
  emily: [...EMILY, ...SHARED],
  john:  [...JOHN, ...SHARED],
};

const BY_ACCOUNT = { 'demo-emily': 'emily', 'demo-john': 'john' };

export const ALL_FEED_VIDEOS = [...EMILY, ...JOHN, ...SHARED];

/**
 * The videos for this account: Emily's and John's own feeds, otherwise every
 * clip with the ones matching the user's interests first.
 */
export function getFeedVideos(accountId, profile) {
  const persona = BY_ACCOUNT[accountId];
  if (persona) return BY_PERSONA[persona];

  const interests = (profile?.interests ?? []).map(i => i.toLowerCase());
  const matches = (v) => interests.some(i => {
    const cat = v.category.toLowerCase();
    return cat.includes(i) || i.includes(cat) || v.title.toLowerCase().includes(i);
  });
  // Students lean to Emily's picks, working adults to John's, interests first.
  const base = profile?.userType === 'working' ? [...JOHN, ...SHARED, ...EMILY] : [...EMILY, ...SHARED, ...JOHN];
  return [...base.filter(matches), ...base.filter(v => !matches(v))];
}
