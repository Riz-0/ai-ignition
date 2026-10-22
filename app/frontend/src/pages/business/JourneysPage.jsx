import React, { useState } from 'react';
import useAppStore from '../../store/appStore.js';
import { useT } from '../../i18n/I18nProvider.jsx';
import styles from './JourneysPage.module.css';

const TRIGGER_IDS = ['first_order', 'reminder_date', 'replenishment', 'inactivity'];

export default function JourneysPage() {
  const { customers, catalogue, journeys, addJourney, addJourneyEvent, closeJourney, addHandover } = useAppStore();
  const t = useT();
  // Humanise a snake_case value through the translated map, falling back to a readable string.
  const lookup = (key, fallback) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const segLabel = (s) => lookup('customers.seg_' + s, s.replace(/_/g, ' '));
  const trigLabel = (id) => lookup('journeys.trig_' + id, id.replace(/_/g, ' '));
  const trigDesc = (id) => lookup('journeys.trig_' + id + '_desc', '');
  const outLabel = (o) => lookup('journeys.out_' + o, o.replace(/_/g, ' '));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ customerId: '', productId: '', triggerId: '' });
  const [filter, setFilter]     = useState('all');

  const filtered = filter === 'all' ? journeys : journeys.filter(j => j.status === filter);

  function startJourney(e) {
    e.preventDefault();
    const customer = customers.find(c => c.id === form.customerId);
    const product  = catalogue.find(p => p.id === form.productId);
    if (!customer || !product) return;
    addJourney({
      customerId:   customer.id,
      customerName: customer.name,
      productId:    product.id,
      productName:  product.name,
      trigger:      form.triggerId,
      reason:       t('journeys.reasonText', { trigger: trigLabel(form.triggerId), segment: segLabel(customer.segment) }),
    });
    setForm({ customerId: '', productId: '', triggerId: '' });
    setShowForm(false);
  }

  function recordEvent(journeyId, type, note) {
    addJourneyEvent(journeyId, { type, note });
    if (type === 'support_needed') {
      const j = journeys.find(j => j.id === journeyId);
      addHandover({ journeyId, customerName: j?.customerName, reason: note || t('journeys.escalatedFallback') });
      closeJourney(journeyId, 'support_needed');
    } else if (['purchased', 'opted_out'].includes(type)) {
      closeJourney(journeyId, type);
    }
  }

  return (
    <div>
      <h1 className="page-title">{t('journeys.title')}</h1>
      <p className="page-sub">{t('journeys.sub')}</p>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {['all', 'active', 'closed'].map(f => (
            <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
              onClick={() => setFilter(f)}>
              {t('journeys.' + f)}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? t('journeys.cancel') : t('journeys.startJourney')}
        </button>
      </div>

      {showForm && (
        <form className={`card ${styles.form}`} onSubmit={startJourney}>
          <h3 className={styles.formTitle}>{t('journeys.startTitle')}</h3>
          <div className={styles.formGrid}>
            <label className={styles.label}>
              {t('journeys.customer')}
              <select className={styles.input} required value={form.customerId}
                onChange={e => setForm({ ...form, customerId: e.target.value })}>
                <option value="">{t('journeys.selectPh')}</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({segLabel(c.segment)})</option>)}
              </select>
            </label>
            <label className={styles.label}>
              {t('journeys.product')}
              <select className={styles.input} required value={form.productId}
                onChange={e => setForm({ ...form, productId: e.target.value })}>
                <option value="">{t('journeys.selectPh')}</option>
                {catalogue.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
              </select>
            </label>
            <label className={`${styles.label} ${styles.full}`}>
              {t('journeys.trigger')}
              <select className={styles.input} required value={form.triggerId}
                onChange={e => setForm({ ...form, triggerId: e.target.value })}>
                <option value="">{t('journeys.selectPh')}</option>
                {TRIGGER_IDS.map(id => <option key={id} value={id}>{trigLabel(id)}</option>)}
              </select>
            </label>
            {form.triggerId && (
              <p className={`${styles.triggerDesc} ${styles.full}`}>
                {trigDesc(form.triggerId)}
              </p>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={!form.customerId || !form.productId || !form.triggerId}>
            {t('journeys.startBtn')}
          </button>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className={`card ${styles.empty}`}>{filter !== 'all' ? t('journeys.emptyWithStatus', { status: t('journeys.' + filter) }) : t('journeys.emptyNone')}</div>
      ) : (
        <div className={styles.journeyList}>
          {filtered.map(j => (
            <JourneyCard key={j.id} journey={j} onEvent={recordEvent} t={t} trigLabel={trigLabel} outLabel={outLabel} />
          ))}
        </div>
      )}
    </div>
  );
}

function JourneyCard({ journey: j, onEvent, t, trigLabel, outLabel }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`card ${styles.jCard}`}>
      <div className={styles.jHeader} onClick={() => setExpanded(v => !v)}>
        <div>
          <div className={styles.jTitle}>{j.customerName} — {j.productName}</div>
          <div className={styles.jMeta}>{j.trigger ? trigLabel(j.trigger) : ''} · {t('journeys.eventsLabel', { n: j.events?.length ?? 0 })} · {fmtDate(j.createdAt)}</div>
          {j.reason && <div className={styles.jReason}>{t('journeys.reasonLabel')}{j.reason}</div>}
        </div>
        <div className={styles.jRight}>
          <span className={`badge ${j.status === 'active' ? 'badge-green' : j.outcome === 'purchased' ? 'badge-teal' : 'badge-amber'}`}>
            {j.status === 'closed' ? (j.outcome ? outLabel(j.outcome) : t('journeys.status_closed')) : t('journeys.active')}
          </span>
          <span className={styles.jToggle}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className={styles.jBody}>
          {j.events?.length > 0 && (
            <div className={styles.eventLog}>
              {j.events.map(ev => (
                <div key={ev.id} className={styles.eventRow}>
                  <span className={styles.eventTime}>{fmtTime(ev.ts)}</span>
                  <span className={styles.eventType}>{outLabel(ev.type)}</span>
                  {ev.note && <span className={styles.eventNote}>{ev.note}</span>}
                </div>
              ))}
            </div>
          )}

          {j.status === 'active' && (
            <div className={styles.jActions}>
              <p className={styles.jActLabel}>{t('journeys.recordResponse')}</p>
              <div className={styles.jBtns}>
                <button className="btn btn-primary btn-sm"  onClick={() => onEvent(j.id, 'purchased',       t('journeys.notePurchased'))}>{t('journeys.purchased')}</button>
                <button className="btn btn-ghost btn-sm"    onClick={() => onEvent(j.id, 'reminded_later',  t('journeys.noteRemindLater'))}>{t('journeys.remindLater')}</button>
                <button className="btn btn-ghost btn-sm"    onClick={() => onEvent(j.id, 'no_response',     t('journeys.noteNoResponse'))}>{t('journeys.noResponse')}</button>
                <button className="btn btn-danger btn-sm"   onClick={() => onEvent(j.id, 'support_needed',  t('journeys.noteEscalate'))}>{t('journeys.escalate')}</button>
                <button className="btn btn-ghost btn-sm"    onClick={() => onEvent(j.id, 'opted_out',       t('journeys.noteOptedOut'))}>{t('journeys.optedOut')}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''; }
function fmtTime(iso) { return iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''; }
