import React, { useState } from 'react';
import useAppStore from '../../store/appStore.js';
import { useT } from '../../i18n/I18nProvider.jsx';
import styles from './SupportPage.module.css';

export default function SupportPage() {
  const { supportHandovers, resolveHandover, addHandover, merchantProfile } = useAppStore();
  const t = useT();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ customerName: '', reason: '', context: '' });

  const open     = supportHandovers.filter(h => !h.resolved);
  const resolved = supportHandovers.filter(h =>  h.resolved);

  function submit(e) {
    e.preventDefault();
    if (!form.customerName.trim()) return;
    addHandover(form);
    setForm({ customerName: '', reason: '', context: '' });
    setShowForm(false);
  }

  return (
    <div>
      <h1 className="page-title">{t('support.title')}</h1>
      <p className="page-sub">
        {t('support.sub')}
      </p>

      <div className={styles.toolbar}>
        <div className={styles.counts}>
          <span className={`badge ${open.length > 0 ? 'badge-red' : 'badge-green'}`}>{t('support.openCount', { n: open.length })}</span>
          <span className="badge badge-teal">{t('support.resolvedCount', { n: resolved.length })}</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? t('support.cancel') : t('support.manualHandover')}
        </button>
      </div>

      {showForm && (
        <form className={`card ${styles.form}`} onSubmit={submit}>
          <h3 className={styles.formTitle}>{t('support.createTitle')}</h3>
          <div className={styles.stack}>
            <label className={styles.label}>
              {t('support.customerName')} <input className={styles.input} required value={form.customerName}
                onChange={e => setForm({ ...form, customerName: e.target.value })} />
            </label>
            <label className={styles.label}>
              {t('support.reason')} <input className={styles.input} value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                placeholder={t('support.reasonPh')} />
            </label>
            <label className={styles.label}>
              {t('support.context')} <textarea className={`${styles.input} ${styles.textarea}`} rows={3}
                value={form.context}
                onChange={e => setForm({ ...form, context: e.target.value })}
                placeholder={t('support.contextPh')} />
            </label>
          </div>
          <button type="submit" className="btn btn-primary">{t('support.createBtn')}</button>
        </form>
      )}

      {open.length === 0 && (
        <div className={`card ${styles.allClear}`}>
          {t('support.allClear')}
        </div>
      )}

      {open.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: 4 }}>{t('support.openCases')}</h2>
          <div className={styles.list}>
            {open.map(h => (
              <HandoverCard key={h.id} handover={h} onResolve={resolveHandover} supportEmail={merchantProfile?.supportEmail} t={t} />
            ))}
          </div>
        </>
      )}

      {resolved.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: 28 }}>{t('support.resolvedHeading')}</h2>
          <div className={styles.list}>
            {resolved.map(h => (
              <div key={h.id} className={`card ${styles.resolvedCard}`}>
                <span className={styles.resolvedIcon}>✓</span>
                <div>
                  <div className={styles.resolvedName}>{h.customerName}</div>
                  <div className={styles.resolvedMeta}>{h.reason || t('support.noReason')} · {t('support.resolvedAt', { date: fmtDate(h.resolvedAt) })}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HandoverCard({ handover: h, onResolve, supportEmail, t }) {
  return (
    <div className={`card ${styles.openCard}`}>
      <div className={styles.openHeader}>
        <span className={styles.openIcon}>🎧</span>
        <div className={styles.openInfo}>
          <div className={styles.openName}>{h.customerName}</div>
          <div className={styles.openMeta}>{t('support.escalatedAt', { date: fmtDate(h.createdAt) })}</div>
        </div>
        <span className="badge badge-red">{t('support.openBadge')}</span>
      </div>

      {h.reason && (
        <div className={styles.openReason}><strong>{t('support.reasonInline')}</strong> {h.reason}</div>
      )}

      {h.context && (
        <div className={styles.openContext}>
          <div className={styles.contextLabel}>{t('support.contextForStaff')}</div>
          <div className={styles.contextText}>{h.context}</div>
        </div>
      )}

      <div className={styles.openActions}>
        {supportEmail && (
          <a href={`mailto:${supportEmail}?subject=${encodeURIComponent(t('support.emailSubject', { name: h.customerName }))}`}
            className="btn btn-ghost btn-sm">
            {t('support.emailSupport')}
          </a>
        )}
        <button className="btn btn-primary btn-sm" onClick={() => onResolve(h.id)}>
          {t('support.markResolved')}
        </button>
      </div>

      <p className={styles.pauseNote}>
        {t('support.pauseNote')}
      </p>
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
