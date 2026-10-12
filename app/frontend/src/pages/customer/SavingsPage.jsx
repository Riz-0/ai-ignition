import React, { useState } from 'react';
import useAppStore from '../../store/appStore.js';
import styles from './SavingsPage.module.css';

const ICONS = ['🎯','👟','💻','✈️','📚','☕','🎮','💄','🎒','🏋️'];

export default function SavingsPage() {
  const {
    shopperProfile, savingsGoals, savingsLedger,
    addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addLedgerEntry,
    getStudentBudget, getWorkingBudget,
  } = useAppStore();

  const isStudent = shopperProfile?.userType === 'student';
  const budget    = isStudent ? getStudentBudget() : getWorkingBudget();

  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState({ name: '', icon: '🎯', targetAmount: '', contributionAmount: '', contributionFrequency: isStudent ? 'weekly' : 'monthly' });
  const [selectedGoal, setSelected] = useState(null);
  const [entryAmount, setEntryAmount] = useState('');
  const [entryNote, setEntryNote]     = useState('');
  const [entryType, setEntryType]     = useState('contribution');

  function addGoal(e) {
    e.preventDefault();
    if (!form.name.trim() || !Number(form.targetAmount)) return;
    addSavingsGoal({ ...form, targetAmount: Number(form.targetAmount), contributionAmount: Number(form.contributionAmount) || 0 });
    setForm({ name: '', icon: '🎯', targetAmount: '', contributionAmount: '', contributionFrequency: isStudent ? 'weekly' : 'monthly' });
    setShowForm(false);
  }

  function recordEntry(goalId) {
    const amt = Number(entryAmount);
    if (!amt || amt <= 0) return;
    addLedgerEntry({ goalId, type: entryType, amount: amt, note: entryNote });
    // Update goal currentAmount
    const goal = savingsGoals.find(g => g.id === goalId);
    if (goal) {
      const delta = entryType === 'withdrawal' ? -amt : amt;
      updateSavingsGoal(goalId, { currentAmount: Math.max(0, (goal.currentAmount || 0) + delta) });
    }
    setEntryAmount('');
    setEntryNote('');
    setSelected(null);
  }

  const totalSaved = savingsGoals.reduce((s, g) => s + (g.currentAmount || 0), 0);
  const totalTarget = savingsGoals.reduce((s, g) => s + (g.targetAmount || 0), 0);

  return (
    <div>
      <h1 className="page-title">{isStudent ? 'Save' : 'Savings Goals'}</h1>
      <p className="page-sub">
        {isStudent
          ? 'Goal pockets, contribution plans and progress toward what matters to you.'
          : 'Multiple goals, planned contributions, projected completion and editable allocations.'}
      </p>

      {/* Summary */}
      <div className={styles.summaryRow}>
        <div className="card">
          <div className={styles.sumVal}>${totalSaved.toFixed(2)}</div>
          <div className={styles.sumLabel}>Total recorded</div>
        </div>
        <div className="card">
          <div className={styles.sumVal}>${totalTarget.toFixed(2)}</div>
          <div className={styles.sumLabel}>Total target</div>
        </div>
        <div className="card">
          <div className={styles.sumVal}>{savingsGoals.filter(g => g.status === 'active').length}</div>
          <div className={styles.sumLabel}>Active goals</div>
        </div>
        {budget && (
          <div className="card">
            <div className={styles.sumVal}>${(budget.savings || 0)}</div>
            <div className={styles.sumLabel}>{isStudent ? 'Weekly' : 'Monthly'} allocation</div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className={styles.disclaimer}>
        <span>ℹ️</span>
        <p>This is a planning and tracking ledger. Recording a contribution does not transfer funds. Money stays in your existing account. Forecast progress is a projection, not a guaranteed outcome.</p>
      </div>

      {/* Add goal */}
      <div className={styles.toolbar}>
        <h2 className="section-title" style={{ margin: 0 }}>Goal pockets</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ Cancel' : '+ New goal'}
        </button>
      </div>

      {showForm && (
        <form className={`card ${styles.form}`} onSubmit={addGoal}>
          <h3 className={styles.formTitle}>Create a goal pocket</h3>
          <div className={styles.iconRow}>
            {ICONS.map(ic => (
              <button key={ic} type="button"
                className={`${styles.iconBtn} ${form.icon === ic ? styles.iconActive : ''}`}
                onClick={() => setForm(f => ({ ...f, icon: ic }))}>
                {ic}
              </button>
            ))}
          </div>
          <div className={styles.formGrid}>
            <label className={styles.flabel}>
              Goal name *
              <input className={styles.finput} required placeholder="e.g. New shoes"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </label>
            <label className={styles.flabel}>
              Target amount ($) *
              <input className={styles.finput} type="number" min="1" required placeholder="e.g. 60"
                value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} />
            </label>
            <label className={styles.flabel}>
              {isStudent ? 'Weekly' : 'Monthly'} contribution ($)
              <input className={styles.finput} type="number" min="0" placeholder="e.g. 10"
                value={form.contributionAmount} onChange={e => setForm(f => ({ ...f, contributionAmount: e.target.value }))} />
            </label>
          </div>
          <button type="submit" className="btn btn-primary">Create goal pocket</button>
        </form>
      )}

      {/* Goal list */}
      {savingsGoals.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <span>🎯</span>
          <p>No goals yet. Create your first goal pocket above.</p>
        </div>
      ) : (
        <div className={styles.goalList}>
          {savingsGoals.map(goal => {
            const pct = goal.targetAmount ? Math.min(100, Math.round(((goal.currentAmount || 0) / goal.targetAmount) * 100)) : 0;
            const remaining = Math.max(0, goal.targetAmount - (goal.currentAmount || 0));
            const weeksLeft = goal.contributionAmount > 0 ? Math.ceil(remaining / goal.contributionAmount) : null;
            const goalEntries = savingsLedger.filter(e => e.goalId === goal.id);

            return (
              <div key={goal.id} className={`card ${styles.goalCard}`}>
                <div className={styles.goalHeader}>
                  <span className={styles.goalIcon}>{goal.icon}</span>
                  <div className={styles.goalInfo}>
                    <div className={styles.goalName}>{goal.name}</div>
                    <div className={styles.goalMeta}>
                      ${(goal.currentAmount || 0).toFixed(2)} of ${goal.targetAmount} recorded
                      {weeksLeft && <span> · ~{weeksLeft} {isStudent ? 'week' : 'month'}{weeksLeft !== 1 ? 's' : ''} to go</span>}
                    </div>
                  </div>
                  <div className={styles.goalPct}>{pct}%</div>
                </div>

                {/* Progress bar */}
                <div className={styles.progressTrack}>
                  <div className={styles.progressBar} style={{ width: `${pct}%` }} />
                </div>

                {/* Actions */}
                <div className={styles.goalActions}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(selectedGoal === goal.id ? null : goal.id)}>
                    {selectedGoal === goal.id ? '✕ Close' : '+ Record entry'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteSavingsGoal(goal.id)}>Delete</button>
                </div>

                {/* Record entry panel */}
                {selectedGoal === goal.id && (
                  <div className={styles.entryPanel}>
                    <div className={styles.entryToggle}>
                      {['contribution', 'planned', 'withdrawal'].map(t => (
                        <button key={t} type="button"
                          className={`${styles.entryTypeBtn} ${entryType === t ? styles.entryTypeActive : ''}`}
                          onClick={() => setEntryType(t)}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className={styles.entryRow}>
                      <input className={styles.finput} type="number" min="0.01" step="0.01"
                        placeholder="Amount ($)" value={entryAmount}
                        onChange={e => setEntryAmount(e.target.value)} />
                      <input className={styles.finput} placeholder="Note (optional)"
                        value={entryNote} onChange={e => setEntryNote(e.target.value)} />
                      <button className="btn btn-primary btn-sm" onClick={() => recordEntry(goal.id)}>Record</button>
                    </div>
                    <p className={styles.entryNote}>
                      Planned contributions remain separate from completed ones. Recording does not move money.
                    </p>
                  </div>
                )}

                {/* Recent entries */}
                {goalEntries.length > 0 && (
                  <div className={styles.ledger}>
                    {goalEntries.slice(-3).reverse().map(e => (
                      <div key={e.id} className={styles.ledgerRow}>
                        <span className={styles.ledgerType}>{e.type}</span>
                        <span className={`${styles.ledgerAmt} ${e.type === 'withdrawal' ? styles.ledgerNeg : styles.ledgerPos}`}>
                          {e.type === 'withdrawal' ? '−' : '+'} ${Number(e.amount).toFixed(2)}
                        </span>
                        <span className={styles.ledgerDate}>{e.date}</span>
                        {e.note && <span className={styles.ledgerNote}>{e.note}</span>}
                      </div>
                    ))}
                    {goalEntries.length > 3 && <p className={styles.ledgerMore}>+{goalEntries.length - 3} more entries</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
