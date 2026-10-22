/**
 * Hoot's voices. Every tone can do exactly the same things (budget checks,
 * goals, wishlist, product second opinions); only the personality changes.
 *
 * The tone is picked per account first (the demo personas), then from the
 * user's interests, then from their account type.
 */

export const TONES = {
  bestie: {
    label: 'Bestie mode',
    greeting: (name) => `Hiii ${name || 'babe'}! 💕 It's Hoot, your 2AM shopping bestie. Want me to find you something cute, or check if something fits your budget? ✨`,
    chips: ['Recommend something cute ✨', "What's my budget left? 💕", 'How are my savings goals? 🌸', "What's on my wishlist? 🛍️"],
  },
  coach: {
    label: 'Coach mode',
    greeting: (name) => `Yo ${name || 'champ'} 👊 Hoot here, your 2AM spotter. I can find you gear, run a purchase past your budget, or check your goals.`,
    chips: ['Recommend some gear 💪', "What's my budget left?", 'How are my goals tracking?', 'Check my wishlist'],
  },
  friendly: {
    label: 'Friendly mode',
    greeting: (name) => `Hey ${name || 'there'}! 👋 I'm Hoot, your 2AM assistant. I can recommend products, check if something fits your budget, or see how your goals are going.`,
    chips: ['Recommend something for me', 'How much can I spend?', 'How are my goals?', "What's on my wishlist?"],
  },
  calm: {
    label: 'Calm mode',
    greeting: (name) => `Hi ${name || 'there'}, I'm Hoot, your 2AM assistant. I can recommend products, check a purchase against your budget, track your goals, or review your wishlist.`,
    chips: ['Recommend something for me', 'How much can I spend?', 'How are my goals?', "What's on my wishlist?"],
  },
  pro: {
    label: 'Business mode',
    greeting: () => "Hello, I'm Hoot, your 2AM assistant. Ask me about your customers, products or campaign ideas.",
    chips: ['Ideas to bring customers back', 'How should I price a bundle?', 'Write a friendly reminder message'],
  },
};

const BY_ACCOUNT = {
  'demo-emily': 'bestie',
  'demo-john':  'coach',
};

const BESTIE_INTERESTS = ['Beauty', 'Fashion'];
const COACH_INTERESTS  = ['Fitness', 'Sports', 'Supplements', 'Activewear', 'Gadgets', 'Electronics'];

/**
 * @param {string|null} accountId
 * @param {object|null} profile   shopperProfile
 * @param {'shopper'|'business'} mode
 * @returns {keyof TONES}
 */
export function pickTone(accountId, profile, mode = 'shopper') {
  if (mode === 'business') return 'pro';
  if (accountId && BY_ACCOUNT[accountId]) return BY_ACCOUNT[accountId];
  const interests = profile?.interests ?? [];
  if (interests.some(i => BESTIE_INTERESTS.includes(i))) return 'bestie';
  if (interests.some(i => COACH_INTERESTS.includes(i))) return 'coach';
  return profile?.userType === 'working' ? 'calm' : 'friendly';
}
