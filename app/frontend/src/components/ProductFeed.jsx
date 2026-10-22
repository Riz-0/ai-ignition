import React, { useState, useEffect, useRef } from 'react';
import useAppStore from '../store/appStore.js';
import { setFocusedProduct } from './assistantBus.js';

export default function ProductFeed() {
  const [products, setProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const feedRef = useRef(null);
  
  // Store refs for all video elements so we can control them imperatively
  const videoRefs = useRef([]);

  // Pull wishlist state and actions directly from global app store
  const { wishlist, addToWishlist, removeFromWishlist } = useAppStore();

  // Load local JSON on mount
  useEffect(() => {
    fetch('/products.json')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Failed to load products:', err));
  }, []);

  // Force active video to restart/play whenever currentIndex changes
  useEffect(() => {
    videoRefs.current.forEach((videoEl, index) => {
      if (!videoEl) return;
      if (index === currentIndex) {
        videoEl.currentTime = 0;
        videoEl.play().catch((err) => console.log("Autoplay prevented:", err));
      } else {
        videoEl.pause();
      }
    });
  }, [currentIndex, products]);

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
        url: product.videoUrl,
        notes: product.description
      });
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
                  <h3>{product.title}</h3>
                  <p className="price">${product.price.toFixed(2)}</p>
                  <p className="description">{product.description}</p>
                </div>

                <div className="action-sidebar">
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