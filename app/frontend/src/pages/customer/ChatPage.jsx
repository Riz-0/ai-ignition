import React, { useState, useRef, useEffect } from 'react';
import useAppStore from '../../store/appStore.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';
import MantaGOChat from '../../components/MantaGOChat.jsx';
import { isMantagoConfigured } from '../../config/mantago.js';
import styles from './ChatPage.module.css';

// Rule → { reply, intent } so each tap both replies AND updates preferences.
// Used only by the simulated fallback assistant (when MantaGO can't load).
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

const QUICK_REPLIES = [
  'Interested', 'Too expensive', 'Remind me later', 'Wrong style',
  'Already bought', 'Not interested', 'Show alternatives', 'Stop notifications',
];

export default function ChatPage() {
  const { lang } = useI18n();
  const { shopperProfile } = useAppStore();
  const name = shopperProfile?.name ?? 'there';

  // Track whether the live MantaGO widget failed to load; if so, fall
  // back to the built-in simulated assistant so the demo never breaks.
  const [mantagoFailed, setMantagoFailed] = useState(false);
  const live = isMantagoConfigured() && !mantagoFailed;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>🛒 2AM Assistant</h1>
        <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
          {t2(lang, 'sub')}
        </p>
      </div>

      {live ? (
        <LiveAssistant lang={lang} name={name} onFail={() => setMantagoFailed(true)} />
      ) : (
        <SimulatedAssistant name={name} />
      )}
    </div>
  );
}

/* ── Live MantaGO assistant — fills the page ─────────────── */
function LiveAssistant({ lang, name, onFail }) {
  return (
    <div className={styles.liveWrap}>
      {/* The MantaGO chat fills the available area. */}
      <MantaGOChat lang={lang} onFail={onFail} />

      <p className={styles.disclaimer}>{t2(lang, 'privacy')}</p>
    </div>
  );
}

/* ── Simulated fallback assistant (used if MantaGO can't load) ── */
function SimulatedAssistant({ name }) {
  const { addConversation, addMessage, conversations, applyFeedback } = useAppStore();
  const [input, setInput]   = useState('');
  const [convId, setConvId] = useState(null);
  const [typing, setTyping] = useState(false);
  const bottomRef           = useRef(null);

  const conv = conversations.find(c => c.id === convId) ?? conversations.find(c => c.status === 'active');
  const messages = conv?.messages ?? [];

  useEffect(() => {
    if (!convId) {
      const existing = conversations.find(c => c.status === 'active');
      if (existing) { setConvId(existing.id); return; }
      addConversation({ title: '2AM Assistant' });
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
    if (rule) applyFeedback(rule.intent, { category: conv.productCategory ?? null });
    const reply = rule?.reply
      ?? "Got it — I'm adapting your recommendations based on that. Anything specific you'd like me to find within your budget?";

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addMessage(conv.id, { role: 'ai', text: reply });
    }, 700 + Math.random() * 500);
  }

  function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }

  return (
    <>
      <div className={styles.chatArea}>
        {messages.length === 0 && (
          <div className={styles.welcome}>
            <span className={styles.welcomeIcon}>🛒</span>
            <p>Hi {name}! I'm your 2AM Assistant.</p>
            <p style={{ fontSize: '.85rem', color: 'var(--text-dim)', marginTop: 6 }}>
              Tell me what you need in your own words — about a saved product, your wishlist, or what to buy next. I'll help you find alternatives and stay within your budget.
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
        Offline mode — showing the built-in assistant. The live 2AM Assistant (powered by MantaGO) will appear when connected. Your budget and savings stay in this app.
      </p>
    </>
  );
}

/* ── Local micro-translations for the live assistant panel ──
   Kept here so the panel adapts to the UI language (en/ja/zh/th/ko)
   without bloating the global dictionary. */
const PANEL = {
  en: {
    sub:  'Your personalised shopping companion — adapts to what you need, in your own words.',
    hi:   "Hi {name}! I'm your 2AM Assistant.",
    body: 'Whether you are evaluating a saved product, managing your wishlist, or deciding what to buy next, I help you find alternatives and stay within your budget.',
    open: 'Tap the chat bubble in the corner to start a conversation.',
    b1:   'Describe what you need in your own words',
    b2:   'Get alternatives that fit your budget',
    b3:   'Revisit saved items and decide what to buy next',
    privacy: 'Powered by MantaGO. Your budget and savings stay in this app — only the preferences you type are shared.',
  },
  ja: {
    sub:  'あなた専用のショッピングコンパニオン — あなたの言葉に合わせて提案します。',
    hi:   'こんにちは、{name}さん！2AM アシスタントです。',
    body: '保存した商品の検討、ウィッシュリストの管理、次に買うものの決定まで、予算内で代替案を見つけるお手伝いをします。',
    open: '右下のチャットバブルをタップして会話を始めましょう。',
    b1:   'ほしいものを自分の言葉で伝える',
    b2:   '予算に合う代替案を受け取る',
    b3:   '保存した商品を見直し、次の購入を決める',
    privacy: 'MantaGO 提供。予算と貯金はこのアプリ内にとどまり、入力した希望だけが共有されます。',
  },
  zh: {
    sub:  '你的个性化购物伙伴 — 用你自己的话，给你量身建议。',
    hi:   '你好，{name}！我是你的 2AM 助手。',
    body: '无论是评估已保存的商品、管理心愿单，还是决定下一步买什么，我都能帮你找到替代品并控制在预算内。',
    open: '点击右下角的聊天气泡开始对话。',
    b1:   '用你自己的话描述需求',
    b2:   '获得符合预算的替代选择',
    b3:   '重温已保存商品，决定下一步购买',
    privacy: '由 MantaGO 提供支持。你的预算和储蓄留在本应用中 — 只分享你输入的偏好。',
  },
  th: {
    sub:  'ผู้ช่วยช้อปปิ้งส่วนตัวของคุณ — ปรับตามสิ่งที่คุณต้องการด้วยคำพูดของคุณเอง',
    hi:   'สวัสดี {name}! ฉันคือ 2AM Assistant ของคุณ',
    body: 'ไม่ว่าจะประเมินสินค้าที่บันทึกไว้ จัดการรายการที่อยากได้ หรือตัดสินใจว่าจะซื้ออะไรต่อ ฉันช่วยหาตัวเลือกอื่นและอยู่ในงบของคุณ',
    open: 'แตะฟองแชทที่มุมขวาล่างเพื่อเริ่มสนทนา',
    b1:   'บอกสิ่งที่คุณต้องการด้วยคำพูดของคุณเอง',
    b2:   'รับตัวเลือกที่อยู่ในงบประมาณ',
    b3:   'ทบทวนสินค้าที่บันทึกไว้และตัดสินใจซื้อ',
    privacy: 'ขับเคลื่อนโดย MantaGO งบและเงินออมอยู่ในแอปนี้ — แชร์เฉพาะความต้องการที่คุณพิมพ์',
  },
  ko: {
    sub:  '나만의 맞춤 쇼핑 도우미 — 당신의 말에 맞춰 제안합니다.',
    hi:   '안녕하세요 {name}님! 2AM 어시스턴트입니다.',
    body: '저장한 상품 검토, 위시리스트 관리, 다음 구매 결정까지 — 예산 안에서 대안을 찾도록 도와드립니다.',
    open: '오른쪽 아래 채팅 버블을 눌러 대화를 시작하세요.',
    b1:   '필요한 것을 당신의 말로 설명하세요',
    b2:   '예산에 맞는 대안을 받아보세요',
    b3:   '저장한 상품을 다시 보고 다음 구매를 결정하세요',
    privacy: 'MantaGO 제공. 예산과 저축은 이 앱에 남고, 입력한 선호만 공유됩니다.',
  },
};

function t2(lang, key, vars) {
  const dict = PANEL[lang] ?? PANEL.en;
  let s = dict[key] ?? PANEL.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}
