import React, { useEffect, useState, useCallback } from 'react';
import useAppStore from '../store/appStore.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { isMantagoConfigured } from '../config/mantago.js';
import MantaGOChat from './MantaGOChat.jsx';
import { onFocusedProduct } from './assistantBus.js';
import styles from './FloatingAssistant.module.css';

/**
 * FloatingAssistant — the 2AM Assistant that lives in the bottom-right
 * corner of EVERY page (mounted from the layouts).
 *
 * Three pieces:
 *   1. A launcher bubble (🛒) that opens/closes the MantaGO chat panel.
 *   2. The MantaGO chat itself in floating mode (session preserved when closed).
 *   3. A budget-aware "nudge" that pops up while the user scrolls the Discovery
 *      feed — e.g. "That's $40 but you have $20 left this week. Want cheaper
 *      options?" Tapping it opens the chat.
 *
 * Privacy: the nudge is computed locally from on-device budget data and is
 * NEVER sent to MantaGO. Only what the user types in the chat is shared.
 */
export default function FloatingAssistant() {
  const { lang } = useI18n();
  const {
    shopperProfile, getStudentBudget, getWorkingBudget, feedback,
    suggestionsEnabled,
  } = useAppStore();

  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [nudge, setNudge] = useState(null); // { text } | null

  // The dedicated chat tab has been removed — the assistant is global now,
  // so it floats on every page.
  const configured = isMantagoConfigured() && !failed;

  // Compute this week's/month's remaining discretionary budget (on-device).
  const budget = shopperProfile?.userType === 'working'
    ? getWorkingBudget?.()
    : getStudentBudget?.();
  const remaining = budget?.discretionary ?? null;

  // Listen for the feed focusing a product and build a budget-aware nudge.
  useEffect(() => {
    return onFocusedProduct((product) => {
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
      setNudge({ text });
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

  const openChat = useCallback(() => { setOpen(true); setNudge(null); }, []);

  if (!configured) return null;

  return (
    <>
      {/* Budget-aware nudge (feed doom-scroll interjection) */}
      {nudge && !open && (
        <div className={styles.nudge} role="status">
          <span className={styles.nudgeIcon}>🛒</span>
          <p className={styles.nudgeText}>{nudge.text}</p>
          <div className={styles.nudgeActions}>
            <button className={styles.nudgePrimary} onClick={openChat}>{L(lang, 'ask')}</button>
            <button className={styles.nudgeGhost} onClick={() => setNudge(null)}>{L(lang, 'dismiss')}</button>
          </div>
        </div>
      )}

      {/* The MantaGO chat panel — stays mounted so the session survives toggling */}
      <MantaGOChat lang={lang} mode="floating" open={open} onFail={() => setFailed(true)} />

      {/* Launcher bubble */}
      <button
        data-tour="assistant-fab"
        className={`${styles.launcher} ${open ? styles.launcherOpen : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label={open ? L(lang, 'close') : L(lang, 'openAria')}
        title="2AM Assistant"
      >
        {open ? '✕' : '🛒'}
      </button>
    </>
  );
}

/* ── tiny local i18n (en/ja/zh/th/ko) for the floating bits ── */
const STR = {
  en: {
    fits: "That's ${price} and you have ${left} left this week. Want to save toward it?",
    over: "That's ${price} but you only have ${left} left — ${over} over. Want cheaper options?",
    ask: 'Ask 2AM Assistant', dismiss: 'Dismiss', close: 'Close assistant',
    openAria: 'Open 2AM Assistant',
  },
  ja: {
    fits: 'これは${price}で、今週は残り${left}あります。貯金を始めますか？',
    over: 'これは${price}ですが、残りは${left}（${over}超過）です。安い選択肢を見ますか？',
    ask: '2AM アシスタントに聞く', dismiss: '閉じる', close: 'アシスタントを閉じる',
    openAria: '2AM アシスタントを開く',
  },
  zh: {
    fits: '这件 ${price}，你本周还剩 ${left}。要为它存钱吗？',
    over: '这件 ${price}，但你只剩 ${left}，超出 ${over}。要看更便宜的选项吗？',
    ask: '问 2AM 助手', dismiss: '关闭', close: '关闭助手',
    openAria: '打开 2AM 助手',
  },
  th: {
    fits: 'ชิ้นนี้ ${price} และสัปดาห์นี้คุณเหลือ ${left} อยากเก็บเงินเพื่อซื้อไหม?',
    over: 'ชิ้นนี้ ${price} แต่คุณเหลือแค่ ${left} เกิน ${over} อยากดูตัวเลือกที่ถูกกว่าไหม?',
    ask: 'ถาม 2AM Assistant', dismiss: 'ปิด', close: 'ปิดผู้ช่วย',
    openAria: 'เปิด 2AM Assistant',
  },
  ko: {
    fits: '이건 ${price}이고 이번 주에 ${left} 남았어요. 목표로 저축할까요?',
    over: '이건 ${price}인데 ${left}밖에 안 남았어요 — ${over} 초과. 더 저렴한 옵션을 볼까요?',
    ask: '2AM 어시스턴트에게 묻기', dismiss: '닫기', close: '어시스턴트 닫기',
    openAria: '2AM 어시스턴트 열기',
  },
};
function L(lang, key, vars) {
  const dict = STR[lang] ?? STR.en;
  let s = dict[key] ?? STR.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}
function fmt(n) { return Number(n).toFixed(Number.isInteger(Number(n)) ? 0 : 2); }
