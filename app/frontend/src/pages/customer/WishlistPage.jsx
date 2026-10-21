import React, { useState } from 'react';
import useAppStore from '../../store/appStore.js';
import styles from './WishlistPage.module.css';

const EMPTY = { title: '', url: '', price: '', budget: '', reminderDate: '', notes: '' };

export default function WishlistPage() {
  const { wishlist, addToWishlist, updateWishlistItem, removeFromWishlist, addReminder } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY);

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const item = { ...form, price: Number(form.price) || null, budget: Number(form.budget) || null };
    addToWishlist(item);
    if (item.reminderDate) {
      addReminder({ productTitle: item.title, date: item.reminderDate });
    }
    setForm(EMPTY);
    setShowForm(false);
  }

  return (
    <div>
      <h1 className="page-title">Wishlist</h1>
      <p className="page-sub">Products you've saved. Set a budget or a reminder date and your 2AM Assistant will follow up.</p>

      <div className={styles.toolbar}>
        <span className={styles.count}>{wishlist.length} item{wishlist.length !== 1 ? 's' : ''}</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ Cancel' : '+ Save product'}
        </button>
      </div>

      {showForm && (
        <form className={`card ${styles.form}`} onSubmit={submit}>
          <h3 className={styles.formTitle}>Add to wishlist</h3>
          <div className={styles.formGrid}>
            <label className={styles.label}>
              Product name *
              <input className={styles.input} required value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Office shoes — black leather" />
            </label>
            <label className={styles.label}>
              Product URL
              <input className={styles.input} type="url" value={form.url}
                onChange={e => setForm({ ...form, url: e.target.value })}
                placeholder="https://..." />
            </label>
            <label className={styles.label}>
              Listed price ($)
              <input className={styles.input} type="number" min="0" value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="e.g. 45" />
            </label>
            <label className={styles.label}>
              Your budget ($)
              <input className={styles.input} type="number" min="0" value={form.budget}
                onChange={e => setForm({ ...form, budget: e.target.value })}
                placeholder="e.g. 40" />
            </label>
            <label className={styles.label}>
              Remind me on
              <input className={styles.input} type="date" value={form.reminderDate}
                onChange={e => setForm({ ...form, reminderDate: e.target.value })} />
            </label>
            <label className={`${styles.label} ${styles.full}`}>
              Notes
              <input className={styles.input} value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. Need size 7, prefer leather" />
            </label>
          </div>
          <button type="submit" className="btn btn-primary">Save to wishlist</button>
        </form>
      )}

      {wishlist.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <span className={styles.emptyIcon}>❤️</span>
          <p>Nothing saved yet. Add a product above to get started.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {wishlist.map(item => <WishlistCard key={item.id} item={item} onRemove={removeFromWishlist} onUpdate={updateWishlistItem} />)}
        </div>
      )}
    </div>
  );
}

function WishlistCard({ item, onRemove, onUpdate }) {
  const overBudget = item.price && item.budget && Number(item.price) > Number(item.budget);

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.cardTop}>
        <div>
          <div className={styles.cardTitle}>{item.title}</div>
          {item.notes && <div className={styles.cardNotes}>{item.notes}</div>}
          <div className={styles.cardMeta}>
            {item.price  && <span className={`badge ${overBudget ? 'badge-red' : 'badge-green'}`}>${item.price} listed</span>}
            {item.budget && <span className="badge badge-amber">Budget: ${item.budget}</span>}
            {item.reminderDate && <span className="badge badge-teal">📅 {item.reminderDate}</span>}
          </div>
        </div>
        <div className={styles.cardActions}>
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">View →</a>
          )}
          <button className="btn btn-danger btn-sm" onClick={() => onRemove(item.id)}>✕</button>
        </div>
      </div>
      {overBudget && (
        <div className={styles.budgetAlert}>
          ⚠️ Listed price is above your budget. Your 2AM Assistant will alert you if it drops within range.
        </div>
      )}
    </div>
  );
}
