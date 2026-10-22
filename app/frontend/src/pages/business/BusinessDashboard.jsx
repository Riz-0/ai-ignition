import React from 'react';
import { Link } from 'react-router-dom';
import useAppStore from '../../store/appStore.js';
import { useT } from '../../i18n/I18nProvider.jsx';
import styles from './BusinessDashboard.module.css';

const SEG_BADGE = {
  first_time:          'badge-teal',
  returning_customer:  'badge-green',
  replenishment:       'badge-coral',
  inactive:            'badge-amber',
  unresolved_issue:    'badge-red',
  opted_out:           'badge-violet',
};

export default function BusinessDashboard() {
  const { merchantProfile, customers, journeys, catalogue, supportHandovers } = useAppStore();
  const t = useT();
  const lookup = (key, fallback) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const segLabel = (s) => lookup('customers.seg_' + s, s.replace(/_/g, ' '));
  const outLabel = (o) => lookup('journeys.out_' + o, o.replace(/_/g, ' '));
  const goalLabel = (g) => lookup('bizDash.goal_' + g, g.replace(/_/g, ' '));

  const activeJourneys = journeys.filter(j => j.status === 'active').length;
  const closedJourneys = journeys.filter(j => j.status === 'closed').length;
  const purchases      = journeys.filter(j => j.outcome === 'purchased').length;
  const openHandovers  = supportHandovers.filter(h => !h.resolved).length;
  const optOuts        = customers.filter(c => c.segment === 'opted_out').length;
  const convRate       = closedJourneys > 0 ? Math.round((purchases / closedJourneys) * 100) : 0;

  const segCounts = customers.reduce((acc, c) => {
    acc[c.segment] = (acc[c.segment] || 0) + 1;
    return acc;
  }, {});

  // Suggested action
  const suggestedAction = openHandovers > 0
    ? { icon: '🎧', text: t(openHandovers !== 1 ? 'bizDash.actionSupport' : 'bizDash.actionSupportOne', { n: openHandovers }), link: '/business/support', cta: t('bizDash.viewSupport') }
    : activeJourneys === 0 && customers.length > 0
    ? { icon: '🗺️', text: t('bizDash.actionNoJourneys'), link: '/business/journeys', cta: t('bizDash.startJourney') }
    : { icon: '✅', text: t('bizDash.actionAllClear'), link: null, cta: null };

  return (
    <div>
      <h1 className="page-title">{t('bizDash.overview', { name: merchantProfile?.name ?? t('bizDash.businessName') })}</h1>
      <p className="page-sub">
        {t('bizDash.goalLabel')} <strong>{merchantProfile?.goal ? goalLabel(merchantProfile.goal) : t('bizDash.notSet')}</strong>
        &nbsp;·&nbsp; {t('bizDash.contactLimit')} <strong>{merchantProfile?.contactLimitPerDay ?? 2}{t('bizDash.perDay')}</strong>
      </p>

      {/* Suggested action banner */}
      <div className={`card ${styles.actionBanner}`}>
        <span className={styles.actionIcon}>{suggestedAction.icon}</span>
        <div className={styles.actionText}>
          <p>{suggestedAction.text}</p>
          {suggestedAction.link && <Link to={suggestedAction.link} className={styles.actionCta}>{suggestedAction.cta}</Link>}
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className="card">
          <div className={styles.kpiVal}>{customers.length}</div>
          <div className={styles.kpiLabel}>{t('bizDash.kpiCustomers')}</div>
          <Link to="/business/customers" className={styles.kpiLink}>{t('bizDash.kpiView')}</Link>
        </div>
        <div className="card">
          <div className={styles.kpiVal}>{activeJourneys}</div>
          <div className={styles.kpiLabel}>{t('bizDash.kpiActiveJourneys')}</div>
          <Link to="/business/journeys" className={styles.kpiLink}>{t('bizDash.kpiView')}</Link>
        </div>
        <div className={`card ${purchases > 0 ? styles.kpiHighlight : ''}`}>
          <div className={styles.kpiVal}>{purchases}</div>
          <div className={styles.kpiLabel}>{t('bizDash.kpiRepeatOrders')}</div>
        </div>
        <div className="card">
          <div className={styles.kpiVal}>{convRate}%</div>
          <div className={styles.kpiLabel}>{t('bizDash.kpiConvRate')}</div>
          <p className={styles.kpiNote}>{t('bizDash.kpiEstimated')}</p>
        </div>
        <div className={`card ${openHandovers > 0 ? styles.kpiUrgent : ''}`}>
          <div className={styles.kpiVal}>{openHandovers}</div>
          <div className={styles.kpiLabel}>{t('bizDash.kpiOpenCases')}</div>
          <Link to="/business/support" className={styles.kpiLink}>{t('bizDash.kpiReview')}</Link>
        </div>
        <div className="card">
          <div className={styles.kpiVal}>{optOuts}</div>
          <div className={styles.kpiLabel}>{t('bizDash.kpiOptedOut')}</div>
          <p className={styles.kpiNote}>{t('bizDash.kpiExcluded')}</p>
        </div>
      </div>

      {/* Privacy reminder */}
      <div className={styles.privacyNote}>
        {t('bizDash.privacyNote')}
      </div>

      {/* Segment breakdown */}
      <h2 className="section-title" style={{ marginTop: 28 }}>{t('bizDash.segmentsHeading')}</h2>
      {customers.length === 0 ? (
        <div className={`card ${styles.empty}`}>{t('bizDash.segEmptyPre')}<Link to="/business/customers">{t('bizDash.segEmptyLink')}</Link>{t('bizDash.segEmptyPost')}</div>
      ) : (
        <div className={styles.segGrid}>
          {Object.entries(segCounts).map(([seg, count]) => (
            <div key={seg} className={`card ${styles.segCard}`}>
              <div className={styles.segCount}>{count}</div>
              <span className={`badge ${SEG_BADGE[seg] ?? 'badge-coral'}`}>{segLabel(seg)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent journeys */}
      <h2 className="section-title" style={{ marginTop: 28 }}>{t('bizDash.recentJourneys')}</h2>
      {journeys.length === 0 ? (
        <div className={`card ${styles.empty}`}>{t('bizDash.journeysEmptyPre')}<Link to="/business/journeys">{t('bizDash.journeysEmptyLink')}</Link>{t('bizDash.journeysEmptyPost')}</div>
      ) : (
        <div className={styles.journeyList}>
          {journeys.slice(0, 5).map(j => (
            <div key={j.id} className={`card ${styles.journeyRow}`}>
              <div>
                <div className={styles.journeyTitle}>{j.customerName ?? t('bizDash.customerFallback')} — {j.productName ?? t('bizDash.productFallback')}</div>
                {j.reason && <div className={styles.journeyReason}>{j.reason}</div>}
                <div className={styles.journeyMeta}>{t('journeys.eventsLabel', { n: j.events?.length ?? 0 })} · {fmtDate(j.createdAt)}</div>
              </div>
              <span className={`badge ${j.status === 'active' ? 'badge-green' : j.outcome === 'purchased' ? 'badge-teal' : 'badge-amber'}`}>
                {j.status === 'closed' ? (j.outcome ? outLabel(j.outcome) : t('journeys.status_closed')) : t('journeys.active')}
              </span>
            </div>
          ))}
          {journeys.length > 5 && <Link to="/business/journeys" className={styles.viewAll}>{t('bizDash.viewAll', { n: journeys.length })}</Link>}
        </div>
      )}

      <div className={styles.pilotNote}>
        <strong>{t('bizDash.pilotNoteStrong')}</strong>{t('bizDash.pilotNote')}
      </div>
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
