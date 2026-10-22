import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../store/appStore.js';
import { useT } from '../../i18n/I18nProvider.jsx';
import styles from './BusinessOnboarding.module.css';

const GOAL_IDS = ['second_purchase', 'replenishment', 'reactivation', 'upsell'];

const DEMO_PRODUCTS = [
  { id: 'p1', name: 'House Blend — 250g', price: 12.90, category: 'Coffee', inStock: true },
  { id: 'p2', name: 'Dark Roast — 250g',  price: 13.50, category: 'Coffee', inStock: true },
  { id: 'p3', name: 'Office Snack Bundle', price: 28.00, category: 'Snacks', inStock: true },
];

const DEMO_CUSTOMERS = [
  { id: 'c1', name: 'Alicia Tan',  segment: 'returning_customer', lastOrder: '2026-09-10', orders: 3, mode: 'working' },
  { id: 'c2', name: 'Ben Ng',      segment: 'first_time',         lastOrder: '2026-10-01', orders: 1, mode: 'student' },
  { id: 'c3', name: 'Chloe Lim',  segment: 'inactive',            lastOrder: '2026-07-15', orders: 2, mode: 'working' },
];

const STEPS = ['profile', 'goal', 'catalogue', 'customers', 'settings'];

export default function BusinessOnboarding() {
  const [step, setStep]             = useState(0);
  const [merchantName, setName]     = useState('');
  const [supportEmail, setEmail]    = useState('');
  const [contactLimit, setLimit]    = useState(2);
  const [goal, setGoal]             = useState('');
  const [loadDemo, setLoadDemo]     = useState(true);
  const [approvalRoles, setApproval] = useState({ owner: true, marketer: false, support: false });

  const { setMerchantProfile, addProduct, addCustomer } = useAppStore();
  const t = useT();
  const lookup = (key, fallback) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const segLabel = (s) => lookup('customers.seg_' + s, s.replace(/_/g, ' '));
  const navigate = useNavigate();

  function finish() {
    setMerchantProfile({ name: merchantName, supportEmail, contactLimitPerDay: contactLimit, goal, approvalRoles });
    if (loadDemo) {
      DEMO_PRODUCTS.forEach(p => addProduct(p));
      DEMO_CUSTOMERS.forEach(c => addCustomer(c));
    }
    navigate('/business');
  }

  const titles = [t('bizOnboard.t_profile'), t('bizOnboard.t_goal'), t('bizOnboard.t_catalogue'), t('bizOnboard.t_customers'), t('bizOnboard.t_settings')];
  const canNext = [merchantName.trim().length > 0, goal.length > 0, true, true, true];

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>🛒 {t('bizOnboard.headerTitle')}</div>
          <div className={styles.progress}>
            {STEPS.map((_, i) => <div key={i} className={`${styles.dot} ${i <= step ? styles.dotOn : ''}`} />)}
          </div>
          <h1 className={styles.title}>{titles[step]}</h1>
          <p className={styles.stepLabel}>{t('bizOnboard.stepLabel', { n: step + 1, total: STEPS.length })}</p>
        </div>

        <div className={styles.body}>

          {/* Step 0 — profile */}
          {step === 0 && (
            <div className={styles.stack}>
              <label className={styles.label}>{t('bizOnboard.bizName')}
                <input className={styles.input} placeholder={t('bizOnboard.bizNamePh')}
                  value={merchantName} onChange={e => setName(e.target.value)} />
              </label>
              <label className={styles.label}>{t('bizOnboard.supportEmail')}
                <input className={styles.input} type="email" placeholder={t('bizOnboard.supportEmailPh')}
                  value={supportEmail} onChange={e => setEmail(e.target.value)} />
              </label>
              <p className={styles.subtle}>{t('bizOnboard.profileNote')}</p>
            </div>
          )}

          {/* Step 1 — goal */}
          {step === 1 && (
            <div className={styles.goalGrid}>
              {GOAL_IDS.map(id => (
                <button key={id} type="button"
                  className={`${styles.goalCard} ${goal === id ? styles.goalSelected : ''}`}
                  onClick={() => setGoal(id)}>
                  <div className={styles.goalLabel}>{t('bizOnboard.goal_' + id)}</div>
                  <div className={styles.goalDesc}>{t('bizOnboard.goal_' + id + '_desc')}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2 — catalogue */}
          {step === 2 && (
            <div className={styles.stack}>
              <p className={styles.bodyText}>{t('bizOnboard.catalogueNote')}</p>
              <div className={styles.demoTable}>
                {DEMO_PRODUCTS.map(p => (
                  <div key={p.id} className={styles.demoRow}>
                    <span className={styles.demoName}>{p.name}</span>
                    <span className={styles.demoCategory}>{p.category}</span>
                    <span className={styles.demoPrice}>${p.price.toFixed(2)}</span>
                    <span className="badge badge-green">{t('bizOnboard.inStock')}</span>
                  </div>
                ))}
              </div>
              <p className={styles.subtle}>{t('bizOnboard.catalogueSubtle')}</p>
            </div>
          )}

          {/* Step 3 — customers */}
          {step === 3 && (
            <div className={styles.stack}>
              <p className={styles.bodyText}>{t('bizOnboard.customersNote')}</p>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={loadDemo} onChange={e => setLoadDemo(e.target.checked)} />
                {t('bizOnboard.loadDemoLabel')}
              </label>
              <div className={styles.demoTable}>
                {DEMO_CUSTOMERS.map(c => (
                  <div key={c.id} className={styles.demoRow}>
                    <span className={styles.demoName}>{c.name}</span>
                    <span className={`badge ${c.segment === 'returning_customer' ? 'badge-green' : c.segment === 'first_time' ? 'badge-teal' : 'badge-amber'}`}>
                      {segLabel(c.segment)}
                    </span>
                    <span className={styles.demoCategory}>{c.mode === 'student' ? '🎓' : '💼'}</span>
                    <span className={styles.demoPrice}>{t(c.orders !== 1 ? 'bizOnboard.orders' : 'bizOnboard.order', { n: c.orders })}</span>
                  </div>
                ))}
              </div>
              <p className={styles.subtle}>{t('bizOnboard.customersSubtle')}</p>
            </div>
          )}

          {/* Step 4 — settings */}
          {step === 4 && (
            <div className={styles.stack}>
              <label className={styles.label}>{t('bizOnboard.maxContact')}
                <input className={styles.input} type="number" min="1" max="5"
                  value={contactLimit} onChange={e => setLimit(Number(e.target.value))} />
              </label>
              <div className={styles.label}>{t('bizOnboard.approvalRoles')}
                <div className={styles.checkStack}>
                  {Object.keys(approvalRoles).map(role => (
                    <label key={role} className={styles.checkLabel}>
                      <input type="checkbox" checked={approvalRoles[role]}
                        onChange={e => setApproval(r => ({ ...r, [role]: e.target.checked }))} />
                      {t('bizOnboard.roleCanApprove', { role: lookup('bizOnboard.role_' + role, role.charAt(0).toUpperCase() + role.slice(1)) })}
                    </label>
                  ))}
                </div>
              </div>
              <p className={styles.subtle}>{t('bizOnboard.settingsNote')}</p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step > 0
            ? <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>{t('bizOnboard.back')}</button>
            : <div />}
          {step < STEPS.length - 1
            ? <button className="btn btn-primary" disabled={!canNext[step]} onClick={() => setStep(s => s + 1)}>{t('bizOnboard.next')}</button>
            : <button className="btn btn-primary" onClick={finish}>{t('bizOnboard.openDashboard')}</button>}
        </div>
      </div>
    </div>
  );
}
