import React, { useState, useEffect, useRef } from 'react';
import useAppStore from '../store/appStore.js';
import { setFocusedProduct } from './assistantBus.js';
import { getFeedVideos } from '../data/feedVideos.js';

// Button text for the shop link, by how exact the link is.
const SHOP_LABEL = { product: 'Buy', brand: 'Shop', search: 'Find' };

// The sound on/off choice is remembered on this device.
const SOUND_KEY = '2am-feed-sound';
function readSoundPref() {
  try { return localStorage.getItem(SOUND_KEY) === 'on'; } catch { return false; }
}
function saveSoundPref(on) {
  try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch { /* storage unavailable */ }
}

export default function ProductFeed() {
  // Pull wishlist state and actions directly from global app store
  const { wishlist, addToWishlist, removeFromWishlist, addReminder, startPurchaseCheck,
          activeAccountId, shopperProfile } = useAppStore();

  // Each account gets its own videos (Emily's, John's, or interest-matched).
  const [products, setProducts] = useState(() => getFeedVideos(activeAccountId, shopperProfile));
  const [currentIndex, setCurrentIndex] = useState(0);
  const feedRef = useRef(null);
  
  // Store refs for all video elements so we can control them imperatively
  const videoRefs = useRef([]);

  // Sound: browsers only autoplay muted video until the user taps. If sound
  // was left on last time but the browser blocks it, play muted and turn it
  // back on with the next tap on the feed.
  const [soundOn, setSoundOn] = useState(readSoundPref);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const muted = !soundOn || soundBlocked;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    setProducts(getFeedVideos(activeAccountId, shopperProfile));
    setCurrentIndex(0);
  }, [activeAccountId, shopperProfile]);

  // Force active video to restart/play whenever currentIndex changes
  useEffect(() => {
    videoRefs.current.forEach((videoEl, index) => {
      if (!videoEl) return;
      if (index === currentIndex) {
        videoEl.currentTime = 0;
        videoEl.muted = mutedRef.current;
        videoEl.play().catch(() => {
          // Sound not allowed yet: play muted until the user taps.
          if (!videoEl.muted) {
            videoEl.muted = true;
            setSoundBlocked(true);
            videoEl.play().catch(() => {});
          }
        });
      } else {
        videoEl.pause();
      }
    });
  }, [currentIndex, products]);

  // Apply sound changes to the playing video without restarting it.
  useEffect(() => {
    const v = videoRefs.current[currentIndex];
    if (v) v.muted = muted;
  }, [muted, currentIndex]);

  const toggleSound = () => {
    const next = muted;            // muted now → turn sound on, and vice versa
    setSoundOn(next);
    setSoundBlocked(false);
    saveSoundPref(next);
    // Unmute inside the tap itself, so the browser counts it as permission.
    const v = videoRefs.current[currentIndex];
    if (v) {
      v.muted = !next;
      if (next) v.play().catch(() => {});
    }
  };

  // Sound was on last time but blocked on load: the first tap turns it back on.
  const resumeSound = () => {
    if (!soundBlocked) return;
    setSoundBlocked(false);
    const v = videoRefs.current[currentIndex];
    if (v) {
      v.muted = false;
      v.play().catch(() => {});
    }
  };

  // Tell the floating 2AM Assistant which product is on screen, so it can pop
  // a budget-aware nudge while the user scrolls. Cleared when the feed unmounts.
  useEffect(() => {
    if (products.length) setFocusedProduct(products[currentIndex] ?? null);
  }, [currentIndex, products]);

  useEffect(() => () => setFocusedProduct(null), []);

  // Keyboard navigation support for desktop (Arrow Up / Arrow Down)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' && currentIndex < products.length - 1) {
        e.preventDefault();
        scrollToIndex(currentIndex + 1);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        scrollToIndex(currentIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, products.length]);

  const scrollToIndex = (index) => {
    setCurrentIndex(index);
    if (feedRef.current) {
      const cardHeight = feedRef.current.clientHeight;
      feedRef.current.scrollTo({
        top: index * cardHeight,
        behavior: 'smooth'
      });
    }
  };

  // Optional: Update index via manual scrolling scroll-snap tracking
  const handleScroll = () => {
    if (feedRef.current) {
      const cardHeight = feedRef.current.clientHeight;
      const newIndex = Math.round(feedRef.current.scrollTop / cardHeight);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < products.length) {
        setCurrentIndex(newIndex);
      }
    }
  };

  // Toggle wishlist action using your global store functions
  const handleToggleWishlist = (product) => {
    const isWishlisted = wishlist.some((item) => item.id === product.id);

    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        title: product.title,
        price: product.price,
        budget: product.price,
        url: product.url,
        notes: product.description
      });
      // Saved between 10pm and 5am? Sleep on it: remind them tomorrow morning.
      const hour = new Date().getHours();
      if (hour >= 22 || hour < 5) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + (hour >= 22 ? 1 : 0));
        const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
        addReminder({ productTitle: product.title, date, source: 'late-night-save' });
      }
    }
  };

  return (
    <div className="feed-outer-wrapper">
      {/* Desktop Navigation Buttons */}
      <div className="desktop-controls">
        <button 
          onClick={() => scrollToIndex(Math.max(0, currentIndex - 1))} 
          disabled={currentIndex === 0}
          className="control-arrow-btn"
          title="Previous Video"
        >
          ▲
        </button>
        <button 
          onClick={() => scrollToIndex(Math.min(products.length - 1, currentIndex + 1))} 
          disabled={currentIndex === products.length - 1}
          className="control-arrow-btn"
          title="Next Video"
        >
          ▼
        </button>
      </div>

      {/* Main Feed Viewport */}
      <div 
        className="feed-viewport" 
        ref={feedRef} 
        onScroll={handleScroll}
        onPointerDown={resumeSound}
      >
        {products.map((product, index) => {
          const isWishlisted = wishlist.some((item) => item.id === product.id);
          return (
            <div key={product.id} className="feed-card">
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={product.videoUrl}
                loop
                muted
                playsInline
                className="feed-video"
              />

              <div className="feed-overlay">
                <div className="product-details">
                  <p className="merchant">{product.merchant} · {product.category}</p>
                  <h3>{product.title}</h3>
                  <p className="price">
                    {product.approx ? '~' : ''}${product.price.toFixed(2)}
                    {product.approx && <span className="price-note"> typical price</span>}
                  </p>
                  <p className="description">{product.description}</p>
                </div>

                <div className="action-sidebar">
                  <button
                    type="button"
                    onClick={toggleSound}
                    className={`wishlist-btn sound-btn ${soundBlocked ? 'sound-hint' : ''}`}
                    aria-pressed={!muted}
                    aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
                  >
                    <span className="icon">{muted ? '🔇' : '🔊'}</span>
                    <span className="label">{soundBlocked ? 'Tap for sound' : muted ? 'Sound off' : 'Sound on'}</span>
                  </button>
                  {product.url && (
                    <a href={product.url} target="_blank" rel="noopener noreferrer"
                      onClick={() => startPurchaseCheck(product, 'discover')}
                      className="wishlist-btn shop-btn"
                      title={product.linkType === 'search' ? 'Search for this item on Shopee' : `Open ${product.merchant}`}>
                      <span className="icon">🛍️</span>
                      <span className="label">{SHOP_LABEL[product.linkType] ?? 'Shop'} ↗</span>
                    </a>
                  )}
                  <button
                    onClick={() => handleToggleWishlist(product)}
                    className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
                  >
                    <span className="icon">{isWishlisted ? '❤️' : '🤍'}</span>
                    <span className="label">{isWishlisted ? 'Saved' : 'Wishlist'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}