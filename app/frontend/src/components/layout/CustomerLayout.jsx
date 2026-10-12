import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAppStore  from '../../store/appStore.js';
import useAuthStore from '../../store/authStore.js';
import styles from './Layout.module.css';

export default function CustomerLayout() {
  const { shopperProfile, reminders, reset } = useAppStore();
  const { logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const isStudent    = shopperProfile?.userType !== 'working';
  const dueReminders = reminders.filter(r => !r.fired).length;

  // Nav adapts to student vs working adult per spec
  const NAV = isStudent
    ? [
        { to: '/customer',              icon: '⊞',  label: 'Home',        end: true },
        { to: '/customer/feed',         icon: '🎥', label: 'Discover'    },
        { to: '/customer/savings',      icon: '🎯', label: 'Save'        },
        { to: '/customer/wishlist',     icon: '❤️', label: 'Wishlist'    },
        { to: '/customer/chat',         icon: '💬', label: 'Assistant'   },
        { to: '/customer/connections',  icon: '🔗', label: 'Connections' },
        { to: '/customer/settings',     icon: '⚙️', label: 'Settings'   },
      ]
    : [
        { to: '/customer',              icon: '⊞',  label: 'Overview',   end: true },
        { to: '/customer/feed',         icon: '📊', label: 'Spending'    },
        { to: '/customer/savings',      icon: '📈', label: 'Savings'     },
        { to: '/customer/wishlist',     icon: '🛒', label: 'Shopping'    },
        { to: '/customer/chat',         icon: '💬', label: 'Assistant'   },
        { to: '/customer/connections',  icon: '🔗', label: 'Connections' },
        { to: '/customer/settings',     icon: '⚙️', label: 'Settings'   },
      ];

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.logo}>
          <span>🛒</span><span>2am Shoppers</span>
        </div>
        <div className={styles.modeChip}
          style={isStudent
            ? { background: 'rgba(124,58,237,.12)', color: 'var(--violet-light)', borderColor: 'rgba(124,58,237,.25)' }
            : { background: 'rgba(240,78,110,.12)',  color: 'var(--coral-light)',  borderColor: 'rgba(240,78,110,.25)' }
          }>
          {isStudent ? '🎓 Student' : '💼 Working Adult'}
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => setOpen(false)}>
              <span className={styles.navIcon}>{icon}</span>
              <span>{label}</span>
              {label === 'Wishlist' && dueReminders > 0 && (
                <span className={styles.badge}>{dueReminders}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}
              style={{ background: isStudent ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' : 'linear-gradient(135deg,#f04e6e,#ff8fa3)' }}>
              {shopperProfile?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <div className={styles.userName}>{shopperProfile?.name ?? 'Shopper'}</div>
              <div className={styles.userSub}>{isStudent ? 'Student' : 'Working Adult'}</div>
            </div>
          </div>
          <button className={styles.switchBtn} title="Switch view"
            onClick={() => { reset(); navigate('/'); }}>⇄</button>
          <button className={styles.logoutBtn} title="Sign out"
            onClick={() => { logout(); navigate('/login'); }}>⏻</button>
        </div>
      </aside>

      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setOpen(v => !v)}>☰</button>
          <div className={styles.topbarRight}>
            {dueReminders > 0 && (
              <NavLink to="/customer/wishlist" className={styles.alertBadge}>
                🔔 {dueReminders} reminder{dueReminders !== 1 ? 's' : ''} due
              </NavLink>
            )}
          </div>
        </header>
        <main className={styles.content}><Outlet /></main>
      </div>
    </div>
  );
}
