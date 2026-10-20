import React, { useState } from 'react';
import useAppStore from '../../store/appStore.js';
import { getPersonaFeed } from '../../store/personaFeeds.js';
import styles from './FeedPage.module.css';

// Generic fallback feed (used when the account has no persona feed)
const DEMO_FEED = [
  {
    id: 'f1', type: 'demo', merchant: 'Brew & Bites', category: 'Coffee',
    title: 'Brew & Bites House Blend — 250g',
    desc: 'Smooth, medium roast. Great for office mornings. Previously purchased by you.',
    price: 12.90, tags: ['replenishment', 'returning_customer'],
    cta: 'Check it out', emoji: '☕',
  },
  {
    id: 'f2', type: 'comparison', merchant: 'Brew & Bites', category: 'Coffee',
    title: 'House Blend vs. Dark Roast — which is right for you?',
    desc: 'House Blend: smooth, medium body. Dark Roast: bold, stronger caffeine kick. Both are single-origin.',
    price: null, tags: ['comparison'],
    cta: 'See both options', emoji: '⚖️',
  },
  {
    id: 'f3', type: 'bundle', merchant: 'Brew & Bites', category: 'Snacks',
    title: 'Office Snack Bundle — Coffee + Mixed Nuts',
    desc: 'Eligible for colleague group purchase. Split the cost across 3–5 people. Merchant-approved deal.',
    price: 28.00, tags: ['group_deal'],
    cta: 'View bundle', emoji: '🤝',
    note: 'SIMULATED — group checkout not yet built',
  },
  {
    id: 'f4', type: 'demo', merchant: 'StyleStep', category: 'Fashion',
    title: 'Classic Leather Oxford — Black',
    desc: 'Slip-on comfort for the office. Available in sizes 6–11. You saved a similar product last month.',
    price: 38.00, tags: ['interest_match', 'within_budget'],
    cta: 'View product', emoji: '👟',
  },
];

const TYPE_LABEL = { demo: 'Product', comparison: 'Comparison', bundle: 'Group Deal' };
const TAG_STYLE  = {
  replenishment:      'badge-coral',
  returning_customer: 'badge-violet',
  comparison:         'badge-teal',
  group_deal:         'badge-amber',
  interest_match:     'badge-green',
  within_budget:      'badge-green',
  trending:           'badge-violet',
  travel:             'badge-teal',
  value_set:          'badge-amber',
  goal_linked:        'badge-amber',
  collectible:        'badge-violet',
};

export default function FeedPage() {
  const { shopperProfile, activeAccountId, addToWishlist, feedback, recordSkip, applyFeedback } = useAppStore();
  const [saved, setSaved] = useState({});

  // Personalised discovery feed for this persona (Emily → beauty/travel,
  // John → fitness/collectibles), falling back to the generic demo feed.
  const personaFeed = getPersonaFeed(activeAccountId, shopperProfile?.userType);
  const sourceFeed  = personaFeed ?? DEMO_FEED;

  // Feed reacts to stored feedback (Phase 2 explicit + implicit loops):
  //  - hide items the user skipped
  //  - hide items in a disliked category
  //  - hide items above the lowered price threshold
  const visibleFeed = sourceFeed.filter(item => {
    if (feedback.skippedFeedIds.includes(item.id)) return false;
    if (feedback.dislikedCategories.includes(item.category)) return false;
    if (feedback.priceThreshold != null && item.price != null && item.price > feedback.priceThreshold) return false;
    return true;
  });

  function saveProduct(item) {
    addToWishlist({ title: item.title, price: item.price?.toFixed(2), budget: shopperProfile?.budget ?? null });
    applyFeedback('interested', { category: item.category });
    setSaved(s => ({ ...s, [item.id]: true }));
  }

  function skip(item) {
    recordSkip(item.id);                                  // implicit signal
    applyFeedback('not_interested', { category: item.category });
  }

  return (
    <div>
      <h1 className="page-title">Discover</h1>
      <p className="page-sub">
        {shopperProfile?.name ? `Hand-picked for ${shopperProfile.name} — ` : 'Personalised picks — '}
        based on your interests: {shopperProfile?.interests?.join(', ') || 'everything'}.
      </p>

      {/* Feedback summary — shows the loop is working */}
      {(feedback.priceThreshold != null || feedback.dislikedCategories.length > 0 || feedback.skippedFeedIds.length > 0) && (
        <div className={styles.feedbackBar}>
          <span>🎯 Tuned to your taste:</span>
          {feedback.priceThreshold != null && <span className="badge badge-green">under ${feedback.priceThreshold}</span>}
          {feedback.dislikedCategories.map(c => <span key={c} className="badge badge-coral">hiding {c}</span>)}
          {feedback.skippedFeedIds.length > 0 && <span className="badge badge-violet">{feedback.skippedFeedIds.length} skipped</span>}
        </div>
      )}

      <div className={styles.disclaimer}>
        <span>🔬</span>
        <p>Picks reference real brands matched to your interests; prices are indicative and may differ at checkout. Links open the official store. Bundles marked SIMULATED are illustrative.</p>
      </div>

      <div className={styles.feed}>
        {visibleFeed.length === 0 && (
          <div className={`card ${styles.card}`} style={{ textAlign: 'center' }}>
            <p className={styles.cardDesc}>No picks match your current preferences. Try saving an item or relaxing a filter in Settings.</p>
          </div>
        )}
        {visibleFeed.map(item => (
          <div key={item.id} className={`card ${styles.card}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardEmoji}>{item.emoji}</span>
              <div>
                <div className={styles.cardMerchant}>{item.merchant} · {item.category}</div>
                <div className={styles.cardType}>{TYPE_LABEL[item.type] ?? item.type}</div>
              </div>
            </div>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            <p className={styles.cardDesc}>{item.desc}</p>
            {item.note && <div className={styles.simLabel}>⚠️ {item.note}</div>}
            <div className={styles.cardFooter}>
              <div className={styles.tags}>
                {item.tags.map(t => (
                  <span key={t} className={`badge ${TAG_STYLE[t] ?? 'badge-coral'}`}>{t.replace(/_/g, ' ')}</span>
                ))}
              </div>
              <div className={styles.cardActions}>
                {item.price && <span className={styles.price}>${item.price.toFixed(2)}</span>}
                <button className="btn btn-ghost btn-sm" onClick={() => skip(item)} title="Not interested">✕ Skip</button>
                <button
                  className={`btn btn-ghost btn-sm ${saved[item.id] ? styles.savedBtn : ''}`}
                  onClick={() => saveProduct(item)}
                  disabled={saved[item.id]}
                >
                  {saved[item.id] ? '❤️ Saved' : '❤️ Save'}
                </button>
                {item.url ? (
                  <a className="btn btn-primary btn-sm" href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.cta}
                  </a>
                ) : (
                  <button className="btn btn-primary btn-sm">{item.cta}</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className={styles.feedNote}>
        The app controls its own feed. It cannot guarantee placement in any external platform's feed, or link accounts across different marketplaces.
      </p>
    </div>
  );
}
