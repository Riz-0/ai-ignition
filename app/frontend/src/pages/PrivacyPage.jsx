import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n/I18nProvider.jsx';
import styles from './PrivacyPage.module.css';

/**
 * "How we handle your data" — public so onboarding, Settings and the
 * Privacy First badge can all link here. Keep these claims in sync with
 * what the app actually does (see appStore persistence + backend routes/assistant.js).
 */
const SECTIONS = [
  { icon: '📱', key: 'device' },
  { icon: '💬', key: 'assistant' },
  { icon: '🏪', key: 'merchants' },
  { icon: '🔗', key: 'links' },
  { icon: '🧹', key: 'control' },
];

export default function PrivacyPage() {
  const t = useT();
  const navigate = useNavigate();

  function goBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <button type="button" className={styles.back} onClick={goBack}>← {t('privacy.back')}</button>

        <div className={styles.hero}>
          <span className={styles.heroIcon}>🔒</span>
          <h1 className={styles.title}>{t('privacy.pageTitle')}</h1>
          <p className={styles.sub}>{t('privacy.pageSub')}</p>
        </div>

        <div className={styles.list}>
          {SECTIONS.map(({ icon, key }) => (
            <section key={key} className={styles.card}>
              <span className={styles.icon}>{icon}</span>
              <div>
                <h2 className={styles.cardTitle}>{t(`privacy.${key}Title`)}</h2>
                <p className={styles.cardBody}>{t(`privacy.${key}Body`)}</p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
