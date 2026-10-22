import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/assistant/chat — Hoot, the 2AM Assistant.
 *
 * Body: {
 *   messages: [{ role: 'user' | 'assistant', content: string }],
 *   tone:     'bestie' | 'coach' | 'friendly' | 'calm' | 'pro',
 *   lang:     'en' | 'ja' | 'zh' | 'th' | 'ko',
 *   context:  { name, userType, period, remaining, interests[], goals[], wishlist[], focusedProduct },
 *   catalog:  [{ id, title, price, merchant, category, emoji, url }]   products Hoot may recommend
 * }
 * Returns: { reply: string, products: [catalog items to show as cards] }
 *
 * Hoot answers in a fixed JSON shape (reply + product ids). Only ids that are
 * really in the catalog are returned, so it can't invent products or links.
 *
 * Every tone has the same skills; only the voice changes. The context is a
 * short on-device summary the frontend chooses to send — never full history.
 *
 * Credentials come from the environment (ANTHROPIC_API_KEY, or an
 * `ant auth login` profile). Without them this returns 503 and the frontend
 * falls back to its on-device replies.
 */
const router = Router();

const MODEL = 'claude-opus-5-5';
const MAX_HISTORY = 20;
const MAX_CHARS = 2000;
const MAX_CATALOG = 40;
const MAX_CARDS = 4;

// Hoot always answers in this shape so the app can show product cards.
const REPLY_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    product_ids: { type: 'array', items: { type: 'string' } },
  },
  required: ['reply', 'product_ids'],
  additionalProperties: false,
};

const LANGUAGE_NAMES = { en: 'English', ja: 'Japanese', zh: 'Simplified Chinese', th: 'Thai', ko: 'Korean' };

const BASE_PROMPT = `You are Hoot, the 2AM Assistant inside "The 2am Shoppers", a shopping and savings app for students and working adults.

What you help with:
- Whether a purchase fits the user's budget right now, using the numbers in the context.
- Saving toward their goals: how long a goal will take, small ways to get there faster.
- Their wishlist: what to buy now, what to wait for, cheaper alternatives.
- Product questions and honest second opinions before they buy, especially late-night impulse buys.
- Recommending products: suggest items from the product catalog in the context that fit their interests and budget, or give an overview of their wishlist and goals.

Recommending products:
- Only recommend products from the catalog, by putting their ids in "product_ids" (at most 4, best first). The app shows them as cards with the price and a link, so don't repeat links or long specs in your reply; a short reason for each pick is enough.
- Prefer items within the budget left. If you suggest something over budget, say so.
- If nothing in the catalog fits, say so and leave "product_ids" empty. Never invent products, prices or links.
- Leave "product_ids" empty when the user isn't asking for products.

How you behave:
- Be on the user's side. Never pressure them to buy. If something is over budget, say so kindly and offer an option (wait, save toward it, a cheaper pick).
- Use only the budget, goal and wishlist figures given in the context. If a number isn't there, say you don't know it rather than inventing one. Don't make up product prices or stock.
- Keep replies short and chatty for a phone screen: usually 1-4 sentences, with a short list only when it really helps. Plain text, no markdown.
- You give general shopping and budgeting help, not licensed financial or investment advice; for questions like that, say so briefly and suggest a qualified advisor.
- Stay on topic (shopping, budgets, saving, products). Politely steer back if asked about unrelated things.`;

const TONES = {
  bestie: `Voice: a sweet, bubbly, girly best friend. Warm and encouraging, a little playful, uses friendly words like "babe" or "bestie" sparingly and one or two cute emojis (💕 ✨ 🌸 🛍️) per reply. Hype the user up while still protecting their budget.`,
  coach: `Voice: a chill, straight-talking gym buddy. Relaxed and practical, short punchy sentences, light humour, the occasional 💪 or 👊. Treat saving like training: steady reps, no excuses, but never preachy.`,
  friendly: `Voice: an upbeat, casual friend. Warm, clear and encouraging, with an occasional emoji.`,
  calm: `Voice: a calm, practical helper. Friendly, concise and to the point, rarely uses emojis.`,
  pro: `Voice: a professional, friendly retail advisor speaking to a shop owner. Concise and businesslike. Focus on helping them understand their customers and products.`,
};

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return [];
  const msgs = raw
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  // The conversation must start with the user (the panel's greeting is local).
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  return msgs;
}

function describeContext(ctx = {}) {
  const lines = [];
  const money = n => (typeof n === 'number' && Number.isFinite(n) ? `$${n.toFixed(2)}` : null);
  if (ctx.name) lines.push(`User's first name: ${String(ctx.name).slice(0, 40)}`);
  if (ctx.userType) lines.push(`Account type: ${ctx.userType === 'working' ? 'working adult (monthly budget)' : 'student (weekly budget)'}`);
  if (money(ctx.remaining)) lines.push(`Spending money left this ${ctx.period === 'month' ? 'month' : 'week'}: ${money(ctx.remaining)}`);
  if (Array.isArray(ctx.interests) && ctx.interests.length) lines.push(`Interests: ${ctx.interests.slice(0, 10).join(', ')}`);
  if (Array.isArray(ctx.goals) && ctx.goals.length) {
    lines.push('Savings goals:');
    for (const g of ctx.goals.slice(0, 5)) {
      lines.push(`- ${String(g.name).slice(0, 60)}: ${money(g.current) ?? '$0'} of ${money(g.target) ?? '?'} saved`);
    }
  }
  if (Array.isArray(ctx.wishlist) && ctx.wishlist.length) {
    lines.push('Wishlist:');
    for (const w of ctx.wishlist.slice(0, 8)) {
      lines.push(`- ${String(w.title).slice(0, 80)}${money(w.price) ? ` (${money(w.price)})` : ''}`);
    }
  }
  if (ctx.focusedProduct?.title) {
    const p = ctx.focusedProduct;
    lines.push(`Product on screen right now: ${String(p.title).slice(0, 80)}${money(p.price) ? ` (${money(p.price)})` : ''}`);
  }
  return lines.length ? `Context about this user (from their app):\n${lines.join('\n')}` : 'No user context was shared.';
}

const toPrice = n => (typeof n === 'number' && Number.isFinite(n) ? n : null);

/** Keep only well-formed catalog items with http(s) links. */
function sanitizeCatalog(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const items = [];
  for (const p of raw.slice(0, MAX_CATALOG)) {
    if (!p || typeof p.id !== 'string' || typeof p.title !== 'string' || seen.has(p.id)) continue;
    let url = null;
    try {
      const u = new URL(String(p.url));
      if (u.protocol === 'https:' || u.protocol === 'http:') url = u.toString();
    } catch { /* no link */ }
    seen.add(p.id);
    items.push({
      id: p.id.slice(0, 60),
      title: p.title.slice(0, 120),
      price: p.price == null ? null : toPrice(Number(p.price)),
      merchant: typeof p.merchant === 'string' ? p.merchant.slice(0, 40) : null,
      category: typeof p.category === 'string' ? p.category.slice(0, 40) : null,
      emoji: typeof p.emoji === 'string' ? p.emoji.slice(0, 8) : null,
      url,
    });
  }
  return items;
}

function describeCatalog(catalog) {
  if (!catalog.length) return 'Product catalog: (empty, so do not recommend products).';
  const lines = catalog.map(p =>
    `- id=${p.id} | ${p.title} | ${p.price != null ? `$${p.price.toFixed(2)}` : 'price varies'} | ${[p.merchant, p.category].filter(Boolean).join(', ')}`);
  return `Product catalog you may recommend from:\n${lines.join('\n')}`;
}

/** Pull { reply, product_ids } out of the response text, tolerating plain text. */
function parseReply(text) {
  try {
    const data = JSON.parse(text);
    if (data && typeof data.reply === 'string') {
      return { reply: data.reply.trim(), ids: Array.isArray(data.product_ids) ? data.product_ids : [] };
    }
  } catch { /* fall through */ }
  return { reply: text.trim(), ids: [] };
}

let client = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

router.post('/chat', async (req, res, next) => {
  const messages = sanitizeMessages(req.body?.messages);
  if (!messages.length) return res.status(400).json({ error: 'A user message is required.' });

  const tone = TONES[req.body?.tone] ? req.body.tone : 'friendly';
  const language = LANGUAGE_NAMES[req.body?.lang] ?? LANGUAGE_NAMES.en;

  const catalog = sanitizeCatalog(req.body?.catalog);

  const system = [
    BASE_PROMPT,
    TONES[tone],
    `Reply in ${language}.`,
    describeContext(req.body?.context),
    describeCatalog(catalog),
  ].join('\n\n');

  try {
    const response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      output_config: {
        effort: 'low',                                   // quick, chatty replies
        format: { type: 'json_schema', schema: REPLY_SCHEMA },
      },
      // Server-side fallback: if a request is declined, the API retries it on a fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages,
    });

    if (response.stop_reason === 'refusal') {
      return res.json({ reply: "Sorry, I can't help with that one. Ask me about your budget, goals or wishlist instead!", products: [] });
    }

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');
    const { reply, ids } = parseReply(text);

    // Only show products that are really in the catalog we sent.
    const byId = new Map(catalog.map(p => [p.id, p]));
    const products = [...new Set(ids)].map(id => byId.get(id)).filter(Boolean).slice(0, MAX_CARDS);

    return res.json({ reply: reply || "Hmm, I'm not sure. Could you ask that another way?", products });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(503).json({ error: 'not_configured' });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'rate_limited' });
    }
    if (err instanceof Anthropic.APIError) {
      console.error('[assistant] Claude API error', err.status, err.message);
      return res.status(502).json({ error: 'upstream_error' });
    }
    // Not an API response at all: usually no credentials configured on this server.
    if (err instanceof Error && !(err instanceof SyntaxError)) {
      console.warn('[assistant] Claude client not configured:', err.message);
      return res.status(503).json({ error: 'not_configured' });
    }
    return next(err);
  }
});

export default router;
