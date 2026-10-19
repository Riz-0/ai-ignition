import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import useAppStore  from '../store/appStore.js';
import { useT } from '../i18n/I18nProvider.jsx';
import { UIPrefsCluster } from '../components/UIPrefs.jsx';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login }                                          = useAuthStore();
  const { shopperProfile, merchantProfile, setAppMode }    = useAppStore();
  const t = useT();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(username, password);
      setLoading(false);
      if (!result.success) { setError(t('login.error')); return; }

      if (result.role === 'admin') { navigate('/'); return; }

      // Route returning users to their last view
      if (result.role === 'business' && merchantProfile) {
        setAppMode('business'); navigate('/business');
      } else if ((result.role === 'working') && shopperProfile?.userType === 'working') {
        setAppMode('working'); navigate('/customer');
      } else if ((result.role === 'student') && shopperProfile?.userType === 'student') {
        setAppMode('student'); navigate('/customer');
      } else {
        navigate('/');
      }
    }, 400);
  }

  return (
    <div className={styles.page}>
      <div className={styles.prefsBar}><UIPrefsCluster /></div>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to="/" className={styles.logo}>🛒 {t('common.appName')}</Link>
          <h1 className={styles.title}>{t('login.welcome')}</h1>
          <p className={styles.sub}>{t('login.sub')}</p>
        </div>

        <div className={styles.adminHint}>
          <span className={styles.adminIcon}>⚡</span>
          <span>{t('login.hint')}</span>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            {t('login.username')}
            <input className={styles.input} type="text" autoComplete="username"
              placeholder="e.g. user" value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }} required />
          </label>
          <label className={styles.label}>
            {t('login.password')}
            <div className={styles.passwordWrap}>
              <input className={styles.input} type={showPass ? 'text' : 'password'}
                autoComplete="current-password" placeholder="••••••••" value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }} required />
              <button type="button" className={styles.togglePass}
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </label>
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? t('login.signingIn') : t('login.submit')}
          </button>
        </form>

        <div className={styles.footer}>
          <span>{t('login.noAccount')}</span>
          <Link to="/signup" className={styles.switchLink}>{t('login.createOne')}</Link>
        </div>

        <div className={styles.downloadLink}>
          <Link to="/download">📱 {t('download.title')}</Link>
        </div>
      </div>
    </div>
  );
}
