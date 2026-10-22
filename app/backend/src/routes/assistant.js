import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/assistant/chat — Hoot, the 2AM Assistant.
 *
 * Body: {
 *   messages: [{ role: 'user' | 'assistant', content: string }],
 *   tone:     'bestie' | 'coach' | 'friendly' | 'calm' | 'pro',
 *   lang:     'en' | 'ja' | 'zh' | 'th' | 'ko',
 *   context:  { name, userType, period, remaining, interests[], goals[], wishlist[], focusedProduct }
 * }
 * Returns: { reply: string }
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

const LANGUAGE_NAMES = { en: 'English', ja: 'Japanese', zh: 'Simplified Chinese', th: 'Thai', ko: 'Korean' };

const BASE_PROMPT = `You are Hoot, the 2AM Assistant inside "The 2am Shoppers", a shopping and savings app for students and working adults.

What you help with:
- Whether a purchase fits the user's budget right now, using the numbers in the context.
- Saving toward their goals: how long a goal will take, small ways to get there faster.
- Their wishlist: what to buy now, what to wait for, cheaper alternatives.
- Product questions and honest second opinions before they buy, especially late-night impulse buys.

How you behave:
- Be on the user's side. Never pressure them to buy. If something is over budget, say so kindly and offer an option (wait, save toward it, a cheaper pick).
- Use only the budget, goal and wishlist figures given in the context. If a number isn't there, say you don't know it rather than inventing one. Don't make up product prices or stock.
- Keep replies short and chatty for a phone screen: usually 1-4 sentences, with a short list only when it really helps. Plain text, no markdown headings.
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

  const system = [
    BASE_PROMPT,
    TONES[tone],
    `Reply in ${language}.`,
    describeContext(req.body?.context),
  ].join('\n\n');

  try {
    const response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: 'low' }, // quick, chatty replies
      // Server-side fallback: if a request is declined, the API retries it on a fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages,
    });

    if (response.stop_reason === 'refusal') {
      return res.json({ reply: "Sorry, I can't help with that one. Ask me about your budget, goals or wishlist instead!" });
    }

    const reply = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')
      .trim();

    return res.json({ reply: reply || "Hmm, I'm not sure. Could you ask that another way?" });
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
