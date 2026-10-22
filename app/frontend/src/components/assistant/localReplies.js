/**
 * On-device replies for Hoot, used when the assistant server isn't reachable
 * (no backend, no API key, offline). They cover the core jobs — budget,
 * goals, wishlist, a price check and product picks from the catalog — in the
 * same voice as the AI, so the chat never feels broken. Nothing here leaves
 * the device.
 *
 * Returns { reply: string, products: catalog items to show as cards }.
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
    recIntro: (left) => left != null ? `Ooh okay, cute picks that fit your ${money(left)} 💕` : 'Ooh okay, some cute picks for you 💕',
    recCheaper: (price) => `Cheaper finds under ${money(price)}, bestie ✨`,
    recOver: 'Nothing fits your budget right now 🥺 but these are the closest. Maybe wishlist one and save up? 💕',
    recNone: "Hmm, I couldn't find anything that matches, babe. Try another word? ✨",
    fallback: "I'm in offline mode so I can do budget checks, goals, your wishlist and product picks 🥺 Try one of those!",
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
    recIntro: (left) => left != null ? `Here's what fits the ${money(left)} you've got 💪` : "Here's what I'd look at 💪",
    recCheaper: (price) => `Cheaper options under ${money(price)}. Same gains, less damage 👊`,
    recOver: "Nothing fits the budget right now. Closest options below. Save up first, champ.",
    recNone: "Couldn't find a match. Try another keyword.",
    fallback: "I'm offline right now: budget checks, goals, wishlist and product picks only. Hit me with one of those 👊",
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
    recIntro: (left) => left != null ? `Here are a few ideas within your ${money(left)} budget 🙂` : 'Here are a few ideas for you 🙂',
    recCheaper: (price) => `Here are some cheaper options under ${money(price)}:`,
    recOver: "Nothing fits your budget right now, but these are the closest:",
    recNone: "I couldn't find anything matching that. Try another word?",
    fallback: "I'm offline right now, so I can help with your budget, goals, wishlist and product picks. Try one of those!",
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
    recIntro: (left) => left != null ? `Some options within your remaining ${money(left)}:` : 'Some options you may like:',
    recCheaper: (price) => `Lower-priced options under ${money(price)}:`,
    recOver: 'Nothing is within your budget right now. The closest options:',
    recNone: 'No matching products found.',
    fallback: "I'm offline at the moment, so I can help with your budget, goals, wishlist and product picks.",
  },
  pro: {
    fallback: "I'm offline at the moment. Connect the assistant server to get business suggestions.",
  },
};

function voiceFor(tone) {
  return { ...VOICE.friendly, ...(VOICE[tone] ?? {}) };
}

const STOPWORDS = new Set(['the', 'and', 'for', 'can', 'you', 'something', 'some', 'show', 'find', 'recommend', 'suggest',
  'what', 'should', 'buy', 'get', 'any', 'ideas', 'idea', 'cheaper', 'alternative', 'alternatives', 'under', 'with',
  'that', 'this', 'please', 'want', 'need', 'cute', 'good', 'nice', 'gift', 'deal', 'deals', 'products', 'product',
  'afford', 'could', 'would', 'right', 'now', 'today', 'cheap', 'less', 'more', 'like', 'love', 'really', 'stuff',
  'thing', 'things', 'item', 'items', 'look', 'looking', 'shop', 'shopping', 'pick', 'picks', 'babe', 'bestie',
  'hoot', 'have', 'got', 'budget', 'fits', 'fit', 'new', 'best', 'buy', 'worth', 'recommendation', 'recommendations',
  'suggestion', 'suggestions', 'options', 'option', 'week', 'month', 'gear', 'for']);

/** Rank catalog items for a recommendation request. */
function recommend(q, ctx, catalog) {
  const remaining = typeof ctx.remaining === 'number' ? ctx.remaining : null;
  const interests = (ctx.interests ?? []).map(i => i.toLowerCase());
  const wished = new Set((ctx.wishlist ?? []).map(w => w.title));
  const words = q.split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !STOPWORDS.has(w));

  // "Cheaper than this" → only items under the product on screen.
  const cheaperThan = /cheap|alternative|less/.test(q) ? ctx.focusedProduct?.price : null;

  let pool = catalog.filter(p => typeof p.price === 'number' && !wished.has(p.title));
  if (cheaperThan) pool = pool.filter(p => p.price < cheaperThan);

  const scored = pool.map(p => {
    const hay = `${p.title} ${p.category ?? ''} ${p.merchant ?? ''}`.toLowerCase();
    const hits = words.filter(w => hay.includes(w)).length;
    let score = hits * 3;
    const cat = (p.category ?? '').toLowerCase();
    if (interests.some(i => hay.includes(i) || (cat && i.includes(cat)))) score += 2;
    if (remaining != null && p.price <= remaining) score += 1;
    return { p, score, hits };
  });

  // If they named something specific, only keep things that match it.
  const matched = words.length ? scored.filter(s => s.hits > 0) : scored;
  const ranked = (matched.length ? matched : words.length ? [] : scored)
    .sort((a, b) => b.score - a.score || a.p.price - b.p.price)
    .map(s => s.p);

  const affordable = remaining == null ? ranked : ranked.filter(p => p.price <= remaining);
  if (affordable.length) return { kind: cheaperThan ? 'cheaper' : 'fits', items: affordable.slice(0, 3), cheaperThan };
  if (ranked.length) return { kind: 'over', items: [...ranked].sort((a, b) => a.price - b.price).slice(0, 3) };
  return { kind: 'none', items: [] };
}

/**
 * @param {string} text     the user's message
 * @param {string} tone
 * @param {object} ctx      { remaining, period, interests[], goals[], wishlist[], focusedProduct }
 * @param {Array}  catalog  products Hoot may recommend
 * @returns {{ reply: string, products: Array }}
 */
export function localReply(text, tone, ctx = {}, catalog = []) {
  const v = voiceFor(tone);
  const q = text.toLowerCase();
  const { remaining, period = 'week' } = ctx;
  const hasBudget = typeof remaining === 'number';
  const say = (reply, products = []) => ({ reply, products });

  // Only "$35" or "35 dollars/bucks" count, so "12-Pack" or "2 shirts" aren't read as prices.
  const priceMatch = q.match(/\$\s?(\d+(?:\.\d{1,2})?)/) ?? q.match(/(\d+(?:\.\d{1,2})?)\s?(?:dollars?|bucks|usd|sgd)\b/);
  const price = priceMatch ? Number(priceMatch[1]) : ctx.focusedProduct?.price;

  if (/afford|buy|worth|fit|get it|can i/.test(q) && price && !/recommend|suggest|cheaper|alternative/.test(q)) {
    if (!hasBudget) return say(v.noBudget);
    return say(price <= remaining ? v.fits(price, remaining - price) : v.over(price, price - remaining));
  }
  if (/recommend|suggest|show me|find|idea|gift|cheaper|alternative|something|what should i|deal|pick/.test(q)) {
    if (tone === 'pro' || !catalog.length) return say(v.fallback);
    const rec = recommend(q, ctx, catalog);
    if (rec.kind === 'none') return say(v.recNone);
    if (rec.kind === 'over') return say(v.recOver, rec.items);
    if (rec.kind === 'cheaper') return say(v.recCheaper(rec.cheaperThan), rec.items);
    return say(v.recIntro(hasBudget ? remaining : null), rec.items);
  }
  if (/budget|spend|left|how much|money|afford/.test(q)) {
    return say(hasBudget ? v.left(remaining, period) : v.noBudget);
  }
  if (/goal|sav/.test(q)) {
    const goals = ctx.goals ?? [];
    if (!goals.length) return say(v.noGoals);
    const lines = goals.map(g => v.goal(g, g.target ? Math.round((g.current / g.target) * 100) : 0));
    return say([v.goalsIntro, ...lines].join('\n'));
  }
  if (/wish|list|saved/.test(q)) {
    const items = ctx.wishlist ?? [];
    if (!items.length) return say(v.noWish);
    const lines = items.slice(0, 6).map(w => `• ${w.title}${w.price ? ` (${money(w.price)})` : ''}`);
    return say([v.wishIntro, ...lines].join('\n'));
  }
  return say(v.fallback);
}
