/**
 * Phone + desktop notifications (Web Notifications API via the service worker).
 *
 * Works in desktop Chrome/Edge/Firefox/Safari and Android Chrome. On iPhone
 * it works only after "Add to Home Screen" (iOS 16.4+), as the installed app.
 * Notifications go through the service worker when there is one, because
 * phones refuse `new Notification()` from a page.
 *
 * These fire while the app is open or in the background. Alerts with the app
 * fully closed need a push server (Web Push + VAPID keys), which isn't set up.
 */

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** 'granted' | 'denied' | 'default' | 'unsupported' */
export function notificationPermission() {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

/** Ask the browser for permission. Must be called from a click. */
export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

/**
 * Show a notification. `url` is opened when it's tapped; `tag` replaces an
 * earlier notification with the same tag instead of stacking.
 */
export async function showNotification({ title, body, url = '/customer', tag }) {
  if (notificationPermission() !== 'granted') return false;
  const options = {
    body,
    tag,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url },
  };
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    if (reg) {
      await reg.showNotification(title, options);
      return true;
    }
    const n = new Notification(title, options);
    n.onclick = () => { window.focus(); window.location.assign(url); };
    return true;
  } catch {
    return false;
  }
}

/** True when `now` falls inside the user's quiet hours ("22:00"–"08:00", may wrap midnight). */
export function inQuietHours(profile, now = new Date()) {
  const start = toMinutes(profile?.quietStart);
  const end = toMinutes(profile?.quietEnd);
  if (start == null || end == null || start === end) return false;
  const m = now.getHours() * 60 + now.getMinutes();
  return start < end ? m >= start && m < end : m >= start || m < end;
}

function toMinutes(hhmm) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? '');
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}
