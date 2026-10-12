import React from 'react';
import { Link } from 'react-router-dom';
import useAppStore from '../../store/appStore.js';
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
    ? { icon: '🎧', text: `${openHandovers} customer${openHandovers !== 1 ? 's' : ''} need support. Sales prompts are paused for them.`, link: '/business/support', cta: 'View support →' }
    : activeJourneys === 0 && customers.length > 0
    ? { icon: '🗺️', text: 'No active journeys. Start one for an eligible customer.', link: '/business/journeys', cta: 'Start a journey →' }
    : { icon: '✅', text: 'Everything is up to date.', link: null, cta: null };

  return (
    <div>
      <h1 className="page-title">{merchantProfile?.name ?? 'Business'} — Overview</h1>
      <p className="page-sub">
        Goal: <strong>{merchantProfile?.goal?.replace(/_/g, ' ') ?? 'Not set'}</strong>
        &nbsp;·&nbsp; Contact limit: <strong>{merchantProfile?.contactLimitPerDay ?? 2}/day</strong>
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
          <div className={styles.kpiLabel}>Customers</div>
          <Link to="/business/customers" className={styles.kpiLink}>View →</Link>
        </div>
        <div className="card">
          <div className={styles.kpiVal}>{activeJourneys}</div>
          <div className={styles.kpiLabel}>Active journeys</div>
          <Link to="/business/journeys" className={styles.kpiLink}>View →</Link>
        </div>
        <div className={`card ${purchases > 0 ? styles.kpiHighlight : ''}`}>
          <div className={styles.kpiVal}>{purchases}</div>
          <div className={styles.kpiLabel}>Confirmed repeat orders</div>
        </div>
        <div className="card">
          <div className={styles.kpiVal}>{convRate}%</div>
          <div className={styles.kpiLabel}>Conv-to-purchase rate</div>
          <p className={styles.kpiNote}>estimated</p>
        </div>
        <div className={`card ${openHandovers > 0 ? styles.kpiUrgent : ''}`}>
          <div className={styles.kpiVal}>{openHandovers}</div>
          <div className={styles.kpiLabel}>Open support cases</div>
          <Link to="/business/support" className={styles.kpiLink}>Review →</Link>
        </div>
        <div className="card">
          <div className={styles.kpiVal}>{optOuts}</div>
          <div className={styles.kpiLabel}>Opted out</div>
          <p className={styles.kpiNote}>excluded from outreach</p>
        </div>
      </div>

      {/* Privacy reminder */}
      <div className={styles.privacyNote}>
        🔒 Shoppers' private budgets, allowances and savings goals are never visible here. The app applies budget limits on the shopper side.
      </div>

      {/* Segment breakdown */}
      <h2 className="section-title" style={{ marginTop: 28 }}>Customer segments</h2>
      {customers.length === 0 ? (
        <div className={`card ${styles.empty}`}>No customers yet. Import records during onboarding or add them on the <Link to="/business/customers">Customers</Link> page.</div>
      ) : (
        <div className={styles.segGrid}>
          {Object.entries(segCounts).map(([seg, count]) => (
            <div key={seg} className={`card ${styles.segCard}`}>
              <div className={styles.segCount}>{count}</div>
              <span className={`badge ${SEG_BADGE[seg] ?? 'badge-coral'}`}>{seg.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent journeys */}
      <h2 className="section-title" style={{ marginTop: 28 }}>Recent journeys</h2>
      {journeys.length === 0 ? (
        <div className={`card ${styles.empty}`}>No journeys started yet. Go to <Link to="/business/journeys">Journeys</Link> to begin.</div>
      ) : (
        <div className={styles.journeyList}>
          {journeys.slice(0, 5).map(j => (
            <div key={j.id} className={`card ${styles.journeyRow}`}>
              <div>
                <div className={styles.journeyTitle}>{j.customerName ?? 'Customer'} — {j.productName ?? 'Product'}</div>
                {j.reason && <div className={styles.journeyReason}>{j.reason}</div>}
                <div className={styles.journeyMeta}>{j.events?.length ?? 0} events · {fmtDate(j.createdAt)}</div>
              </div>
              <span className={`badge ${j.status === 'active' ? 'badge-green' : j.outcome === 'purchased' ? 'badge-teal' : 'badge-amber'}`}>
                {j.status === 'closed' ? (j.outcome?.replace(/_/g, ' ') ?? 'closed') : j.status}
              </span>
            </div>
          ))}
          {journeys.length > 5 && <Link to="/business/journeys" className={styles.viewAll}>View all {journeys.length} journeys →</Link>}
        </div>
      )}

      <div className={styles.pilotNote}>
        <strong>Hackathon note:</strong> Sample data demonstrates the reporting process. These figures do not prove a real increase in retention or customer lifetime value. For a real pilot, compare eligible customers with a randomly assigned holdout group.
      </div>
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
