/**
 * Conversation service — interprets customer intent and generates replies.
 *
 * For the MVP this uses a rule-based response map that mirrors the
 * adaptation table from the markdown spec.
 *
 * In the full build, replace getAIReply() with a real LLM call:
 *   - OpenAI: openai.chat.completions.create(...)
 *   - Amazon Bedrock: BedrockRuntimeClient + InvokeModelCommand
 *
 * The agent uses only verified catalogue information for product claims.
 * If current information is unavailable, it asks the user to check the
 * listing rather than presenting an unverified offer.
 */

// ── Safety keywords ──────────────────────────────────────────
// A refund/complaint/escalation must PAUSE sales prompts and route to
// a human. Checked before every other rule (markdown §7 / Phase 1).
export const SAFETY_KEYWORDS = [
  'refund', 'return it', 'broken', 'faulty', 'damaged', 'complaint',
  'complain', 'scam', 'cheated', 'report', 'speak to a human',
  'talk to a person', 'customer service', 'this is wrong', 'never arrived',
  'didnt arrive', "didn't arrive", 'wrong item', 'defective',
];

const SAFETY_REPLY =
  "I'm sorry to hear that. I've paused shopping suggestions and flagged this for a human support agent who will follow up. Is there anything you'd like me to pass on to them?";

/**
 * Returns true if the message trips a safety/complaint keyword.
 */
export function isSafetyMessage(message = '') {
  const lower = message.toLowerCase();
  return SAFETY_KEYWORDS.some(kw => lower.includes(kw));
}

// Response-based adaptation map (mirrors markdown §4 Step 5)
const ADAPTATION_RULES = [
  {
    keywords: ['too expensive', 'too pricey', 'cant afford', "can't afford", 'over budget', 'expensive'],
    reply: "Got it — I'll look for lower-cost alternatives or an eligible group bundle. What's your upper limit for this product?",
    intent: 'price_objection',
  },
  {
    keywords: ['remind me later', 'remind me', 'later', 'not now', 'come back'],
    reply: 'No problem! When would you like me to remind you? You can say something like "the 25th" or "next Friday".',
    intent: 'defer',
  },
  {
    keywords: ['wrong style', 'not my style', 'dont like', "don't like", 'change style', 'different style', 'not what i'],
    reply: "Thanks for the feedback — I've noted your preference. Can you describe what style you're looking for? I'll update your suggestions.",
    intent: 'style_mismatch',
  },
  {
    keywords: ['already bought', 'already purchased', 'bought it', 'got it already'],
    reply: "Great! I'll end this recommendation. Would you like me to check in on whether you're happy with it in a few days?",
    intent: 'purchased_elsewhere',
  },
  {
    keywords: ['still have enough', 'still stocked', 'not running low', 'enough stock', 'have plenty'],
    reply: "Got it — I'll pause the replenishment check and ask again in a few weeks.",
    intent: 'replenishment_not_needed',
  },
  {
    keywords: ['not interested', 'no thanks', 'dont want', "don't want", 'stop recommending', 'not for me'],
    reply: "Understood — I've stopped this recommendation and adjusted your future suggestions accordingly.",
    intent: 'not_interested',
  },
  {
    keywords: ['stop notifications', 'unsubscribe', 'stop messaging', 'no more messages', 'stop sending'],
    reply: "I've stopped push follow-ups for this product. You can adjust your notification preferences in Settings at any time.",
    intent: 'opt_out',
  },
  {
    keywords: ['interested', 'yes', 'tell me more', 'show me', 'want to see', 'looks good'],
    reply: "Here are the details. I'll show you the available options within your budget — which one looks most suitable?",
    intent: 'interested',
  },
  {
    keywords: ['running low', 'need more', 'almost out', 'running out', 'need to reorder'],
    reply: "Got it — let me check the current availability and price before confirming. I'll get back to you with verified information.",
    intent: 'replenishment_needed',
  },
  {
    keywords: ['payday', '25th', 'next month', 'end of month', 'salary'],
    reply: "I've scheduled a reminder for your chosen date. I'll verify the product and offer are still available before sending it.",
    intent: 'payday_reminder',
  },
  {
    keywords: ['group', 'colleague', 'team', 'office', 'together', 'split'],
    reply: "There may be an eligible colleague bundle for this. Would you like me to check what group deals are available from this merchant?",
    intent: 'group_interest',
  },
  {
    keywords: ['coffee', 'shoes', 'bag', 'clothes', 'beauty', 'snack', 'food'],
    reply: "I found a few options matching your interests. Want me to show them in your feed, or would you prefer details here in chat?",
    intent: 'product_search',
  },
];

const FALLBACK_REPLY =
  "Got it — I'm updating your recommendations based on that. Is there anything specific you'd like me to find for you?";

/**
 * Guard against invented prices (Phase 1 "No invented prices").
 * Given a product row, only return a price string if the record is
 * verified and has a numeric price. Otherwise ask the user to check
 * the listing.
 *
 * @param {{ verified?: number, price?: number|null, name?: string }} product
 * @returns {string} safe phrasing for the price
 */
export function safePriceStatement(product) {
  if (!product) return 'Please check the listing for the current price.';
  const verified = product.verified === 1 || product.verified === true;
  if (verified && product.price != null) {
    return `The verified price is $${Number(product.price).toFixed(2)}.`;
  }
  return "I don't have a verified current price for that, so please check the listing before buying.";
}

/**
 * Generate an AI reply for a given user message.
 *
 * Returns a structured object so the caller can act on intent
 * (e.g. raise a support handover on a safety pause).
 *
 * @param {string} userMessage
 * @param {Array<{role: string, text: string}>} history
 * @returns {Promise<{ reply: string, intent: string, safetyPause: boolean }>}
 */
export async function getAIReply(userMessage, history = []) {
  // Safety pause always wins
  if (isSafetyMessage(userMessage)) {
    return { reply: SAFETY_REPLY, intent: 'safety_pause', safetyPause: true };
  }

  if (process.env.OPENAI_API_KEY) {
    const reply = await getLLMReply(userMessage, history);
    return { reply, intent: matchIntent(userMessage), safetyPause: false };
  }

  const { reply, intent } = getRuleBasedReply(userMessage);
  return { reply, intent, safetyPause: false };
}

/**
 * Match a message to an intent without generating a reply.
 */
function matchIntent(message) {
  const lower = message.toLowerCase();
  const rule  = ADAPTATION_RULES.find(r => r.keywords.some(kw => lower.includes(kw)));
  return rule?.intent ?? 'general';
}

/**
 * Rule-based fallback — used when no LLM key is configured.
 */
function getRuleBasedReply(message) {
  const lower = message.toLowerCase();
  for (const rule of ADAPTATION_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return { reply: rule.reply, intent: rule.intent };
    }
  }
  return { reply: FALLBACK_REPLY, intent: 'general' };
}

/**
 * Real LLM reply via OpenAI Chat Completions.
 * Only called when OPENAI_API_KEY is set.
 * Replace with Bedrock equivalent if using AWS.
 */
async function getLLMReply(userMessage, history) {
  // Dynamic import so the app starts without openai installed
  const { default: OpenAI } = await import('openai').catch(() => {
    throw new Error('openai package not installed. Run: npm install openai');
  });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = `You are a casual, helpful AI shopping companion for working youths aged 18–30.
You help customers decide what to buy, revisit saved items and reorder products they like.
Rules:
- Keep replies short and conversational.
- Only make product claims based on verified information provided to you. If uncertain, ask the customer to check the listing.
- Adapt to the customer's stated needs: if they say "too expensive", offer alternatives; if they say "remind me later", ask when.
- Never infer income, salary or payday from age or shopping habits.
- If the customer wants to stop notifications, honour that immediately.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
    { role: 'user', content: userMessage },
  ];

  const response = await client.chat.completions.create({
    model:       'gpt-4o-mini',
    messages,
    max_tokens:  200,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content ?? FALLBACK_REPLY;
}
