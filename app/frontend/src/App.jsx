import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts stay eager — they're the shell shown immediately after auth.
import CustomerLayout       from './components/layout/CustomerLayout.jsx';
import BusinessLayout       from './components/layout/BusinessLayout.jsx';

// Pages are lazy-loaded so the first paint (login / landing) ships a small
// bundle and heavier views (business dashboard, chat, feed) load on demand.
const LoginPage          = lazy(() => import('./pages/LoginPage.jsx'));
const SignupPage         = lazy(() => import('./pages/SignupPage.jsx'));
const ModeSelectPage     = lazy(() => import('./pages/ModeSelectPage.jsx'));
const DownloadPage       = lazy(() => import('./pages/DownloadPage.jsx'));
const PrivacyPage        = lazy(() => import('./pages/PrivacyPage.jsx'));

const CustomerOnboarding = lazy(() => import('./pages/customer/CustomerOnboarding.jsx'));
const CustomerHome       = lazy(() => import('./pages/customer/CustomerHome.jsx'));
const WishlistPage       = lazy(() => import('./pages/customer/WishlistPage.jsx'));
const FeedPage           = lazy(() => import('./pages/customer/FeedPage.jsx'));
const CustomerSettings   = lazy(() => import('./pages/customer/CustomerSettings.jsx'));
const SavingsPage        = lazy(() => import('./pages/customer/SavingsPage.jsx'));
const ConnectionsPage    = lazy(() => import('./pages/customer/ConnectionsPage.jsx'));

const BusinessOnboarding = lazy(() => import('./pages/business/BusinessOnboarding.jsx'));
const BusinessDashboard  = lazy(() => import('./pages/business/BusinessDashboard.jsx'));
const CustomersPage      = lazy(() => import('./pages/business/CustomersPage.jsx'));
const JourneysPage       = lazy(() => import('./pages/business/JourneysPage.jsx'));
const CataloguePage      = lazy(() => import('./pages/business/CataloguePage.jsx'));
const SupportPage        = lazy(() => import('./pages/business/SupportPage.jsx'));

import useAuthStore  from './store/authStore.js';
import useAppStore   from './store/appStore.js';

function RequireAuth({ children }) {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

/**
 * Landing router for `/`. The 3-mode selector is ADMIN-ONLY. Everyone
 * else is sent straight to the view that matches their account, so a
 * normal user never sees the mode picker.
 */
function LandingRouter() {
  const role            = useAuthStore(s => s.currentUser?.role);
  const shopperProfile  = useAppStore(s => s.shopperProfile);
  const merchantProfile = useAppStore(s => s.merchantProfile);

  if (role === 'admin') return <ModeSelectPage />;

  if (role === 'business') {
    return <Navigate to={merchantProfile ? '/business' : '/business/onboarding'} replace />;
  }
  // student / working (or anything else) → customer app
  return <Navigate to={shopperProfile ? '/customer' : '/customer/onboarding'} replace />;
}

/** Minimal full-screen fallback shown while a lazy route chunk loads. */
function RouteFallback() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: 'var(--text-dim)', fontSize: '.9rem',
    }}>
      <span>Loading…</span>
    </div>
  );
}

export default function App() {
  const { shopperProfile, merchantProfile } = useAppStore();

  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>

      {/* ── Public ─────────────────────────────────────────── */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/signup"   element={<SignupPage />} />
      <Route path="/download" element={<DownloadPage />} />
      <Route path="/privacy"  element={<PrivacyPage />} />

      {/* ── Landing: admin → mode select, others → their view ── */}
      <Route path="/" element={<RequireAuth><LandingRouter /></RequireAuth>} />

      {/* ── Customer (student + working adult) ─────────────── */}
      <Route path="/customer/onboarding"
        element={<RequireAuth><CustomerOnboarding /></RequireAuth>} />

      <Route path="/customer"
        element={
          <RequireAuth>
            {shopperProfile ? <CustomerLayout /> : <Navigate to="/customer/onboarding" replace />}
          </RequireAuth>
        }
      >
        <Route index          element={<CustomerHome />} />
        <Route path="wishlist"    element={<WishlistPage />} />
        <Route path="feed"        element={<FeedPage />} />
        {/* /customer/chat removed — the 2AM Assistant is now a global
            floating bot. Redirect any old links to Home. */}
        <Route path="chat"        element={<Navigate to="/customer" replace />} />
        <Route path="savings"     element={<SavingsPage />} />
        <Route path="connections" element={<ConnectionsPage />} />
        <Route path="settings"    element={<CustomerSettings />} />
      </Route>

      {/* ── Business ───────────────────────────────────────── */}
      <Route path="/business/onboarding"
        element={<RequireAuth><BusinessOnboarding /></RequireAuth>} />

      <Route path="/business"
        element={
          <RequireAuth>
            {merchantProfile ? <BusinessLayout /> : <Navigate to="/business/onboarding" replace />}
          </RequireAuth>
        }
      >
        <Route index           element={<BusinessDashboard />} />
        <Route path="customers"  element={<CustomersPage />} />
        <Route path="journeys"   element={<JourneysPage />} />
        <Route path="catalogue"  element={<CataloguePage />} />
        <Route path="support"    element={<SupportPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
