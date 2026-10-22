import React, { useState } from 'react';
import useAppStore from '../../store/appStore.js';
import { useT } from '../../i18n/I18nProvider.jsx';
import styles from './CataloguePage.module.css';

const EMPTY = { name: '', category: '', price: '', description: '', inStock: true };

export default function CataloguePage() {
  const { catalogue, addProduct, updateProduct } = useAppStore();
  const t = useT();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY);

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    addProduct({ ...form, price: Number(form.price) || 0 });
    setForm(EMPTY);
    setShowForm(false);
  }

  return (
    <div>
      <h1 className="page-title">{t('catalogue.title')}</h1>
      <p className="page-sub">{t('catalogue.sub')}</p>

      <div className={styles.toolbar}>
        <span className={styles.count}>{t('catalogue.productCount', { n: catalogue.length })}</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? t('catalogue.cancel') : t('catalogue.addProduct')}
        </button>
      </div>

      {showForm && (
        <form className={`card ${styles.form}`} onSubmit={submit}>
          <h3 className={styles.formTitle}>{t('catalogue.addTitle')}</h3>
          <div className={styles.formGrid}>
            <label className={styles.label}>
              {t('catalogue.name')} <input className={styles.input} required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('catalogue.namePh')} />
            </label>
            <label className={styles.label}>
              {t('catalogue.category')} <input className={styles.input} value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })} placeholder={t('catalogue.categoryPh')} />
            </label>
            <label className={styles.label}>
              {t('catalogue.price')} <input className={styles.input} type="number" min="0" step="0.01" value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })} />
            </label>
            <label className={`${styles.label} ${styles.checkLabel}`}>
              <span>{t('catalogue.inStock')}</span>
              <input type="checkbox" checked={form.inStock}
                onChange={e => setForm({ ...form, inStock: e.target.checked })} />
            </label>
            <label className={`${styles.label} ${styles.full}`}>
              {t('catalogue.description')} <input className={styles.input} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder={t('catalogue.descriptionPh')} />
            </label>
          </div>
          <button type="submit" className="btn btn-primary">{t('catalogue.addBtn')}</button>
          <p className={styles.subtle}>{t('catalogue.verifyNote')}</p>
        </form>
      )}

      {catalogue.length === 0 ? (
        <div className={`card ${styles.empty}`}>{t('catalogue.emptyBody')}</div>
      ) : (
        <div className={styles.grid}>
          {catalogue.map(p => <ProductCard key={p.id} product={p} onUpdate={updateProduct} t={t} />)}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product: p, onUpdate, t }) {
  return (
    <div className={`card ${styles.pCard}`}>
      <div className={styles.pHeader}>
        <div>
          <div className={styles.pName}>{p.name}</div>
          {p.category && <div className={styles.pCategory}>{p.category}</div>}
        </div>
        <div className={styles.pPrice}>${Number(p.price).toFixed(2)}</div>
      </div>
      {p.description && <p className={styles.pDesc}>{p.description}</p>}
      <div className={styles.pFooter}>
        <span className={`badge ${p.inStock ? 'badge-green' : 'badge-red'}`}>
          {p.inStock ? t('catalogue.inStockBadge') : t('catalogue.outOfStockBadge')}
        </span>
        <button
          className={`btn btn-ghost btn-sm`}
          onClick={() => onUpdate(p.id, { inStock: !p.inStock })}
        >
          {p.inStock ? t('catalogue.markOutOfStock') : t('catalogue.markInStock')}
        </button>
      </div>
    </div>
  );
}
