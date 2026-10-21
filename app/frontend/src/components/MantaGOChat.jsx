import React, { useEffect, useRef, useState } from 'react';
import { buildMantagoUrl, MANTAGO_ORIGIN, isMantagoConfigured } from '../config/mantago.js';

/**
 * MantaGOChat — mounts the live MantaGO web chat ("2AM Assistant")
 * INLINE, filling the area its parent gives it, instead of as a small
 * floating corner bubble.
 *
 * The iframe is rendered inside this component's own element and sized
 * to 100% × 100% so it fills the ChatPage. We still speak MantaGO's
 * cookie postMessage protocol so the live-chat session persists, but we
 * ignore the widget's resize/drag messages because WE own the layout now.
 *
 * Privacy wall: we only load the bot. No budget, savings or ledger values
 * are posted to MantaGO — the user shares only what they type.
 *
 * The iframe reloads when `lang` changes so the bot follows the UI language.
 */
export default function MantaGOChat({ lang = 'en', onFail }) {
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
      // session survives reloads. (Resize/drag messages are ignored: the
      // iframe is inline and fills its container.)
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

  return (
    <div style={wrap}>
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

const wrap = {
  flex: 1,
  minHeight: 0,
  width: '100%',
  borderRadius: 'var(--radius)',
  overflow: 'hidden',
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  display: 'flex',
};

const frame = {
  flex: 1,
  width: '100%',
  height: '100%',
  border: 'none',
  background: 'transparent',
};
