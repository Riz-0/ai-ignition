import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const isNative = () => Capacitor.isNativePlatform();

export function notificationsSupported() {
  if (isNative()) return true;

  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Returns:
 * 'granted' | 'denied' | 'default' | 'unsupported'
 */
export async function notificationPermission() {
  if (isNative()) {
    try {
      const result = await LocalNotifications.checkPermissions();
      return result.display === "granted" ? "granted" : result.display === "denied" ? "denied" : "default";
    } catch {
      return "unsupported";
    }
  }

  if (!notificationsSupported()) return "unsupported";

  return Notification.permission;
}

/** Request permission following a user click. */
export async function requestNotificationPermission() {
  if (isNative()) {
    try {
      const current = await LocalNotifications.checkPermissions();

      if (current.display === "granted") return "granted";
      if (current.display === "denied") return "denied";

      const result = await LocalNotifications.requestPermissions();

      return result.display === "granted" ? "granted" : result.display === "denied" ? "denied" : "default";
    } catch {
      return "unsupported";
    }
  }

  if (!notificationsSupported()) return "unsupported";

  if (Notification.permission !== "default") {
    return Notification.permission;
  }

  try {
    return await Notification.requestPermission();
  } catch {
    return "default";
  }
}

/**
 * Show a notification locally.
 * No backend or push server required.
 */
export async function showNotification({ title, body, url = "/customer", tag }) {
  const permission = await notificationPermission();

  if (permission !== "granted") return false;

  if (isNative()) {
    try {
      // Use a numeric ID. Reusing the same tag replaces the
      // corresponding notification on subsequent tests.
      const id = tag ? stableNotificationId(tag) : Math.floor(Date.now() % 2147483647);

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: {
              at: new Date(Date.now() + 1000),
              allowWhileIdle: true,
            },
            extra: { url },
          },
        ],
      });

      return true;
    } catch (error) {
      console.error("Native notification failed:", error);
      return false;
    }
  }

  try {
    const options = {
      body,
      tag,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url },
    };

    // Prefer the service worker where available.
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();

      if (reg) {
        await reg.showNotification(title, options);
        return true;
      }
    }

    const notification = new Notification(title, options);

    notification.onclick = () => {
      window.focus();
      window.location.assign(url);
      notification.close();
    };

    return true;
  } catch (error) {
    console.error("Browser notification failed:", error);
    return false;
  }
}

/** Stable positive 31-bit numeric ID for native notifications. */
function stableNotificationId(value) {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }

  return (Math.abs(hash) % 2147483646) + 1;
}

/** True when now falls within the user's quiet hours. */
export function inQuietHours(profile, now = new Date()) {
  const start = toMinutes(profile?.quietStart);
  const end = toMinutes(profile?.quietEnd);

  if (start == null || end == null || start === end) {
    return false;
  }

  const minutes = now.getHours() * 60 + now.getMinutes();

  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

function toMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? "");

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}
