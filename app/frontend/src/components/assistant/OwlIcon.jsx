import React from 'react';

/**
 * Hoot the owl — the 2AM Assistant's icon. A night owl for a 2am shopping
 * buddy. Drawn to sit on the gradient launcher or a card background.
 */
export default function OwlIcon({ size = 28, blink = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      {/* ear tufts */}
      <path d="M14 14 L20 26 L11 25 Z" fill="#fde7c7" />
      <path d="M50 14 L44 26 L53 25 Z" fill="#fde7c7" />
      {/* body */}
      <ellipse cx="32" cy="38" rx="21" ry="22" fill="#fde7c7" />
      {/* belly */}
      <ellipse cx="32" cy="46" rx="12" ry="11" fill="#fff6ea" />
      <path d="M26 44 q3 2 6 0 q3 2 6 0" stroke="#e9c79b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M27 49 q2.5 1.6 5 0 q2.5 1.6 5 0" stroke="#e9c79b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* eye discs */}
      <circle cx="23.5" cy="31" r="8.5" fill="#fff" />
      <circle cx="40.5" cy="31" r="8.5" fill="#fff" />
      {blink ? (
        <>
          <path d="M19 31 q4.5 3 9 0" stroke="#2b2140" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M36 31 q4.5 3 9 0" stroke="#2b2140" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="24.5" cy="31.5" r="4.4" fill="#2b2140" />
          <circle cx="39.5" cy="31.5" r="4.4" fill="#2b2140" />
          <circle cx="26" cy="30" r="1.5" fill="#fff" />
          <circle cx="41" cy="30" r="1.5" fill="#fff" />
        </>
      )}
      {/* beak */}
      <path d="M29.5 37 L34.5 37 L32 41.5 Z" fill="#f59e0b" />
      {/* blush */}
      <ellipse cx="16.5" cy="39" rx="3" ry="1.8" fill="#ff8fa3" opacity=".7" />
      <ellipse cx="47.5" cy="39" rx="3" ry="1.8" fill="#ff8fa3" opacity=".7" />
    </svg>
  );
}
