import React, { useEffect, useRef } from 'react';
import { buildMantagoUrl, MANTAGO_ORIGIN, isMantagoConfigured } from '../config/mantago.js';

/**
 * MantaGOChat — mounts the live MantaGO web chat ("2AM Assistant").
 *
 * Two layout modes:
 *   - inline  (default): the iframe fills the element its parent gives it.
 *   - floating:          the iframe is a fixed bubble in the bottom-right
 *                        corner, present on every page via the layouts.
 *
 * Either way we speak MantaGO's cookie postMessage protocol so the live-chat
 * session persists. We ignore the widget's own resize/drag messages because
 * WE own the container size in both modes.
 *
 * Privacy wall: we only load the bot. No budget, savings or ledger values are
 * posted to MantaGO — the user shares only what they type.
 *
 * The iframe reloads when `lang` changes so the bot follows the UI language.
 */
export default function MantaGOChat({ lang = 'en', onFail, mode = 'inline', open = true }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!isMantagoConfigured()) { onFail?.(); return; }

    const CLIENT_ID_COOKIE = 'mnatagoLiveChat-clientId-Jrb2vrKbW';

    const onMessage = (event) => {
      // Only trust messages from the MantaGO origin.
      if (event.origin !== new URL(MANTAGO_ORIGIN).origin) return;
      const msg = event.data || {};
      const iframe = iframeRef.current;

      // Cookie management — persist the MantaGO live-chat client id so the
      // session survives reloads.
      if (msg.type === 'setLiveChatCookie') {
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 10);
        document.cookie = `${msg.name}=${encodeURIComponent(msg.value)}; expires=${expiry.toUTCString()}; path=/`;
        return;
      }
      if (msg.type === 'getLiveChatCookie') {
        const readCookie = (name) => {
          const prefix = `${name}=`;
          for (let part of document.cookie.split(';')) {
            part = part.trim();
            if (part.indexOf(prefix) === 0) return decodeURIComponent(part.substring(prefix.length));
          }
          return null;
        };
        iframe?.contentWindow?.postMessage(
          { type: 'updateLiveChatClientId', value: readCookie(CLIENT_ID_COOKIE) },
          MANTAGO_ORIGIN
        );
        return;
      }
      if (msg.type === 'removeLiveChatCookie') {
        document.cookie = `${CLIENT_ID_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [lang, onFail]);

  if (!isMantagoConfigured()) return null;

  const wrap = mode === 'floating' ? floatingWrap(open) : inlineWrap;

  return (
    <div style={wrap} aria-hidden={mode === 'floating' && !open}>
      <iframe
        ref={iframeRef}
        src={buildMantagoUrl(lang)}
        title="2AM Assistant"
        allow="microphone; camera; autoplay"
        style={frame}
        onError={() => onFail?.()}
      />
    </div>
  );
}

const inlineWrap = {
  flex: 1,
  minHeight: 0,
  width: '100%',
  borderRadius: 'var(--radius)',
  overflow: 'hidden',
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  display: 'flex',
};

/* Floating panel sits just above the corner launcher button.
   We keep it mounted (not unmounted) when closed so the MantaGO session
   and its cookie survive toggling — we just hide it. */
function floatingWrap(open) {
  return {
    position: 'fixed',
    right: 'max(14px, env(safe-area-inset-right))',
    bottom: 'calc(68px + env(safe-area-inset-bottom))',
    width: 'min(380px, calc(100vw - 28px))',
    height: 'min(560px, calc(100dvh - 140px))',
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid var(--border-light)',
    background: 'var(--bg-card)',
    boxShadow: '0 16px 48px rgba(0,0,0,.45)',
    zIndex: 1000,
    display: 'flex',
    // Hide without unmounting so the chat session is preserved.
    opacity: open ? 1 : 0,
    transform: open ? 'translateY(0) scale(1)' : 'translateY(12px) scale(.98)',
    pointerEvents: open ? 'auto' : 'none',
    transition: 'opacity .18s ease, transform .18s ease',
  };
}

const frame = {
  flex: 1,
  width: '100%',
  height: '100%',
  border: 'none',
  background: 'transparent',
};
