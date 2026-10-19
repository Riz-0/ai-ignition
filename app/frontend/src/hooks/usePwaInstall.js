import { useState, useEffect, useCallback } from 'react';

/**
 * usePwaInstall — captures the `beforeinstallprompt` event so the UI
 * can show an "Install" button that triggers the native install prompt.
 *
 * Returns:
 *   { canInstall, promptInstall, installed }
 *   - canInstall: true once the browser has fired beforeinstallprompt
 *   - promptInstall(): triggers the prompt; resolves with the user choice
 *   - installed: true if the app is already running standalone (or was installed)
 */
export function usePwaInstall() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    if (standalone) setInstalled(true);

    const onBefore = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };

    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return { outcome: 'unavailable' };
    deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice;
  }, [deferred]);

  return { canInstall: !!deferred, promptInstall, installed };
}
