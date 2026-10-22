import React, { useEffect, useState } from 'react';
import useAppStore from '../store/appStore.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import styles from './PurchaseCheck.module.css';

// Ignore "coming back" within this long of tapping the link (it didn't really leave).
const MIN_AWAY_MS = 2000;

/**
 * "Did you get it?" — after the user opens a product's shop link (Discover,
 * Hoot's cards, the wishlist) and comes back to the app, ask what happened:
 *   - Bought it:      log the spend (budget goes down), record the purchase,
 *                     take it off the wishlist.
 *   - Still thinking: add it to the wishlist.
 *   - Didn't buy:     nothing changes.
 * The pending check is persisted, so it's also asked when the app is reopened later.
 */
export default function PurchaseCheck() {
  const { lang } = useI18n();
  const pending = useAppStore((s) => s.pendingPurchaseCheck);
  const activeAccountId = useAppStore((s) => s.activeAccountId);
  const [show, setShow] = useState(false);
  const [toast, setToast] = useState(null);

  const mine = !!pending && pending.accountId === (activeAccountId ?? 'local');
  const L = (key, vars) => t(lang, key, vars);

  // Show the card when the user comes back (tab/app visible again, window focused,
  // or the app reopened later with a check still pending).
  useEffect(() => {
    if (!mine) { setShow(false); return undefined; }
    const openedAt = new Date(pending.openedAt).getTime();
    const cameBack = () => { if (Date.now() - openedAt >= MIN_AWAY_MS) setShow(true); };
    cameBack();
    const onVisible = () => { if (document.visibilityState === 'visible') cameBack(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', cameBack);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', cameBack);
    };
  }, [mine, pending?.openedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  function answer(kind) {
    const s = useAppStore.getState();
    const p = s.pendingPurchaseCheck;
    if (!p) return;
    const hasPrice = typeof p.price === 'number';

    if (kind === 'bought') {
      if (hasPrice) {
        s.addExpense({
          category: 'shopping',
          amount: p.price,
          description: p.merchant ? `${p.title} (${p.merchant})` : p.title,
          source: 'purchase-check',
        });
      }
      s.recordPurchase({ title: p.title, price: p.price, url: p.url, merchant: p.merchant, source: p.source });
      s.wishlist.filter((w) => w.title === p.title).forEach((w) => s.removeFromWishlist(w.id));

      const after = useAppStore.getState();
      const working = after.shopperProfile?.userType === 'working';
      const left = (working ? after.getWorkingBudget?.() : after.getStudentBudget?.())?.discretionary;
      setToast(hasPrice && typeof left === 'number'
        ? L('boughtLeft', { price: money(p.price), left: money(left), period: L(working ? 'month' : 'week') })
        : L('bought'));
    } else if (kind === 'thinking') {
      const already = s.wishlist.some((w) => w.title === p.title);
      if (!already) {
        s.addToWishlist({
          title: p.title,
          price: p.price,
          budget: p.price,
          url: p.url,
          notes: [p.merchant, p.category].filter(Boolean).join(' · '),
          source: 'purchase-check',
        });
      }
      setToast(L(already ? 'thinkingAlready' : 'thinking'));
    } else {
      setToast(L('notBought'));
    }

    s.clearPurchaseCheck();
    setShow(false);
  }

  return (
    <>
      {show && mine && (
        <div className={styles.backdrop} role="presentation">
          <section className={styles.card} role="dialog" aria-modal="true" aria-labelledby="purchase-check-title">
            <button type="button" className={styles.later} onClick={() => setShow(false)} aria-label={L('later')}>✕</button>
            <div className={styles.head}>
              <span className={styles.thumb}>{pending.emoji || '🛍️'}</span>
              <div className={styles.headText}>
                <h3 id="purchase-check-title" className={styles.title}>{L('title')}</h3>
                <p className={styles.product}>{pending.title}</p>
                <p className={styles.meta}>
                  {[pending.merchant, typeof pending.price === 'number' ? `$${pending.price.toFixed(2)}` : null].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <div className={styles.actions}>
              <button type="button" className={`${styles.choice} ${styles.bought}`} onClick={() => answer('bought')}>
                ✅ {L('btnBought')}
              </button>
              <button type="button" className={`${styles.choice} ${styles.thinking}`} onClick={() => answer('thinking')}>
                🤔 {L('btnThinking')}
                <span className={styles.choiceHint}>{L('btnThinkingHint')}</span>
              </button>
              <button type="button" className={`${styles.choice} ${styles.no}`} onClick={() => answer('no')}>
                ✕ {L('btnNo')}
              </button>
            </div>
          </section>
        </div>
      )}
      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </>
  );
}

function money(n) { return `$${Number(n).toFixed(2)}`; }

/* ── tiny local i18n (en/ja/zh/th/ko) ── */
const STR = {
  en: {
    title: 'Did you get it?', btnBought: 'Bought it', btnThinking: 'Still thinking',
    btnThinkingHint: 'Save to wishlist', btnNo: "Didn't buy", later: 'Ask me later',
    week: 'week', month: 'month',
    bought: 'Nice! Logged your purchase.',
    boughtLeft: 'Logged {price}. You have {left} left this {period}.',
    thinking: 'Added to your wishlist. Sleep on it 🌙',
    thinkingAlready: "It's already on your wishlist. Sleep on it 🌙",
    notBought: 'No worries, nothing changed. 👍',
  },
  ja: {
    title: '買いましたか？', btnBought: '買った', btnThinking: 'まだ考え中',
    btnThinkingHint: 'ウィッシュリストに保存', btnNo: '買わなかった', later: 'あとで聞く',
    week: '週', month: '月',
    bought: '購入を記録しました。',
    boughtLeft: '{price}を記録しました。今{period}の残りは{left}です。',
    thinking: 'ウィッシュリストに追加しました。ひと晩寝かせて 🌙',
    thinkingAlready: 'すでにウィッシュリストにあります。ひと晩寝かせて 🌙',
    notBought: '了解です。何も変更していません。👍',
  },
  zh: {
    title: '你买了吗？', btnBought: '买了', btnThinking: '还在考虑',
    btnThinkingHint: '加入心愿单', btnNo: '没买', later: '稍后再问',
    week: '周', month: '月',
    bought: '已记录你的购买。',
    boughtLeft: '已记录 {price}。本{period}还剩 {left}。',
    thinking: '已加入心愿单。睡一觉再决定 🌙',
    thinkingAlready: '它已经在你的心愿单里了。睡一觉再决定 🌙',
    notBought: '好的，没有任何变化。👍',
  },
  th: {
    title: 'ซื้อแล้วหรือยัง?', btnBought: 'ซื้อแล้ว', btnThinking: 'ยังคิดอยู่',
    btnThinkingHint: 'บันทึกในวิชลิสต์', btnNo: 'ไม่ได้ซื้อ', later: 'ถามทีหลัง',
    week: 'สัปดาห์', month: 'เดือน',
    bought: 'บันทึกการซื้อแล้ว',
    boughtLeft: 'บันทึก {price} แล้ว {period}นี้เหลือ {left}',
    thinking: 'เพิ่มในวิชลิสต์แล้ว นอนคิดก่อนนะ 🌙',
    thinkingAlready: 'อยู่ในวิชลิสต์แล้ว นอนคิดก่อนนะ 🌙',
    notBought: 'ได้เลย ไม่มีอะไรเปลี่ยนแปลง 👍',
  },
  ko: {
    title: '구매하셨나요?', btnBought: '샀어요', btnThinking: '아직 고민 중',
    btnThinkingHint: '위시리스트에 저장', btnNo: '안 샀어요', later: '나중에 묻기',
    week: '주', month: '달',
    bought: '구매를 기록했어요.',
    boughtLeft: '{price}을(를) 기록했어요. 이번 {period} 남은 금액은 {left}이에요.',
    thinking: '위시리스트에 추가했어요. 하룻밤 생각해 봐요 🌙',
    thinkingAlready: '이미 위시리스트에 있어요. 하룻밤 생각해 봐요 🌙',
    notBought: '알겠어요, 바뀐 건 없어요. 👍',
  },
};
function t(lang, key, vars) {
  let s = (STR[lang] ?? STR.en)[key] ?? STR.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}
