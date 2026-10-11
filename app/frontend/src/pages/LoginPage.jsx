import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import useAppStore  from '../store/appStore.js';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login }                                        = useAuthStore();
  const { customerProfile, merchantProfile, setAppMode } = useAppStore();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const result = login(username, password);
      setLoading(false);

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Admin goes straight to mode select
      if (result.role === 'admin') {
        navigate('/');
        return;
      }

      // Returning users go to their last-used view
      if ((result.role === 'working' || result.role === 'merchant') && merchantProfile) {
        setAppMode('working');
        navigate('/business');
      } else if ((result.role === 'student' || result.role === 'customer') && customerProfile) {
        setAppMode('student');
        navigate('/customer');
      } else {
        navigate('/');
      }
    }, 400);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to="/" className={styles.logo}>🛒 2am Shoppers</Link>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.sub}>Sign in to continue</p>
        </div>

        {/* Admin hint */}
        <div className={styles.adminHint}>
          <span className={styles.adminIcon}>⚡</span>
          <span>Admin: username <strong>user</strong> · password <strong>password</strong></span>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Username
            <input
              className={styles.input}
              type="text"
              autoComplete="username"
              placeholder="e.g. user"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              required
            />
          </label>

          <label className={styles.label}>
            Password
            <div className={styles.passwordWrap}>
              <input
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                required
              />
              <button
                type="button"
                className={styles.togglePass}
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <div className={styles.footer}>
          <span>Don't have an account?</span>
          <Link to="/signup" className={styles.switchLink}>Create one</Link>
        </div>
      </div>
    </div>
  );
}
