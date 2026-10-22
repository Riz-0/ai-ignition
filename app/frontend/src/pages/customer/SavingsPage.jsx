import React, { useState } from 'react';
import useAppStore from '../../store/appStore.js';
import { useT } from '../../i18n/I18nProvider.jsx';
import styles from './SavingsPage.module.css';

const ICONS = ['🎯','👟','💻','✈️','📚','☕','🎮','💄','🎒','🏋️'];

export default function SavingsPage() {
  const {
    shopperProfile, savingsLedger, getActiveGoals,
    addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addLedgerEntry,
    getStudentBudget, getWorkingBudget,
  } = useAppStore();
  const t = useT();

  const isStudent = shopperProfile?.userType === 'student';
  const budget    = isStudent ? getStudentBudget() : getWorkingBudget();

  // Goals scoped to the logged-in account (keeps persona goals separate).
  const savingsGoals = getActiveGoals();

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
      <h1 className="page-title">{isStudent ? t('savings.saveTitle') : t('savings.savingsTitle')}</h1>
      <p className="page-sub">
        {isStudent ? t('savings.studentSub') : t('savings.workingSub')}
      </p>

      {/* Summary */}
      <div className={styles.summaryRow}>
        <div className="card">
          <div className={styles.sumVal}>${totalSaved.toFixed(2)}</div>
          <div className={styles.sumLabel}>{t('savings.totalRecorded')}</div>
        </div>
        <div className="card">
          <div className={styles.sumVal}>${totalTarget.toFixed(2)}</div>
          <div className={styles.sumLabel}>{t('savings.totalTarget')}</div>
        </div>
        <div className="card">
          <div className={styles.sumVal}>{savingsGoals.filter(g => g.status === 'active').length}</div>
          <div className={styles.sumLabel}>{t('savings.activeGoals')}</div>
        </div>
        {budget && (
          <div className="card">
            <div className={styles.sumVal}>${(budget.savings || 0)}</div>
            <div className={styles.sumLabel}>{isStudent ? t('savings.weeklyAlloc') : t('savings.monthlyAlloc')}</div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className={styles.disclaimer}>
        <span>ℹ️</span>
        <p>{t('savings.disclaimer')}</p>
      </div>

      {/* Add goal */}
      <div className={styles.toolbar}>
        <h2 className="section-title" style={{ margin: 0 }}>{t('savings.goalPockets')}</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? t('savings.cancel') : t('savings.newGoal')}
        </button>
      </div>

      {showForm && (
        <form className={`card ${styles.form}`} onSubmit={addGoal}>
          <h3 className={styles.formTitle}>{t('savings.createGoal')}</h3>
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
              {t('savings.goalName')}
              <input className={styles.finput} required placeholder={t('savings.goalNamePh')}
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </label>
            <label className={styles.flabel}>
              {t('savings.targetAmount')}
              <input className={styles.finput} type="number" min="1" required placeholder={t('savings.targetAmountPh')}
                value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} />
            </label>
            <label className={styles.flabel}>
              {isStudent ? t('savings.weeklyContribution') : t('savings.monthlyContribution')}
              <input className={styles.finput} type="number" min="0" placeholder={t('savings.contributionPh')}
                value={form.contributionAmount} onChange={e => setForm(f => ({ ...f, contributionAmount: e.target.value }))} />
            </label>
          </div>
          <button type="submit" className="btn btn-primary">{t('savings.createBtn')}</button>
        </form>
      )}

      {/* Goal list */}
      {savingsGoals.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <span>🎯</span>
          <p>{t('savings.emptyBody')}</p>
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
                      ${(goal.currentAmount || 0).toFixed(2)} {t('savings.ofRecorded', { target: goal.targetAmount })}
                      {weeksLeft && <span> · {isStudent ? t('savings.weeksToGo', { n: weeksLeft }) : t('savings.monthsToGo', { n: weeksLeft })}</span>}
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
                    {selectedGoal === goal.id ? t('savings.closeEntry') : t('savings.recordEntry')}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteSavingsGoal(goal.id)}>{t('savings.deleteBtn')}</button>
                </div>

                {/* Record entry panel */}
                {selectedGoal === goal.id && (
                  <div className={styles.entryPanel}>
                    <div className={styles.entryToggle}>
                      {['contribution', 'planned', 'withdrawal'].map(ty => (
                        <button key={ty} type="button"
                          className={`${styles.entryTypeBtn} ${entryType === ty ? styles.entryTypeActive : ''}`}
                          onClick={() => setEntryType(ty)}>
                          {t('savings.type' + ty.charAt(0).toUpperCase() + ty.slice(1))}
                        </button>
                      ))}
                    </div>
                    <div className={styles.entryRow}>
                      <input className={styles.finput} type="number" min="0.01" step="0.01"
                        placeholder={t('savings.amountPh')} value={entryAmount}
                        onChange={e => setEntryAmount(e.target.value)} />
                      <input className={styles.finput} placeholder={t('savings.notePh')}
                        value={entryNote} onChange={e => setEntryNote(e.target.value)} />
                      <button className="btn btn-primary btn-sm" onClick={() => recordEntry(goal.id)}>{t('savings.recordBtn')}</button>
                    </div>
                    <p className={styles.entryNote}>
                      {t('savings.entryNote')}
                    </p>
                  </div>
                )}

                {/* Recent entries */}
                {goalEntries.length > 0 && (
                  <div className={styles.ledger}>
                    {goalEntries.slice(-3).reverse().map(e => (
                      <div key={e.id} className={styles.ledgerRow}>
                        <span className={styles.ledgerType}>{t('savings.type' + (e.type || '').charAt(0).toUpperCase() + (e.type || '').slice(1))}</span>
                        <span className={`${styles.ledgerAmt} ${e.type === 'withdrawal' ? styles.ledgerNeg : styles.ledgerPos}`}>
                          {e.type === 'withdrawal' ? '−' : '+'} ${Number(e.amount).toFixed(2)}
                        </span>
                        <span className={styles.ledgerDate}>{e.date}</span>
                        {e.note && <span className={styles.ledgerNote}>{e.note}</span>}
                      </div>
                    ))}
                    {goalEntries.length > 3 && <p className={styles.ledgerMore}>{t('savings.moreEntries', { n: goalEntries.length - 3 })}</p>}
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
