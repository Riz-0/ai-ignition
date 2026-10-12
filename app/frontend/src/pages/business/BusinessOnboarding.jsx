import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../store/appStore.js';
import styles from './BusinessOnboarding.module.css';

const GOALS = [
  { id: 'second_purchase', label: 'Increase second purchases', desc: 'Turn first-time buyers into returning customers within 60 days.' },
  { id: 'replenishment',   label: 'Drive replenishment',       desc: 'Remind existing customers to reorder repeat-use products.' },
  { id: 'reactivation',   label: 'Reactivate inactive customers', desc: 'Re-engage customers with no new order beyond a chosen interval.' },
  { id: 'upsell',         label: 'Introduce complementary products', desc: 'Offer relevant additions to customers who already buy from you.' },
];

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
  const navigate = useNavigate();

  function finish() {
    setMerchantProfile({ name: merchantName, supportEmail, contactLimitPerDay: contactLimit, goal, approvalRoles });
    if (loadDemo) {
      DEMO_PRODUCTS.forEach(p => addProduct(p));
      DEMO_CUSTOMERS.forEach(c => addCustomer(c));
    }
    navigate('/business');
  }

  const titles = ['Your business profile', 'Engagement goal', 'Product catalogue', 'Import customers', 'Permissions & limits'];
  const canNext = [merchantName.trim().length > 0, goal.length > 0, true, true, true];

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>🛒 2am Shoppers — Business</div>
          <div className={styles.progress}>
            {STEPS.map((_, i) => <div key={i} className={`${styles.dot} ${i <= step ? styles.dotOn : ''}`} />)}
          </div>
          <h1 className={styles.title}>{titles[step]}</h1>
          <p className={styles.stepLabel}>Step {step + 1} of {STEPS.length}</p>
        </div>

        <div className={styles.body}>

          {/* Step 0 — profile */}
          {step === 0 && (
            <div className={styles.stack}>
              <label className={styles.label}>Business / shop name *
                <input className={styles.input} placeholder="e.g. Brew & Bites"
                  value={merchantName} onChange={e => setName(e.target.value)} />
              </label>
              <label className={styles.label}>Support email (for customer handovers)
                <input className={styles.input} type="email" placeholder="support@yourshop.com"
                  value={supportEmail} onChange={e => setEmail(e.target.value)} />
              </label>
              <p className={styles.subtle}>Customer records remain scoped to your business. Other merchants do not receive your customer data. Personal shopper budgets and goal balances are never visible here.</p>
            </div>
          )}

          {/* Step 1 — goal */}
          {step === 1 && (
            <div className={styles.goalGrid}>
              {GOALS.map(g => (
                <button key={g.id} type="button"
                  className={`${styles.goalCard} ${goal === g.id ? styles.goalSelected : ''}`}
                  onClick={() => setGoal(g.id)}>
                  <div className={styles.goalLabel}>{g.label}</div>
                  <div className={styles.goalDesc}>{g.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2 — catalogue */}
          {step === 2 && (
            <div className={styles.stack}>
              <p className={styles.bodyText}>In the full build you import your live product catalogue. For the hackathon demo, sample products are pre-loaded. Product claims must come from verified catalogue data.</p>
              <div className={styles.demoTable}>
                {DEMO_PRODUCTS.map(p => (
                  <div key={p.id} className={styles.demoRow}>
                    <span className={styles.demoName}>{p.name}</span>
                    <span className={styles.demoCategory}>{p.category}</span>
                    <span className={styles.demoPrice}>${p.price.toFixed(2)}</span>
                    <span className="badge badge-green">In stock</span>
                  </div>
                ))}
              </div>
              <p className={styles.subtle}>All prices and stock shown here are illustrative sample data.</p>
            </div>
          )}

          {/* Step 3 — customers */}
          {step === 3 && (
            <div className={styles.stack}>
              <p className={styles.bodyText}>Import existing customer records with appropriate consent. Demo customers are available to show student and working adult wording variants in journeys.</p>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={loadDemo} onChange={e => setLoadDemo(e.target.checked)} />
                Load demo customers (Alicia · Ben · Chloe) and catalogue
              </label>
              <div className={styles.demoTable}>
                {DEMO_CUSTOMERS.map(c => (
                  <div key={c.id} className={styles.demoRow}>
                    <span className={styles.demoName}>{c.name}</span>
                    <span className={`badge ${c.segment === 'returning_customer' ? 'badge-green' : c.segment === 'first_time' ? 'badge-teal' : 'badge-amber'}`}>
                      {c.segment.replace(/_/g, ' ')}
                    </span>
                    <span className={styles.demoCategory}>{c.mode === 'student' ? '🎓' : '💼'}</span>
                    <span className={styles.demoPrice}>{c.orders} order{c.orders !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
              <p className={styles.subtle}>Match records only using authorised identifiers. Do not assume accounts on different marketplaces belong to the same person.</p>
            </div>
          )}

          {/* Step 4 — settings */}
          {step === 4 && (
            <div className={styles.stack}>
              <label className={styles.label}>Max contact attempts per customer per day
                <input className={styles.input} type="number" min="1" max="5"
                  value={contactLimit} onChange={e => setLimit(Number(e.target.value))} />
              </label>
              <div className={styles.label}>Campaign approval roles
                <div className={styles.checkStack}>
                  {Object.keys(approvalRoles).map(role => (
                    <label key={role} className={styles.checkLabel}>
                      <input type="checkbox" checked={approvalRoles[role]}
                        onChange={e => setApproval(r => ({ ...r, [role]: e.target.checked }))} />
                      {role.charAt(0).toUpperCase() + role.slice(1)} can approve campaigns
                    </label>
                  ))}
                </div>
              </div>
              <p className={styles.subtle}>New paid campaigns, spending changes and discounts outside merchant-approved rules require business approval before activation.</p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step > 0
            ? <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
            : <div />}
          {step < STEPS.length - 1
            ? <button className="btn btn-primary" disabled={!canNext[step]} onClick={() => setStep(s => s + 1)}>Next →</button>
            : <button className="btn btn-primary" onClick={finish}>💼 Open dashboard</button>}
        </div>
      </div>
    </div>
  );
}
