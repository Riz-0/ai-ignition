import React, { useState, useEffect } from 'react';

/**
 * QR code component.
 *
 * Renders a QR code for the given value via a public QR image API.
 * If the image fails to load (no network, blocked, etc.) we fall back
 * to a plain-text rendering of the URL so the download/share flow
 * still works in a demo with no internet — the viewer can type the URL.
 *
 * No external npm dependency, so it installs cleanly and works offline
 * for the app shell itself (only the QR *image* needs network).
 */
export default function QRCode({ value, size = 200, alt = 'QR code', className, style }) {
  const [failed, setFailed] = useState(false);
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(value)}`;

  // Reset the failed flag if the value changes (e.g. URL changes)
  useEffect(() => { setFailed(false); }, [value]);

  const wrapStyle = {
    width: size, height: size,
    background: '#fff',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    boxSizing: 'border-box',
    ...style,
  };

  if (failed) {
    return (
      <div className={className} style={wrapStyle}>
        <div style={{ textAlign: 'center', color: '#1a1d2b', fontSize: Math.max(9, size / 22), lineHeight: 1.3, wordBreak: 'break-all', fontFamily: 'monospace' }}>
          {value}
        </div>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      width={size}
      height={size}
      alt={alt}
      style={{ borderRadius: 10, display: 'block', ...style }}
      onError={() => setFailed(true)}
    />
  );
}
