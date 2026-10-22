import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAppStore from '../../store/appStore.js';
import { useT, useI18n } from '../../i18n/I18nProvider.jsx';
import styles from './CustomerSettings.module.css';

const STUDENT_INTERESTS = ['Fashion', 'Coffee', 'Beauty', 'Stationery & Study', 'Electronics', 'Food & Snacks', 'Sports', 'Books'];
const WORKING_INTERESTS = ['Fashion', 'Coffee', 'Beauty', 'Workday Essentials', 'Electronics', 'Food & Snacks', 'Home & Living', 'Gadgets'];

export default function CustomerSettings() {
  const { shopperProfile, setShopperProfile, reset, theme, setTheme, startTour } = useAppStore();
  const t = useT();
  const { lang, setLang, languages } = useI18n();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:        shopperProfile?.name        ?? '',
    userType:    shopperProfile?.userType    ?? 'student',
    interests:   shopperProfile?.interests   ?? [],
    budget:      shopperProfile?.budget      ?? '',
    quietStart:  shopperProfile?.quietStart  ?? '22:00',
    quietEnd:    shopperProfile?.quietEnd    ?? '08:00',
    paydayDate:  shopperProfile?.paydayDate  ?? '',
    notifFreq:   shopperProfile?.notifFreq   ?? 'occasional',
  });
  const [saved, setSaved] = useState(false);

  const INTERESTS = form.userType === 'working' ? WORKING_INTERESTS : STUDENT_INTERESTS;
  const isStudent = form.userType === 'student';

  function toggleInterest(i) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(i) ? f.interests.filter(x => x !== i) : [...f.interests, i],
    }));
  }

  function switchType(t) {
    setForm(f => ({ ...f, userType: t, interests: [] }));
  }

  function save(e) {
    e.preventDefault();
    setShopperProfile({ ...form, budget: Number(form.budget) || null });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    if (window.confirm(t('settings.resetConfirm'))) {
      reset();
      navigate('/');
    }
  }

  return (
    <div>
      <h1 className="page-title">{t('settings.title')}</h1>
      <p className="page-sub">{t('settings.sub')}</p>

      {/* Appearance — language + theme */}
      <section className={styles.section}>
        <h2 className={styles.sectionHead}>{t('settings.appearance')}</h2>
        <label className={styles.label}>
          {t('settings.language')}
          <select className={styles.input} value={lang}
            onChange={e => setLang(e.target.value)}>
            {languages.map(l => <option key={l.code} value={l.code}>{l.native} — {l.label}</option>)}
          </select>
        </label>
        <p className={styles.subtle}>{t('settings.languageHint')}</p>
        <label className={styles.label} style={{ marginTop: 14 }}>
          {t('settings.theme')}
          <div className={styles.row}>
            <button type="button"
              className={`${styles.typeBtn} ${theme === 'dark' ? styles.typeBtnOn : ''}`}
              onClick={() => setTheme('dark')}>🌙 {t('settings.themeDark')}</button>
            <button type="button"
              className={`${styles.typeBtn} ${theme === 'light' ? styles.typeBtnOn : ''}`}
              onClick={() => setTheme('light')}>☀️ {t('settings.themeLight')}</button>
          </div>
        </label>
      </section>

      {/* Help & privacy — replay the coach-mark tour, read the data policy */}
      <section className={styles.section}>
        <h2 className={styles.sectionHead}>{t('settings.help')}</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={startTour}>
            🧭 {t('settings.replayTour')}
          </button>
          <Link to="/privacy" className="btn btn-ghost btn-sm">
            🔒 {t('settings.privacyLink')}
          </Link>
        </div>
        <p className={styles.subtle}>{t('settings.replayHint')}</p>
      </section>

      <form className={styles.form} onSubmit={save}>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>{t('settings.accountType')}</h2>
          <div className={styles.row}>
            <button
              type="button"
              className={`${styles.typeBtn} ${form.userType === 'student' ? styles.typeBtnOn : ''}`}
              onClick={() => switchType('student')}
            >
              🎓 {t('mode.student')}
            </button>
            <button
              type="button"
              className={`${styles.typeBtn} ${form.userType === 'working' ? styles.typeBtnOn : ''}`}
              onClick={() => switchType('working')}
            >
              💼 {t('mode.working')}
            </button>
          </div>
          <p className={styles.subtle}>{t('settings.budgetHint')}</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>{t('settings.profile')}</h2>
          <label className={styles.label}>
            {t('settings.name')}
            <input className={styles.input} value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </label>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>{t('settings.interests')}</h2>
          <div className={styles.interestGrid}>
            {INTERESTS.map(i => (
              <button key={i} type="button"
                className={`${styles.chip} ${form.interests.includes(i) ? styles.chipOn : ''}`}
                onClick={() => toggleInterest(i)}>
                {i}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>{t('settings.budget')}</h2>
          <label className={styles.label}>
            {t('settings.budgetLabel')}
            <input className={styles.input} type="number" min="0"
              placeholder={t('settings.budgetBlank')}
              value={form.budget}
              onChange={e => setForm({ ...form, budget: e.target.value })} />
          </label>
          <p className={styles.subtle}>{t('settings.budgetHint')}</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>{t('settings.notifications')}</h2>
          <label className={styles.label}>
            {t('settings.frequency')}
            <select className={styles.input} value={form.notifFreq}
              onChange={e => setForm({ ...form, notifFreq: e.target.value })}>
              <option value="frequent">{t('settings.frequent')}</option>
              <option value="occasional">{t('settings.occasional')}</option>
              <option value="minimal">{t('settings.minimal')}</option>
            </select>
          </label>
          <div className={styles.row}>
            <label className={styles.label}>
              {t('settings.quietStart')}
              <input className={styles.input} type="time" value={form.quietStart}
                onChange={e => setForm({ ...form, quietStart: e.target.value })} />
            </label>
            <label className={styles.label}>
              {t('settings.quietEnd')}
              <input className={styles.input} type="time" value={form.quietEnd}
                onChange={e => setForm({ ...form, quietEnd: e.target.value })} />
            </label>
          </div>
          <label className={styles.label}>
            {isStudent ? t('settings.allowanceReminder') : t('settings.paydayReminder')}
            <input className={styles.input} type="number" min="1" max="31"
              placeholder={t('settings.reminderPh')}
              value={form.paydayDate}
              onChange={e => setForm({ ...form, paydayDate: e.target.value })} />
          </label>
        </section>

        <div className={styles.actions}>
          <button type="submit" className="btn btn-primary">
            {saved ? t('common.saved') : t('common.saveChanges')}
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={handleReset}>
            {t('common.reset')}
          </button>
        </div>
      </form>
    </div>
  );
}
