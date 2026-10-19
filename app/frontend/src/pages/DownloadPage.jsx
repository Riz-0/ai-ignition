import React from 'react';
import { Link } from 'react-router-dom';
import QRCode from '../components/QRCode.jsx';
import { usePwaInstall } from '../hooks/usePwaInstall.js';
import { useT } from '../i18n/I18nProvider.jsx';
import styles from './DownloadPage.module.css';

/**
 * /download — the install landing page.
 *
 * This is the page the QR code resolves to. On a phone it shows the
 * platform-specific "Add to Home Screen" steps; on a desktop browser
 * that supports the install prompt, the primary button triggers it.
 * A second QR lets a visitor share the app onward from their phone.
 */
export default function DownloadPage() {
  const t = useT();
  const { canInstall, promptInstall, installed } = usePwaInstall();

  // The URL this page is served at — encode it in the QR so a phone
  // camera can open the same install page.
  const shareUrl =
    (typeof window !== 'undefined' && window.location?.href) ||
    'http://localhost:3003/download';

  async function handleInstall() {
    const choice = await promptInstall();
    // outcome is 'accepted' | 'dismissed' | 'unavailable'
    // The install event listener in usePwaInstall updates `installed`.
    return choice;
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <span className={styles.badge}>🛒 {t('common.appName')}</span>
        <h1 className={styles.title}>
          {t('download.title')}
        </h1>
        <p className={styles.sub}>{t('download.sub')}</p>
      </div>

      {/* Scan-to-install card */}
      <div className={styles.qrCard}>
        <div className={styles.qrLabel}>{t('download.scan')}</div>
        <QRCode value={shareUrl} size={200} alt="Scan to open the install page" />
        <div className={styles.qrUrl}>{shareUrl}</div>

        {installed ? (
          <div className={styles.installed}>✓ {t('download.installed')}</div>
        ) : canInstall ? (
          <button className={styles.installBtn} onClick={handleInstall}>
            ⬇ {t('common.install')} {t('common.appName')}
          </button>
        ) : (
          <p style={{ fontSize: '.78rem', color: 'var(--text-dim)', marginTop: 14 }}>
            {/* If the browser doesn't expose an install button, the steps below still work via the browser menu. */}
            {t('download.ios1')} / {t('download.android1')}
          </p>
        )}
      </div>

      {/* Platform-specific steps */}
      <div className={styles.steps}>
        <div className={styles.stepCard}>
          <div className={styles.stepIcon}>🍎</div>
          <div className={styles.stepTitle}>{t('download.iosTitle')}</div>
          <ol className={styles.stepList}>
            <li>{t('download.ios1')}</li>
            <li>{t('download.ios2')}</li>
            <li>{t('download.ios3')}</li>
            <li>{t('download.ios4')}</li>
          </ol>
        </div>
        <div className={styles.stepCard}>
          <div className={styles.stepIcon}>🤖</div>
          <div className={styles.stepTitle}>{t('download.androidTitle')}</div>
          <ol className={styles.stepList}>
            <li>{t('download.android1')}</li>
            <li>{t('download.android2')}</li>
            <li>{t('download.android3')}</li>
            <li>{t('download.android4')}</li>
          </ol>
        </div>
        <div className={styles.stepCard}>
          <div className={styles.stepIcon}>💻</div>
          <div className={styles.stepTitle}>{t('download.desktopTitle')}</div>
          <ol className={styles.stepList}>
            <li>{t('download.desktop1')}</li>
            <li>{t('download.desktop2')}</li>
          </ol>
        </div>
      </div>

      {/* Share onward */}
      <div className={styles.shareRow}>
        <div className={styles.shareText}>
          <h3>{t('download.shareApp')}</h3>
          <p>{t('download.scanToShare')}</p>
        </div>
        <QRCode value={shareUrl} size={132} alt="Share app QR" />
      </div>

      <Link className={styles.back} to="/">{t('connections.backToHub')}</Link>
    </div>
  );
}
