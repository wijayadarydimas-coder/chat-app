'use client';
// src/app/chat/page.jsx — v5
// New: Multi-select delete (long press mobile / right-click desktop), Voice Notes

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { connectSocket } from '@/lib/socket-client';
import Cookies from 'js-cookie';

// ═══════════════════════════════════════════════════════════
//  ICONS
// ═══════════════════════════════════════════════════════════
const Icon = {
  Logout:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Send:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Attach:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  Video:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  Phone:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.63a16 16 0 0 0 6.29 6.29l.95-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Search:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Trash:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Copy:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Close:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Download:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Edit:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Settings:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Crown:     () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>,
  Mic:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  MicOff:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  VideoOff:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  PhoneOff:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11l-.94.94"/><line x1="23" y1="1" x2="1" y2="23"/></svg>,
  Plus:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Camera:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  X:         () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Users:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Check:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Back:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  Menu:      () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  ChevLeft:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevRight: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ZoomIn:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  ZoomOut:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  RotateCW:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Play:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Pause:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  StopCircle: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6"/></svg>,
  Waveform:  () => <svg width="40" height="16" viewBox="0 0 40 16" fill="none"><rect x="0" y="6" width="2" height="4" rx="1" fill="currentColor" opacity="0.5"/><rect x="4" y="3" width="2" height="10" rx="1" fill="currentColor" opacity="0.7"/><rect x="8" y="1" width="2" height="14" rx="1" fill="currentColor"/><rect x="12" y="4" width="2" height="8" rx="1" fill="currentColor" opacity="0.8"/><rect x="16" y="6" width="2" height="4" rx="1" fill="currentColor" opacity="0.5"/><rect x="20" y="2" width="2" height="12" rx="1" fill="currentColor" opacity="0.9"/><rect x="24" y="5" width="2" height="6" rx="1" fill="currentColor" opacity="0.6"/><rect x="28" y="3" width="2" height="10" rx="1" fill="currentColor" opacity="0.75"/><rect x="32" y="6" width="2" height="4" rx="1" fill="currentColor" opacity="0.5"/><rect x="36" y="4" width="2" height="8" rx="1" fill="currentColor" opacity="0.65"/></svg>,
  Redo:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>,
};

// ═══════════════════════════════════════════════════════════
//  SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════
function Avatar({ user, size = 36, showRing = false, isGroup = false }) {
  const name = user?.name || user?.username || '?';
  const photoUrl = user?.avatar || user?.photo || null;
  const [imgError, setImgError] = useState(false);
  const initials = name.charAt(0).toUpperCase();
  const bgColor  = isGroup ? '#1e2130' : '#00c4a8';
  const txtColor = isGroup ? '#00e5c3' : '#0a0c10';
  const showImg  = photoUrl && !imgError;
  return (
    <div style={{ width: size, height: size, borderRadius: isGroup ? 'var(--radius-sm)' : '50%', flexShrink: 0, borderWidth: 2, borderStyle: 'solid', borderColor: showRing ? 'var(--accent)' : 'var(--border)', boxShadow: showRing ? 'var(--shadow-glow)' : 'none', overflow: 'hidden', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', position: 'relative' }}>
      {showImg ? (
        <img src={photoUrl} alt={name} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }} />
      ) : (
        <span style={{ fontSize: size * 0.4, fontWeight: 700, color: txtColor, lineHeight: 1, userSelect: 'none' }}>{initials}</span>
      )}
    </div>
  );
}

function OnlineDot({ online }) {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: online ? 'var(--accent)' : '#3a3f50', boxShadow: online ? '0 0 6px var(--accent)' : 'none' }} />;
}

function IconBtn({ children, onClick, title, danger = false, active = false, disabled = false, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 'var(--radius-sm)', borderWidth: 1, borderStyle: 'solid', borderColor: active ? 'var(--accent)' : 'var(--border)', background: active ? 'var(--accent-muted)' : hov ? (danger ? 'var(--danger-muted)' : 'var(--bg-elevated)') : 'transparent', color: active ? 'var(--accent)' : hov ? (danger ? 'var(--danger)' : 'var(--text-primary)') : (danger ? 'var(--danger)' : 'var(--text-muted)'), cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, transition: 'all 0.15s', flexShrink: 0, ...style }}>
      {children}
    </button>
  );
}

function Spinner({ size = 16 }) {
  return <div style={{ width: size, height: size, borderWidth: 2, borderStyle: 'solid', borderColor: 'currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}

function FocusInput({ label, value, onChange, type = 'text', placeholder, style = {} }) {
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

function Overlay({ children, onClose, zIndex = 200 }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex, padding: 16 }}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ModalBox({ children, maxWidth = 420 }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 64px rgba(0,0,0,0.6)' }}>
      {children}
    </div>
  );
}

const btnCallStyle = (active) => ({ width: 52, height: 52, borderRadius: '50%', border: 'none', background: active ? 'var(--danger)' : 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' });

// ═══════════════════════════════════════════════════════════
//  UPLOAD HELPER
// ═══════════════════════════════════════════════════════════
async function uploadFile(file, chatId = 'profile') {
  const form = new FormData();
  form.append('file', file);
  form.append('chatId', chatId);
  const res  = await fetch('/api/chat/upload', { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload gagal');
  return data.fileUrl;
}

// ═══════════════════════════════════════════════════════════
//  VOICE NOTE RECORDER
// ═══════════════════════════════════════════════════════════
function VoiceNoteRecorder({ onSend, onCancel, disabled }) {
  const [state, setState] = useState('idle'); // idle | recording | preview
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const animRef = useRef(null);
  const [waveHeights, setWaveHeights] = useState(Array(20).fill(3));

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState('preview');
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(100);
      mediaRef.current = mr;
      setState('recording');
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      // Animate waveform
      const animate = () => {
        setWaveHeights(Array(20).fill(0).map(() => Math.floor(Math.random() * 14) + 2));
        animRef.current = requestAnimationFrame(() => setTimeout(animate, 100));
      };
      animate();
    } catch (e) { alert('Tidak bisa akses mikrofon: ' + e.message); }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animRef.current);
    mediaRef.current?.stop();
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
    onSend(file, duration);
    resetAll();
  };

  const resetAll = () => {
    setState('idle');
    setDuration(0);
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.pause();
    setWaveHeights(Array(20).fill(3));
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  useEffect(() => {
    return () => { clearInterval(timerRef.current); cancelAnimationFrame(animRef.current); if (audioUrl) URL.revokeObjectURL(audioUrl); };
  }, []);

  if (state === 'idle') {
    return (
      <button type="button" onClick={startRecording} disabled={disabled} title="Rekam voice note"
        style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
        <Icon.Mic />
      </button>
    );
  }

  if (state === 'recording') {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0, animation: 'pulse 1s ease infinite' }} />
        {/* Live waveform */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, height: 28, overflow: 'hidden' }}>
          {waveHeights.map((h, i) => (
            <div key={i} style={{ flex: 1, height: h, background: 'var(--accent)', borderRadius: 2, transition: 'height 0.1s', minHeight: 2 }} />
          ))}
        </div>
        <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmt(duration)}</span>
        <button type="button" onClick={stopRecording} title="Stop rekam"
          style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--danger)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon.StopCircle />
        </button>
      </div>
    );
  }

  // preview
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 2px' }}>
      {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />}
      <button type="button" onClick={togglePlay}
        style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--accent)', color: '#0a0c10', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isPlaying ? <Icon.Pause /> : <Icon.Play />}
      </button>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><Icon.Waveform /></span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmt(duration)}</span>
      </div>
      <button type="button" onClick={resetAll} title="Rekam ulang"
        style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon.Redo />
      </button>
      <button type="button" onClick={handleSend}
        style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--accent)', color: '#0a0c10', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon.Send />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  VOICE NOTE BUBBLE
// ═══════════════════════════════════════════════════════════
function VoiceNoteBubble({ msg, isMe }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s)%60).padStart(2,'0')}`;
  const totalDur = msg.voiceDuration || 0;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const t = audioRef.current.currentTime;
    const d = audioRef.current.duration || totalDur || 1;
    setCurrentTime(t);
    setProgress((t / d) * 100);
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const d = audioRef.current.duration || totalDur || 1;
    audioRef.current.currentTime = ratio * d;
  };

  const bubbleBg = isMe ? 'var(--bubble-me)' : 'var(--bubble-them)';
  const txtColor = isMe ? '#0a0c10' : 'var(--text-primary)';
  const mutedColor = isMe ? 'rgba(10,12,16,0.6)' : 'var(--text-muted)';
  const progressBg = isMe ? 'rgba(10,12,16,0.3)' : 'var(--bg-hover)';
  const progressFill = isMe ? 'rgba(10,12,16,0.7)' : 'var(--accent)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180, maxWidth: 240 }}>
      {msg.fileUrl && <audio ref={audioRef} src={msg.fileUrl} onTimeUpdate={handleTimeUpdate} onEnded={() => { setIsPlaying(false); setProgress(0); setCurrentTime(0); }} />}
      <button onClick={togglePlay}
        style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: isMe ? 'rgba(10,12,16,0.2)' : 'var(--accent-muted)', color: isMe ? '#0a0c10' : 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isPlaying ? <Icon.Pause /> : <Icon.Play />}
      </button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Waveform bars (decorative, progress-based) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1.5, height: 18, cursor: 'pointer' }} onClick={handleSeek}>
          {Array(24).fill(0).map((_, i) => {
            const barProgress = (i / 24) * 100;
            const filled = barProgress <= progress;
            const h = [8, 14, 10, 16, 8, 12, 18, 10, 14, 8, 16, 12, 10, 18, 8, 14, 10, 16, 12, 8, 14, 18, 10, 12][i];
            return <div key={i} style={{ flex: 1, height: h, borderRadius: 2, background: filled ? (isMe ? 'rgba(10,12,16,0.7)' : 'var(--accent)') : (isMe ? 'rgba(10,12,16,0.25)' : 'rgba(255,255,255,0.12)'), transition: 'background 0.1s' }} />;
          })}
        </div>
        <span style={{ fontSize: 10, color: mutedColor }}>{fmt(currentTime)} / {fmt(totalDur)}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  CONTEXT MENU (Right-click on desktop)
// ═══════════════════════════════════════════════════════════
function ContextMenu({ x, y, onSelectMessage, onCopy, onClose }) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('click', handler);
    window.addEventListener('scroll', handler);
    return () => { window.removeEventListener('click', handler); window.removeEventListener('scroll', handler); };
  }, [onClose]);

  return (
    <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', left: x, top: y, zIndex: 500, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 160, overflow: 'hidden', animation: 'fadeUp 0.12s ease' }}>
      <button onClick={() => { onSelectMessage(); onClose(); }}
        style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
        Pilih Pesan
      </button>
      {onCopy && (
        <button onClick={() => { onCopy(); onClose(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Icon.Copy /> Salin Teks
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SELECTION MODE HEADER BAR
// ═══════════════════════════════════════════════════════════
function SelectionBar({ count, onDelete, onCancel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, animation: 'fadeUp 0.15s ease' }}>
      <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
        <Icon.X />
      </button>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
        {count} pesan dipilih
      </span>
      <button onClick={onDelete} disabled={count === 0}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: count > 0 ? 'var(--danger-muted)' : 'transparent', border: `1px solid ${count > 0 ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', color: count > 0 ? 'var(--danger)' : 'var(--text-muted)', cursor: count > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all .15s' }}>
        <Icon.Trash /> Hapus ({count})
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  IMAGE CROPPER MODAL
// ═══════════════════════════════════════════════════════════
function ImageCropperModal({ show, imageSrc, onCancel, onCrop }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const imgRef = useRef(null);
  const SIZE = 300;

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => { imgRef.current = img; setZoom(1); setOffset({ x: 0, y: 0 }); setRotation(0); };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    if (!canvasRef.current || !imgRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    ctx.translate(SIZE / 2 + offset.x, SIZE / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    const w = imgRef.current.width, h = imgRef.current.height;
    ctx.drawImage(imgRef.current, -w / 2, -h / 2, w, h);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'var(--accent)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }, [zoom, rotation, offset, imageSrc]);

  const onMouseDown = (e) => { setDragging(true); dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }; };
  const onMouseMove = (e) => { if (!dragging || !dragStart.current) return; setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); };
  const onMouseUp = () => setDragging(false);
  const onTouchStart = (e) => { const t = e.touches[0]; setDragging(true); dragStart.current = { x: t.clientX - offset.x, y: t.clientY - offset.y }; };
  const onTouchMove = (e) => { if (!dragging) return; const t = e.touches[0]; setOffset({ x: t.clientX - dragStart.current.x, y: t.clientY - dragStart.current.y }); e.preventDefault(); };

  const handleCrop = () => {
    canvasRef.current.toBlob(blob => {
      if (!blob) return;
      onCrop(new File([blob], 'avatar.png', { type: 'image/png' }));
    }, 'image/png', 0.92);
  };

  if (!show || !imageSrc) return null;
  return (
    <Overlay onClose={onCancel} zIndex={300}>
      <ModalBox maxWidth={380}>
        <div style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>✂️ Sesuaikan Foto</div>
            <IconBtn onClick={onCancel}><Icon.Close /></IconBtn>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, userSelect: 'none' }}>
            <canvas ref={canvasRef} width={SIZE} height={SIZE}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onMouseUp}
              style={{ borderRadius: '50%', cursor: dragging ? 'grabbing' : 'grab', border: '2px solid var(--border-accent)', maxWidth: '100%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><Icon.ZoomOut /></span>
              <input type="range" min="0.5" max="3" step="0.05" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }} />
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><Icon.ZoomIn /></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <button onClick={() => setRotation(r => r - 90)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>↺ Putar Kiri</button>
              <button onClick={() => setRotation(r => r + 90)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Putar Kanan ↻</button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>Geser foto, gunakan slider untuk zoom</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '10px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Batal</button>
            <button onClick={handleCrop} style={{ flex: 2, padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Gunakan Foto</button>
          </div>
        </div>
      </ModalBox>
    </Overlay>
  );
}

// ═══════════════════════════════════════════════════════════
//  EDIT MY PROFILE MODAL
// ═══════════════════════════════════════════════════════════
function EditProfileModal({ show, onClose, currentUser, onSaved }) {
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [cropSrc, setCropSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (currentUser && show) { setUsername(currentUser.username || ''); setAvatarUrl(currentUser.avatar || ''); setCropSrc(null); }
  }, [currentUser, show]);

  if (!show) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setCropSrc(ev.target.result); setShowCropper(true); };
    reader.readAsDataURL(file); e.target.value = '';
  };

  const handleCropDone = async (croppedFile) => {
    setShowCropper(false); setUploading(true);
    try { const url = await uploadFile(croppedFile, 'profile'); setAvatarUrl(url); }
    catch (err) { alert(err.message); } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!username.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), avatar: avatarUrl }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      onSaved(data.user); onClose();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <>
      <Overlay onClose={onClose}>
        <ModalBox maxWidth={360}>
          <div style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Edit Profil</span>
              <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ position: 'relative', cursor: 'pointer', borderRadius: '50%' }} onClick={() => !uploading && fileRef.current?.click()} title="Ganti foto profil">
                <div style={{ width: 92, height: 92, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border-accent)', position: 'relative', background: '#00c4a8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setAvatarUrl('')} /> : <span style={{ fontSize: 36, fontWeight: 700, color: '#0a0c10' }}>{(username || '?').charAt(0).toUpperCase()}</span>}
                  <div className="avatar-hover-overlay">{uploading ? <Spinner /> : <Icon.Camera />}</div>
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{uploading ? 'Mengupload...' : 'Klik foto untuk ganti & crop'}</span>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>
            <FocusInput label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Nama kamu..." />
            <button onClick={handleSave} disabled={saving || uploading || !username.trim()}
              style={{ width: '100%', padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!username.trim() || uploading) ? 0.5 : 1 }}>
              {saving ? <Spinner /> : <><Icon.Check /> Simpan</>}
            </button>
          </div>
        </ModalBox>
      </Overlay>
      <ImageCropperModal show={showCropper} imageSrc={cropSrc} onCancel={() => setShowCropper(false)} onCrop={handleCropDone} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
//  VIEW PROFILE MODAL
// ═══════════════════════════════════════════════════════════
function ViewProfileModal({ show, onClose, targetUser, isOnline }) {
  if (!show || !targetUser) return null;
  return (
    <Overlay onClose={onClose}>
      <ModalBox maxWidth={320}>
        <div style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Profil</span>
            <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Avatar user={targetUser} size={80} showRing={isOnline} />
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{targetUser.username}</div>
            {targetUser.email && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{targetUser.email}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <OnlineDot online={isOnline} />
              <span style={{ fontSize: 13, color: isOnline ? 'var(--accent)' : 'var(--text-muted)' }}>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </ModalBox>
    </Overlay>
  );
}

// ═══════════════════════════════════════════════════════════
//  GROUP SETTINGS MODAL
// ═══════════════════════════════════════════════════════════
function GroupSettingsModal({ show, onClose, group, currentUser, users, socket, onUpdated, onDeleted }) {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [onlyAdmins, setOnlyAdmins] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('info');
  const [cropSrc, setCropSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const photoRef = useRef(null);

  useEffect(() => {
    if (group && show) { setName(group.name || ''); setPhoto(group.photo || ''); setOnlyAdmins(group.onlyAdmins || false); setTab('info'); }
  }, [group?._id, show]);

  if (!show || !group) return null;
  const adminIds = (group.admins || []).map(a => (typeof a === 'object' ? a._id : a)?.toString());
  const isAdmin = adminIds.includes(currentUser?._id?.toString());
  const members = group.members || [];

  const handlePhotoFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setCropSrc(ev.target.result); setShowCropper(true); };
    reader.readAsDataURL(file); e.target.value = '';
  };

  const handleGroupCrop = async (croppedFile) => {
    setShowCropper(false); setUploading(true);
    try { const url = await uploadFile(croppedFile, group._id); setPhoto(url); }
    catch (e) { alert(e.message); } finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/group/${group._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, photo, onlyAdmins }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      socket?.emit('group-updated', { groupId: group._id, ...data.group });
      onUpdated(data.group); onClose();
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Hapus grup "${group.name}"?`)) return;
    try {
      const res = await fetch(`/api/group/${group._id}`, { method: 'DELETE' }); const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      socket?.emit('group-deleted', { groupId: group._id }); onDeleted(group._id); onClose();
    } catch (e) { alert(e.message); }
  };

  const handleToggleAdmin = async (mid) => {
    const isNow = adminIds.includes(mid.toString());
    try {
      const res = await fetch(`/api/group/${group._id}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: mid, role: isNow ? 'member' : 'admin' }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error); onUpdated(data.group);
    } catch (e) { alert(e.message); }
  };

  const handleKick = async (mid) => {
    if (!confirm('Keluarkan member ini?')) return;
    try {
      const res = await fetch(`/api/group/${group._id}/members`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: mid }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error); onUpdated(data.group);
    } catch (e) { alert(e.message); }
  };

  const tabStyle = t => ({ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: 'inherit', color: tab === t ? 'var(--accent)' : 'var(--text-muted)', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', transition: 'all .15s' });

  return (
    <>
      <Overlay onClose={onClose}>
        <ModalBox maxWidth={460}>
          <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Pengaturan Grup</span>
            <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
          </div>
          <div style={{ display: 'flex', margin: '12px 0 0', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
            <button style={tabStyle('info')} onClick={() => setTab('info')}>Info</button>
            <button style={tabStyle('members')} onClick={() => setTab('members')}>Member ({members.length})</button>
          </div>
          <div style={{ padding: 20 }}>
            {tab === 'info' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
                  <div style={{ position: 'relative', cursor: isAdmin ? 'pointer' : 'default' }} onClick={() => isAdmin && !uploading && photoRef.current?.click()}>
                    <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '2px solid var(--border-accent)', background: '#1e2130', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {photo ? <img src={photo} alt="group" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setPhoto('')} /> : <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{(name || 'G').charAt(0).toUpperCase()}</span>}
                      {isAdmin && <div className="avatar-hover-overlay" style={{ borderRadius: 'var(--radius-sm)' }}>{uploading ? <Spinner /> : <Icon.Camera />}</div>}
                    </div>
                  </div>
                  {isAdmin && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Klik untuk ganti foto</span>}
                  <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoFile} style={{ display: 'none' }} />
                </div>
                {isAdmin ? <FocusInput label="Nama Grup" value={name} onChange={e => setName(e.target.value)} /> : <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>{group.name}</div>}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  📅 Dibuat {group.createdAt ? new Date(group.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  {group.createdBy ? ` oleh ${typeof group.createdBy === 'object' ? group.createdBy.username : (users.find(u => u._id === group.createdBy)?.username || 'Unknown')}` : ''}
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 18, cursor: 'pointer' }} onClick={() => setOnlyAdmins(v => !v)}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Hanya admin yang bisa kirim</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Mode pengumuman</div>
                    </div>
                    <div style={{ width: 44, height: 24, borderRadius: 12, position: 'relative', background: onlyAdmins ? 'var(--accent)' : '#3a3f50', transition: 'background .2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 3, left: onlyAdmins ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                    </div>
                  </div>
                )}
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {saving ? <Spinner /> : <><Icon.Check /> Simpan</>}
                    </button>
                    <button onClick={handleDelete} style={{ padding: '10px 14px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', cursor: 'pointer' }}><Icon.Trash /></button>
                  </div>
                )}
              </>
            )}
            {tab === 'members' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {members.map(m => {
                  const mid = (typeof m === 'object' ? m._id : m)?.toString();
                  const mData = typeof m === 'object' ? m : users.find(u => u._id?.toString() === mid);
                  if (!mData) return null;
                  const isMAdmin = adminIds.includes(mid);
                  const isCreator = (typeof group.createdBy === 'object' ? group.createdBy._id : group.createdBy)?.toString() === mid;
                  return (
                    <div key={mid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)' }}>
                      <Avatar user={mData} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {mData.username}{isCreator && <span style={{ color: 'var(--accent)' }}><Icon.Crown /></span>}
                        </div>
                        <div style={{ fontSize: 11, color: isMAdmin ? 'var(--accent)' : 'var(--text-muted)' }}>{isMAdmin ? 'Admin' : 'Member'}</div>
                      </div>
                      {isAdmin && mid !== currentUser?._id?.toString() && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => handleToggleAdmin(mid)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{isMAdmin ? '− Admin' : '+ Admin'}</button>
                          {!isCreator && <button onClick={() => handleKick(mid)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--danger)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}>Kick</button>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ModalBox>
      </Overlay>
      <ImageCropperModal show={showCropper} imageSrc={cropSrc} onCancel={() => setShowCropper(false)} onCrop={handleGroupCrop} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
//  CREATE GROUP MODAL
// ═══════════════════════════════════════════════════════════
function CreateGroupModal({ show, onClose, users, currentUser, onCreated }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const filtered = users.filter(u => u._id !== currentUser?._id && u.username?.toLowerCase().includes(search.toLowerCase()));
  const toggle = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/group/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, members: [...selected, currentUser._id] }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      onCreated(data.group); setName(''); setSelected([]); setSearch(''); onClose();
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  if (!show) return null;
  return (
    <Overlay onClose={onClose}>
      <ModalBox maxWidth={400}>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Grup Baru</span>
            <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
          </div>
          <FocusInput label="Nama Grup" value={name} onChange={e => setName(e.target.value)} placeholder="Nama grup..." />
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Pilih Member</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari user..." style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 8, fontFamily: 'inherit' }} />
          {selected.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
              {selected.map(id => { const u = users.find(x => x._id === id); return u ? <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 4px', background: 'var(--accent-muted)', border: '1px solid var(--border-accent)', borderRadius: 20, fontSize: 12, color: 'var(--accent)' }}><Avatar user={u} size={16} />{u.username}<span style={{ cursor: 'pointer', display: 'flex', marginLeft: 2 }} onClick={() => toggle(id)}><Icon.X /></span></span> : null; })}
            </div>
          )}
          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 16 }}>
            {filtered.map(u => (
              <div key={u._id} onClick={() => toggle(u._id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: selected.includes(u._id) ? 'var(--accent-muted)' : 'transparent', transition: 'background .12s' }}
                onMouseEnter={e => { if (!selected.includes(u._id)) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={e => { if (!selected.includes(u._id)) e.currentTarget.style.background = 'transparent'; }}>
                <Avatar user={u} size={30} />
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{u.username}</div>
                <div style={{ width: 18, height: 18, borderRadius: '50%', borderWidth: 2, borderStyle: 'solid', borderColor: selected.includes(u._id) ? 'var(--accent)' : 'var(--border)', background: selected.includes(u._id) ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {selected.includes(u._id) && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#0a0c10" strokeWidth="2.5" strokeLinecap="round"/></svg>}
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleCreate} disabled={!name.trim() || selected.length === 0 || loading}
            style={{ width: '100%', padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!name.trim() || !selected.length) ? 0.5 : 1 }}>
            {loading ? <Spinner /> : `Buat Grup (${selected.length} member)`}
          </button>
        </div>
      </ModalBox>
    </Overlay>
  );
}

// ═══════════════════════════════════════════════════════════
//  SEARCH PANEL
// ═══════════════════════════════════════════════════════════
function SearchPanel({ messages, onClose, onJumpTo }) {
  const [query, setQuery] = useState('');
  const results = query.trim() ? messages.filter(m => m.content?.toLowerCase().includes(query.toLowerCase())) : [];
  return (
    <div style={{ width: 260, minWidth: 220, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><Icon.Search /></span>
        <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari pesan..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit' }} />
        <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {query && results.length === 0 && <div style={{ padding: 14, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>Tidak ditemukan</div>}
        {results.map((msg, i) => (
          <div key={i} onClick={() => onJumpTo(msg._id)} style={{ padding: '9px 11px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginBottom: 4, background: 'var(--bg-elevated)' }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 3 }}>{msg.sender?.username || 'User'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {msg.content.split(new RegExp(`(${query})`, 'gi')).map((p, j) =>
                p.toLowerCase() === query.toLowerCase() ? <mark key={j} style={{ background: 'var(--accent)', color: '#0a0c10', borderRadius: 2 }}>{p}</mark> : p
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PRIVATE CALL OVERLAY
// ═══════════════════════════════════════════════════════════
function PrivateCallOverlay({ call, onEnd, localStream, remoteStream }) {
  const localRef = useRef(null); const remoteRef = useRef(null);
  const [muted, setMuted] = useState(false); const [videoOff, setVideoOff] = useState(false);
  useEffect(() => { if (localRef.current && localStream) localRef.current.srcObject = localStream; }, [localStream]);
  useEffect(() => { if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream; }, [remoteStream]);
  const toggleMute = () => { localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; }); setMuted(m => !m); };
  const toggleVideo = () => { localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; }); setVideoOff(v => !v); };
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#080a0f', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <video ref={remoteRef} autoPlay playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: remoteStream ? 1 : 0 }} />
      {!remoteStream && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, zIndex: 1 }}>
          <Avatar user={call?.with} size={92} showRing />
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{call?.with?.username}</div>
          <div style={{ fontSize: 14, color: 'var(--accent)', animation: 'pulse 1.5s ease infinite' }}>{call?.status === 'incoming' ? '📞 Panggilan masuk...' : '📞 Memanggil...'}</div>
        </div>
      )}
      <video ref={localRef} autoPlay playsInline muted style={{ position: 'absolute', bottom: 90, right: 16, width: 110, height: 150, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid rgba(255,255,255,0.2)', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: 28, display: 'flex', gap: 14, zIndex: 3 }}>
        {call?.type === 'video' && <button onClick={toggleVideo} style={btnCallStyle(videoOff)}>{videoOff ? <Icon.VideoOff /> : <Icon.Video />}</button>}
        <button onClick={onEnd} style={{ ...btnCallStyle(false), width: 62, height: 62, background: 'var(--danger)', boxShadow: '0 0 20px rgba(255,77,109,0.4)' }}><Icon.PhoneOff /></button>
        <button onClick={toggleMute} style={btnCallStyle(muted)}>{muted ? <Icon.MicOff /> : <Icon.Mic />}</button>
      </div>
      {call?.status === 'incoming' && (
        <div style={{ position: 'absolute', bottom: 115, display: 'flex', gap: 14, zIndex: 3 }}>
          <button onClick={call.onAccept} style={{ padding: '11px 26px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--accent)', color: '#0a0c10', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Terima</button>
          <button onClick={onEnd} style={{ padding: '11px 26px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--danger)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Tolak</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  GROUP CALL OVERLAY
// ═══════════════════════════════════════════════════════════
function PeerTile({ stream, username, callType }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && stream) ref.current.srcObject = stream; }, [stream]);
  return (
    <div style={{ position: 'relative', background: '#1a1d26', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video ref={ref} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: callType === 'video' ? 'block' : 'none' }} />
      {callType !== 'video' && <Avatar user={{ username }} size={60} />}
      <div style={{ position: 'absolute', bottom: 7, left: 9, fontSize: 11, color: '#fff', fontWeight: 600, background: 'rgba(0,0,0,0.55)', padding: '2px 7px', borderRadius: 20 }}>{username}</div>
    </div>
  );
}

function GroupCallOverlay({ groupId, groupName, callType, currentUser, socket, onEnd }) {
  const [peers, setPeers] = useState({});
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const localRef = useRef(null);
  const peerConns = useRef({});
  const localStreamRef = useRef(null);
  const STUN = { iceServers: [{ urls: process.env.NEXT_PUBLIC_STUN_SERVER || 'stun:stun.l.google.com:19302' }] };

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
        localStreamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;
        socket.emit('group-call-join', { groupId, userId: currentUser._id, username: currentUser.username, callType });
      } catch (e) { alert('Tidak bisa akses mikrofon/kamera: ' + e.message); onEnd(); }
    };
    init();
    socket.on('group-call-user-joined', async ({ socketId, username }) => {
      const pc = createPC(socketId, username);
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      socket.emit('group-call-offer', { targetId: socketId, offer, callType });
    });
    socket.on('group-call-offer', async ({ offer, from, fromUsername }) => {
      const pc = createPC(from, fromUsername);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
      socket.emit('group-call-answer', { targetId: from, answer });
    });
    socket.on('group-call-answer', async ({ answer, from }) => { await peerConns.current[from]?.setRemoteDescription(new RTCSessionDescription(answer)); });
    socket.on('group-call-ice', ({ candidate, from }) => { peerConns.current[from]?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {}); });
    socket.on('group-call-user-left', ({ socketId }) => {
      peerConns.current[socketId]?.close(); delete peerConns.current[socketId];
      setPeers(prev => { const n = { ...prev }; delete n[socketId]; return n; });
    });
    return () => { ['group-call-user-joined','group-call-offer','group-call-answer','group-call-ice','group-call-user-left'].forEach(e => socket.off(e)); };
  }, []);

  const createPC = (socketId, username) => {
    const pc = new RTCPeerConnection(STUN);
    localStreamRef.current?.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
    pc.ontrack = e => setPeers(prev => ({ ...prev, [socketId]: { stream: e.streams[0], username } }));
    pc.onicecandidate = e => { if (e.candidate) socket.emit('group-call-ice', { targetId: socketId, candidate: e.candidate }); };
    peerConns.current[socketId] = pc; return pc;
  };

  const handleEnd = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    Object.values(peerConns.current).forEach(pc => pc.close()); peerConns.current = {};
    socket.emit('group-call-leave', { groupId }); onEnd();
  };
  const toggleMute = () => { localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; }); setMuted(m => !m); };
  const toggleVideo = () => { localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; }); setVideoOff(v => !v); };
  const peerList = Object.entries(peers);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#080a0f', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 18px', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--accent)' }}><Icon.Users /></span>
        {groupName} · {callType === 'video' ? '📹 Video' : '🎙 Voice'}
        <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{peerList.length + 1} orang</span>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: peerList.length === 0 ? '1fr' : peerList.length < 3 ? '1fr 1fr' : 'repeat(3,1fr)', gap: 8, padding: '0 10px', alignContent: 'center' }}>
        <div style={{ position: 'relative', background: '#1a1d26', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video ref={localRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: callType === 'video' && !videoOff ? 'block' : 'none' }} />
          {(callType !== 'video' || videoOff) && <Avatar user={currentUser} size={60} />}
          <div style={{ position: 'absolute', bottom: 7, left: 9, fontSize: 11, color: '#fff', fontWeight: 600, background: 'rgba(0,0,0,0.55)', padding: '2px 7px', borderRadius: 20 }}>{currentUser.username} (Saya)</div>
        </div>
        {peerList.map(([sid, peer]) => <PeerTile key={sid} stream={peer.stream} username={peer.username} callType={callType} />)}
        {peerList.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            <Icon.Users /> Menunggu member lain bergabung...
          </div>
        )}
      </div>
      <div style={{ padding: '14px 0 30px', display: 'flex', justifyContent: 'center', gap: 14 }}>
        {callType === 'video' && <button onClick={toggleVideo} style={btnCallStyle(videoOff)}>{videoOff ? <Icon.VideoOff /> : <Icon.Video />}</button>}
        <button onClick={handleEnd} style={{ ...btnCallStyle(false), width: 62, height: 62, background: 'var(--danger)', boxShadow: '0 0 20px rgba(255,77,109,0.4)' }}><Icon.PhoneOff /></button>
        <button onClick={toggleMute} style={btnCallStyle(muted)}>{muted ? <Icon.MicOff /> : <Icon.Mic />}</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function ChatPage() {
  const router = useRouter();

  const [user, setUser]               = useState(null);
  const [users, setUsers]             = useState([]);
  const [chats, setChats]             = useState([]);
  const [groups, setGroups]           = useState([]);
  const [activeTab, setActiveTab]     = useState('chats');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages]       = useState([]);
  const [newMessage, setNewMessage]   = useState('');
  const [loading, setLoading]         = useState(true);
  const [sendingMsg, setSendingMsg]   = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [socket, setSocket]           = useState(null);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser]   = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [unread, setUnread]           = useState({});

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile]       = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [inputFocused, setInputFocused]   = useState(false);
  const [showSearch, setShowSearch]   = useState(false);

  // ── Selection Mode State ──
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMsgs, setSelectedMsgs]   = useState(new Set());
  const [contextMenu, setContextMenu]     = useState(null); // { x, y, msgId, msgContent }
  const longPressTimer = useRef(null);

  const [showEditProfile, setShowEditProfile]   = useState(false);
  const [showCreateGroup, setShowCreateGroup]   = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showViewProfile, setShowViewProfile]   = useState(false);
  const [viewProfileUser, setViewProfileUser]   = useState(null);
  const [previewFile, setPreviewFile]           = useState(null);
  const [showFileModal, setShowFileModal]       = useState(false);
  const [deleteModal, setDeleteModal]           = useState({ show: false, type: 'multi' }); // multi or single

  const [privateCall, setPrivateCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerRef = useRef(null);

  const [groupCall, setGroupCall]             = useState(null);
  const [incomingGroupCall, setIncomingGroupCall] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);
  const typingRef      = useRef(false);
  const messageRefs    = useRef({});

  // ── Detect mobile ──
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && selectedChat) setSidebarOpen(false);
      else if (!mobile) setSidebarOpen(true);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [selectedChat]);

  useEffect(() => { loadUser(); loadUsers(); }, []);
  useEffect(() => { if (user) { loadChats(); loadGroups(); } }, [user]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Exit selection mode when chat changes
  useEffect(() => {
    setSelectionMode(false);
    setSelectedMsgs(new Set());
    setContextMenu(null);
  }, [selectedChat]);

  // ── Socket ──
  useEffect(() => {
    if (!user) return;
    const sock = connectSocket(Cookies.get('token'));
    setSocket(sock);

    // PERBAIKAN: fungsi untuk emit user-online
    const emitOnline = () => {
      sock.emit('user-online', user._id);
      sock.emit('get-online-users');
    };

    // Jika sudah connected, langsung emit
    if (sock.connected) {
      emitOnline();
    }

    // PERBAIKAN: pasang listener 'connect' SEBELUM apapun
    // Ini handle kasus di production di mana socket baru connect setelah useEffect jalan
    sock.on('connect', () => {
      console.log('Socket connected, emitting user-online');
      emitOnline();
    });

    sock.on('online-users', setOnlineUsers);
    sock.on('user-online',  id => setOnlineUsers(p => [...new Set([...p, id])]));
    sock.on('user-offline', id => setOnlineUsers(p => p.filter(x => x !== id)));

    sock.on('user-typing', d => { if (d.chatId === selectedChat?._id && d.userId !== user._id) { setTypingUser(d.username); setTimeout(() => setTypingUser(null), 3000); } });
    sock.on('user-stop-typing', d => { if (d.chatId === selectedChat?._id) setTypingUser(null); });
    sock.on('messages-read', d => { if (d.chatId === selectedChat?._id) setMessages(p => p.map(m => ({ ...m, read: true }))); });
    sock.on('message-deleted', d => { if (d.chatId === selectedChat?._id) setMessages(p => p.filter(m => m._id !== d.messageId)); });

    const seen = new Set();
    sock.on('new-message', msg => {
      if (seen.has(msg._id)) return; seen.add(msg._id);
      const fmt = { ...msg, senderId: msg.senderId?._id || msg.senderId, sender: msg.sender || msg.senderId };
      if (selectedChat && msg.chatId === selectedChat._id) {
        setMessages(p => { if (p.some(m => m._id === msg._id)) return p; sock.emit('mark-read', { chatId: selectedChat._id, userId: user._id }); return [...p, fmt]; });
      } else { setUnread(p => ({ ...p, [msg.chatId]: (p[msg.chatId] || 0) + 1 })); }
      setChats(p => p.map(c => c._id === msg.chatId ? { ...c, lastMessage: msg } : c));
    });
    sock.on('new-group-message', msg => {
      if (seen.has(msg._id)) return; seen.add(msg._id);
      const fmt = { ...msg, senderId: msg.senderId?._id || msg.senderId, sender: msg.sender || msg.senderId };
      if (selectedChat && msg.groupId === selectedChat._id && selectedChat.type === 'group') {
        setMessages(p => p.some(m => m._id === msg._id) ? p : [...p, fmt]);
      } else { setUnread(p => ({ ...p, [msg.groupId]: (p[msg.groupId] || 0) + 1 })); }
      setGroups(p => p.map(g => g._id === msg.groupId ? { ...g, lastMessage: msg } : g));
    });

    sock.on('group-updated', g => setGroups(p => p.map(x => x._id === g._id ? { ...x, ...g, type: 'group' } : x)));
    sock.on('group-deleted', ({ groupId }) => { setGroups(p => p.filter(g => g._id !== groupId)); if (selectedChat?._id === groupId) setSelectedChat(null); });

    sock.on('call-offer', ({ offer, from, fromUserId, fromUsername, callType }) => {
      const caller = users.find(u => u._id === fromUserId) || { username: fromUsername, _id: fromUserId };
      setPrivateCall({ type: callType || 'audio', status: 'incoming', with: caller, socketId: from, offer, onAccept: () => acceptCall(from, offer, callType, sock) });
    });
    sock.on('call-answer', async ({ answer }) => { if (peerRef.current) await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer)); });
    sock.on('ice-candidate', c => { peerRef.current?.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}); });
    sock.on('call-ended', () => cleanupCall());
    sock.on('group-call-invite', d => setIncomingGroupCall(d));

    // HAPUS: sock.on('connect', ...) yang lama yang hanya emit user-online
    // Sudah digabung ke atas

    return () => {
      ['connect','new-message','new-group-message','online-users','user-online','user-offline',
       'user-typing','user-stop-typing','messages-read','message-deleted','group-updated',
       'group-deleted','call-offer','call-answer','ice-candidate','call-ended','group-call-invite'
      ].forEach(e => sock.off(e));
      seen.clear();
    };
  }, [user, selectedChat]);

  // ── Data fetching ──
  const loadUser   = async () => { try { const r = await fetch('/api/user/me'); const d = await r.json(); if (d.user) setUser(d.user); else router.push('/login'); } catch {} };
  const loadUsers  = async () => { try { const r = await fetch('/api/user/list'); const d = await r.json(); setUsers(d.users || []); } catch {} };
  const loadChats  = async () => {
    try {
      const r = await fetch('/api/chat/list'); const d = await r.json();
      setChats((d.chats || []).map(c => {
        if (c.otherUser) return { ...c, type: 'private' };
        const otherId = Array.isArray(c.members) ? c.members.find(id => (typeof id === 'object' ? id._id : id)?.toString() !== user?._id) : null;
        const ou = typeof otherId === 'object' ? otherId : users.find(u => u._id === otherId);
        return { ...c, type: 'private', otherUser: ou || { _id: otherId, username: 'Unknown' } };
      }));
    } catch {} finally { setLoading(false); }
  };
  const loadGroups = async () => { try { const r = await fetch('/api/group/list'); const d = await r.json(); setGroups((d.groups || []).map(g => ({ ...g, type: 'group' }))); } catch {} finally { setLoading(false); } };
  const loadMsgs   = async (chatId, type = 'private') => {
    setLoadingMsgs(true);
    try {
      const r = await fetch(type === 'group' ? `/api/group/${chatId}/messages` : `/api/chat/${chatId}/messages`);
      const d = await r.json();
      setMessages((d.messages || []).map(m => ({ ...m, senderId: m.senderId?._id || m.senderId, sender: m.sender || m.senderId })));
    } catch {} finally { setLoadingMsgs(false); }
  };

  const openChat = async (chat) => {
    setSelectedChat({ ...chat, type: 'private' });
    setUnread(p => ({ ...p, [chat._id]: 0 }));
    socket?.emit('join-chat', chat._id);
    socket?.emit('mark-read', { chatId: chat._id, userId: user._id });
    await loadMsgs(chat._id, 'private');
    if (isMobile) setSidebarOpen(false);
  };

  const openGroup = async (group) => {
    setSelectedChat({ ...group, type: 'group' });
    setUnread(p => ({ ...p, [group._id]: 0 }));
    socket?.emit('join-chat', group._id);
    await loadMsgs(group._id, 'group');
    if (isMobile) setSidebarOpen(false);
  };

  const createOrOpenChat = async (targetUser) => {
    try {
      const r = await fetch('/api/chat/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId: targetUser._id }) });
      const d = await r.json(); if (!r.ok) { alert(d.error); return; }
      const chat = { ...d.chat, type: 'private', otherUser: d.chat.otherUser || targetUser };
      setSelectedChat(chat); setUnread(p => ({ ...p, [d.chat._id]: 0 }));
      socket?.emit('join-chat', d.chat._id); socket?.emit('mark-read', { chatId: d.chat._id, userId: user._id });
      await loadMsgs(d.chat._id, 'private');
      setChats(p => p.some(c => c._id === d.chat._id) ? p : [chat, ...p]);
      setActiveTab('chats');
      if (isMobile) setSidebarOpen(false);
    } catch {}
  };

  // ── Selection Mode Handlers ──
  const enterSelectionMode = (msgId) => {
    setSelectionMode(true);
    setSelectedMsgs(new Set([msgId]));
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedMsgs(new Set());
  };

  const toggleMsgSelect = (msgId) => {
    if (!selectionMode) return;
    setSelectedMsgs(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId); else next.add(msgId);
      return next;
    });
  };

  // Long press for mobile
  const handleLongPressStart = (msgId) => {
    longPressTimer.current = setTimeout(() => {
      if ('vibrate' in navigator) navigator.vibrate(40);
      enterSelectionMode(msgId);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  // Right-click for desktop
  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    const sid = (typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId);
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 180),
      y: Math.min(e.clientY, window.innerHeight - 120),
      msgId: msg._id,
      msgContent: msg.content,
      isVoice: msg.isVoice,
    });
  };

  // Delete selected messages
  const handleDeleteSelected = async (deleteType) => {
    const isGroup = selectedChat.type === 'group';
    const ids = Array.from(selectedMsgs);
    for (const msgId of ids) {
      try {
        const url = isGroup
          ? `/api/group/${selectedChat._id}/messages?messageId=${msgId}&deleteType=${deleteType}`
          : `/api/chat/${selectedChat._id}/messages?messageId=${msgId}&deleteType=${deleteType}`;
        const r = await fetch(url, { method: 'DELETE' });
        if (r.ok && deleteType === 'everyone') {
          socket?.emit('delete-message', { chatId: selectedChat._id, messageId: msgId });
        }
      } catch {}
    }
    setMessages(p => p.filter(m => !selectedMsgs.has(m._id)));
    setDeleteModal({ show: false, type: 'multi' });
    exitSelectionMode();
  };

  // ── Messaging ──
  const handleTyping = () => {
    if (!typingRef.current && socket && selectedChat) { typingRef.current = true; socket.emit('typing', { chatId: selectedChat._id, userId: user._id, username: user.username }); }
    if (typingTimeout) clearTimeout(typingTimeout);
    const t = setTimeout(() => { socket?.emit('stop-typing', { chatId: selectedChat._id, userId: user._id }); typingRef.current = false; }, 2000);
    setTypingTimeout(t);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sendingMsg) return;
    const isGroup = selectedChat.type === 'group';
    if (isGroup) {
      const g = groups.find(g => g._id === selectedChat._id);
      const aids = (g?.admins || []).map(a => (typeof a === 'object' ? a._id : a)?.toString());
      if (g?.onlyAdmins && !aids.includes(user._id?.toString())) { alert('Hanya admin yang bisa kirim pesan.'); return; }
    }
    setSendingMsg(true);
    try {
      const url = isGroup ? `/api/group/${selectedChat._id}/messages` : `/api/chat/${selectedChat._id}/messages`;
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newMessage }) });
      const d = await r.json(); if (!r.ok) { alert(d.error); return; }
      socket?.emit('stop-typing', { chatId: selectedChat._id, userId: user._id });
      if (isGroup) socket?.emit('group-message', { groupId: selectedChat._id, ...d.message });
      else socket?.emit('private-message', { chatId: selectedChat._id, ...d.message });
      setMessages(p => p.some(m => m._id === d.message._id) ? p : [...p, { ...d.message, senderId: user._id, sender: { _id: user._id, username: user.username, avatar: user.avatar }, createdAt: new Date().toISOString(), read: true }]);
      setNewMessage('');
    } catch {} finally { setSendingMsg(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file || !selectedChat) return;
    setSendingMsg(true); const isGroup = selectedChat.type === 'group';
    try {
      const fileUrl = await uploadFile(file, selectedChat._id);
      const msgUrl  = isGroup ? `/api/group/${selectedChat._id}/messages` : `/api/chat/${selectedChat._id}/messages`;
      const r = await fetch(msgUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `📎 ${file.name}`, fileUrl, fileType: file.type, fileName: file.name, fileSize: file.size }) });
      const d = await r.json();
      if (r.ok && d.message) {
        if (isGroup) socket?.emit('group-message', { groupId: selectedChat._id, ...d.message });
        else socket?.emit('private-message', { chatId: selectedChat._id, ...d.message });
        setMessages(p => [...p, { ...d.message, senderId: user._id, sender: { _id: user._id, username: user.username, avatar: user.avatar }, createdAt: new Date().toISOString(), fileUrl, fileType: file.type, fileName: file.name, fileSize: file.size }]);
      }
      e.target.value = '';
    } catch (err) { alert(err.message); } finally { setSendingMsg(false); }
  };

  // ── Voice Note Send ──
  const handleVoiceNoteSend = async (file, duration) => {
    if (!selectedChat) return;
    setSendingMsg(true);
    const isGroup = selectedChat.type === 'group';
    try {
      const fileUrl = await uploadFile(file, selectedChat._id);
      const msgUrl = isGroup ? `/api/group/${selectedChat._id}/messages` : `/api/chat/${selectedChat._id}/messages`;
      const r = await fetch(msgUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: '🎙 Voice note', fileUrl, fileType: 'audio/webm', fileName: file.name, isVoice: true, voiceDuration: duration }) });
      const d = await r.json();
      if (r.ok && d.message) {
        const newMsg = { ...d.message, senderId: user._id, sender: { _id: user._id, username: user.username, avatar: user.avatar }, createdAt: new Date().toISOString(), fileUrl, fileType: 'audio/webm', isVoice: true, voiceDuration: duration };
      if (isGroup) socket?.emit('group-message', { groupId: selectedChat._id, ...d.message, isVoice: true, voiceDuration: duration });
      else socket?.emit('private-message', { chatId: selectedChat._id, ...d.message, isVoice: true, voiceDuration: duration });
        setMessages(p => [...p, newMsg]);
      }
    } catch (err) { alert(err.message); } finally { setSendingMsg(false); }
  };

  // ── Calls ──
  const STUN = { iceServers: [{ urls: process.env.NEXT_PUBLIC_STUN_SERVER || 'stun:stun.l.google.com:19302' }] };

  const startPrivateCall = async (type = 'audio') => {
    if (!selectedChat || selectedChat.type === 'group') return;
    const tid = selectedChat.otherUser?._id; if (!tid) return;
    const getSocket = () => new Promise(resolve => {
      socket.emit('get-socket-id', { userId: tid });
      const h = ({ userId, socketId }) => { if (userId === tid) { socket.off('socket-id-result', h); resolve(socketId); } };
      socket.on('socket-id-result', h); setTimeout(() => { socket.off('socket-id-result', h); resolve(null); }, 3000);
    });
    try {
      const sid = await getSocket(); if (!sid) { alert('User sedang offline.'); return; }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      setLocalStream(stream);
      const pc = new RTCPeerConnection(STUN);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      pc.ontrack = e => setRemoteStream(e.streams[0]);
      pc.onicecandidate = e => { if (e.candidate) socket.emit('ice-candidate', { targetId: sid, candidate: e.candidate }); };
      peerRef.current = pc;
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      socket.emit('call-offer', { targetId: sid, offer, fromUserId: user._id, fromUsername: user.username, callType: type });
      setPrivateCall({ type, status: 'calling', with: selectedChat.otherUser, socketId: sid });
    } catch (e) { alert('Gagal memulai call: ' + e.message); }
  };

  const acceptCall = async (fromSocketId, offer, callType, sock) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
      setLocalStream(stream);
      const pc = new RTCPeerConnection(STUN);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      pc.ontrack = e => setRemoteStream(e.streams[0]);
      pc.onicecandidate = e => { if (e.candidate) (sock || socket)?.emit('ice-candidate', { targetId: fromSocketId, candidate: e.candidate }); };
      peerRef.current = pc;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
      (sock || socket)?.emit('call-answer', { targetId: fromSocketId, answer });
      setPrivateCall(p => ({ ...p, status: 'active' }));
    } catch { cleanupCall(); }
  };

  const cleanupCall = () => {
    localStream?.getTracks().forEach(t => t.stop());
    peerRef.current?.close(); peerRef.current = null;
    setLocalStream(null); setRemoteStream(null); setPrivateCall(null);
  };

  const endCall = () => { if (privateCall?.socketId) socket?.emit('call-end', { targetId: privateCall.socketId }); cleanupCall(); };

  const startGroupCall = (type = 'audio') => {
    if (!selectedChat || selectedChat.type !== 'group') return;
    socket?.emit('group-call-start', { groupId: selectedChat._id, groupName: selectedChat.name, callType: type, fromUsername: user.username });
    setGroupCall({ groupId: selectedChat._id, groupName: selectedChat.name, callType: type });
  };

  // ── Helpers ──
  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); Cookies.remove('token'); socket?.disconnect(); router.push('/login'); };

  const formatTime = ts => {
    if (!ts) return '';
    try { const d = new Date(ts), now = new Date(); if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); if (now - d < 172800000) return 'Kemarin'; return d.toLocaleDateString([], { month: 'short', day: 'numeric' }); } catch { return ''; }
  };

  const isOnline     = uid => onlineUsers.includes(uid?.toString());
  const isGroupAdmin = () => { if (!selectedChat || selectedChat.type !== 'group') return false; const g = groups.find(g => g._id === selectedChat._id); return (g?.admins || []).map(a => (typeof a === 'object' ? a._id : a)?.toString()).includes(user?._id?.toString()); };
  const canSend      = () => { if (!selectedChat) return false; if (selectedChat.type === 'private') return true; const g = groups.find(g => g._id === selectedChat._id); if (!g) return true; const aids = (g.admins || []).map(a => (typeof a === 'object' ? a._id : a)?.toString()); return !g.onlyAdmins || aids.includes(user?._id?.toString()); };

  const fChats  = chats.filter(c => (c.otherUser?.username || '').toLowerCase().includes(sidebarSearch.toLowerCase()));
  const fGroups = groups.filter(g => (g.name || '').toLowerCase().includes(sidebarSearch.toLowerCase()));
  const fUsers  = users.filter(u => u._id !== user?._id && u.username?.toLowerCase().includes(sidebarSearch.toLowerCase()));

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0c10' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 40, height: 40, borderWidth: 3, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#00e5c3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', background: 'var(--bg-base)', fontFamily: "'DM Sans',sans-serif", overflow: 'hidden', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        :root{
          --bg-base:#0a0c10;--bg-surface:#111318;--bg-elevated:#1a1d26;--bg-hover:#20242f;
          --accent:#00e5c3;--accent-muted:rgba(0,229,195,0.12);--border-accent:rgba(0,229,195,0.3);
          --text-primary:#e8ecf0;--text-muted:#6b7280;--text-subtle:#2d3240;
          --border:rgba(255,255,255,0.07);
          --danger:#ff4d6d;--danger-muted:rgba(255,77,109,0.12);
          --bubble-me:#00c4a8;--bubble-them:#1e2130;
          --radius-sm:8px;--radius-md:12px;--radius-lg:18px;
          --shadow-glow:0 0 20px rgba(0,229,195,0.15);
        }
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--bg-base);color:var(--text-primary)}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dots{0%,80%,100%{opacity:.2;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
        @keyframes selPop{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}
        .row-hov:hover{background:var(--bg-elevated)!important}
        .msg{animation:fadeUp .16s ease}
        ::placeholder{color:var(--text-muted)}
        .tab-btn{padding:8px 0;font-size:12px;font-weight:600;flex:1;cursor:pointer;border:none;border-bottom:2px solid transparent;background:transparent;font-family:inherit;color:var(--text-muted);transition:all .15s}
        .tab-active{color:var(--accent)!important;border-bottom-color:var(--accent)!important}
        .avatar-hover-overlay{position:absolute;inset:0;border-radius:inherit;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;color:#fff;opacity:0;transition:opacity .2s}
        .avatar-hover-overlay:hover{opacity:1}
        *:hover > .avatar-hover-overlay{opacity:1}
        .sidebar-backdrop{display:none}
        @media(max-width:767px){
          .sidebar-backdrop{display:block;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:49}
        }
        /* Msg bubble selectable */
        .msg-bubble-wrap{cursor:pointer;border-radius:var(--radius-md);transition:background 0.12s}
        .msg-bubble-wrap.sel-mode:hover{background:rgba(0,229,195,0.06)}
        .msg-selected .bubble-inner{outline:2px solid var(--accent);outline-offset:2px}
        /* Selection checkbox */
        .sel-check{width:20px;height:20px;border-radius:50%;border:2px solid var(--border);background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;animation:selPop .15s ease}
        .sel-check.checked{border-color:var(--accent);background:var(--accent)}
      `}</style>

      {isMobile && sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* ═══ SIDEBAR ═══ */}
      <aside style={{ width: sidebarOpen ? (isMobile ? '80vw' : 290) : 0, minWidth: 0, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'width 0.25s cubic-bezier(.4,0,.2,1)', flexShrink: 0, position: isMobile ? 'fixed' : 'relative', top: 0, left: 0, bottom: 0, zIndex: isMobile ? 50 : 'auto', boxShadow: isMobile && sidebarOpen ? '4px 0 24px rgba(0,0,0,0.4)' : 'none' }}>
        {/* My profile header */}
        <div style={{ padding: '12px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setShowEditProfile(true)}><Avatar user={user} size={38} showRing /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}><OnlineDot online /><span style={{ fontSize: 11, color: 'var(--accent)' }}>Online</span></div>
          </div>
          <IconBtn onClick={() => setShowEditProfile(true)} title="Edit profil" style={{ width: 28, height: 28 }}><Icon.Edit /></IconBtn>
          <IconBtn onClick={handleLogout} title="Logout" danger style={{ width: 28, height: 28 }}><Icon.Logout /></IconBtn>
          <IconBtn onClick={() => setSidebarOpen(false)} title="Sembunyikan sidebar" style={{ width: 28, height: 28 }}><Icon.ChevLeft /></IconBtn>
        </div>

        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}><Icon.Search /></span>
            <input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} placeholder="Cari..."
              style={{ width: '100%', padding: '7px 10px 7px 30px', background: 'var(--bg-elevated)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = 'var(--border-accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 10px' }}>
          <button className={`tab-btn${activeTab === 'chats' ? ' tab-active' : ''}`} onClick={() => setActiveTab('chats')}>Chat</button>
          <button className={`tab-btn${activeTab === 'groups' ? ' tab-active' : ''}`} onClick={() => setActiveTab('groups')}>Grup</button>
          <button className={`tab-btn${activeTab === 'people' ? ' tab-active' : ''}`} onClick={() => setActiveTab('people')}>People</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'chats' && (
            fChats.length === 0
              ? <div style={{ padding: '16px 14px', fontSize: 13, color: 'var(--text-muted)' }}>Belum ada chat.</div>
              : fChats.map(chat => {
                const ou = chat.otherUser || {}; const uOnline = isOnline(ou._id); const cnt = unread[chat._id] || 0;
                const sel = selectedChat?._id === chat._id && selectedChat?.type === 'private';
                return (
                  <div key={chat._id} className="row-hov" onClick={() => openChat(chat)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', cursor: 'pointer', borderLeft: sel ? '2px solid var(--accent)' : '2px solid transparent', background: sel ? 'var(--accent-muted)' : 'transparent', transition: 'all .12s' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar user={ou} size={36} showRing={sel} />
                      <span style={{ position: 'absolute', bottom: 0, right: 0 }}><OnlineDot online={uOnline} /></span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: cnt > 0 ? 700 : 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ou.username || 'Unknown'}</div>
                      {chat.lastMessage && <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{typeof chat.lastMessage === 'object' ? chat.lastMessage.content : chat.lastMessage}</div>}
                    </div>
                    {cnt > 0 && <span style={{ background: 'var(--accent)', color: '#0a0c10', fontSize: 10, fontWeight: 700, borderRadius: 10, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>{cnt}</span>}
                  </div>
                );
              })
          )}

          {activeTab === 'groups' && (
            <>
              <div style={{ padding: '8px 10px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>GRUP</span>
                <button onClick={() => setShowCreateGroup(true)} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', background: 'var(--accent-muted)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-accent)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Icon.Plus /> Baru
                </button>
              </div>
              {fGroups.length === 0
                ? <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>Belum ada grup.</div>
                : fGroups.map(group => {
                  const cnt = unread[group._id] || 0; const sel = selectedChat?._id === group._id && selectedChat?.type === 'group';
                  return (
                    <div key={group._id} className="row-hov" onClick={() => openGroup(group)}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', cursor: 'pointer', borderLeft: sel ? '2px solid var(--accent)' : '2px solid transparent', background: sel ? 'var(--accent-muted)' : 'transparent', transition: 'all .12s' }}>
                      <Avatar user={{ name: group.name, avatar: group.photo, photo: group.photo }} size={36} isGroup showRing={sel} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: cnt > 0 ? 700 : 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{group.members?.length || 0} member</div>
                      </div>
                      {cnt > 0 && <span style={{ background: 'var(--accent)', color: '#0a0c10', fontSize: 10, fontWeight: 700, borderRadius: 10, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>{cnt}</span>}
                    </div>
                  );
                })}
            </>
          )}

          {activeTab === 'people' && (
            <>
              <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>SEMUA USER</div>
              {fUsers.length === 0
                ? <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>Tidak ada user.</div>
                : fUsers.map(u => (
                  <div key={u._id} className="row-hov" onClick={() => { createOrOpenChat(u); setActiveTab('chats'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 12px', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar user={u} size={34} />
                      <span style={{ position: 'absolute', bottom: 0, right: 0 }}><OnlineDot online={isOnline(u._id)} /></span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{u.username}</div>
                      <div style={{ fontSize: 11, color: isOnline(u._id) ? 'var(--accent)' : 'var(--text-muted)' }}>{isOnline(u._id) ? 'Online' : 'Offline'}</div>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {selectedChat ? (
          <>
            {/* ── Header ── */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, minHeight: 58 }}>
              {(!sidebarOpen || isMobile) && (
                <IconBtn onClick={() => { if (isMobile) { setSelectedChat(null); setSidebarOpen(true); } else setSidebarOpen(true); }} title={isMobile ? 'Kembali' : 'Tampilkan sidebar'}>
                  {isMobile ? <Icon.Back /> : <Icon.ChevRight />}
                </IconBtn>
              )}

              {selectionMode ? (
                /* Selection mode header */
                <SelectionBar
                  count={selectedMsgs.size}
                  onDelete={() => setDeleteModal({ show: true, type: 'multi' })}
                  onCancel={exitSelectionMode}
                />
              ) : (
                /* Normal header */
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer', minWidth: 0, overflow: 'hidden' }}
                    onClick={() => { if (selectedChat.type === 'group') setShowGroupSettings(true); else { setViewProfileUser(selectedChat.otherUser); setShowViewProfile(true); } }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {selectedChat.type === 'group'
                        ? <Avatar user={{ name: selectedChat.name, avatar: selectedChat.photo, photo: selectedChat.photo }} size={40} isGroup />
                        : <><Avatar user={selectedChat.otherUser} size={40} showRing={isOnline(selectedChat.otherUser?._id)} /><span style={{ position: 'absolute', bottom: 1, right: 1 }}><OnlineDot online={isOnline(selectedChat.otherUser?._id)} /></span></>
                      }
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedChat.type === 'group' ? selectedChat.name : selectedChat.otherUser?.username}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        {selectedChat.type === 'group'
                          ? `${selectedChat.members?.length || 0} member`
                          : (isOnline(selectedChat.otherUser?._id) ? <span style={{ color: 'var(--accent)' }}>Online</span> : 'Offline')
                        }
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {selectedChat.type === 'private' && <>
                      <IconBtn onClick={() => startPrivateCall('audio')} title="Voice call"><Icon.Phone /></IconBtn>
                      <IconBtn onClick={() => startPrivateCall('video')} title="Video call"><Icon.Video /></IconBtn>
                    </>}
                    {selectedChat.type === 'group' && <>
                      <IconBtn onClick={() => startGroupCall('audio')} title="Voice call grup"><Icon.Phone /></IconBtn>
                      <IconBtn onClick={() => startGroupCall('video')} title="Video call grup"><Icon.Video /></IconBtn>
                    </>}
                    <IconBtn onClick={() => setShowSearch(v => !v)} title="Cari pesan" active={showSearch}><Icon.Search /></IconBtn>
                    <IconBtn onClick={() => fileInputRef.current?.click()} title="Lampirkan"><Icon.Attach /></IconBtn>
                    {selectedChat.type === 'group' && isGroupAdmin() && <IconBtn onClick={() => setShowGroupSettings(true)} title="Pengaturan grup"><Icon.Settings /></IconBtn>}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                </>
              )}
            </div>

            {/* ── Body ── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
              {/* Messages list */}
              <div
                style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}
                onClick={() => { if (contextMenu) setContextMenu(null); }}
              >
                {loadingMsgs
                  ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat pesan...</div>
                  : messages.length === 0
                    ? <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: 34 }}>💬</span>
                        <span style={{ fontSize: 13 }}>Belum ada pesan — mulai duluan!</span>
                      </div>
                    : messages.map((msg, idx) => {
                      const sid   = (typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId);
                      const isMe  = sid === user?._id;
                      const sName = msg.sender?.username || (typeof msg.senderId === 'object' ? msg.senderId?.username : 'User');
                      const key   = msg._id ? `${msg._id}-${idx}` : `tmp-${idx}`;
                      const mDate = msg.createdAt ? new Date(msg.createdAt).toDateString() : null;
                      const pDate = idx > 0 && messages[idx-1].createdAt ? new Date(messages[idx-1].createdAt).toDateString() : null;
                      const isSelected = selectedMsgs.has(msg._id);
                      const isVoice = Boolean(msg.isVoice) ||
                        (msg.fileType?.startsWith('audio/') && msg.content === '🎙 Voice note');      

                      return (
                        <div key={key} ref={el => { if (msg._id) messageRefs.current[msg._id] = el; }}>
                          {mDate && mDate !== pDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 6px' }}>
                              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(msg.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                            </div>
                          )}

                          <div className={`msg msg-bubble-wrap ${selectionMode ? 'sel-mode' : ''} ${isSelected ? 'msg-selected' : ''}`}
                            style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 6, marginBottom: 2, padding: '2px 0', userSelect: selectionMode ? 'none' : 'auto', background: isSelected ? 'rgba(0,229,195,0.05)' : 'transparent', borderRadius: 'var(--radius-sm)' }}
                            onClick={() => { if (selectionMode && msg._id) toggleMsgSelect(msg._id); }}
                            onContextMenu={(e) => { if (!selectionMode && msg._id) handleContextMenu(e, msg); }}
                            onTouchStart={() => { if (!selectionMode && msg._id) handleLongPressStart(msg._id); }}
                            onTouchEnd={handleLongPressEnd}
                            onTouchMove={handleLongPressEnd}
                          >
                            {/* Selection checkbox */}
                            {selectionMode && (
                              <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 8, flexShrink: 0, order: isMe ? 3 : 0 }}>
                                <div className={`sel-check ${isSelected ? 'checked' : ''}`}>
                                  {isSelected && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#0a0c10" strokeWidth="2.5" strokeLinecap="round"/></svg>}
                                </div>
                              </div>
                            )}

                            {!isMe && <Avatar user={{ username: sName, avatar: msg.sender?.avatar }} size={26} />}

                            <div style={{ position: 'relative', maxWidth: isMobile ? '80%' : '65%' }}>
                              {selectedChat.type === 'group' && !isMe && (
                                <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginBottom: 2, paddingLeft: 4 }}>{sName}</div>
                              )}
                              <div className="bubble-inner" style={{ padding: isVoice ? '8px 10px' : '8px 12px', borderRadius: isMe ? '14px 14px 3px 14px' : '14px 14px 14px 3px', background: isMe ? 'var(--bubble-me)' : 'var(--bubble-them)', color: isMe ? '#0a0c10' : 'var(--text-primary)', fontSize: 14, lineHeight: 1.5, boxShadow: isMe ? '0 2px 8px rgba(0,196,168,0.2)' : '0 2px 6px rgba(0,0,0,0.2)', transition: 'outline 0.1s' }}>
                              {(() => {
                                const isVoiceNote = Boolean(msg.isVoice) ||
                                  (msg.fileType && msg.fileType.startsWith('audio/') && msg.content === '🎙 Voice note');
                                if (isVoiceNote) return <VoiceNoteBubble msg={msg} isMe={isMe} />;
                                if (msg.fileUrl) {
                                  if (msg.fileType?.startsWith('image/'))
                                    return <img src={msg.fileUrl} alt={msg.fileName} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6, cursor: 'pointer', display: 'block' }} onClick={e => { if (!selectionMode) { setPreviewFile(msg); setShowFileModal(true); } e.stopPropagation(); }} />;
                                  return <div style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }} onClick={e => { if (!selectionMode) { setPreviewFile(msg); setShowFileModal(true); } e.stopPropagation(); }}><span style={{ fontSize: 18 }}>📎</span><span style={{ fontSize: 13 }}>{msg.fileName || msg.content}</span></div>;
                                }
                                return msg.content;
                              })()}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatTime(msg.createdAt)}</span>
                                {isMe && msg.read && <span style={{ fontSize: 10, color: 'var(--accent)' }}>✓✓</span>}
                              </div>
                            </div>

                            {isMe && <Avatar user={user} size={26} />}
                          </div>
                        </div>
                      );
                    })
                }
                {typingUser && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ padding: '9px 12px', background: 'var(--bubble-them)', borderRadius: '14px 14px 14px 3px', display: 'flex', gap: 4 }}>
                      {[0, .2, .4].map((d, i) => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: `dots 1.2s ${d}s infinite` }} />)}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{typingUser} mengetik</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {showSearch && (
                <SearchPanel messages={messages} onClose={() => setShowSearch(false)}
                  onJumpTo={id => { messageRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setShowSearch(false); }} />
              )}
            </div>

            {/* ── Input ── */}
            {!selectionMode && (
              <form onSubmit={sendMessage} style={{ padding: '9px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                {canSend() ? (
                  <>
                    <VoiceNoteRecorder onSend={handleVoiceNoteSend} disabled={sendingMsg} />
                    <input type="text" value={newMessage} onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
                      placeholder="Kirim pesan..."
                      style={{ flex: 1, padding: '9px 14px', background: 'var(--bg-elevated)', borderWidth: 1, borderStyle: 'solid', borderColor: inputFocused ? 'var(--border-accent)' : 'var(--border)', borderRadius: 22, color: 'var(--text-primary)', fontSize: 14, outline: 'none', transition: 'border-color .2s', fontFamily: 'inherit' }}
                      onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} />
                    <button type="submit" disabled={!newMessage.trim() || sendingMsg}
                      style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--accent)', color: '#0a0c10', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', flexShrink: 0, opacity: !newMessage.trim() ? 0.4 : 1 }}>
                      {sendingMsg ? <Spinner size={14} /> : <Icon.Send />}
                    </button>
                  </>
                ) : (
                  <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '7px 0' }}>📢 Hanya admin yang bisa kirim</div>
                )}
              </form>
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: 'var(--text-muted)' }}>
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                <Icon.Menu /> Buka daftar chat
              </button>
            )}
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>💬</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Pilih percakapan</div>
            <div style={{ fontSize: 13 }}>Pilih chat dari sidebar untuk memulai</div>
          </div>
        )}
      </div>

      {/* ═══ CONTEXT MENU (Desktop right-click) ═══ */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onSelectMessage={() => { enterSelectionMode(contextMenu.msgId); }}
          onCopy={contextMenu.msgContent && !contextMenu.isVoice ? () => navigator.clipboard.writeText(contextMenu.msgContent) : null}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* ═══ MODALS ═══ */}
      <EditProfileModal show={showEditProfile} onClose={() => setShowEditProfile(false)} currentUser={user}
        onSaved={u => { setUser(u); setUsers(p => p.map(x => x._id === u._id ? u : x)); }} />

      <ViewProfileModal show={showViewProfile} onClose={() => setShowViewProfile(false)} targetUser={viewProfileUser} isOnline={isOnline(viewProfileUser?._id)} />

      <GroupSettingsModal show={showGroupSettings} onClose={() => setShowGroupSettings(false)}
        group={groups.find(g => g._id === selectedChat?._id)} currentUser={user} users={users} socket={socket}
        onUpdated={updated => { setGroups(p => p.map(g => g._id === updated._id ? { ...g, ...updated, type: 'group' } : g)); if (selectedChat?._id === updated._id) setSelectedChat(p => ({ ...p, ...updated })); }}
        onDeleted={id => { setGroups(p => p.filter(g => g._id !== id)); if (selectedChat?._id === id) setSelectedChat(null); }} />

      <CreateGroupModal show={showCreateGroup} onClose={() => setShowCreateGroup(false)} users={users} currentUser={user}
        onCreated={g => { const wt = { ...g, type: 'group' }; setGroups(p => [wt, ...p]); setActiveTab('groups'); openGroup(wt); }} />

      {/* File preview */}
      {showFileModal && previewFile && (
        <Overlay onClose={() => setShowFileModal(false)}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '92vw', maxWidth: 760, maxHeight: '90vh', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{previewFile.fileName || 'File'}</span>
              <div style={{ display: 'flex', gap: 5 }}>
                <a href={previewFile.fileUrl} download={previewFile.fileName}><IconBtn><Icon.Download /></IconBtn></a>
                <IconBtn onClick={() => setShowFileModal(false)}><Icon.Close /></IconBtn>
              </div>
            </div>
            <div style={{ padding: 16, overflowY: 'auto', maxHeight: 'calc(90vh - 56px)' }}>
              {previewFile.fileType?.startsWith('image/')
                ? <img src={previewFile.fileUrl} alt="" style={{ maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain', borderRadius: 'var(--radius-md)', display: 'block', margin: '0 auto' }} />
                : previewFile.fileType === 'application/pdf'
                  ? <iframe src={previewFile.fileUrl} style={{ width: '100%', height: '68vh', border: 'none' }} title="" />
                  : <div style={{ textAlign: 'center', padding: 32 }}>
                      <div style={{ fontSize: 52, marginBottom: 10 }}>📄</div>
                      <a href={previewFile.fileUrl} download={previewFile.fileName} style={{ padding: '9px 18px', background: 'var(--accent)', color: '#0a0c10', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>Download</a>
                    </div>
              }
            </div>
          </div>
        </Overlay>
      )}

      {/* Delete modal — multi-select */}
      {deleteModal.show && (
        <Overlay onClose={() => setDeleteModal({ show: false, type: 'multi' })}>
          <ModalBox maxWidth={320}>
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Hapus {selectedMsgs.size} Pesan
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Pilih opsi penghapusan:</div>
              <button style={{ width: '100%', padding: '9px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 7 }} onClick={() => handleDeleteSelected('self')}>Hapus untuk saya</button>
              <button style={{ width: '100%', padding: '9px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginBottom: 7 }} onClick={() => handleDeleteSelected('everyone')}>Hapus untuk semua</button>
              <button style={{ width: '100%', padding: '9px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }} onClick={() => setDeleteModal({ show: false, type: 'multi' })}>Batal</button>
            </div>
          </ModalBox>
        </Overlay>
      )}

      {/* Incoming group call toast */}
      {incomingGroupCall && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 250, background: 'var(--bg-surface)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-accent)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeUp 0.2s ease', maxWidth: 320, width: 'calc(100vw - 32px)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', animation: 'pulse 1.2s ease infinite', flexShrink: 0 }}>
            {incomingGroupCall.callType === 'video' ? <Icon.Video /> : <Icon.Phone />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{incomingGroupCall.groupName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{incomingGroupCall.fromUsername} mengundang</div>
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <button onClick={() => { setGroupCall({ ...incomingGroupCall }); setIncomingGroupCall(null); }} style={{ padding: '6px 12px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Join</button>
            <button onClick={() => setIncomingGroupCall(null)} style={{ padding: '6px 10px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>Tolak</button>
          </div>
        </div>
      )}

      {/* Calls */}
      {privateCall && <PrivateCallOverlay call={privateCall} onEnd={endCall} localStream={localStream} remoteStream={remoteStream} />}
      {groupCall && socket && <GroupCallOverlay groupId={groupCall.groupId} groupName={groupCall.groupName} callType={groupCall.callType} currentUser={user} socket={socket} onEnd={() => setGroupCall(null)} />}
    </div>
  );
}