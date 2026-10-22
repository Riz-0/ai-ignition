import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAppStore  from '../../store/appStore.js';
import useAuthStore from '../../store/authStore.js';
import { useT } from '../../i18n/I18nProvider.jsx';
import { UIPrefsCluster } from '../../components/UIPrefs.jsx';
import FloatingAssistant from '../../components/FloatingAssistant.jsx';
import styles from './Layout.module.css';

const NAV_BASE = [
  { to: '/business',            icon: '⊞',  labelKey: 'nav.dashboard', end: true },
  { to: '/business/customers',  icon: '👥', labelKey: 'nav.customers' },
  { to: '/business/journeys',   icon: '🗺️', labelKey: 'nav.journeys'  },
  { to: '/business/catalogue',  icon: '📦', labelKey: 'nav.catalogue'  },
  { to: '/business/support',    icon: '🎧', labelKey: 'nav.support'    },
];

export default function BusinessLayout() {
  const { merchantProfile, supportHandovers, switchMode } = useAppStore();
  const { logout, isAdmin } = useAuthStore();
  const t = useT();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const openHandovers = supportHandovers.filter((h) => !h.resolved).length;
  const NAV = NAV_BASE.map((n) => ({ ...n, label: t(n.labelKey) }));

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.logo}>
          <span>🛒</span><span>{t('layout.brand')}</span>
        </div>
        <div className={styles.modeChip} style={{ background: 'rgba(245,158,11,.12)', color: 'var(--amber-light)', borderColor: 'rgba(245,158,11,.25)' }}>
          🏪 {t('mode.business')}
        </div>
        <nav className={styles.nav}>
          {NAV.map(({ to, icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className={styles.navIcon}>{icon}</span>
              <span>{label}</span>
              {to === '/business/support' && openHandovers > 0 && (
                <span className={styles.badge}>{openHandovers}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar} style={{ background: 'linear-gradient(135deg,#f59e0b,#f04e6e)' }}>
              {merchantProfile?.name?.[0]?.toUpperCase() ?? 'M'}
            </div>
            <div>
              <div className={styles.userName}>{merchantProfile?.name ?? t('layout.merchantFallback')}</div>
              <div className={styles.userSub}>{t('mode.business')}</div>
            </div>
          </div>
          {isAdmin() && (
            <button className={styles.switchBtn} title={t('layout.switchView')}
              onClick={() => { switchMode(); navigate('/'); }}
            >⇄</button>
          )}
          <button className={styles.logoutBtn} title={t('common.signOut')}
            onClick={() => { logout(); navigate('/login'); }}
          >⏻</button>
        </div>
      </aside>
      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setOpen(v => !v)}>☰</button>
          <div className={styles.topbarRight}>
            <UIPrefsCluster />
            {openHandovers > 0 && (
              <NavLink to="/business/support" className={styles.alertBadge} style={{ borderColor: 'rgba(220,38,38,.35)', color: 'var(--red-light)' }}>
                {t(openHandovers !== 1 ? 'layout.handoversOpen' : 'layout.handoverOpen', { n: openHandovers })}
              </NavLink>
            )}
          </div>
        </header>
        <main className={styles.content}><Outlet /></main>
      </div>

      {/* 2AM Assistant floats in the corner on every business page too */}
      <FloatingAssistant />
    </div>
  );
}
