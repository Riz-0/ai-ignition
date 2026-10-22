import { useEffect } from 'react';
import useAppStore from '../store/appStore.js';
import { inQuietHours, notificationPermission, showNotification } from '../lib/notifications.js';

const CHECK_EVERY_MS = 60 * 1000;
const LOW_BUDGET_SHARE = 0.2;      // alert when 20% or less of this period's spending money is left
const REMINDER_HOUR = 9;           // date-only reminders go off at 9am

/**
 * Sends phone/desktop notifications while the app is open or in the
 * background:
 *   - wishlist reminders when their day comes (once each),
 *   - a low-budget alert once per week/month (not on "minimal" frequency).
 * Nothing is sent during the user's quiet hours; it waits until they end.
 */
export default function useNotificationScheduler() {
  const enabled = useAppStore((s) => s.notificationsEnabled);

  useEffect(() => {
    if (!enabled) return undefined;

    const check = () => {
      if (notificationPermission() !== 'granted') return;
      const s = useAppStore.getState();
      const profile = s.shopperProfile;
      if (!profile || inQuietHours(profile)) return;

      // 1. Reminders that are due
      const now = new Date();
      for (const r of s.reminders) {
        if (r.fired || r.notified || !isDue(r, now)) continue;
        showNotification({
          title: `⏰ ${r.productTitle ?? 'Wishlist reminder'}`,
          body: 'You asked to be reminded about this today. Still want it? Tap to check your wishlist.',
          url: '/customer/wishlist',
          tag: `reminder-${r.id}`,
        });
        s.markReminderNotified(r.id);
      }

      // 2. Low budget, once per period
      if (profile.notifFreq === 'minimal') return;
      const isWorking = profile.userType === 'working';
      const b = isWorking ? s.getWorkingBudget?.() : s.getStudentBudget?.();
      if (!b) return;
      const total = isWorking
        ? b.income - b.essentials - b.savings - b.buffer
        : b.allowance - b.essentials - b.savings;
      if (!(total > 0) || b.discretionary / total > LOW_BUDGET_SHARE) return;

      const key = `${s.activeAccountId ?? 'local'}:${periodKey(now, isWorking)}`;
      if (s.lastBudgetAlert === key) return;
      const period = isWorking ? 'month' : 'week';
      showNotification({
        title: `💸 Only $${b.discretionary.toFixed(2)} left this ${period}`,
        body: `Hoot says: maybe sleep on any big buys until your ${isWorking ? 'payday' : 'allowance day'}.`,
        url: '/customer',
        tag: 'low-budget',
      });
      s.setLastBudgetAlert(key);
    };

    check();
    const id = setInterval(check, CHECK_EVERY_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled]);
}

/** A reminder is due at its `at` time, or at 9am on its `date` (YYYY-MM-DD). */
function isDue(r, now) {
  if (r.at) return new Date(r.at) <= now;
  if (!r.date) return false;
  const [y, m, d] = String(r.date).split('-').map(Number);
  if (!y || !m || !d) return false;
  return new Date(y, m - 1, d, REMINDER_HOUR) <= now;
}

/** "2026-10" for monthly budgets, "2026-W43" style (week of year) for weekly. */
function periodKey(now, monthly) {
  if (monthly) return `${now.getFullYear()}-${now.getMonth() + 1}`;
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.floor(((now - start) / 86400000 + start.getDay()) / 7);
  return `${now.getFullYear()}-W${week}`;
}
