import React, { useEffect, useRef, useState } from 'react';
import api from '../../lib/api.js';
import OwlIcon from './OwlIcon.jsx';
import { TONES } from './personas.js';
import { localReply } from './localReplies.js';
import styles from './AssistantChat.module.css';

/**
 * Hoot's chat panel. Talks to the backend (/api/assistant/chat → Claude) and
 * falls back to on-device replies when the server isn't available.
 *
 * Stays mounted while closed so the conversation survives toggling.
 *
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {string}   tone          key of TONES
 * @param {string}   lang
 * @param {string}   name          user's first name for the greeting
 * @param {Function} getContext    () => context object sent with each message
 * @param {string|null} prefill    a message to send as soon as the panel opens
 * @param {Function} onPrefillSent
 * @param {Function} L             (key) => UI string in the current language
 */
export default function AssistantChat({ open, onClose, tone, lang, name, getContext, prefill, onPrefillSent, L }) {
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
    let reply;
    if (!offline) {
      try {
        const data = await api.post('/assistant/chat', {
          messages: history.map(({ role, content: c }) => ({ role, content: c })),
          tone, lang, context,
        }, { timeout: 60000 });
        reply = data.reply;
      } catch (err) {
        // Busy or a hiccup upstream: answer locally but try the server again next time.
        // Anything else (no backend, no API key): stay on-device for this session.
        if (!['rate_limited', 'upstream_error'].includes(err.message)) setOffline(true);
      }
    }
    if (!reply) reply = localReply(content, tone, context);

    setMessages(m => [...m, { role: 'assistant', content: reply }]);
    setSending(false);
  }

  const showChips = messages.length === 1 && !sending;

  return (
    <section className={`${styles.panel} ${open ? styles.open : ''}`} aria-hidden={!open}
      role="dialog" aria-label="Hoot, your 2AM assistant">
      <header className={styles.header}>
        <span className={styles.avatar}><OwlIcon size={30} /></span>
        <div className={styles.headText}>
          <strong className={styles.name}>Hoot</strong>
          <span className={styles.sub}>{L('subtitle')} · {voice.label}</span>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label={L('close')}>✕</button>
      </header>

      <div className={styles.list} ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={`${styles.row} ${m.role === 'user' ? styles.rowMe : ''}`}>
            {m.role === 'assistant' && <span className={styles.miniAvatar}><OwlIcon size={22} /></span>}
            <p className={`${styles.bubble} ${m.role === 'user' ? styles.me : styles.ai}`}>{m.content}</p>
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
