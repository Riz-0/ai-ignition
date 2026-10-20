import React, { useState, useRef, useEffect } from 'react';
import useAppStore from '../../store/appStore.js';
import styles from './ChatPage.module.css';

// Rule → { reply, intent } so each tap both replies AND updates preferences.
const RESPONSE_RULES = [
  { keys: ['too expensive', 'expensive', 'pricey', 'budget'], intent: 'too_expensive',
    reply: "Got it — I've lowered your price threshold by 20% and I'll look for cheaper alternatives or a group bundle." },
  { keys: ['remind me later', 'remind', 'later'], intent: 'remind_later',
    reply: 'No problem! When would you like me to remind you? You can say something like "the 25th" or "next Friday".' },
  { keys: ['wrong style', 'not my style', "don't like", 'different style'], intent: 'wrong_style',
    reply: "Thanks for telling me — I've noted that and I'll steer away from this style. What are you looking for instead?" },
  { keys: ['not interested', 'no thanks', 'stop recommending'], intent: 'not_interested',
    reply: "Understood — I've stopped this recommendation and adjusted your future suggestions." },
  { keys: ['already bought', 'already got', 'bought it'], intent: 'already_bought',
    reply: "Great! I'll end this recommendation. Want me to check in on whether you're happy with it in a few days?" },
  { keys: ['still have enough', 'still stocked', 'not running low'], intent: 'still_enough',
    reply: "Got it — I'll pause the replenishment check and ask again in a few weeks." },
  { keys: ['interested', 'tell me more', 'show me', 'looks good', 'yes'], intent: 'interested',
    reply: "Great — here are options within your budget. Which one looks most suitable?" },
  { keys: ['stop notifications', 'unsubscribe', 'no more messages'], intent: 'stop_notifications',
    reply: "Understood — I've stopped push follow-ups. You can change this in Settings any time." },
  { keys: ['payday', '25th', 'end of month'], intent: 'payday',
    reply: "I've scheduled a reminder for your chosen date. I'll verify the product and price are still available before sending it." },
];

function matchRule(msg) {
  const lower = msg.toLowerCase();
  return RESPONSE_RULES.find(r => r.keys.some(k => lower.includes(k))) ?? null;
}

// Quick-reply chips — now include Interested and Not interested (Phase 3).
const QUICK_REPLIES = [
  'Interested', 'Too expensive', 'Remind me later', 'Wrong style',
  'Already bought', 'Not interested', 'Show alternatives', 'Stop notifications',
];

export default function ChatPage() {
  const { shopperProfile, addConversation, addMessage, conversations, applyFeedback } = useAppStore();
  const [input, setInput]   = useState('');
  const [convId, setConvId] = useState(null);
  const [typing, setTyping] = useState(false);
  const bottomRef           = useRef(null);

  // Get or create a conversation
  const conv = conversations.find(c => c.id === convId) ?? conversations.find(c => c.status === 'active');
  const messages = conv?.messages ?? [];

  useEffect(() => {
    if (!convId) {
      const existing = conversations.find(c => c.status === 'active');
      if (existing) { setConvId(existing.id); return; }
      addConversation({ title: 'Shopping assistant' });
    }
  }, []);

  useEffect(() => {
    if (!convId && conversations.length > 0) {
      setConvId(conversations[conversations.length - 1].id);
    }
  }, [conversations.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typing]);

  function send(text) {
    const msg = (text ?? input).trim();
    if (!msg || !conv) return;
    setInput('');
    addMessage(conv.id, { role: 'user', text: msg });

    const rule = matchRule(msg);
    // Explicit feedback loop — persist the preference change.
    if (rule) {
      applyFeedback(rule.intent, { category: conv.productCategory ?? null });
    }
    const reply = rule?.reply
      ?? "Got it — I'm adapting your recommendations based on that. Anything specific you'd like me to find?";

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addMessage(conv.id, { role: 'ai', text: reply });
    }, 700 + Math.random() * 500);
  }

  function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>AI Shopping Companion</h1>
        <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
          Tell it what you need in your own words. It adapts to your responses.
        </p>
      </div>

      <div className={styles.chatArea}>
        {messages.length === 0 && (
          <div className={styles.welcome}>
            <span className={styles.welcomeIcon}>🛒</span>
            <p>Hi {shopperProfile?.name ?? 'there'}! I'm your 2am shopping companion.</p>
            <p style={{ fontSize: '.85rem', color: 'var(--text-dim)', marginTop: 6 }}>
              Ask me anything — about a saved product, your wishlist, or what to buy next.
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`${styles.bubble} ${msg.role === 'user' ? styles.user : styles.ai}`}>
            {msg.role === 'ai' && <span className={styles.aiIcon}>🛒</span>}
            <div className={styles.bubbleText}>{msg.text}</div>
          </div>
        ))}

        {typing && (
          <div className={`${styles.bubble} ${styles.ai}`}>
            <span className={styles.aiIcon}>🛒</span>
            <div className={styles.typing}><span /><span /><span /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.quickReplies}>
        {QUICK_REPLIES.map(r => (
          <button key={r} className={styles.quickBtn} onClick={() => send(r)}>{r}</button>
        ))}
      </div>

      <div className={styles.inputRow}>
        <textarea
          className={styles.textarea}
          rows={1}
          placeholder="Type a message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button className="btn btn-primary btn-sm" onClick={() => send()} disabled={!input.trim()}>Send</button>
      </div>

      <p className={styles.disclaimer}>
        This chat uses a simulated AI for the hackathon demo. In the full build, responses come from a real language model using verified merchant catalogue data.
      </p>
    </div>
  );
}
