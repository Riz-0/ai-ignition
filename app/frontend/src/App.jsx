import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage            from './pages/LoginPage.jsx';
import SignupPage           from './pages/SignupPage.jsx';
import ModeSelectPage       from './pages/ModeSelectPage.jsx';
import DownloadPage         from './pages/DownloadPage.jsx';
import PrivacyPage          from './pages/PrivacyPage.jsx';

// Customer (student + working adult)
import CustomerOnboarding   from './pages/customer/CustomerOnboarding.jsx';
import CustomerLayout       from './components/layout/CustomerLayout.jsx';
import CustomerHome         from './pages/customer/CustomerHome.jsx';
import WishlistPage         from './pages/customer/WishlistPage.jsx';
import FeedPage             from './pages/customer/FeedPage.jsx';
import ChatPage             from './pages/customer/ChatPage.jsx';
import CustomerSettings     from './pages/customer/CustomerSettings.jsx';
import SavingsPage          from './pages/customer/SavingsPage.jsx';
import ConnectionsPage      from './pages/customer/ConnectionsPage.jsx';
import ProductFeed          from './components/ProductFeed.jsx'

// Business
import BusinessOnboarding   from './pages/business/BusinessOnboarding.jsx';
import BusinessLayout       from './components/layout/BusinessLayout.jsx';
import BusinessDashboard    from './pages/business/BusinessDashboard.jsx';
import CustomersPage        from './pages/business/CustomersPage.jsx';
import JourneysPage         from './pages/business/JourneysPage.jsx';
import CataloguePage        from './pages/business/CataloguePage.jsx';
import SupportPage          from './pages/business/SupportPage.jsx';

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

export default function App() {
  const { shopperProfile, merchantProfile } = useAppStore();

  return (
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
        <Route path="chat"        element={<ChatPage />} />
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
  );
}
