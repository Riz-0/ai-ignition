import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/init.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getAIReply } from '../services/conversationService.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/conversations?shopper_id=
router.get('/', asyncHandler(async (req, res) => {
  const shopper_id = req.query.shopper_id ?? req.query.customer_id;
  if (!shopper_id) return res.status(400).json({ error: 'shopper_id required' });
  const db   = getDb();
  const convs = db.prepare('SELECT * FROM conversations WHERE shopper_id = ? ORDER BY created_at DESC').all(shopper_id);
  const withMessages = convs.map(c => ({
    ...c,
    messages: db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at').all(c.id),
  }));
  res.json(withMessages);
}));

// POST /api/conversations  — start a new conversation thread
router.post('/', asyncHandler(async (req, res) => {
  const shopper_id = req.body.shopper_id ?? req.body.customer_id;
  const { product_id, title } = req.body;
  if (!shopper_id) return res.status(400).json({ error: 'shopper_id required' });
  const db = getDb();
  const id = uuid();
  db.prepare('INSERT INTO conversations (id, shopper_id, product_id, title) VALUES (?, ?, ?, ?)')
    .run(id, shopper_id, product_id ?? null, title ?? 'Shopping assistant');
  res.status(201).json({ ...db.prepare('SELECT * FROM conversations WHERE id = ?').get(id), messages: [] });
}));

// POST /api/conversations/:id/reply  — send a message and get an AI response
router.post('/:id/reply', asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'message required' });

  const db   = getDb();
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  // Persist user message
  const userMsgId = uuid();
  db.prepare('INSERT INTO messages (id, conversation_id, role, text) VALUES (?, ?, ?, ?)')
    .run(userMsgId, conv.id, 'user', message.trim());

  // Get conversation history for context
  const history = db.prepare('SELECT role, text FROM messages WHERE conversation_id = ? ORDER BY created_at').all(conv.id);

  // Get structured AI reply { reply, intent, safetyPause }
  const ai = await getAIReply(message.trim(), history);

  const aiMsgId = uuid();
  db.prepare('INSERT INTO messages (id, conversation_id, role, text) VALUES (?, ?, ?, ?)')
    .run(aiMsgId, conv.id, 'ai', ai.reply);

  // Safety pause → raise a support handover and pause the conversation
  if (ai.safetyPause) {
    db.prepare('UPDATE conversations SET status = ? WHERE id = ?').run('paused_support', conv.id);
    // Attach to merchant handover queue if we can resolve one
    const merchant = db.prepare('SELECT id FROM merchant_profiles LIMIT 1').get();
    if (merchant) {
      db.prepare(`
        INSERT INTO support_handovers (id, merchant_id, customer_name, reason, context, resolved)
        VALUES (?, ?, ?, ?, ?, 0)
      `).run(uuidv4(), merchant.id, 'App shopper', 'Complaint/refund keyword in chat', message.trim());
    }
  }

  res.json({
    userMessage: db.prepare('SELECT * FROM messages WHERE id = ?').get(userMsgId),
    aiMessage:   db.prepare('SELECT * FROM messages WHERE id = ?').get(aiMsgId),
    intent:      ai.intent,
    safetyPause: ai.safetyPause,
  });
}));

// POST /api/conversations/:id/close
router.post('/:id/close', asyncHandler(async (req, res) => {
  const { reason } = req.body;
  getDb().prepare('UPDATE conversations SET status = ? WHERE id = ?').run(reason ?? 'closed', req.params.id);
  res.json({ status: 'closed' });
}));

export default router;
