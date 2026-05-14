import React, { useState } from 'react';

export function Avatar({ user, size = 36, showRing = false, isGroup = false }) {
  const name = user?.name || user?.username || '?';
  const photoUrl = user?.avatar || user?.photo || null;
  const [imgError, setImgError] = useState(false);
  const initials = name.charAt(0).toUpperCase();
  const bgColor  = isGroup ? '#1e2130' : '#00c4a8';
  const txtColor = isGroup ? '#00e5c3' : '#0a0c10';
  const showImg  = photoUrl && !imgError;
  return (
    <div style={{ width: size, height: size, borderRadius: isGroup ? 'var(--radius-sm)' : '50%', flexShrink: 0, borderWidth: 2, borderStyle: 'solid', borderColor: showRing ? 'var(--accent)' : 'var(--border)', boxShadow: showRing ? 'var(--shadow-glow)' : 'none', overflow: 'hidden', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', position: 'relative' }}>
      {showImg ? <img src={photoUrl} alt={name} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }} /> : <span style={{ fontSize: size * 0.4, fontWeight: 700, color: txtColor, lineHeight: 1, userSelect: 'none' }}>{initials}</span>}
    </div>
  );
}

export function OnlineDot({ online }) {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: online ? 'var(--accent)' : '#3a3f50', boxShadow: online ? '0 0 6px var(--accent)' : 'none' }} />;
}

export function IconBtn({ children, onClick, title, danger = false, active = false, disabled = false, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 'var(--radius-sm)', borderWidth: 1, borderStyle: 'solid', borderColor: active ? 'var(--accent)' : 'var(--border)', background: active ? 'var(--accent-muted)' : hov ? (danger ? 'var(--danger-muted)' : 'var(--bg-elevated)') : 'transparent', color: active ? 'var(--accent)' : hov ? (danger ? 'var(--danger)' : 'var(--text-primary)') : (danger ? 'var(--danger)' : 'var(--text-muted)'), cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, transition: 'all 0.15s', flexShrink: 0, ...style }}>
      {children}
    </button>
  );
}

export function Spinner({ size = 16 }) {
  return <div style={{ width: size, height: size, borderWidth: 2, borderStyle: 'solid', borderColor: 'currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}

export function FocusInput({ label, value, onChange, type = 'text', placeholder, style = {} }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', borderWidth: 1, borderStyle: 'solid', borderColor: focused ? 'var(--border-accent)' : 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', fontFamily: 'inherit' }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
    </div>
  );
}

export function Overlay({ children, onClose, zIndex = 200 }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex, padding: 16 }}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export function ModalBox({ children, maxWidth = 420 }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 64px rgba(0,0,0,0.6)' }}>
      {children}
    </div>
  );
}
