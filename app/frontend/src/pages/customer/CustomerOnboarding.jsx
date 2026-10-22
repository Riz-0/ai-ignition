import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../store/appStore.js';
import { useT } from '../../i18n/I18nProvider.jsx';
import PrivacyBadge from '../../components/PrivacyBadge.jsx';
import styles from './CustomerOnboarding.module.css';

const STUDENT_INTERESTS  = ['Fashion', 'Coffee', 'Beauty', 'Stationery & Study', 'Electronics', 'Food & Snacks', 'Sports', 'Books'];
const WORKING_INTERESTS  = ['Fashion', 'Coffee', 'Beauty', 'Workday Essentials', 'Electronics', 'Food & Snacks', 'Home & Living', 'Gadgets'];

// Steps differ slightly between modes
const STUDENT_STEPS  = ['type', 'interests', 'budget', 'savings', 'notifications', 'review'];
const WORKING_STEPS  = ['type', 'interests', 'budget', 'savings', 'notifications', 'review'];

export default function CustomerOnboarding() {
  const [userType,   setUserType]   = useState(''); // set by the mode that navigated here
  const [step,       setStep]       = useState(0);
  const [name,       setName]       = useState('');
  const [interests,  setInterests]  = useState([]);

  // Budget
  const [budget,          setBudget]          = useState('');
  const [allowance,       setAllowance]       = useState('');
  const [essentialStudent,setEssentialStudent]= useState('');
  const [income,          setIncome]          = useState('');
  const [essentialWorking,setEssentialWorking]= useState('');
  const [buffer,          setBuffer]          = useState('');

  // Savings
  const [savingsAlloc, setSavingsAlloc] = useState('');
  const [firstGoalName, setFirstGoalName] = useState('');
  const [firstGoalTarget, setFirstGoalTarget] = useState('');

  // Notifications
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd,   setQuietEnd]   = useState('08:00');
  const [paydayDate, setPaydayDate] = useState('');
  const [notifFreq,  setNotifFreq]  = useState('occasional');
  const [gamificationEnabled, setGamificationEnabled] = useState(true);

  const { setShopperProfile, addSavingsGoal, appMode } = useAppStore();
  const t = useT();
  const intLabel = (i) => {
    const v = t('custOnboard.int_' + i);
    return v === 'custOnboard.int_' + i ? i : v;
  };
  const navigate = useNavigate();

  // Determine type from appMode if not yet set
  const resolvedType = userType || (appMode === 'working' ? 'working' : 'student');
  const isStudent = resolvedType === 'student';
  const INTERESTS = isStudent ? STUDENT_INTERESTS : WORKING_INTERESTS;
  const STEPS = isStudent ? STUDENT_STEPS : WORKING_STEPS;

  function toggleInterest(i) {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  function pickType(t) {
    setUserType(t);
    setInterests([]);
    setStep(1);
  }

  function finish() {
    const profile = {
      name, userType: resolvedType, interests,
      budget: Number(budget) || null,
      quietStart, quietEnd, paydayDate, notifFreq,
      ...(isStudent
        ? { allowance: Number(allowance) || 0, essentialReserveStudent: Number(essentialStudent) || 0, savingsAllocation: Number(savingsAlloc) || 0, gamificationEnabled }
        : { income: Number(income) || 0, essentialReserve: Number(essentialWorking) || 0, savingsAllocation: Number(savingsAlloc) || 0, buffer: Number(buffer) || 0 }
      ),
    };
    setShopperProfile(profile);
    if (firstGoalName.trim() && Number(firstGoalTarget) > 0) {
      addSavingsGoal({ name: firstGoalName.trim(), targetAmount: Number(firstGoalTarget), contributionAmount: Number(savingsAlloc) || 0, contributionFrequency: isStudent ? 'weekly' : 'monthly' });
    }
    navigate('/customer');
  }

  const canNext = {
    0: true,
    1: name.trim().length > 0 && interests.length > 0,
    2: true,
    3: true,
    4: true,
    5: true,
  };

  const titles = {
    student:  [t('custOnboard.titleType'), t('custOnboard.titleAbout'), t('custOnboard.titleWeeklyBudget'), t('custOnboard.titleSavings'), t('custOnboard.titleNotifications'), t('custOnboard.titleReady')],
    working:  [t('custOnboard.titleType'), t('custOnboard.titleAbout'), t('custOnboard.titleMonthlyPlan'), t('custOnboard.titleSavings'), t('custOnboard.titleNotifications'), t('custOnboard.titleReady')],
  };

  const stepTitles = titles[resolvedType] || titles.student;
  const totalSteps = STEPS.length;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>🛒 {t('custOnboard.headerTitle')}</div>
          <div className={styles.progress}>
            {STEPS.map((_, i) => <div key={i} className={`${styles.dot} ${i <= step ? styles.dotOn : ''}`} />)}
          </div>
          <h1 className={styles.title}>{stepTitles[step]}</h1>
          <p className={styles.stepLabel}>{t('custOnboard.stepLabel', { n: step + 1, total: totalSteps })}</p>
        </div>

        <div className={styles.body}>

          {/* Step 0 — type picker */}
          {step === 0 && (
            <div className={styles.typeGrid}>
              <button className={`${styles.typeCard} ${resolvedType === 'student' ? styles.typeSelected : ''}`}
                onClick={() => pickType('student')}>
                <span className={styles.typeEmoji}>🎓</span>
                <div className={styles.typeLabel}>{t('custOnboard.typeStudent')}</div>
                <div className={styles.typeDesc}>{t('custOnboard.typeStudentDesc')}</div>
              </button>
              <button className={`${styles.typeCard} ${resolvedType === 'working' ? styles.typeSelected : ''}`}
                onClick={() => pickType('working')}>
                <span className={styles.typeEmoji}>💼</span>
                <div className={styles.typeLabel}>{t('custOnboard.typeWorking')}</div>
                <div className={styles.typeDesc}>{t('custOnboard.typeWorkingDesc')}</div>
              </button>
            </div>
          )}

          {/* Step 1 — name + interests */}
          {step === 1 && (
            <div className={styles.stack}>
              <div className={styles.typeBadge}>{isStudent ? t('custOnboard.badgeStudent') : t('custOnboard.badgeWorking')}</div>
              <label className={styles.label}>
                {t('custOnboard.yourName')}
                <input className={styles.input} placeholder={t('custOnboard.yourNamePh')} value={name} onChange={e => setName(e.target.value)} />
              </label>
              <div className={styles.label}>
                {t('custOnboard.intoWhat')} <span className={styles.hint}>{t('custOnboard.pickOne')}</span>
                <div className={styles.interestGrid}>
                  {INTERESTS.map(i => (
                    <button key={i} type="button"
                      className={`${styles.interestChip} ${interests.includes(i) ? styles.selected : ''}`}
                      onClick={() => toggleInterest(i)}>{intLabel(i)}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — budget / income */}
          {step === 2 && (
            <div className={styles.stack}>
              <div><PrivacyBadge /></div>
              {isStudent ? (
                <>
                  <p className={styles.bodyText}>{t('custOnboard.studentBudgetNote')}</p>
                  <label className={styles.label}>
                    {t('custOnboard.weeklyAllowance')}
                    <div className={styles.inputPrefix}><span>$</span>
                      <input className={styles.input} type="number" min="0" placeholder={t('custOnboard.weeklyAllowancePh')} value={allowance} onChange={e => setAllowance(e.target.value)} />
                    </div>
                  </label>
                  <label className={styles.label}>
                    {t('custOnboard.essentialWeek')}
                    <div className={styles.inputPrefix}><span>$</span>
                      <input className={styles.input} type="number" min="0" placeholder={t('custOnboard.essentialWeekPh')} value={essentialStudent} onChange={e => setEssentialStudent(e.target.value)} />
                    </div>
                  </label>
                  <label className={styles.label}>
                    {t('custOnboard.shopCapStudent')}
                    <div className={styles.inputPrefix}><span>$</span>
                      <input className={styles.input} type="number" min="0" placeholder={t('custOnboard.shopCapStudentPh')} value={budget} onChange={e => setBudget(e.target.value)} />
                    </div>
                  </label>
                </>
              ) : (
                <>
                  <p className={styles.bodyText}>{t('custOnboard.workingBudgetNote')}</p>
                  <label className={styles.label}>
                    {t('custOnboard.monthlyIncome')}
                    <div className={styles.inputPrefix}><span>$</span>
                      <input className={styles.input} type="number" min="0" placeholder={t('custOnboard.monthlyIncomePh')} value={income} onChange={e => setIncome(e.target.value)} />
                    </div>
                  </label>
                  <label className={styles.label}>
                    {t('custOnboard.essentialMonth')}
                    <div className={styles.inputPrefix}><span>$</span>
                      <input className={styles.input} type="number" min="0" placeholder={t('custOnboard.essentialMonthPh')} value={essentialWorking} onChange={e => setEssentialWorking(e.target.value)} />
                    </div>
                  </label>
                  <label className={styles.label}>
                    {t('custOnboard.buffer')}
                    <div className={styles.inputPrefix}><span>$</span>
                      <input className={styles.input} type="number" min="0" placeholder={t('custOnboard.bufferPh')} value={buffer} onChange={e => setBuffer(e.target.value)} />
                    </div>
                  </label>
                  <label className={styles.label}>
                    {t('custOnboard.shopCapWorking')}
                    <div className={styles.inputPrefix}><span>$</span>
                      <input className={styles.input} type="number" min="0" placeholder={t('custOnboard.shopCapWorkingPh')} value={budget} onChange={e => setBudget(e.target.value)} />
                    </div>
                  </label>
                </>
              )}
              <p className={styles.subtle}>{t('custOnboard.budgetSubtle')}</p>
            </div>
          )}

          {/* Step 3 — savings goal */}
          {step === 3 && (
            <div className={styles.stack}>
              <p className={styles.bodyText}>{t('custOnboard.savingsNote')}</p>
              <label className={styles.label}>
                {isStudent ? t('custOnboard.weeklySavings') : t('custOnboard.monthlySavings')}
                <div className={styles.inputPrefix}><span>$</span>
                  <input className={styles.input} type="number" min="0" placeholder={t('custOnboard.savingsPh')} value={savingsAlloc} onChange={e => setSavingsAlloc(e.target.value)} />
                </div>
              </label>
              <label className={styles.label}>
                {t('custOnboard.firstGoalName')}
                <input className={styles.input} placeholder={t('custOnboard.firstGoalNamePh')} value={firstGoalName} onChange={e => setFirstGoalName(e.target.value)} />
              </label>
              <label className={styles.label}>
                {t('custOnboard.targetAmount')}
                <div className={styles.inputPrefix}><span>$</span>
                  <input className={styles.input} type="number" min="0" placeholder={t('custOnboard.targetAmountPh')} value={firstGoalTarget} onChange={e => setFirstGoalTarget(e.target.value)} />
                </div>
              </label>
              <p className={styles.subtle}>{t('custOnboard.savingsSubtle')}</p>
            </div>
          )}

          {/* Step 4 — notifications */}
          {step === 4 && (
            <div className={styles.stack}>
              <label className={styles.label}>
                {t('custOnboard.notifFreq')}
                <select className={styles.input} value={notifFreq} onChange={e => setNotifFreq(e.target.value)}>
                  <option value="frequent">{t('custOnboard.freqFrequent')}</option>
                  <option value="occasional">{t('custOnboard.freqOccasional')}</option>
                  <option value="minimal">{t('custOnboard.freqMinimal')}</option>
                </select>
              </label>
              <label className={styles.label}>
                {t('custOnboard.quietStart')}
                <input className={styles.input} type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} />
              </label>
              <label className={styles.label}>
                {t('custOnboard.quietEnd')}
                <input className={styles.input} type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} />
              </label>
              <label className={styles.label}>
                {isStudent ? t('custOnboard.allowanceReminder') : t('custOnboard.paydayReminder')}
                <input className={styles.input} type="number" min="1" max="31" placeholder={t('custOnboard.reminderPh')} value={paydayDate} onChange={e => setPaydayDate(e.target.value)} />
              </label>
              {isStudent && (
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={gamificationEnabled} onChange={e => setGamificationEnabled(e.target.checked)} />
                  {t('custOnboard.gamification')}
                </label>
              )}
            </div>
          )}

          {/* Step 5 — review */}
          {step === 5 && (
            <div className={styles.review}>
              <div className={styles.reviewRow}><span>{t('custOnboard.rMode')}</span><strong>{isStudent ? t('custOnboard.badgeStudent') : t('custOnboard.badgeWorking')}</strong></div>
              <div className={styles.reviewRow}><span>{t('custOnboard.rName')}</span><strong>{name}</strong></div>
              <div className={styles.reviewRow}><span>{t('custOnboard.rInterests')}</span><strong>{interests.map(intLabel).join(', ') || '—'}</strong></div>
              {isStudent
                ? <><div className={styles.reviewRow}><span>{t('custOnboard.rWeeklyAllowance')}</span><strong>{allowance ? `$${allowance}` : '—'}</strong></div>
                    <div className={styles.reviewRow}><span>{t('custOnboard.rEssentials')}</span><strong>{essentialStudent ? `$${essentialStudent}` : '—'}</strong></div></>
                : <><div className={styles.reviewRow}><span>{t('custOnboard.rMonthlyIncome')}</span><strong>{income ? `$${income}` : '—'}</strong></div>
                    <div className={styles.reviewRow}><span>{t('custOnboard.rEssentials')}</span><strong>{essentialWorking ? `$${essentialWorking}` : '—'}</strong></div>
                    <div className={styles.reviewRow}><span>{t('custOnboard.rBuffer')}</span><strong>{buffer ? `$${buffer}` : '—'}</strong></div></>
              }
              <div className={styles.reviewRow}><span>{t('custOnboard.rSavingsAlloc')}</span><strong>{savingsAlloc ? `$${savingsAlloc}` : '—'}</strong></div>
              {firstGoalName && <div className={styles.reviewRow}><span>{t('custOnboard.rFirstGoal')}</span><strong>{firstGoalName} — ${firstGoalTarget}</strong></div>}
              <div className={styles.reviewRow}><span>{t('custOnboard.rNotifications')}</span><strong>{notifFreq}</strong></div>
              <div className={styles.reviewRow}><span>{t('custOnboard.rQuietHours')}</span><strong>{quietStart} – {quietEnd}</strong></div>
              <p className={styles.subtle} style={{ marginTop: 12 }}>{t('custOnboard.reviewSubtle')}</p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step > 0
            ? <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>{t('custOnboard.back')}</button>
            : <div />}
          {step === 0
            ? <div />
            : step < totalSteps - 1
              ? <button className="btn btn-primary" disabled={!canNext[step]} onClick={() => setStep(s => s + 1)}>{t('custOnboard.next')}</button>
              : <button className="btn btn-primary" onClick={finish}>{t('custOnboard.startShopping')}</button>
          }
        </div>
      </div>
    </div>
  );
}
