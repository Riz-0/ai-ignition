import React, { useEffect, useState, useCallback, useRef } from 'react';
import useAppStore from '../store/appStore.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { onFocusedProduct } from './assistantBus.js';
import AssistantChat from './assistant/AssistantChat.jsx';
import OwlIcon from './assistant/OwlIcon.jsx';
import { pickTone } from './assistant/personas.js';
import styles from './FloatingAssistant.module.css';

/**
 * FloatingAssistant — Hoot, the 2AM Assistant, in the bottom-right corner of
 * EVERY page (mounted from the layouts).
 *
 * Three pieces:
 *   1. An owl launcher bubble that opens/closes the chat panel.
 *   2. Hoot's chat (AssistantChat) — same skills for everyone, with a voice
 *      that matches the account (e.g. bestie for Emily, coach for John).
 *   3. A budget-aware "nudge" that pops up while the user scrolls the Discovery
 *      feed — e.g. "That's $40 but you have $20 left this week. Want cheaper
 *      options?" Tapping it opens the chat and asks Hoot about that product.
 *
 * Privacy: the nudge is computed on-device. The chat sends Hoot a short
 * summary (name, interests, budget left, goals, wishlist) with each message.
 */
export default function FloatingAssistant({ mode = 'shopper' }) {
  const { lang } = useI18n();
  const {
    shopperProfile, getStudentBudget, getWorkingBudget, getActiveGoals,
    wishlist, suggestionsEnabled, activeAccountId,
  } = useAppStore();

  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(null);       // { text, product } | null
  const [prefill, setPrefill] = useState(null);   // question to send when the chat opens
  const focusedRef = useRef(null);                // product currently on screen in Discover

  const isBusiness = mode === 'business';
  const tone = pickTone(activeAccountId, shopperProfile, mode);
  const Lx = useCallback((key, vars) => L(lang, key, vars), [lang]);

  // Compute this week's/month's remaining discretionary budget (on-device).
  const isWorking = shopperProfile?.userType === 'working';
  const budget = isBusiness ? null : (isWorking ? getWorkingBudget?.() : getStudentBudget?.());
  const remaining = budget?.discretionary ?? null;

  // Listen for the feed focusing a product and build a budget-aware nudge.
  useEffect(() => {
    return onFocusedProduct((product) => {
      focusedRef.current = product ?? null;
      if (suggestionsEnabled === false) { return; }  // user turned suggestions off
      if (!product || open) { return; }              // don't nudge while chat is open
      const price = Number(product.price);
      if (!price || remaining == null) { return; }   // need both to compare

      let text;
      if (price <= remaining) {
        text = L(lang, 'fits', { price: fmt(price), left: fmt(remaining) });
      } else {
        const over = price - remaining;
        text = L(lang, 'over', { price: fmt(price), left: fmt(remaining), over: fmt(over) });
      }
      setNudge({ text, product });
    });
  }, [lang, remaining, open, suggestionsEnabled]);

  // If suggestions get turned off while a nudge is showing, clear it.
  useEffect(() => {
    if (suggestionsEnabled === false) setNudge(null);
  }, [suggestionsEnabled]);

  // Auto-dismiss a nudge after a while so it isn't sticky.
  useEffect(() => {
    if (!nudge) return;
    const id = setTimeout(() => setNudge(null), 9000);
    return () => clearTimeout(id);
  }, [nudge]);

  const askAboutNudge = useCallback(() => {
    const p = nudge?.product;
    if (p?.title) setPrefill(L(lang, 'askAbout', { title: p.title, price: fmt(p.price) }));
    setOpen(true);
    setNudge(null);
  }, [nudge, lang]);

  // The short summary Hoot gets with each message.
  const getContext = useCallback(() => {
    if (isBusiness) return {};
    const goals = (getActiveGoals?.() ?? [])
      .filter(g => g.status !== 'completed')
      .map(g => ({ name: g.name, current: Number(g.currentAmount) || 0, target: Number(g.targetAmount) || 0 }));
    const items = (wishlist ?? []).map(w => ({ title: w.title, price: Number(w.price ?? w.budget) || null }));
    const focused = focusedRef.current;
    return {
      name: shopperProfile?.name,
      userType: shopperProfile?.userType,
      period: isWorking ? 'month' : 'week',
      remaining,
      interests: shopperProfile?.interests ?? [],
      goals,
      wishlist: items,
      focusedProduct: focused?.title ? { title: focused.title, price: Number(focused.price) || null } : null,
    };
  }, [isBusiness, getActiveGoals, wishlist, shopperProfile, isWorking, remaining]);

  return (
    <>
      {/* Budget-aware nudge (feed doom-scroll interjection) */}
      {nudge && !open && (
        <div className={styles.nudge} role="status">
          <span className={styles.nudgeIcon}><OwlIcon size={26} /></span>
          <p className={styles.nudgeText}>{nudge.text}</p>
          <div className={styles.nudgeActions}>
            <button className={styles.nudgePrimary} onClick={askAboutNudge}>{L(lang, 'ask')}</button>
            <button className={styles.nudgeGhost} onClick={() => setNudge(null)}>{L(lang, 'dismiss')}</button>
          </div>
        </div>
      )}

      {/* Hoot's chat — stays mounted so the conversation survives toggling */}
      <AssistantChat
        open={open}
        onClose={() => setOpen(false)}
        tone={tone}
        lang={lang}
        name={isBusiness ? null : shopperProfile?.name}
        getContext={getContext}
        prefill={prefill}
        onPrefillSent={() => setPrefill(null)}
        L={Lx}
      />

      {/* Launcher bubble */}
      <button
        data-tour="assistant-fab"
        className={`${styles.launcher} ${open ? styles.launcherOpen : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label={open ? L(lang, 'close') : L(lang, 'openAria')}
        title={open ? L(lang, 'close') : 'Hoot · 2AM Assistant'}
      >
        {open ? '✕' : <OwlIcon size={34} />}
      </button>
    </>
  );
}

/* ── tiny local i18n (en/ja/zh/th/ko) for the floating bits ── */
const STR = {
  en: {
    fits: "That's ${price} and you have ${left} left this week. Want to save toward it?",
    over: "That's ${price} but you only have ${left} left — ${over} over. Want cheaper options?",
    ask: 'Ask Hoot', dismiss: 'Dismiss', close: 'Close Hoot',
    openAria: 'Open Hoot, your 2AM assistant',
    askAbout: 'Is the {title} (${price}) worth it for me right now?',
    subtitle: 'Your 2AM assistant', placeholder: 'Message Hoot…', send: 'Send', typing: 'Hoot is typing',
    offline: 'Offline mode: Hoot is answering from your budget on this device.',
  },
  ja: {
    fits: 'これは${price}で、今週は残り${left}あります。貯金を始めますか？',
    over: 'これは${price}ですが、残りは${left}（${over}超過）です。安い選択肢を見ますか？',
    ask: 'Hootに聞く', dismiss: '閉じる', close: 'Hootを閉じる',
    openAria: '2AMアシスタントのHootを開く',
    askAbout: '{title}（${price}）は今の私にとって買う価値ある？',
    subtitle: 'あなたの2AMアシスタント', placeholder: 'Hootにメッセージ…', send: '送信', typing: 'Hootが入力中',
    offline: 'オフラインモード：この端末の予算データから回答しています。',
  },
  zh: {
    fits: '这件 ${price}，你本周还剩 ${left}。要为它存钱吗？',
    over: '这件 ${price}，但你只剩 ${left}，超出 ${over}。要看更便宜的选项吗？',
    ask: '问问 Hoot', dismiss: '关闭', close: '关闭 Hoot',
    openAria: '打开你的 2AM 助手 Hoot',
    askAbout: '{title}（${price}）现在值得我买吗？',
    subtitle: '你的 2AM 助手', placeholder: '给 Hoot 发消息…', send: '发送', typing: 'Hoot 正在输入',
    offline: '离线模式：Hoot 正根据此设备上的预算回答。',
  },
  th: {
    fits: 'ชิ้นนี้ ${price} และสัปดาห์นี้คุณเหลือ ${left} อยากเก็บเงินเพื่อซื้อไหม?',
    over: 'ชิ้นนี้ ${price} แต่คุณเหลือแค่ ${left} เกิน ${over} อยากดูตัวเลือกที่ถูกกว่าไหม?',
    ask: 'ถาม Hoot', dismiss: 'ปิด', close: 'ปิด Hoot',
    openAria: 'เปิด Hoot ผู้ช่วย 2AM ของคุณ',
    askAbout: '{title} (${price}) คุ้มไหมที่จะซื้อตอนนี้?',
    subtitle: 'ผู้ช่วย 2AM ของคุณ', placeholder: 'ส่งข้อความถึง Hoot…', send: 'ส่ง', typing: 'Hoot กำลังพิมพ์',
    offline: 'โหมดออฟไลน์: Hoot ตอบจากข้อมูลงบบนอุปกรณ์นี้',
  },
  ko: {
    fits: '이건 ${price}이고 이번 주에 ${left} 남았어요. 목표로 저축할까요?',
    over: '이건 ${price}인데 ${left}밖에 안 남았어요 — ${over} 초과. 더 저렴한 옵션을 볼까요?',
    ask: 'Hoot에게 묻기', dismiss: '닫기', close: 'Hoot 닫기',
    openAria: '2AM 어시스턴트 Hoot 열기',
    askAbout: '{title}(${price}) 지금 사도 괜찮을까?',
    subtitle: '나의 2AM 어시스턴트', placeholder: 'Hoot에게 메시지…', send: '보내기', typing: 'Hoot가 입력 중',
    offline: '오프라인 모드: 이 기기의 예산 정보로 답하고 있어요.',
  },
};
function L(lang, key, vars) {
  const dict = STR[lang] ?? STR.en;
  let s = dict[key] ?? STR.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}
function fmt(n) { return Number(n).toFixed(Number.isInteger(Number(n)) ? 0 : 2); }
