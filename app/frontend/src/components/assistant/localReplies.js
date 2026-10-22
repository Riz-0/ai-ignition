/**
 * On-device replies for Hoot, used when the assistant server isn't reachable
 * (no backend, no API key, offline). They only cover the core jobs — budget,
 * goals, wishlist, a price check — but in the same voice as the AI, so the
 * chat never feels broken. Nothing here leaves the device.
 */

const money = (n) => `$${Number(n).toFixed(Number.isInteger(Number(n)) ? 0 : 2)}`;

/* Per-tone phrasing. Each entry is a function of the facts it needs. */
const VOICE = {
  bestie: {
    left: (amt, period) => `You've got ${money(amt)} left this ${period}, babe 💕`,
    fits: (price, left) => `Good news bestie ✨ ${money(price)} fits, and you'd still have ${money(left)} left. Treat yourself (just once 😉)`,
    over: (price, over) => `Ooh, ${money(price)} is ${money(over)} over your budget right now 🥺 Want to pop it on your wishlist and save for it instead? 💕`,
    goal: (g, pct) => `${g.name}: ${money(g.current)} of ${money(g.target)} (${pct}%) ✨`,
    goalsIntro: 'Here are your savings goals, look at you go 🌸',
    noGoals: "You don't have any savings goals yet! Set one up in Save and I'll cheer you on 💕",
    wishIntro: "Here's your wishlist, cutie 🛍️",
    noWish: 'Your wishlist is empty! Heart something in Discover and I will keep an eye on it ✨',
    noBudget: "I can't see your budget yet, babe. Add it in Settings and I'll do the maths for you 💕",
    fallback: "I'm in offline mode right now so I can only help with your budget, goals and wishlist 🥺 Try asking me one of those!",
  },
  coach: {
    left: (amt, period) => `${money(amt)} left in the tank this ${period}. 💪`,
    fits: (price, left) => `${money(price)}? That fits. You'd still have ${money(left)} left. Your call, champ.`,
    over: (price, over) => `${money(price)} puts you ${money(over)} over. Not this week, champ. Wishlist it and grind toward it 👊`,
    goal: (g, pct) => `${g.name}: ${money(g.current)} / ${money(g.target)} (${pct}%)`,
    goalsIntro: 'Goal check, here are your numbers:',
    noGoals: 'No goals set yet. Pick one in Save and we start the reps 💪',
    wishIntro: "Here's what's on your list:",
    noWish: 'Wishlist is empty. Save something from Discover and I will track it.',
    noBudget: "I can't see your budget yet. Set it in Settings and I'll crunch the numbers.",
    fallback: "I'm offline right now, so I can only do budget, goals and wishlist checks. Hit me with one of those 👊",
  },
  friendly: {
    left: (amt, period) => `You have ${money(amt)} left to spend this ${period} 🙂`,
    fits: (price, left) => `${money(price)} fits your budget, and you'd have ${money(left)} left over.`,
    over: (price, over) => `${money(price)} is ${money(over)} more than you have left right now. Want to save toward it instead?`,
    goal: (g, pct) => `${g.name}: ${money(g.current)} of ${money(g.target)} (${pct}%)`,
    goalsIntro: 'Here are your savings goals:',
    noGoals: "You haven't set a savings goal yet. Add one in Save!",
    wishIntro: "Here's your wishlist:",
    noWish: 'Your wishlist is empty. Save something from Discover to see it here.',
    noBudget: "I can't see your budget yet. Add it in Settings and I'll work it out.",
    fallback: "I'm offline right now, so I can help with your budget, goals and wishlist. Try asking about one of those!",
  },
  calm: {
    left: (amt, period) => `You have ${money(amt)} left to spend this ${period}.`,
    fits: (price, left) => `${money(price)} fits your budget. You would have ${money(left)} left.`,
    over: (price, over) => `${money(price)} is ${money(over)} over your remaining budget. Consider saving toward it.`,
    goal: (g, pct) => `${g.name}: ${money(g.current)} of ${money(g.target)} (${pct}%)`,
    goalsIntro: 'Your savings goals:',
    noGoals: 'No savings goals yet. You can add one in Save.',
    wishIntro: 'Your wishlist:',
    noWish: 'Your wishlist is empty.',
    noBudget: "Your budget isn't set yet. You can add it in Settings.",
    fallback: "I'm offline at the moment, so I can only help with your budget, goals and wishlist.",
  },
  pro: {
    fallback: "I'm offline at the moment. Connect the assistant server to get business suggestions.",
  },
};

function voiceFor(tone) {
  return { ...VOICE.friendly, ...(VOICE[tone] ?? {}) };
}

/**
 * @param {string} text   the user's message
 * @param {string} tone
 * @param {object} ctx    { remaining, period, goals[], wishlist[], focusedProduct }
 */
export function localReply(text, tone, ctx = {}) {
  const v = voiceFor(tone);
  const q = text.toLowerCase();
  const { remaining, period = 'week' } = ctx;
  const hasBudget = typeof remaining === 'number';

  // A price in the message ("can I afford $35 shoes?"), else the product on screen.
  // Only "$35" or "35 dollars/bucks" count, so "12-Pack" or "2 shirts" aren't read as prices.
  const priceMatch = q.match(/\$\s?(\d+(?:\.\d{1,2})?)/) ?? q.match(/(\d+(?:\.\d{1,2})?)\s?(?:dollars?|bucks|usd|sgd)\b/);
  const price = priceMatch ? Number(priceMatch[1]) : ctx.focusedProduct?.price;

  if (/afford|buy|worth|fit|get it|can i/.test(q) && price) {
    if (!hasBudget) return v.noBudget;
    return price <= remaining ? v.fits(price, remaining - price) : v.over(price, price - remaining);
  }
  if (/budget|spend|left|how much|money|afford/.test(q)) {
    return hasBudget ? v.left(remaining, period) : v.noBudget;
  }
  if (/goal|sav/.test(q)) {
    const goals = ctx.goals ?? [];
    if (!goals.length) return v.noGoals;
    const lines = goals.map(g => v.goal(g, g.target ? Math.round((g.current / g.target) * 100) : 0));
    return [v.goalsIntro, ...lines].join('\n');
  }
  if (/wish|list|saved/.test(q)) {
    const items = ctx.wishlist ?? [];
    if (!items.length) return v.noWish;
    const lines = items.slice(0, 6).map(w => `• ${w.title}${w.price ? ` (${money(w.price)})` : ''}`);
    return [v.wishIntro, ...lines].join('\n');
  }
  return v.fallback;
}
