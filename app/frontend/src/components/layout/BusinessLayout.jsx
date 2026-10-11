import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAppStore  from '../../store/appStore.js';
import useAuthStore from '../../store/authStore.js';
import styles from './Layout.module.css';

const NAV = [
  { to: '/business',            icon: '⊞',  label: 'Dashboard', end: true },
  { to: '/business/customers',  icon: '👥', label: 'Customers' },
  { to: '/business/journeys',   icon: '🗺️', label: 'Journeys'  },
  { to: '/business/catalogue',  icon: '📦', label: 'Catalogue'  },
  { to: '/business/support',    icon: '🎧', label: 'Support'    },
];

export default function BusinessLayout() {
  const { merchantProfile, supportHandovers, reset } = useAppStore();
  const { logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const openHandovers = supportHandovers.filter((h) => !h.resolved).length;

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.logo}>
          <span>🛒</span><span>2am Shoppers</span>
        </div>
        <div className={styles.modeChip} style={{ background: 'rgba(245,158,11,.12)', color: 'var(--amber-light)', borderColor: 'rgba(245,158,11,.25)' }}>
          💼 Working Adult
        </div>
        <nav className={styles.nav}>
          {NAV.map(({ to, icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className={styles.navIcon}>{icon}</span>
              <span>{label}</span>
              {label === 'Support' && openHandovers > 0 && (
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
              <div className={styles.userName}>{merchantProfile?.name ?? 'Working Adult'}</div>
              <div className={styles.userSub}>Working Adult</div>
            </div>
          </div>
          <button className={styles.switchBtn} title="Switch view"
            onClick={() => { reset(); navigate('/'); }}
          >⇄</button>
          <button className={styles.logoutBtn} title="Sign out"
            onClick={() => { logout(); navigate('/login'); }}
          >⏻</button>
        </div>
      </aside>
      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setOpen(v => !v)}>☰</button>
          <div className={styles.topbarRight}>
            {openHandovers > 0 && (
              <NavLink to="/business/support" className={styles.alertBadge} style={{ borderColor: 'rgba(220,38,38,.35)', color: 'var(--red-light)' }}>
                🎧 {openHandovers} handover{openHandovers !== 1 ? 's' : ''} open
              </NavLink>
            )}
          </div>
        </header>
        <main className={styles.content}><Outlet /></main>
      </div>
    </div>
  );
}
