import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAppStore  from '../../store/appStore.js';
import useAuthStore from '../../store/authStore.js';
import { useT } from '../../i18n/I18nProvider.jsx';
import { UIPrefsCluster } from '../../components/UIPrefs.jsx';
import CoachTour, { TourPrompt } from '../../components/CoachTour.jsx';
import PrivacyBadge from '../../components/PrivacyBadge.jsx';
import FloatingAssistant from '../../components/FloatingAssistant.jsx';
import styles from './Layout.module.css';

export default function CustomerLayout() {
  const { shopperProfile, reminders, switchMode, activeAccountId,
          tourOffersHandled, handleTourOffer, tourActive, startTour, endTour } = useAppStore();
  const { logout, isAdmin, currentUser } = useAuthStore();
  const t = useT();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const isStudent    = shopperProfile?.userType !== 'working';
  const dueReminders = reminders.filter(r => !r.fired).length;

  // Nav adapts to student vs working adult per spec
  const NAV = isStudent
    ? [
        { tour: 'home',         to: '/customer',              icon: '⊞',  label: t('nav.home'),         end: true },
        { tour: 'feed',         to: '/customer/feed',         icon: '🎥', label: t('nav.discover')    },
        { tour: 'savings',      to: '/customer/savings',      icon: '🎯', label: t('nav.save')        },
        { tour: 'wishlist',     to: '/customer/wishlist',     icon: '❤️', label: t('nav.wishlist')    },
        { tour: 'connections',  to: '/customer/connections',  icon: '🔗', label: t('nav.connections') },
        { tour: 'settings',     to: '/customer/settings',     icon: '⚙️', label: t('nav.settings')   },
      ]
    : [
        { tour: 'home',         to: '/customer',              icon: '⊞',  label: t('nav.overview'),    end: true },
        { tour: 'feed',         to: '/customer/feed',         icon: '📊', label: t('nav.spending')    },
        { tour: 'savings',      to: '/customer/savings',      icon: '📈', label: t('nav.savings')     },
        { tour: 'wishlist',     to: '/customer/wishlist',     icon: '🛒', label: t('nav.shopping')    },
        { tour: 'connections',  to: '/customer/connections',  icon: '🔗', label: t('nav.connections') },
        { tour: 'settings',     to: '/customer/settings',     icon: '⚙️', label: t('nav.settings')   },
      ];

  // Only brand-new sign-ups are offered the tour, and only once.
  const showTourOffer = !!currentUser?.offerTour
    && !tourOffersHandled[activeAccountId ?? 'local'] && !tourActive;
  const [declinedNote, setDeclinedNote] = useState(false);

  function acceptTour() {
    handleTourOffer();
    startTour();
  }

  const declineTour = useCallback(() => {
    handleTourOffer();
    setDeclinedNote(true);
  }, [handleTourOffer]);

  useEffect(() => {
    if (!declinedNote) return;
    const id = setTimeout(() => setDeclinedNote(false), 4000);
    return () => clearTimeout(id);
  }, [declinedNote]);

  const tourSteps = useMemo(() => {
    const mode = isStudent ? 'Student' : 'Working';
    const label = (id) => NAV.find(n => n.tour === id)?.label;
    return [
      { title: t('tour.welcomeTitle', { name: shopperProfile?.name || t('homeExtra.fallbackName') }), body: t('tour.welcomeBody') },
      { target: 'nav-home',        inSidebar: true, title: label('home'),        body: t(`tour.home${mode}`) },
      { target: 'nav-feed',        inSidebar: true, title: label('feed'),        body: t(`tour.feed${mode}`) },
      { target: 'nav-savings',     inSidebar: true, title: label('savings'),     body: t('tour.savings') },
      { target: 'nav-wishlist',    inSidebar: true, title: label('wishlist'),    body: t('tour.wishlist') },
      { target: 'assistant-fab',                    title: t('nav.assistant'),   body: t('tour.assistant') },
      { target: 'nav-connections', inSidebar: true, title: label('connections'), body: t('tour.connections') },
      { target: 'privacy',                          title: t('privacy.badge'),   body: t('tour.privacy') },
      { target: 'nav-settings',    inSidebar: true, title: label('settings'),    body: t('tour.settings') },
    ];
  }, [isStudent, shopperProfile?.name, t]); // eslint-disable-line react-hooks/exhaustive-deps

  // On mobile the sidebar is off-canvas, so slide it in for nav steps.
  const handleTourStep = useCallback((step) => {
    if (window.innerWidth <= 768) setOpen(!!step.inSidebar);
  }, []);

  function finishTour() {
    endTour();
    setOpen(false);
  }

  return (
    <div className={styles.shell}>
      {showTourOffer && (
        <TourPrompt name={shopperProfile?.name || currentUser?.name}
          onAccept={acceptTour} onDecline={declineTour} />
      )}
      {tourActive && <CoachTour steps={tourSteps} onFinish={finishTour} onStep={handleTourStep} />}
      {declinedNote && <div className={styles.toast} role="status">{t('tour.declined')}</div>}
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.logo}>
          <span>🛒</span><span>{t('layout.brand')}</span>
        </div>
        <div className={styles.modeChip}
          style={isStudent
            ? { background: 'rgba(124,58,237,.12)', color: 'var(--violet-light)', borderColor: 'rgba(124,58,237,.25)' }
            : { background: 'rgba(240,78,110,.12)',  color: 'var(--coral-light)',  borderColor: 'rgba(240,78,110,.25)' }
          }>
          {isStudent ? `🎓 ${t('mode.student')}` : `💼 ${t('mode.working')}`}
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ tour, to, icon, label, end }) => (
            <NavLink key={to} to={to} end={end} data-tour={`nav-${tour}`}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => setOpen(false)}>
              <span className={styles.navIcon}>{icon}</span>
              <span>{label}</span>
              {to === '/customer/wishlist' && dueReminders > 0 && (
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
              <div className={styles.userName}>{shopperProfile?.name ?? t('layout.shopperFallback')}</div>
              <div className={styles.userSub}>{isStudent ? t('mode.student') : t('mode.working')}</div>
            </div>
          </div>
          {isAdmin() && (
            <button className={styles.switchBtn} title={t('layout.switchView')}
              onClick={() => { switchMode(); navigate('/'); }}>⇄</button>
          )}
          <button className={styles.logoutBtn} title={t('common.signOut')}
            onClick={() => { logout(); navigate('/login'); }}>⏻</button>
        </div>
      </aside>

      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setOpen(v => !v)}>☰</button>
          <div className={styles.topbarRight}>
            <PrivacyBadge compact align="right" data-tour="privacy" />
            <UIPrefsCluster />
            {dueReminders > 0 && (
              <NavLink to="/customer/wishlist" className={styles.alertBadge}>
                {t(dueReminders !== 1 ? 'layout.remindersDue' : 'layout.reminderDue', { n: dueReminders })}
              </NavLink>
            )}
          </div>
        </header>
        <main className={styles.content}><Outlet /></main>
      </div>

      {/* 2AM Assistant floats in the corner on every customer page */}
      <FloatingAssistant />
    </div>
  );
}
