import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../store/appStore.js';
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
    student:  ['What best describes you?', 'Tell us about yourself', 'Your weekly budget', 'Set a savings goal', 'Notifications', 'Ready to go!'],
    working:  ['What best describes you?', 'Tell us about yourself', 'Your monthly plan', 'Set a savings goal', 'Notifications', 'Ready to go!'],
  };

  const stepTitles = titles[resolvedType] || titles.student;
  const totalSteps = STEPS.length;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>🛒 2am Shoppers</div>
          <div className={styles.progress}>
            {STEPS.map((_, i) => <div key={i} className={`${styles.dot} ${i <= step ? styles.dotOn : ''}`} />)}
          </div>
          <h1 className={styles.title}>{stepTitles[step]}</h1>
          <p className={styles.stepLabel}>Step {step + 1} of {totalSteps}</p>
        </div>

        <div className={styles.body}>

          {/* Step 0 — type picker */}
          {step === 0 && (
            <div className={styles.typeGrid}>
              <button className={`${styles.typeCard} ${resolvedType === 'student' ? styles.typeSelected : ''}`}
                onClick={() => pickType('student')}>
                <span className={styles.typeEmoji}>🎓</span>
                <div className={styles.typeLabel}>Student</div>
                <div className={styles.typeDesc}>Weekly allowance, goal pockets and budget-filtered picks.</div>
              </button>
              <button className={`${styles.typeCard} ${resolvedType === 'working' ? styles.typeSelected : ''}`}
                onClick={() => pickType('working')}>
                <span className={styles.typeEmoji}>💼</span>
                <div className={styles.typeLabel}>Working Adult</div>
                <div className={styles.typeDesc}>Monthly income plan, multiple savings goals and smart reminders.</div>
              </button>
            </div>
          )}

          {/* Step 1 — name + interests */}
          {step === 1 && (
            <div className={styles.stack}>
              <div className={styles.typeBadge}>{isStudent ? '🎓 Student' : '💼 Working Adult'}</div>
              <label className={styles.label}>
                Your name
                <input className={styles.input} placeholder="e.g. Alicia" value={name} onChange={e => setName(e.target.value)} />
              </label>
              <div className={styles.label}>
                What are you into? <span className={styles.hint}>(pick at least one)</span>
                <div className={styles.interestGrid}>
                  {INTERESTS.map(i => (
                    <button key={i} type="button"
                      className={`${styles.interestChip} ${interests.includes(i) ? styles.selected : ''}`}
                      onClick={() => toggleInterest(i)}>{i}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — budget / income */}
          {step === 2 && (
            <div className={styles.stack}>
              {isStudent ? (
                <>
                  <p className={styles.bodyText}>Tell us about your weekly allowance and what you need to keep aside. This stays on your device — we won't infer salary or income from your age.</p>
                  <label className={styles.label}>
                    Weekly allowance ($)
                    <div className={styles.inputPrefix}><span>$</span>
                      <input className={styles.input} type="number" min="0" placeholder="e.g. 80" value={allowance} onChange={e => setAllowance(e.target.value)} />
                    </div>
                  </label>
                  <label className={styles.label}>
                    Essential reserves per week (food, transport, school) ($)
                    <div className={styles.inputPrefix}><span>$</span>
                      <input className={styles.input} type="number" min="0" placeholder="e.g. 45" value={essentialStudent} onChange={e => setEssentialStudent(e.target.value)} />
                    </div>
                  </label>
                  <label className={styles.label}>
                    General shopping budget cap ($, optional)
                    <div className={styles.inputPrefix}><span>$</span>
                      <input className={styles.input} type="number" min="0" placeholder="e.g. 30" value={budget} onChange={e => setBudget(e.target.value)} />
                    </div>
                  </label>
                </>
              ) : (
                <>
                  <p className={styles.bodyText}>Tell us about your monthly income plan. This is a planning ledger — money stays in your own accounts.</p>
                  <label className={styles.label}>
                    Recorded monthly income ($)
                    <div className={styles.inputPrefix}><span>$</span>
                      <input className={styles.input} type="number" min="0" placeholder="e.g. 2400" value={income} onChange={e => setIncome(e.target.value)} />
                    </div>
                  </label>
                  <label className={styles.label}>
                    Essential reserves (bills, transport, subscriptions) ($)
                    <div className={styles.inputPrefix}><span>$</span>
                      <input className={styles.input} type="number" min="0" placeholder="e.g. 1500" value={essentialWorking} onChange={e => setEssentialWorking(e.target.value)} />
                    </div>
                  </label>
                  <label className={styles.label}>
                    Buffer ($)
                    <div className={styles.inputPrefix}><span>$</span>
                      <input className={styles.input} type="number" min="0" placeholder="e.g. 200" value={buffer} onChange={e => setBuffer(e.target.value)} />
                    </div>
                  </label>
                  <label className={styles.label}>
                    General shopping budget cap ($, optional)
                    <div className={styles.inputPrefix}><span>$</span>
                      <input className={styles.input} type="number" min="0" placeholder="e.g. 300" value={budget} onChange={e => setBudget(e.target.value)} />
                    </div>
                  </label>
                </>
              )}
              <p className={styles.subtle}>All values are user-entered planning estimates, not bank-verified balances.</p>
            </div>
          )}

          {/* Step 3 — savings goal */}
          {step === 3 && (
            <div className={styles.stack}>
              <p className={styles.bodyText}>Set up a savings allocation and create your first goal pocket. You can add more goals any time.</p>
              <label className={styles.label}>
                {isStudent ? 'Weekly savings allocation ($)' : 'Monthly savings allocation ($)'}
                <div className={styles.inputPrefix}><span>$</span>
                  <input className={styles.input} type="number" min="0" placeholder="e.g. 15" value={savingsAlloc} onChange={e => setSavingsAlloc(e.target.value)} />
                </div>
              </label>
              <label className={styles.label}>
                First goal name (optional)
                <input className={styles.input} placeholder="e.g. New shoes" value={firstGoalName} onChange={e => setFirstGoalName(e.target.value)} />
              </label>
              <label className={styles.label}>
                Target amount ($)
                <div className={styles.inputPrefix}><span>$</span>
                  <input className={styles.input} type="number" min="0" placeholder="e.g. 60" value={firstGoalTarget} onChange={e => setFirstGoalTarget(e.target.value)} />
                </div>
              </label>
              <p className={styles.subtle}>Recording a contribution does not transfer funds. Money stays in your existing account.</p>
            </div>
          )}

          {/* Step 4 — notifications */}
          {step === 4 && (
            <div className={styles.stack}>
              <label className={styles.label}>
                Notification frequency
                <select className={styles.input} value={notifFreq} onChange={e => setNotifFreq(e.target.value)}>
                  <option value="frequent">Frequent — keep me updated</option>
                  <option value="occasional">Occasional — only when relevant</option>
                  <option value="minimal">Minimal — important alerts only</option>
                </select>
              </label>
              <label className={styles.label}>
                Quiet hours — start
                <input className={styles.input} type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} />
              </label>
              <label className={styles.label}>
                Quiet hours — end
                <input className={styles.input} type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} />
              </label>
              <label className={styles.label}>
                {isStudent ? 'Allowance day reminder (day of month, optional)' : 'Payday reminder (day of month, optional)'}
                <input className={styles.input} type="number" min="1" max="31" placeholder="e.g. 25" value={paydayDate} onChange={e => setPaydayDate(e.target.value)} />
              </label>
              {isStudent && (
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={gamificationEnabled} onChange={e => setGamificationEnabled(e.target.checked)} />
                  Enable optional badges and missions (can be turned off any time)
                </label>
              )}
            </div>
          )}

          {/* Step 5 — review */}
          {step === 5 && (
            <div className={styles.review}>
              <div className={styles.reviewRow}><span>Mode</span><strong>{isStudent ? '🎓 Student' : '💼 Working Adult'}</strong></div>
              <div className={styles.reviewRow}><span>Name</span><strong>{name}</strong></div>
              <div className={styles.reviewRow}><span>Interests</span><strong>{interests.join(', ') || '—'}</strong></div>
              {isStudent
                ? <><div className={styles.reviewRow}><span>Weekly allowance</span><strong>{allowance ? `$${allowance}` : '—'}</strong></div>
                    <div className={styles.reviewRow}><span>Essentials reserve</span><strong>{essentialStudent ? `$${essentialStudent}` : '—'}</strong></div></>
                : <><div className={styles.reviewRow}><span>Monthly income</span><strong>{income ? `$${income}` : '—'}</strong></div>
                    <div className={styles.reviewRow}><span>Essentials reserve</span><strong>{essentialWorking ? `$${essentialWorking}` : '—'}</strong></div>
                    <div className={styles.reviewRow}><span>Buffer</span><strong>{buffer ? `$${buffer}` : '—'}</strong></div></>
              }
              <div className={styles.reviewRow}><span>Savings allocation</span><strong>{savingsAlloc ? `$${savingsAlloc}` : '—'}</strong></div>
              {firstGoalName && <div className={styles.reviewRow}><span>First goal</span><strong>{firstGoalName} — ${firstGoalTarget}</strong></div>}
              <div className={styles.reviewRow}><span>Notifications</span><strong>{notifFreq}</strong></div>
              <div className={styles.reviewRow}><span>Quiet hours</span><strong>{quietStart} – {quietEnd}</strong></div>
              <p className={styles.subtle} style={{ marginTop: 12 }}>You can change all of these in Settings at any time.</p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step > 0
            ? <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
            : <div />}
          {step === 0
            ? <div />
            : step < totalSteps - 1
              ? <button className="btn btn-primary" disabled={!canNext[step]} onClick={() => setStep(s => s + 1)}>Next →</button>
              : <button className="btn btn-primary" onClick={finish}>🛒 Start shopping</button>
          }
        </div>
      </div>
    </div>
  );
}
