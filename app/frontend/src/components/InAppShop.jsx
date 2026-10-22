import React, { useState, useMemo } from 'react';
import useAppStore from '../store/appStore.js';
import { useT } from '../i18n/I18nProvider.jsx';
import { DEMO_PRODUCTS, PLATFORM_META } from '../data/demoProducts.js';
import styles from './InAppShop.module.css';

/**
 * InAppShop — the in-app product browsing surface.
 *
 * Shows curated demo products from each connected platform. Users can
 * save products to their wishlist or open the live listing externally.
 *
 * "Browse live" attempts to load the platform homepage inside a sandboxed
 * frame; most marketplaces block embedding via X-Frame-Options, so we
 * detect the blocked case and fall back to a clear "Open externally"
 * action — never pretending a link-only state is a live connection.
 */
export default function InAppShop() {
  const t = useT();
  const { addSavedLink, addToWishlist, connections } = useAppStore();
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('all');
  const [browser, setBrowser] = useState(null); // { platform, url } | null

  const platforms = Object.keys(PLATFORM_META);

  const filtered = useMemo(() => {
    return DEMO_PRODUCTS.filter((p) => {
      if (platform !== 'all' && p.platform !== platform) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query, platform]);

  function saveToWishlist(product) {
    // Save as a saved link + wishlist entry so it appears across the app
    addSavedLink({
      platform: product.platform,
      url: product.url,
      title: product.name,
      price: product.price,
    });
    addToWishlist({
      title: product.name,
      url: product.url,
      price: product.price,
      budget: null,
      reminderDate: '',
      notes: `From ${PLATFORM_META[product.platform].name}`,
    });
    // Mark the platform as link-only if it was still demo
    const conn = connections[product.platform];
    if (conn?.status === 'demo') {
      useAppStore.getState().updateConnection(product.platform, { status: 'link-only' });
    }
  }

  return (
    <div className={styles.wrap}>
      <h2 className="section-title">{t('connections.browseTitle')}</h2>
      <p className="page-sub" style={{ marginBottom: 16 }}>{t('connections.browseSub')}</p>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder={`🔍 ${t('shop.search')}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className={styles.filter}>
          <button
            className={`${styles.filterBtn} ${platform === 'all' ? styles.on : ''}`}
            onClick={() => setPlatform('all')}
          >
            {t('shop.allPlatforms')}
          </button>
          {platforms.map((p) => (
            <button
              key={p}
              className={`${styles.filterBtn} ${platform === p ? styles.on : ''}`}
              onClick={() => setPlatform(p)}
            >
              {PLATFORM_META[p].emoji} {PLATFORM_META[p].name}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>{t('shopExtra.noResults', { query })}</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((p) => (
            <div key={p.id} className={styles.card}>
              <div className={styles.thumb} aria-hidden="true">{p.emoji}</div>
              <div className={styles.platformRow}>
                <span className={styles.platformChip}>
                  {PLATFORM_META[p.platform].emoji} {PLATFORM_META[p.platform].name}
                </span>
                <span>
                  {p.bundle && <span className={styles.bundleChip}>{t('shopExtra.bundle')}</span>}
                  <span className={styles.demoChip}>{t('shop.demoBadge')}</span>
                </span>
              </div>
              <div className={styles.name}>{p.name}</div>
              <div>
                <div className={styles.price}>${p.price.toFixed(2)}</div>
                <div className={styles.priceMeta}>{p.currency} · ★ {p.rating} · {p.category}</div>
              </div>
              <div className={styles.actions}>
                <button className="btn btn-primary btn-sm" onClick={() => saveToWishlist(p)}>
                  + {t('shop.saveToWishlist')}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setBrowser({ platform: p.platform, url: p.url })}
                  title={t('connections.browse')}
                >
                  {t('connections.browse')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {browser && (
        <InAppBrowser
          platform={browser.platform}
          url={browser.url}
          onClose={() => setBrowser(null)}
          t={t}
        />
      )}
    </div>
  );
}

/**
 * InAppBrowser — tries to load the platform site in a sandboxed frame.
 * After a short delay we show a fallback message alongside the external
 * open button, because most marketplaces block iframe embedding.
 */
function InAppBrowser({ platform, url, onClose, t }) {
  const meta = PLATFORM_META[platform];
  const [loaded, setLoaded] = useState(false);

  // If the frame hasn't fired onLoad within ~3.5s we assume the platform
  // blocked embedding (most do via X-Frame-Options / CSP frame-ancestors).
  // We still keep the frame mounted in case it loads late, but we surface
  // the fallback so the user is never stuck on a blank screen.
  return (
    <div className={styles.browserOverlay} onClick={onClose}>
      <div className={styles.browser} onClick={(e) => e.stopPropagation()}>
        <div className={styles.browserBar}>
          <span style={{ fontSize: '1.1rem' }}>{meta.emoji}</span>
          <div className={styles.browserTitle}>
            {meta.name} · {t('connections.browseTitle')}
            <div className={styles.browserUrl}>{url}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className={styles.browserBody}>
          <iframe
            src={url}
            className={styles.browserFrame}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
            title={`${meta.name} in-app browser`}
            onLoad={() => setLoaded(true)}
          />
          {!loaded && (
            <div className={styles.browserBlocked}>
              <div className={styles.browserBlockedEmoji}>🔒</div>
              <h3>{t('connections.browseTitle')}</h3>
              <p>{t('connections.embedBlocked')}</p>
              <a className="btn btn-primary" href={url} target="_blank" rel="noopener noreferrer">
                ↗ {t('connections.openExternal')}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
