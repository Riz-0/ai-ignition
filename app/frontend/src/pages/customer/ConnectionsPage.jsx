import React, { useState } from 'react';
import useAppStore from '../../store/appStore.js';
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
  live:           { label: 'Live connection', color: 'var(--green-light)',   bg: 'rgba(5,150,105,.12)',  dot: '🟢' },
  imported:       { label: 'Imported records', color: 'var(--teal-light)',   bg: 'rgba(8,145,178,.12)',  dot: '🔵' },
  'link-only':    { label: 'Link-only',         color: 'var(--text-muted)',   bg: 'rgba(255,255,255,.05)', dot: '⚪' },
  'needs-attention': { label: 'Needs attention', color: 'var(--amber-light)', bg: 'rgba(245,158,11,.1)',  dot: '🟡' },
  demo:           { label: 'Demo data',          color: 'var(--violet-light)', bg: 'rgba(124,58,237,.1)', dot: '🟣' },
};

export default function ConnectionsPage() {
  const { connections, updateConnection, addSavedLink, savedLinks } = useAppStore();
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
      setImportResult(`✓ 3 sample records extracted for review. Confirm each before they update your spending plan. (Simulated — label: Demo data)`);
      updateConnection(platform, { status: 'imported' });
      setShowImport(null);
      setImportText('');
    }, 900);
  }

  return (
    <div>
      <h1 className="page-title">Connections Hub</h1>
      <p className="page-sub">
        One place for Shopee, SHEIN, TikTok Shop, Taobao and Pinduoduo. Each card shows the actual access level — never "Connected" if only a link was saved.
      </p>

      {/* Status legend */}
      <div className={styles.legend}>
        {Object.entries(STATUS_META).map(([key, m]) => (
          <span key={key} className={styles.legendChip} style={{ color: m.color, background: m.bg }}>
            {m.dot} {m.label}
          </span>
        ))}
      </div>

      {/* Quick-save link */}
      <div className={styles.toolbar}>
        <h2 className="section-title" style={{ margin: 0 }}>Platforms</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowLinkForm(v => !v)}>
          {showLinkForm ? '✕ Cancel' : '+ Save a product link'}
        </button>
      </div>

      {showLinkForm && (
        <form className={`card ${styles.linkForm}`} onSubmit={saveLink}>
          <h3 className={styles.formTitle}>Save a product link</h3>
          <div className={styles.formGrid}>
            <label className={styles.flabel}>
              Platform *
              <select className={styles.finput} required value={linkForm.platform}
                onChange={e => setLinkForm(f => ({ ...f, platform: e.target.value }))}>
                <option value="">— select —</option>
                {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
              </select>
            </label>
            <label className={styles.flabel}>
              Product URL *
              <input className={styles.finput} type="url" required placeholder="https://..."
                value={linkForm.url} onChange={e => setLinkForm(f => ({ ...f, url: e.target.value }))} />
            </label>
            <label className={styles.flabel}>
              Product name
              <input className={styles.finput} placeholder="e.g. Blue canvas sneakers"
                value={linkForm.title} onChange={e => setLinkForm(f => ({ ...f, title: e.target.value }))} />
            </label>
            <label className={styles.flabel}>
              Listed price ($)
              <input className={styles.finput} type="number" min="0" step="0.01" placeholder="e.g. 45.90"
                value={linkForm.price} onChange={e => setLinkForm(f => ({ ...f, price: e.target.value }))} />
            </label>
          </div>
          <p className={styles.fnote}>Sharing a link does not grant access to your platform account or confirm a current price.</p>
          <button type="submit" className="btn btn-primary">Save link</button>
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
                    {meta.dot} {meta.label}
                  </span>
                  {links.length > 0 && <span className={styles.linkCount}>{links.length} link{links.length !== 1 ? 's' : ''} saved</span>}
                </div>
                <span className={styles.toggle}>{isOpen ? '▲' : '▼'}</span>
              </div>

              {isOpen && (
                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <div className={styles.infoBlock}>
                      <div className={styles.infoLabel}>Shopper route (MVP)</div>
                      <p>{p.shopper}</p>
                    </div>
                    <div className={styles.infoBlock}>
                      <div className={styles.infoLabel}>Must validate before live</div>
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
                      + Save a link
                    </button>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => setShowImport(showImport === p.key ? null : p.key)}>
                      📥 Import records
                    </button>
                    {conn.status !== 'demo' && (
                      <button className="btn btn-danger btn-sm"
                        onClick={() => updateConnection(p.key, { status: 'demo' })}>
                        Disconnect
                      </button>
                    )}
                  </div>

                  {/* Import panel */}
                  {showImport === p.key && (
                    <div className={styles.importPanel}>
                      <p className={styles.importNote}>
                        Paste order export text, receipt content or upload a supported file. Extracted records are shown for confirmation before updating your spending plan.
                        <strong> This is a simulated demo — real file parsing comes in a later build.</strong>
                      </p>
                      <textarea className={styles.importArea} rows={3}
                        placeholder="Paste order data here…"
                        value={importText} onChange={e => setImportText(e.target.value)} />
                      <button className="btn btn-primary btn-sm" onClick={() => simulateImport(p.key)}>
                        Extract and review
                      </button>
                    </div>
                  )}

                  {importResult && showImport === null && (
                    <div className={styles.importResult}>{importResult}</div>
                  )}

                  {/* Saved links */}
                  {links.length > 0 && (
                    <div className={styles.savedLinks}>
                      <div className={styles.infoLabel}>Saved links</div>
                      {links.map(l => (
                        <div key={l.id} className={styles.linkRow}>
                          <a href={l.url} target="_blank" rel="noopener noreferrer" className={styles.linkUrl}>
                            {l.title || l.url}
                          </a>
                          {l.price && <span className={styles.linkPrice}>${l.price}</span>}
                          <span className={styles.linkNote}>link-only · price unverified</span>
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

      <p className={styles.footer}>
        Integration plan reviewed October 2026. Keep permissions and regional availability checks current when implementation starts. Never show "Connected" if only a product link was saved.
      </p>
    </div>
  );
}
