import React, { useState } from 'react';
import useAppStore from '../../store/appStore.js';
import { useT } from '../../i18n/I18nProvider.jsx';
import InAppShop from '../../components/InAppShop.jsx';
import PrivacyBadge from '../../components/PrivacyBadge.jsx';
import styles from './ConnectionsPage.module.css';

const PLATFORMS = [
  {
    key: 'shopee',
    name: 'Shopee',
    emoji: '🛍️',
    routes: ['Link-only', 'Imported records', 'Live connection (merchant)'],
    shopper: 'Paste or share listing links; import available receipts or order exports.',
    business: 'Shopee Open Platform for approved merchant connection.',
    validate: 'Accessible regions, account eligibility, catalogue and order permissions.',
  },
  {
    key: 'shein',
    name: 'SHEIN',
    emoji: '👗',
    routes: ['Link-only', 'Imported records'],
    shopper: 'Save fashion links and preferences; import available order records.',
    business: 'SHEIN Developer Platform — seller-focused application and authorisation.',
    validate: 'Seller and market eligibility; supported order and product scopes.',
  },
  {
    key: 'tiktok',
    name: 'TikTok Shop',
    emoji: '📱',
    routes: ['Link-only', 'Imported records', 'Live connection (merchant)'],
    shopper: 'Save product and video links; import available order records.',
    business: 'TikTok Shop Partner Center for shop integrations.',
    validate: 'App approval, shop scope and region. Shop APIs do not expose personal TikTok feeds.',
  },
  {
    key: 'taobao',
    name: 'Taobao',
    emoji: '🏪',
    routes: ['Link-only', 'Imported records'],
    shopper: 'Save original listing links; confirm product details; import available records.',
    business: 'Taobao Open Platform — needs investigation.',
    validate: 'Current approval route, regional support and exact permissions.',
  },
  {
    key: 'pinduoduo',
    name: 'Pinduoduo',
    emoji: '🤝',
    routes: ['Link-only', 'Imported records'],
    shopper: 'Save listing and deal links; import receipts; use our own group-bundle demo.',
    business: 'Pinduoduo Open Platform — needs investigation.',
    validate: 'Developer eligibility, regional support and exact permissions.',
  },
];

const STATUS_META = {
  live:           { labelKey: 'connectionsExtra.statusLive',           color: 'var(--green-light)',   bg: 'rgba(5,150,105,.12)',  dot: '🟢' },
  imported:       { labelKey: 'connectionsExtra.statusImported',       color: 'var(--teal-light)',    bg: 'rgba(8,145,178,.12)',  dot: '🔵' },
  'link-only':    { labelKey: 'connectionsExtra.statusLinkOnly',       color: 'var(--text-muted)',    bg: 'rgba(255,255,255,.05)', dot: '⚪' },
  'needs-attention': { labelKey: 'connectionsExtra.statusNeedsAttention', color: 'var(--amber-light)', bg: 'rgba(245,158,11,.1)',  dot: '🟡' },
  demo:           { labelKey: 'connectionsExtra.statusDemo',           color: 'var(--violet-light)',  bg: 'rgba(124,58,237,.1)', dot: '🟣' },
};

export default function ConnectionsPage() {
  const { connections, updateConnection, addSavedLink, savedLinks } = useAppStore();
  const t = useT();
  const [expanded, setExpanded] = useState(null);
  const [linkForm, setLinkForm] = useState({ platform: '', url: '', title: '', price: '' });
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showImport, setShowImport] = useState(null);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState('');

  function saveLink(e) {
    e.preventDefault();
    if (!linkForm.url.trim() || !linkForm.platform) return;
    addSavedLink({ ...linkForm, price: Number(linkForm.price) || null });
    // Update status to link-only if it was demo
    const conn = connections[linkForm.platform];
    if (conn?.status === 'demo') updateConnection(linkForm.platform, { status: 'link-only' });
    setLinkForm({ platform: '', url: '', title: '', price: '' });
    setShowLinkForm(false);
  }

  function simulateImport(platform) {
    setImportResult('');
    setTimeout(() => {
      setImportResult(t('connectionsExtra.importResult'));
      updateConnection(platform, { status: 'imported' });
      setShowImport(null);
      setImportText('');
    }, 900);
  }

  return (
    <div>
      <h1 className="page-title">{t('connections.title')}</h1>
      <p className="page-sub">{t('connections.sub')}</p>
      <div style={{ marginBottom: 18 }}><PrivacyBadge /></div>

      {/* Status legend */}
      <div className={styles.legend}>
        {Object.entries(STATUS_META).map(([key, m]) => (
          <span key={key} className={styles.legendChip} style={{ color: m.color, background: m.bg }}>
            {m.dot} {t(m.labelKey)}
          </span>
        ))}
      </div>

      {/* Quick-save link */}
      <div className={styles.toolbar}>
        <h2 className="section-title" style={{ margin: 0 }}>{t('connectionsExtra.platformsHeading')}</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowLinkForm(v => !v)}>
          {showLinkForm ? t('connectionsExtra.cancelToggle') : t('connectionsExtra.saveLinkToggle')}
        </button>
      </div>

      {showLinkForm && (
        <form className={`card ${styles.linkForm}`} onSubmit={saveLink}>
          <h3 className={styles.formTitle}>{t('connections.saveLinkTitle')}</h3>
          <div className={styles.formGrid}>
            <label className={styles.flabel}>
              {t('connectionsExtra.platformLabel')}
              <select className={styles.finput} required value={linkForm.platform}
                onChange={e => setLinkForm(f => ({ ...f, platform: e.target.value }))}>
                <option value="">{t('connectionsExtra.selectPh')}</option>
                {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
              </select>
            </label>
            <label className={styles.flabel}>
              {t('connectionsExtra.productUrlLabel')}
              <input className={styles.finput} type="url" required placeholder="https://..."
                value={linkForm.url} onChange={e => setLinkForm(f => ({ ...f, url: e.target.value }))} />
            </label>
            <label className={styles.flabel}>
              {t('connectionsExtra.productNameLabel')}
              <input className={styles.finput} placeholder={t('connectionsExtra.productNamePh')}
                value={linkForm.title} onChange={e => setLinkForm(f => ({ ...f, title: e.target.value }))} />
            </label>
            <label className={styles.flabel}>
              {t('connectionsExtra.listedPriceLabel')}
              <input className={styles.finput} type="number" min="0" step="0.01" placeholder={t('connectionsExtra.listedPricePh')}
                value={linkForm.price} onChange={e => setLinkForm(f => ({ ...f, price: e.target.value }))} />
            </label>
          </div>
          <p className={styles.fnote}>{t('connectionsExtra.fnote')}</p>
          <button type="submit" className="btn btn-primary">{t('connectionsExtra.saveLinkBtn')}</button>
        </form>
      )}

      {/* Platform cards */}
      <div className={styles.platformGrid}>
        {PLATFORMS.map(p => {
          const conn   = connections[p.key] ?? { status: 'demo', label: p.name, route: 'link-only' };
          const meta   = STATUS_META[conn.status] ?? STATUS_META.demo;
          const isOpen = expanded === p.key;
          const links  = savedLinks.filter(l => l.platform === p.key);

          return (
            <div key={p.key} className={styles.platformCard} style={{ borderTop: `2px solid ${meta.color}` }}>
              <div className={styles.cardTop} onClick={() => setExpanded(isOpen ? null : p.key)} style={{ cursor: 'pointer' }}>
                <span className={styles.pEmoji}>{p.emoji}</span>
                <div className={styles.pInfo}>
                  <div className={styles.pName}>{p.name}</div>
                  <span className={styles.statusChip} style={{ color: meta.color, background: meta.bg }}>
                    {meta.dot} {t(meta.labelKey)}
                  </span>
                  {links.length > 0 && <span className={styles.linkCount}>{t(links.length !== 1 ? 'connectionsExtra.linksSaved' : 'connectionsExtra.linkSaved', { n: links.length })}</span>}
                </div>
                <span className={styles.toggle}>{isOpen ? '▲' : '▼'}</span>
              </div>

              {isOpen && (
                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <div className={styles.infoBlock}>
                      <div className={styles.infoLabel}>{t('connectionsExtra.shopperRoute')}</div>
                      <p>{p.shopper}</p>
                    </div>
                    <div className={styles.infoBlock}>
                      <div className={styles.infoLabel}>{t('connectionsExtra.mustValidate')}</div>
                      <p>{p.validate}</p>
                    </div>
                  </div>

                  <div className={styles.routeChips}>
                    {p.routes.map(r => <span key={r} className={styles.routeChip}>{r}</span>)}
                  </div>

                  {/* Actions */}
                  <div className={styles.cardActions}>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => { setLinkForm(f => ({ ...f, platform: p.key })); setShowLinkForm(true); setExpanded(null); }}>
                      {t('connectionsExtra.saveALink')}
                    </button>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => setShowImport(showImport === p.key ? null : p.key)}>
                      {t('connectionsExtra.importRecords')}
                    </button>
                    {conn.status !== 'demo' && (
                      <button className="btn btn-danger btn-sm"
                        onClick={() => updateConnection(p.key, { status: 'demo' })}>
                        {t('connectionsExtra.disconnect')}
                      </button>
                    )}
                  </div>

                  {/* Import panel */}
                  {showImport === p.key && (
                    <div className={styles.importPanel}>
                      <p className={styles.importNote}>
                        {t('connectionsExtra.importNote')}
                        <strong>{t('connectionsExtra.importNoteStrong')}</strong>
                      </p>
                      <textarea className={styles.importArea} rows={3}
                        placeholder={t('connectionsExtra.importPlaceholder')}
                        value={importText} onChange={e => setImportText(e.target.value)} />
                      <button className="btn btn-primary btn-sm" onClick={() => simulateImport(p.key)}>
                        {t('connectionsExtra.extractReview')}
                      </button>
                    </div>
                  )}

                  {importResult && showImport === null && (
                    <div className={styles.importResult}>{importResult}</div>
                  )}

                  {/* Saved links */}
                  {links.length > 0 && (
                    <div className={styles.savedLinks}>
                      <div className={styles.infoLabel}>{t('connectionsExtra.savedLinksLabel')}</div>
                      {links.map(l => (
                        <div key={l.id} className={styles.linkRow}>
                          <a href={l.url} target="_blank" rel="noopener noreferrer" className={styles.linkUrl}>
                            {l.title || l.url}
                          </a>
                          {l.price && <span className={styles.linkPrice}>${l.price}</span>}
                          <span className={styles.linkNote}>{t('connectionsExtra.linkOnlyUnverified')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* In-app Shop — browse products from connected platforms */}
      <InAppShop />

      <p className={styles.footer}>
        {t('connectionsExtra.footerNote')}
      </p>
    </div>
  );
}
