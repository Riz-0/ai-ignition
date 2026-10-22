import React, { useEffect, useRef, useState } from 'react';
import api from '../../lib/api.js';
import useAppStore from '../../store/appStore.js';
import OwlIcon from './OwlIcon.jsx';
import { TONES } from './personas.js';
import { localReply } from './localReplies.js';
import styles from './AssistantChat.module.css';

/**
 * Hoot's chat panel. Talks to the backend (/api/assistant/chat → Claude) and
 * falls back to on-device replies when the server isn't available.
 *
 * Replies can carry product cards (picked from `getCatalog()`), each with a
 * link to the shop and a one-tap "save to wishlist".
 *
 * Stays mounted while closed so the conversation survives toggling.
 *
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {string}   tone          key of TONES
 * @param {string}   lang
 * @param {string}   name          user's first name for the greeting
 * @param {Function} getContext    () => context object sent with each message
 * @param {Function} getCatalog    () => products Hoot may recommend
 * @param {string|null} prefill    a message to send as soon as the panel opens
 * @param {Function} onPrefillSent
 * @param {Function} L             (key, vars) => UI string in the current language
 */
export default function AssistantChat({ open, onClose, tone, lang, name, getContext, getCatalog, prefill, onPrefillSent, L }) {
  const voice = TONES[tone] ?? TONES.friendly;
  const [messages, setMessages] = useState(() => [{ role: 'assistant', content: voice.greeting(name) }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [offline, setOffline] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // New account or new tone → start a fresh conversation with that voice.
  useEffect(() => {
    setMessages([{ role: 'assistant', content: voice.greeting(name) }]);
  }, [tone, name]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => {
    if (open && prefill && !sending) {
      send(prefill);
      onPrefillSent?.();
    }
  }, [open, prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send(text) {
    const content = text.trim();
    if (!content || sending) return;
    const history = [...messages, { role: 'user', content }];
    setMessages(history);
    setInput('');
    setSending(true);

    const context = getContext();
    const catalog = getCatalog();
    let result = null;
    if (!offline) {
      try {
        const data = await api.post('/assistant/chat', {
          // Tell Hoot which cards it already showed, so follow-ups make sense.
          messages: history.map(m => ({
            role: m.role,
            content: m.products?.length ? `${m.content}\n(Showed: ${m.products.map(p => p.title).join('; ')})` : m.content,
          })),
          tone, lang, context, catalog,
        }, { timeout: 60000 });
        if (data?.reply) result = { reply: data.reply, products: data.products ?? [] };
      } catch (err) {
        // Busy or a hiccup upstream: answer locally but try the server again next time.
        // Anything else (no backend, no API key): stay on-device for this session.
        if (!['rate_limited', 'upstream_error'].includes(err.message)) setOffline(true);
      }
    }
    if (!result) result = localReply(content, tone, context, catalog);

    setMessages(m => [...m, { role: 'assistant', content: result.reply, products: result.products }]);
    setSending(false);
  }

  const showChips = messages.length === 1 && !sending;
  const remaining = getContext().remaining;

  return (
    <section className={`${styles.panel} ${open ? styles.open : ''}`} aria-hidden={!open}
      role="dialog" aria-label="Hoot, your 2AM assistant">
      <header className={styles.header}>
        <span className={styles.avatar}><OwlIcon size={32} /></span>
        <div className={styles.headText}>
          <strong className={styles.name}>Hoot</strong>
          <span className={styles.sub}>{L('subtitle')} · {voice.label}</span>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label={L('close')}>✕</button>
      </header>

      <div className={styles.list} ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={styles.turn}>
            <div className={`${styles.row} ${m.role === 'user' ? styles.rowMe : ''}`}>
              {m.role === 'assistant' && <span className={styles.miniAvatar}><OwlIcon size={22} /></span>}
              <p className={`${styles.bubble} ${m.role === 'user' ? styles.me : styles.ai}`}>{m.content}</p>
            </div>
            {m.products?.length > 0 && (
              <div className={styles.cards}>
                {m.products.map(p => <ProductCard key={p.id} product={p} remaining={remaining} L={L} />)}
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className={styles.row}>
            <span className={styles.miniAvatar}><OwlIcon size={22} blink /></span>
            <p className={`${styles.bubble} ${styles.ai} ${styles.typing}`} aria-label={L('typing')}>
              <span /><span /><span />
            </p>
          </div>
        )}
        {showChips && (
          <div className={styles.chips}>
            {voice.chips.map(c => (
              <button key={c} type="button" className={styles.chip} onClick={() => send(c)}>{c}</button>
            ))}
          </div>
        )}
      </div>

      {offline && <p className={styles.offline}>{L('offline')}</p>}

      <form className={styles.inputRow} onSubmit={e => { e.preventDefault(); send(input); }}>
        <input ref={inputRef} className={styles.input} value={input} maxLength={2000}
          placeholder={L('placeholder')} onChange={e => setInput(e.target.value)} />
        <button type="submit" className={styles.send} disabled={!input.trim() || sending} aria-label={L('send')}>➤</button>
      </form>
    </section>
  );
}

/** One recommended product: price vs budget, a shop link and save-to-wishlist. */
function ProductCard({ product: p, remaining, L }) {
  const { wishlist, addToWishlist, startPurchaseCheck } = useAppStore();
  const saved = wishlist.some(w => w.title === p.title);
  const hasPrice = typeof p.price === 'number';
  const fits = hasPrice && typeof remaining === 'number' ? p.price <= remaining : null;

  function save() {
    if (saved) return;
    addToWishlist({
      title: p.title,
      price: p.price,
      budget: p.price,
      url: p.url,
      notes: [p.merchant, p.category].filter(Boolean).join(' · '),
      source: 'hoot',
    });
  }

  return (
    <article className={styles.card}>
      <span className={styles.cardThumb}>{p.emoji || '🛍️'}</span>
      <div className={styles.cardBody}>
        <h4 className={styles.cardTitle}>{p.title}</h4>
        <p className={styles.cardMeta}>{[p.merchant, p.category].filter(Boolean).join(' · ')}</p>
        <div className={styles.cardPriceRow}>
          <strong className={styles.cardPrice}>{hasPrice ? `$${p.price.toFixed(2)}` : L('priceVaries')}</strong>
          {fits === true && <span className={`${styles.tag} ${styles.tagOk}`}>{L('inBudget')}</span>}
          {fits === false && <span className={`${styles.tag} ${styles.tagOver}`}>{L('overBy', { amount: (p.price - remaining).toFixed(2) })}</span>}
        </div>
        <div className={styles.cardActions}>
          {p.url && (
            <a className={styles.cardLink} href={p.url} target="_blank" rel="noopener noreferrer"
              onClick={() => startPurchaseCheck(p, 'hoot')}>{L('view')} ↗</a>
          )}
          <button type="button" className={`${styles.cardSave} ${saved ? styles.cardSaved : ''}`} onClick={save} disabled={saved}>
            {saved ? `❤️ ${L('saved')}` : `♡ ${L('save')}`}
          </button>
        </div>
      </div>
    </article>
  );
}
