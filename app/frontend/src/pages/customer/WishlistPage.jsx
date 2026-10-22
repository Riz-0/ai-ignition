import React, { useState } from 'react';
import useAppStore from '../../store/appStore.js';
import { useT } from '../../i18n/I18nProvider.jsx';
import styles from './WishlistPage.module.css';

const EMPTY = { title: '', url: '', price: '', budget: '', reminderDate: '', notes: '' };

export default function WishlistPage() {
  const { wishlist, addToWishlist, updateWishlistItem, removeFromWishlist, addReminder } = useAppStore();
  const t = useT();
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
      <h1 className="page-title">{t('wishlist.title')}</h1>
      <p className="page-sub">{t('wishlist.sub')}</p>

      <div className={styles.toolbar}>
        <span className={styles.count}>{t('wishlist.itemCount', { n: wishlist.length })}</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? t('wishlist.cancel') : t('wishlist.saveProduct')}
        </button>
      </div>

      {showForm && (
        <form className={`card ${styles.form}`} onSubmit={submit}>
          <h3 className={styles.formTitle}>{t('wishlist.addTitle')}</h3>
          <div className={styles.formGrid}>
            <label className={styles.label}>
              {t('wishlist.productName')}
              <input className={styles.input} required value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder={t('wishlist.productNamePh')} />
            </label>
            <label className={styles.label}>
              {t('wishlist.productUrl')}
              <input className={styles.input} type="url" value={form.url}
                onChange={e => setForm({ ...form, url: e.target.value })}
                placeholder="https://..." />
            </label>
            <label className={styles.label}>
              {t('wishlist.listedPrice')}
              <input className={styles.input} type="number" min="0" value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder={t('wishlist.listedPricePh')} />
            </label>
            <label className={styles.label}>
              {t('wishlist.yourBudget')}
              <input className={styles.input} type="number" min="0" value={form.budget}
                onChange={e => setForm({ ...form, budget: e.target.value })}
                placeholder={t('wishlist.yourBudgetPh')} />
            </label>
            <label className={styles.label}>
              {t('wishlist.remindMe')}
              <input className={styles.input} type="date" value={form.reminderDate}
                onChange={e => setForm({ ...form, reminderDate: e.target.value })} />
            </label>
            <label className={`${styles.label} ${styles.full}`}>
              {t('wishlist.notes')}
              <input className={styles.input} value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder={t('wishlist.notesPh')} />
            </label>
          </div>
          <button type="submit" className="btn btn-primary">{t('wishlist.saveBtn')}</button>
        </form>
      )}

      {wishlist.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <span className={styles.emptyIcon}>❤️</span>
          <p>{t('wishlist.emptyBody')}</p>
        </div>
      ) : (
        <div className={styles.list}>
          {wishlist.map(item => <WishlistCard key={item.id} item={item} onRemove={removeFromWishlist} onUpdate={updateWishlistItem} t={t} />)}
        </div>
      )}
    </div>
  );
}

function WishlistCard({ item, onRemove, onUpdate, t }) {
  const startPurchaseCheck = useAppStore((s) => s.startPurchaseCheck);
  const overBudget = item.price && item.budget && Number(item.price) > Number(item.budget);

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.cardTop}>
        <div>
          <div className={styles.cardTitle}>{item.title}</div>
          {item.notes && <div className={styles.cardNotes}>{item.notes}</div>}
          <div className={styles.cardMeta}>
            {item.price  && <span className={`badge ${overBudget ? 'badge-red' : 'badge-green'}`}>${item.price} {t('wishlist.listedLabel')}</span>}
            {item.budget && <span className="badge badge-amber">{t('wishlist.budgetLabel')}${item.budget}</span>}
            {item.reminderDate && <span className="badge badge-teal">📅 {item.reminderDate}</span>}
          </div>
        </div>
        <div className={styles.cardActions}>
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm"
              onClick={() => startPurchaseCheck({ ...item, price: Number(item.price ?? item.budget) || null }, 'wishlist')}>{t('wishlist.viewBtn')}</a>
          )}
          <button className="btn btn-danger btn-sm" onClick={() => onRemove(item.id)}>✕</button>
        </div>
      </div>
      {overBudget && (
        <div className={styles.budgetAlert}>
          {t('wishlist.overBudgetAlert')}
        </div>
      )}
    </div>
  );
}
