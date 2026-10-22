import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n/I18nProvider.jsx';
import styles from './PrivacyBadge.module.css';

/**
 * "Privacy first" pill. Tap to see a short
 * summary of how data is handled, with a link to the full /privacy page.
 *
 * @param {'left'|'right'} align  which edge the popover lines up with
 * @param {boolean} compact       icon + short label, for the top bar
 */
export default function PrivacyBadge({ align = 'left', compact = false, ...rest }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const ref = useRef(null);
  const popRef = useRef(null);

  // Nudge the popover back inside the viewport on narrow screens.
  useLayoutEffect(() => {
    if (!open) { setShift(0); return; }
    const r = popRef.current.getBoundingClientRect();
    if (r.left < 16) setShift(16 - r.left);
    else if (r.right > window.innerWidth - 16) setShift(window.innerWidth - 16 - r.right);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey  = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span className={styles.wrap} ref={ref} {...rest}>
      <button type="button"
        className={`${styles.badge} ${compact ? styles.compact : ''}`}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}>
        🔒 <span className={styles.label}>{t('privacy.badge')}</span>
      </button>

      {open && (
        <div ref={popRef} role="tooltip"
          className={`${styles.pop} ${align === 'right' ? styles.right : ''}`}
          style={{ transform: `translateX(${shift}px)` }}>
          <strong className={styles.popTitle}>{t('privacy.popTitle')}</strong>
          <ul className={styles.list}>
            <li>📱 {t('privacy.pointDevice')}</li>
            <li>🏪 {t('privacy.pointMerchants')}</li>
            <li>🔗 {t('privacy.pointLinks')}</li>
          </ul>
          <Link to="/privacy" className={styles.more} onClick={() => setOpen(false)}>
            {t('privacy.learnMore')} →
          </Link>
        </div>
      )}
    </span>
  );
}
