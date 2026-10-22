import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import useAppStore  from '../store/appStore.js';
import { useT } from '../i18n/I18nProvider.jsx';
import { UIPrefsCluster } from '../components/UIPrefs.jsx';
import styles from './AuthPage.module.css';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [role,     setRole]     = useState('student');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const { signup } = useAuthStore();
  const { setActiveAccount, setAppMode } = useAppStore();
  const t = useT();
  const navigate   = useNavigate();

  const ROLE_META = {
    student:  { label: `🎓 ${t('mode.student')}`,  desc: t('mode.studentDesc') },
    working:  { label: `💼 ${t('mode.working')}`,  desc: t('mode.workingDesc') },
  };

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('login.error')); // reuse generic credentials error for the mismatch case
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const result = signup(username, email, password, role);
      setLoading(false);
      if (!result.success) {
        // Map common backend messages to the translated credentials error.
        setError(t('login.error'));
        return;
      }
      // Tie the new account to the profile it is about to create in onboarding
      setActiveAccount(result.accountId);
      // Set the mode so onboarding pre-selects the right type
      setAppMode(role);
      navigate('/customer/onboarding');
    }, 400);
  }

  return (
    <div className={styles.page}>
      <div className={styles.prefsBar}><UIPrefsCluster /></div>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.brandRow}>
            <span className={styles.brandIcon}>🛒</span>
            <span className={styles.brandName}>{t('common.appName')}</span>
          </div>
          <h1 className={styles.title}>{t('signup.title')}</h1>
          <p className={styles.sub}>{t('signup.sub')}</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>

          {/* Shopper type toggle (merchant accounts aren't self-serve) */}
          <div className={styles.roleToggle}>
            {Object.entries(ROLE_META).map(([key, meta]) => (
              <button key={key} type="button"
                className={`${styles.roleBtn} ${role === key ? styles.roleActive : ''}`}
                onClick={() => setRole(key)}>
                {meta.label}
              </button>
            ))}
          </div>
          <p className={styles.roleDesc}>{ROLE_META[role].desc}</p>

          <label className={styles.label}>
            {t('login.username')}
            <input className={styles.input} type="text" autoComplete="username"
              placeholder={t('authExtra.chooseUsername')} value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }} required />
          </label>
          <label className={styles.label}>
            {t('signup.email')}
            <input className={styles.input} type="email" autoComplete="email"
              placeholder={t('authExtra.emailPh')} value={email}
              onChange={e => setEmail(e.target.value)} />
          </label>
          <label className={styles.label}>
            {t('login.password')}
            <div className={styles.passwordWrap}>
              <input className={styles.input} type={showPass ? 'text' : 'password'}
                autoComplete="new-password" placeholder={t('authExtra.minChars')} value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }} required />
              <button type="button" className={styles.togglePass}
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? t('authExtra.hidePassword') : t('authExtra.showPassword')}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </label>
          <label className={styles.label}>
            {t('signup.confirm')}
            <input className={styles.input} type={showPass ? 'text' : 'password'}
              autoComplete="new-password" placeholder={t('authExtra.repeatPassword')} value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(''); }} required />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? '…' : t('signup.submit')}
          </button>
        </form>

        <div className={styles.footer}>
          <span>{t('signup.haveAccount')}</span>
          <Link to="/login" className={styles.switchLink}>{t('common.signIn')}</Link>
        </div>

        <div className={styles.downloadLink}>
          <Link to="/download">📱 {t('download.title')}</Link>
        </div>
      </div>
    </div>
  );
}
