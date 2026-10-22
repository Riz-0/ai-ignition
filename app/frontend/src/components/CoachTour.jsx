import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useT } from '../i18n/I18nProvider.jsx';
import styles from './CoachTour.module.css';

/**
 * Banking-app style coach-mark tour.
 *
 * Dims the screen, cuts a spotlight around the real element for each
 * step (found via its `data-tour` attribute) and shows a short tip next
 * to it. Steps without a target, or whose target isn't on screen, show
 * a centred card instead.
 *
 * @param {Array}    steps     [{ target?, title, body, inSidebar? }]
 * @param {Function} onFinish  called on Done / Skip / Esc
 * @param {Function} onStep    called with the active step (lets the
 *                             layout open the mobile sidebar)
 */
const PAD = 6;
const GAP = 12;
const TIP_W = 300;
const MOBILE = 768;

export default function CoachTour({ steps, onFinish, onStep }) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [tipH, setTipH] = useState(0);
  const tipRef = useRef(null);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  useEffect(() => { onStep?.(step); }, [step, onStep]);

  // Track the target's position every frame so the spotlight follows
  // sidebar slide-ins, scrolling and resizes.
  useEffect(() => {
    let raf;
    let last = '';
    const measure = () => {
      const el = step.target && document.querySelector(`[data-tour="${step.target}"]`);
      const r = el?.getBoundingClientRect();
      const visible = r && r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth;
      const next = visible ? { top: r.top, left: r.left, width: r.width, height: r.height } : null;
      const key = JSON.stringify(next);
      if (key !== last) { last = key; setRect(next); }
      raf = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(raf);
  }, [step]);

  useLayoutEffect(() => {
    if (tipRef.current) setTipH(tipRef.current.offsetHeight);
  }, [index, rect]);

  useEffect(() => { tipRef.current?.focus(); }, [index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onFinish();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function next() { isLast ? onFinish() : setIndex(i => i + 1); }
  function back() { setIndex(i => Math.max(0, i - 1)); }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tipW = Math.min(TIP_W, vw - 32);
  let tipStyle;

  if (rect) {
    const roomRight = vw - (rect.left + rect.width + PAD + GAP);
    if (vw > MOBILE && roomRight >= tipW + 16) {
      // Beside the target (sidebar items on desktop)
      const top = rect.top + rect.height / 2 - tipH / 2;
      tipStyle = {
        left: rect.left + rect.width + PAD + GAP,
        top: Math.max(16, Math.min(top, vh - tipH - 16)),
      };
    } else {
      // Below the target, or above when there's no room
      const below = rect.top + rect.height + PAD + GAP;
      const top = below + tipH <= vh - 16 ? below : rect.top - PAD - GAP - tipH;
      const left = rect.left + rect.width / 2 - tipW / 2;
      tipStyle = {
        left: Math.max(16, Math.min(left, vw - tipW - 16)),
        top: Math.max(16, top),
      };
    }
  }

  return (
    <div className={styles.root}>
      {/* Click catcher — blocks the app while the tour is showing */}
      <div className={rect ? styles.catcher : `${styles.catcher} ${styles.dim}`} />

      {rect && (
        <div className={styles.spotlight} style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
        }} />
      )}

      <div
        ref={tipRef}
        className={`${styles.tip} ${rect ? '' : styles.centered}`}
        style={{ width: tipW, ...tipStyle }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="coach-title"
        tabIndex={-1}
      >
        <div className={styles.progress}>
          {steps.map((_, i) => (
            <span key={i} className={`${styles.dot} ${i === index ? styles.dotOn : ''}`} />
          ))}
          <span className={styles.count}>{t('tour.stepOf', { n: index + 1, total: steps.length })}</span>
        </div>
        <h3 id="coach-title" className={styles.title}>{step.title}</h3>
        <p className={styles.body}>{step.body}</p>
        <div className={styles.actions}>
          {!isLast && (
            <button type="button" className={styles.skip} onClick={onFinish}>{t('tour.skip')}</button>
          )}
          <div className={styles.navBtns}>
            {index > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={back}>{t('tour.back')}</button>
            )}
            <button type="button" className="btn btn-primary btn-sm" onClick={next}>
              {isLast ? t('tour.done') : index === 0 ? t('tour.start') : t('tour.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Offer shown to new sign-ups before the tour: one clear "yes" and a
 * small decline link so it never feels forced.
 */
export function TourPrompt({ name, onAccept, onDecline }) {
  const t = useT();
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onDecline(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDecline]);

  return (
    <div className={styles.root}>
      <div className={`${styles.catcher} ${styles.dim}`} />
      <div ref={ref} className={`${styles.tip} ${styles.centered} ${styles.prompt}`}
        style={{ width: Math.min(TIP_W + 20, window.innerWidth - 32) }}
        role="dialog" aria-modal="true" aria-labelledby="tour-prompt-title" tabIndex={-1}>
        <div className={styles.promptIcon}>🧭</div>
        <h3 id="tour-prompt-title" className={styles.title}>{t('tour.promptTitle', { name })}</h3>
        <p className={styles.body}>{t('tour.promptBody')}</p>
        <button type="button" className={`btn btn-primary ${styles.promptAccept}`} onClick={onAccept}>
          {t('tour.promptAccept')}
        </button>
        <button type="button" className={styles.decline} onClick={onDecline}>
          {t('tour.promptDecline')}
        </button>
      </div>
    </div>
  );
}
