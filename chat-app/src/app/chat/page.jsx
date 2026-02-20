'use client';
// src/app/chat/page.jsx — v3
// Fitur baru: Edit profil user, Edit foto grup, Group Call (audio+video), Kick member

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { connectSocket } from '@/lib/socket-client';
import Cookies from 'js-cookie';

// ═══════════════════════════════════════════════════════════
//  ICONS
// ═══════════════════════════════════════════════════════════
const Icon = {
  Logout:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Send:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Attach:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  Video:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  Phone:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.63a16 16 0 0 0 6.29 6.29l.95-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Search:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Trash:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Copy:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Close:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Edit:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Settings: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Crown:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>,
  Mic:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  MicOff:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  VideoOff: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  PhoneOff: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11l-.94.94"/><line x1="23" y1="1" x2="1" y2="23"/></svg>,
  Plus:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Camera:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  X:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Users:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Check:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

// ═══════════════════════════════════════════════════════════
//  BASE COMPONENTS
// ═══════════════════════════════════════════════════════════
function Avatar({ user, size = 36, showRing = false, isGroup = false }) {
  const name = user?.name || user?.username || 'G';
  const src = user?.avatar || user?.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${isGroup ? '1e2130' : '00c4a8'}&color=${isGroup ? '00e5c3' : '0a0c10'}&bold=true&length=1`;
  return (
    <div style={{ width: size, height: size, borderRadius: isGroup ? 'var(--radius-sm)' : '50%', flexShrink: 0, borderWidth: 2, borderStyle: 'solid', borderColor: showRing ? 'var(--accent)' : 'var(--border)', boxShadow: showRing ? 'var(--shadow-glow)' : 'none', overflow: 'hidden', transition: 'all 0.2s' }}>
      <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

function OnlineDot({ online }) {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: online ? 'var(--accent)' : 'var(--text-subtle)', boxShadow: online ? '0 0 6px var(--accent)' : 'none' }} />;
}

function IconBtn({ children, onClick, title, danger = false, active = false, disabled = false, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 'var(--radius-sm)', borderWidth: 1, borderStyle: 'solid', borderColor: active ? 'var(--accent)' : 'var(--border)', background: active ? 'var(--accent-muted)' : hov ? (danger ? 'var(--danger-muted)' : 'var(--bg-elevated)') : 'transparent', color: active ? 'var(--accent)' : hov ? (danger ? 'var(--danger)' : 'var(--text-primary)') : (danger ? 'var(--danger)' : 'var(--text-muted)'), cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, transition: 'all 0.15s', ...style }}>
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

function Overlay({ children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }} onClick={onClose}>
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

// ═══════════════════════════════════════════════════════════
//  PHOTO UPLOAD HELPER (shared)
// ═══════════════════════════════════════════════════════════
async function uploadPhoto(file, chatId = 'profile') {
  const form = new FormData();
  form.append('file', file);
  form.append('chatId', chatId);
  const res = await fetch('/api/chat/upload', { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.fileUrl;
}

// ═══════════════════════════════════════════════════════════
//  EDIT MY PROFILE MODAL
// ═══════════════════════════════════════════════════════════
function EditProfileModal({ show, onClose, currentUser, onSaved }) {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar]     = useState('');
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (currentUser) { setUsername(currentUser.username || ''); setAvatar(currentUser.avatar || ''); }
  }, [currentUser, show]);

  if (!show) return null;

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { const url = await uploadPhoto(file, 'profile'); setAvatar(url); }
    catch (err) { alert(err.message); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!username.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), avatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved(data.user);
      onClose();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalBox maxWidth={380}>
        <div style={{ padding: '20px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Edit Profile</span>
            <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
          </div>

          {/* Avatar picker */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
              <Avatar user={{ username, avatar }} size={88} showRing />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                {uploading ? <Spinner /> : <Icon.Camera />}
              </div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Klik foto untuk ganti</span>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          </div>

          <FocusInput label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Nama kamu..." />

          <button onClick={handleSave} disabled={saving || !username.trim()} style={{ width: '100%', padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: !username.trim() ? 0.5 : 1 }}>
            {saving ? <Spinner /> : <><Icon.Check /> Simpan</>}
          </button>
        </div>
      </ModalBox>
    </Overlay>
  );
}

// ═══════════════════════════════════════════════════════════
//  VIEW USER PROFILE MODAL (readonly, untuk lihat profil orang lain)
// ═══════════════════════════════════════════════════════════
function ViewProfileModal({ show, onClose, targetUser, isOnline }) {
  if (!show || !targetUser) return null;
  return (
    <Overlay onClose={onClose}>
      <ModalBox maxWidth={340}>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Profil</span>
            <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Avatar user={targetUser} size={84} showRing={isOnline} />
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{targetUser.username}</div>
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
//  GROUP SETTINGS MODAL — edit, delete, kick, photo, admin
// ═══════════════════════════════════════════════════════════
function GroupSettingsModal({ show, onClose, group, currentUser, users, socket, onUpdated, onDeleted }) {
  const [name, setName]           = useState('');
  const [photo, setPhoto]         = useState('');
  const [onlyAdmins, setOnlyAdmins] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab]             = useState('info');
  const photoRef = useRef(null);

  useEffect(() => {
    if (group) { setName(group.name || ''); setPhoto(group.photo || ''); setOnlyAdmins(group.onlyAdmins || false); setTab('info'); }
  }, [group?._id, show]);

  if (!show || !group) return null;

  // Normalize admin IDs as strings
  const adminIds = (group.admins || []).map(a => typeof a === 'object' ? a._id?.toString() : a?.toString());
  const isAdmin  = adminIds.includes(currentUser?._id?.toString());
  const members  = group.members || [];

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try { const url = await uploadPhoto(file, group._id); setPhoto(url); }
    catch (err) { alert(err.message); } finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/group/${group._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, photo, onlyAdmins }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      socket?.emit('group-updated', { groupId: group._id, ...data.group });
      onUpdated(data.group); onClose();
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Hapus grup "${group.name}"? Tidak bisa dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/group/${group._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      socket?.emit('group-deleted', { groupId: group._id });
      onDeleted(group._id); onClose();
    } catch (e) { alert(e.message); }
  };

  const handleToggleAdmin = async (mid) => {
    const isNowAdmin = adminIds.includes(mid.toString());
    try {
      const res = await fetch(`/api/group/${group._id}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: mid, role: isNowAdmin ? 'member' : 'admin' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated(data.group);
    } catch (e) { alert(e.message); }
  };

  const handleKick = async (mid) => {
    if (!confirm('Keluarkan member ini dari grup?')) return;
    try {
      const res = await fetch(`/api/group/${group._id}/members`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: mid }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated(data.group);
    } catch (e) { alert(e.message); }
  };

  const tabStyle = (t) => ({
    flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: 'inherit',
    color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
    borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
    transition: 'all 0.15s',
  });

  return (
    <Overlay onClose={onClose}>
      <ModalBox maxWidth={460}>
        {/* Header */}
        <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Pengaturan Grup</span>
          <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', margin: '12px 0 0', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
          <button style={tabStyle('info')} onClick={() => setTab('info')}>Info</button>
          <button style={tabStyle('members')} onClick={() => setTab('members')}>Member ({members.length})</button>
        </div>

        <div style={{ padding: '20px' }}>

          {/* ── INFO TAB ── */}
          {tab === 'info' && (
            <>
              {/* Group photo */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ position: 'relative', cursor: isAdmin ? 'pointer' : 'default' }} onClick={() => isAdmin && photoRef.current?.click()}>
                  <Avatar user={{ name, avatar: photo }} size={80} isGroup />
                  {isAdmin && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                      {uploading ? <Spinner /> : <Icon.Camera />}
                    </div>
                  )}
                </div>
                {isAdmin && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Klik untuk ganti foto grup</span>}
                <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </div>

              {isAdmin
                ? <FocusInput label="Nama Grup" value={name} onChange={e => setName(e.target.value)} />
                : <div style={{ marginBottom: 14, textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{group.name}</div>
              }

              {/* Created info */}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                📅 Dibuat {group.createdAt ? new Date(group.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                {group.createdBy && ` oleh ${typeof group.createdBy === 'object' ? group.createdBy.username : (users.find(u => u._id === group.createdBy)?.username || 'Unknown')}`}
              </div>

              {/* Only admins toggle */}
              {isAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 20, cursor: 'pointer' }} onClick={() => setOnlyAdmins(v => !v)}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Hanya admin yang bisa kirim</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Seperti mode pengumuman WhatsApp</div>
                  </div>
                  <div style={{ width: 44, height: 24, borderRadius: 12, position: 'relative', background: onlyAdmins ? 'var(--accent)' : 'var(--text-subtle)', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: onlyAdmins ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </div>
                </div>
              )}

              {isAdmin && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {saving ? <Spinner /> : <><Icon.Check /> Simpan</>}
                  </button>
                  <button onClick={handleDelete} style={{ padding: '10px 16px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                    <Icon.Trash />
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── MEMBERS TAB ── */}
          {tab === 'members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members.map(m => {
                const mid  = typeof m === 'object' ? m._id?.toString() : m?.toString();
                const memberData = typeof m === 'object' ? m : users.find(u => u._id?.toString() === mid);
                if (!memberData) return null;
                const isMemberAdmin = adminIds.includes(mid);
                const isCreator = group.createdBy && (typeof group.createdBy === 'object' ? group.createdBy._id?.toString() : group.createdBy?.toString()) === mid;
                return (
                  <div key={mid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)' }}>
                    <Avatar user={memberData} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {memberData.username}
                        {isCreator && <span style={{ color: 'var(--accent)', fontSize: 10 }}><Icon.Crown /></span>}
                      </div>
                      <div style={{ fontSize: 11, color: isMemberAdmin ? 'var(--accent)' : 'var(--text-muted)' }}>{isMemberAdmin ? 'Admin' : 'Member'}</div>
                    </div>
                    {isAdmin && mid !== currentUser?._id?.toString() && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleToggleAdmin(mid)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          {isMemberAdmin ? '− Admin' : '+ Admin'}
                        </button>
                        {!isCreator && (
                          <button onClick={() => handleKick(mid)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--danger)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}>Kick</button>
                        )}
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
  );
}

// ═══════════════════════════════════════════════════════════
//  CREATE GROUP MODAL
// ═══════════════════════════════════════════════════════════
function CreateGroupModal({ show, onClose, users, currentUser, onCreated }) {
  const [name, setName]       = useState('');
  const [selected, setSelected] = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = users.filter(u => u._id !== currentUser?._id && u.username?.toLowerCase().includes(search.toLowerCase()));
  const toggle   = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/group/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, members: [...selected, currentUser._id] }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data.group); setName(''); setSelected([]); setSearch(''); onClose();
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  if (!show) return null;
  return (
    <Overlay onClose={onClose}>
      <ModalBox maxWidth={420}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Grup Baru</span>
            <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
          </div>
          <FocusInput label="Nama Grup" value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Tim Alpha" />
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Tambah Member</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 8, fontFamily: 'inherit' }} />
          {selected.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
              {selected.map(id => { const u = users.find(x => x._id === id); return u ? <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 4px', background: 'var(--accent-muted)', border: '1px solid var(--border-accent)', borderRadius: 20, fontSize: 12, color: 'var(--accent)' }}><Avatar user={u} size={16} />{u.username}<span style={{ cursor: 'pointer', display: 'flex' }} onClick={() => toggle(id)}><Icon.X /></span></span> : null; })}
            </div>
          )}
          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 18 }}>
            {filtered.map(u => (
              <div key={u._id} onClick={() => toggle(u._id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: selected.includes(u._id) ? 'var(--accent-muted)' : 'transparent', transition: 'background 0.12s' }}
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
          <button onClick={handleCreate} disabled={!name.trim() || selected.length === 0 || loading} style={{ width: '100%', padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!name.trim() || selected.length === 0) ? 0.5 : 1 }}>
            {loading ? <Spinner /> : `Buat Grup (${selected.length} member)`}
          </button>
        </div>
      </ModalBox>
    </Overlay>
  );
}

// ═══════════════════════════════════════════════════════════
//  SEARCH IN CHAT PANEL
// ═══════════════════════════════════════════════════════════
function SearchPanel({ messages, onClose, onJumpTo }) {
  const [query, setQuery] = useState('');
  const results = query.trim() ? messages.filter(m => m.content?.toLowerCase().includes(query.toLowerCase())) : [];
  return (
    <div style={{ width: 270, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--text-muted)' }}><Icon.Search /></span>
        <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari pesan..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit' }} />
        <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {query && results.length === 0 && <div style={{ padding: 16, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>Tidak ditemukan</div>}
        {results.map((msg, i) => (
          <div key={i} onClick={() => onJumpTo(msg._id)} style={{ padding: '9px 11px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginBottom: 4, background: 'var(--bg-elevated)' }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 3 }}>{msg.sender?.username || 'User'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {msg.content.split(new RegExp(`(${query})`, 'gi')).map((p, j) =>
                p.toLowerCase() === query.toLowerCase()
                  ? <mark key={j} style={{ background: 'var(--accent)', color: '#0a0c10', borderRadius: 2 }}>{p}</mark>
                  : p
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PRIVATE CALL OVERLAY (1-on-1)
// ═══════════════════════════════════════════════════════════
function PrivateCallOverlay({ call, onEnd, localStream, remoteStream }) {
  const localRef  = useRef(null);
  const remoteRef = useRef(null);
  const [muted, setMuted]       = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  useEffect(() => {
    if (localRef.current  && localStream)  localRef.current.srcObject  = localStream;
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream;
  }, [localStream, remoteStream]);

  const toggleMute  = () => { localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; }); setMuted(m => !m); };
  const toggleVideo = () => { localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; }); setVideoOff(v => !v); };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#080a0f', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <video ref={remoteRef} autoPlay playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: remoteStream ? 1 : 0 }} />
      {!remoteStream && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, zIndex: 1 }}>
          <Avatar user={call?.with} size={96} showRing />
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{call?.with?.username}</div>
          <div style={{ fontSize: 14, color: 'var(--accent)', animation: 'pulse 1.5s ease infinite' }}>
            {call?.status === 'incoming' ? '📞 Panggilan masuk...' : '📞 Memanggil...'}
          </div>
        </div>
      )}
      <video ref={localRef} autoPlay playsInline muted style={{ position: 'absolute', bottom: 96, right: 18, width: 120, height: 160, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid rgba(255,255,255,0.2)', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: 32, display: 'flex', gap: 16, zIndex: 3 }}>
        {call?.type === 'video' && <button onClick={toggleVideo} style={btnStyle(videoOff)}>{videoOff ? <Icon.VideoOff /> : <Icon.Video />}</button>}
        <button onClick={onEnd} style={{ ...btnStyle(false), width: 64, height: 64, background: 'var(--danger)', boxShadow: '0 0 20px rgba(255,77,109,0.4)' }}><Icon.PhoneOff /></button>
        <button onClick={toggleMute} style={btnStyle(muted)}>{muted ? <Icon.MicOff /> : <Icon.Mic />}</button>
      </div>
      {call?.status === 'incoming' && (
        <div style={{ position: 'absolute', bottom: 120, display: 'flex', gap: 16, zIndex: 3 }}>
          <button onClick={call.onAccept} style={{ padding: '12px 28px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--accent)', color: '#0a0c10', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>Terima</button>
          <button onClick={onEnd} style={{ padding: '12px 28px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--danger)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>Tolak</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  GROUP CALL OVERLAY (multi-peer mesh)
// ═══════════════════════════════════════════════════════════
function GroupCallOverlay({ groupId, groupName, callType, currentUser, socket, onEnd }) {
  const [peers, setPeers]         = useState({}); // socketId → { stream, username }
  const [localStream, setLocalStream] = useState(null);
  const [muted, setMuted]         = useState(false);
  const [videoOff, setVideoOff]   = useState(false);
  const localRef  = useRef(null);
  const peerConns = useRef({});   // socketId → RTCPeerConnection
  const localStreamRef = useRef(null);

  const STUN = { iceServers: [{ urls: process.env.NEXT_PUBLIC_STUN_SERVER || 'stun:stun.l.google.com:19302' }] };

  useEffect(() => {
    let stream;
    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (localRef.current) localRef.current.srcObject = stream;
        // Notify room this user joined
        socket.emit('group-call-join', { groupId, userId: currentUser._id, username: currentUser.username, callType });
      } catch (e) { alert('Tidak bisa akses mikrofon/kamera: ' + e.message); onEnd(); }
    };
    init();

    // Someone else joined → initiate offer to them
    socket.on('group-call-user-joined', async ({ socketId, username }) => {
      const pc = createPC(socketId, username);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('group-call-offer', { targetId: socketId, offer, callType });
    });

    // Receive offer from someone → answer
    socket.on('group-call-offer', async ({ offer, from, fromUsername }) => {
      const pc = createPC(from, fromUsername);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('group-call-answer', { targetId: from, answer });
    });

    // Receive answer
    socket.on('group-call-answer', async ({ answer, from }) => {
      await peerConns.current[from]?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // ICE
    socket.on('group-call-ice', ({ candidate, from }) => {
      peerConns.current[from]?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    });

    // Someone left
    socket.on('group-call-user-left', ({ socketId }) => {
      peerConns.current[socketId]?.close();
      delete peerConns.current[socketId];
      setPeers(prev => { const n = { ...prev }; delete n[socketId]; return n; });
    });

    return () => {
      ['group-call-user-joined','group-call-offer','group-call-answer','group-call-ice','group-call-user-left'].forEach(e => socket.off(e));
    };
  }, []);

  const createPC = (socketId, username) => {
    const pc = new RTCPeerConnection(STUN);
    localStreamRef.current?.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
    pc.ontrack = e => {
      setPeers(prev => ({ ...prev, [socketId]: { stream: e.streams[0], username } }));
    };
    pc.onicecandidate = e => {
      if (e.candidate) socket.emit('group-call-ice', { targetId: socketId, candidate: e.candidate });
    };
    peerConns.current[socketId] = pc;
    return pc;
  };

  const handleEnd = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    Object.values(peerConns.current).forEach(pc => pc.close());
    peerConns.current = {};
    socket.emit('group-call-leave', { groupId });
    onEnd();
  };

  const toggleMute  = () => { localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; }); setMuted(m => !m); };
  const toggleVideo = () => { localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; }); setVideoOff(v => !v); };

  const peerList = Object.entries(peers);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#080a0f', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
      {/* Group name */}
      <div style={{ padding: '16px 20px', color: '#fff', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--accent)' }}><Icon.Users /></span>
        {groupName} · {callType === 'video' ? '📹 Video Call' : '🎙 Voice Call'}
        <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{peerList.length + 1} participant</span>
      </div>

      {/* Video grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: peerList.length === 0 ? '1fr' : peerList.length < 3 ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 8, padding: '0 12px', alignContent: 'center' }}>
        {/* My tile */}
        <div style={{ position: 'relative', background: '#1a1d26', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video ref={localRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: callType === 'video' ? 'block' : 'none' }} />
          {(callType !== 'video' || videoOff) && <Avatar user={currentUser} size={64} />}
          <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 12, color: '#fff', fontWeight: 600, background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 20 }}>
            {currentUser.username} (Saya)
          </div>
          {muted && <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--danger)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon.MicOff /></div>}
        </div>

        {/* Peer tiles */}
        {peerList.map(([sid, peer]) => (
          <PeerTile key={sid} stream={peer.stream} username={peer.username} callType={callType} />
        ))}

        {/* Waiting placeholder if alone */}
        {peerList.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            <Icon.Users />
            Menunggu member lain bergabung...
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: '16px 0 32px', display: 'flex', justifyContent: 'center', gap: 16 }}>
        {callType === 'video' && <button onClick={toggleVideo} style={btnStyle(videoOff)}>{videoOff ? <Icon.VideoOff /> : <Icon.Video />}</button>}
        <button onClick={handleEnd} style={{ ...btnStyle(false), width: 64, height: 64, background: 'var(--danger)', boxShadow: '0 0 20px rgba(255,77,109,0.4)' }}><Icon.PhoneOff /></button>
        <button onClick={toggleMute} style={btnStyle(muted)}>{muted ? <Icon.MicOff /> : <Icon.Mic />}</button>
      </div>
    </div>
  );
}

function PeerTile({ stream, username, callType }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && stream) ref.current.srcObject = stream; }, [stream]);
  return (
    <div style={{ position: 'relative', background: '#1a1d26', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video ref={ref} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: callType === 'video' ? 'block' : 'none' }} />
      {callType !== 'video' && <Avatar user={{ username }} size={64} />}
      <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 12, color: '#fff', fontWeight: 600, background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 20 }}>{username}</div>
    </div>
  );
}

// shared button style untuk call controls
const btnStyle = (active) => ({
  width: 52, height: 52, borderRadius: '50%', border: 'none',
  background: active ? 'var(--danger)' : 'rgba(255,255,255,0.15)',
  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(4px)',
});

// ═══════════════════════════════════════════════════════════
//  MAIN CHAT PAGE
// ═══════════════════════════════════════════════════════════
export default function ChatPage() {
  const router = useRouter();

  // ── Core state ──
  const [user, setUser]               = useState(null);
  const [users, setUsers]             = useState([]);
  const [chats, setChats]             = useState([]);
  const [groups, setGroups]           = useState([]);
  const [activeTab, setActiveTab]     = useState('chats');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages]       = useState([]);
  const [newMessage, setNewMessage]   = useState('');
  const [loading, setLoading]         = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socket, setSocket]           = useState(null);

  // ── Online / typing ──
  const [onlineUsers, setOnlineUsers]   = useState([]);
  const [typingUser, setTypingUser]     = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  // ── UI ──
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [inputFocused, setInputFocused]   = useState(false);
  const [showMessageActions, setShowMessageActions] = useState(null);
  const [showSearchPanel, setShowSearchPanel]       = useState(false);

  // ── Modals ──
  const [showEditProfile, setShowEditProfile]     = useState(false);
  const [showCreateGroup, setShowCreateGroup]     = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showViewProfile, setShowViewProfile]     = useState(false);
  const [viewProfileUser, setViewProfileUser]     = useState(null);
  const [previewFile, setPreviewFile]             = useState(null);
  const [showFileModal, setShowFileModal]         = useState(false);
  const [deleteModal, setDeleteModal]             = useState({ show: false, message: null });

  // ── Private call (1-on-1) ──
  const [privateCall, setPrivateCall]   = useState(null);
  const [localStream, setLocalStream]   = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerRef = useRef(null);

  // ── Group call ──
  const [groupCall, setGroupCall] = useState(null); // { groupId, groupName, callType }
  const [incomingGroupCall, setIncomingGroupCall] = useState(null); // { groupId, groupName, callType, fromUsername }

  // ── Refs ──
  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);
  const typingRef      = useRef(false);
  const messageRefs    = useRef({});

  // ── Init ──
  useEffect(() => { loadUser(); loadUsers(); }, []);
  useEffect(() => { if (user) { loadChats(); loadGroups(); } }, [user]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ══════════════════════════════════════
  //  SOCKET
  // ══════════════════════════════════════
  useEffect(() => {
    if (!user) return;
    const token = Cookies.get('token');
    const sock  = connectSocket(token);
    setSocket(sock);
    sock.emit('user-online', user._id);

    sock.on('online-users', setOnlineUsers);
    sock.on('user-online',  uid => setOnlineUsers(prev => [...new Set([...prev, uid])]));
    sock.on('user-offline', uid => setOnlineUsers(prev => prev.filter(id => id !== uid)));

    sock.on('user-typing', data => {
      if (data.chatId === selectedChat?._id && data.userId !== user._id) {
        setTypingUser(data.username);
        setTimeout(() => setTypingUser(null), 3000);
      }
    });
    sock.on('user-stop-typing', data => { if (data.chatId === selectedChat?._id) setTypingUser(null); });
    sock.on('messages-read', data => { if (data.chatId === selectedChat?._id) setMessages(prev => prev.map(m => ({ ...m, read: true }))); });
    sock.on('message-deleted', data => { if (data.chatId === selectedChat?._id) setMessages(prev => prev.filter(m => m._id !== data.messageId)); });

    const seen = new Set();
    sock.on('new-message', msg => {
      if (seen.has(msg._id)) return; seen.add(msg._id);
      const fmt = { ...msg, senderId: msg.senderId?._id || msg.senderId, sender: msg.sender || msg.senderId };
      if (selectedChat && msg.chatId === selectedChat._id) {
        setMessages(prev => { if (prev.some(m => m._id === msg._id)) return prev; sock.emit('mark-read', { chatId: selectedChat._id, userId: user._id }); return [...prev, fmt]; });
      } else { setUnreadCounts(prev => ({ ...prev, [msg.chatId]: (prev[msg.chatId] || 0) + 1 })); }
      setChats(prev => prev.map(c => c._id === msg.chatId ? { ...c, lastMessage: msg } : c));
    });

    sock.on('new-group-message', msg => {
      if (seen.has(msg._id)) return; seen.add(msg._id);
      const fmt = { ...msg, senderId: msg.senderId?._id || msg.senderId, sender: msg.sender || msg.senderId };
      if (selectedChat && msg.groupId === selectedChat._id && selectedChat.type === 'group') {
        setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, fmt]);
      } else { setUnreadCounts(prev => ({ ...prev, [msg.groupId]: (prev[msg.groupId] || 0) + 1 })); }
      setGroups(prev => prev.map(g => g._id === msg.groupId ? { ...g, lastMessage: msg } : g));
    });

    sock.on('group-updated', g => setGroups(prev => prev.map(x => x._id === g._id ? { ...x, ...g, type: 'group' } : x)));
    sock.on('group-deleted', ({ groupId }) => { setGroups(prev => prev.filter(g => g._id !== groupId)); if (selectedChat?._id === groupId) setSelectedChat(null); });

    // ── 1-on-1 call signaling ──
    sock.on('call-offer', ({ offer, from, fromUserId, fromUsername, callType }) => {
      const callerUser = users.find(u => u._id === fromUserId) || { username: fromUsername, _id: fromUserId };
      setPrivateCall({ type: callType || 'audio', status: 'incoming', with: callerUser, socketId: from, offer, onAccept: () => handleAcceptCall(from, offer, callType, sock) });
    });
    sock.on('call-answer', async ({ answer }) => { if (peerRef.current) await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer)); });
    sock.on('ice-candidate', candidate => { peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {}); });
    sock.on('call-ended', () => cleanupPrivateCall());

    // ── Group call signaling (forwarding via server) ──
    sock.on('group-call-invite', ({ groupId, groupName, callType, fromUsername }) => {
      setIncomingGroupCall({ groupId, groupName, callType, fromUsername });
    });

    sock.on('connect', () => sock.emit('user-online', user._id));

    return () => {
      ['new-message','new-group-message','connect','online-users','user-online','user-offline','user-typing','user-stop-typing','messages-read','message-deleted','group-updated','group-deleted','call-offer','call-answer','ice-candidate','call-ended','group-call-invite'].forEach(e => sock.off(e));
      seen.clear();
    };
  }, [user, selectedChat]);

  // ══════════════════════════════════════
  //  DATA FETCHING
  // ══════════════════════════════════════
  const loadUser = async () => {
    try { const res = await fetch('/api/user/me'); const data = await res.json(); if (data.user) setUser(data.user); else router.push('/login'); } catch (e) { console.error(e); }
  };
  const loadUsers = async () => {
    try { const res = await fetch('/api/user/list'); const data = await res.json(); setUsers(data.users || []); } catch (e) { console.error(e); }
  };
  const loadChats = async () => {
    try {
      const res = await fetch('/api/chat/list'); const data = await res.json();
      setChats((data.chats || []).map(chat => {
        if (chat.otherUser) return { ...chat, type: 'private' };
        const otherId = Array.isArray(chat.members) ? chat.members.find(id => (typeof id === 'object' ? id._id?.toString() : id.toString()) !== user?._id) : null;
        const otherUser = typeof otherId === 'object' ? otherId : users.find(u => u._id === otherId);
        return { ...chat, type: 'private', otherUser: otherUser || { _id: otherId, username: 'Unknown' } };
      }));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const loadGroups = async () => {
    try { const res = await fetch('/api/group/list'); const data = await res.json(); setGroups((data.groups || []).map(g => ({ ...g, type: 'group' }))); } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const loadMessages = async (chatId, type = 'private') => {
    setLoadingMessages(true);
    try {
      const url = type === 'group' ? `/api/group/${chatId}/messages` : `/api/chat/${chatId}/messages`;
      const res = await fetch(url); const data = await res.json();
      setMessages((data.messages || []).map(m => ({ ...m, senderId: m.senderId?._id || m.senderId, sender: m.sender || m.senderId })));
    } catch (e) { console.error(e); } finally { setLoadingMessages(false); }
  };

  const createOrOpenChat = async (targetUser) => {
    try {
      const res = await fetch('/api/chat/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId: targetUser._id }) });
      const data = await res.json(); if (!res.ok) { alert(data.error); return; }
      const chatWithUser = { ...data.chat, type: 'private', otherUser: data.chat.otherUser || targetUser };
      setSelectedChat(chatWithUser); setUnreadCounts(prev => ({ ...prev, [data.chat._id]: 0 }));
      socket?.emit('join-chat', data.chat._id); socket?.emit('mark-read', { chatId: data.chat._id, userId: user._id });
      await loadMessages(data.chat._id, 'private');
      setChats(prev => prev.some(c => c._id === data.chat._id) ? prev : [chatWithUser, ...prev]);
      setActiveTab('chats');
    } catch (e) { console.error(e); }
  };

  const openGroup = async (group) => {
    setSelectedChat({ ...group, type: 'group' }); setUnreadCounts(prev => ({ ...prev, [group._id]: 0 }));
    socket?.emit('join-chat', group._id); await loadMessages(group._id, 'group');
  };

  // ══════════════════════════════════════
  //  MESSAGING
  // ══════════════════════════════════════
  const handleTyping = () => {
    if (!typingRef.current && socket && selectedChat) { typingRef.current = true; socket.emit('typing', { chatId: selectedChat._id, userId: user._id, username: user.username }); }
    if (typingTimeout) clearTimeout(typingTimeout);
    const t = setTimeout(() => { socket?.emit('stop-typing', { chatId: selectedChat._id, userId: user._id }); typingRef.current = false; }, 2000);
    setTypingTimeout(t);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sendingMessage) return;
    const isGroup = selectedChat.type === 'group';
    if (isGroup) {
      const g = groups.find(g => g._id === selectedChat._id);
      const adminIds = (g?.admins || []).map(a => typeof a === 'object' ? a._id?.toString() : a?.toString());
      if (g?.onlyAdmins && !adminIds.includes(user._id?.toString())) { alert('Hanya admin yang bisa kirim pesan di grup ini.'); return; }
    }
    setSendingMessage(true);
    try {
      const url = isGroup ? `/api/group/${selectedChat._id}/messages` : `/api/chat/${selectedChat._id}/messages`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newMessage }) });
      const data = await res.json(); if (!res.ok) { alert(data.error); return; }
      socket?.emit('stop-typing', { chatId: selectedChat._id, userId: user._id });
      if (isGroup) socket?.emit('group-message', { groupId: selectedChat._id, ...data.message });
      else socket?.emit('private-message', { chatId: selectedChat._id, ...data.message });
      const newMsg = { ...data.message, senderId: user._id, sender: { _id: user._id, username: user.username, avatar: user.avatar }, createdAt: new Date().toISOString(), read: true };
      setMessages(prev => prev.some(m => m._id === data.message._id) ? prev : [...prev, newMsg]);
      setNewMessage('');
    } catch (e) { console.error(e); } finally { setSendingMessage(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file || !selectedChat) return;
    setSendingMessage(true); const isGroup = selectedChat.type === 'group';
    try {
      const url = await uploadPhoto(file, selectedChat._id);
      const msgUrl = isGroup ? `/api/group/${selectedChat._id}/messages` : `/api/chat/${selectedChat._id}/messages`;
      const msgRes = await fetch(msgUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `📎 ${file.name}`, fileUrl: url, fileType: file.type, fileName: file.name, fileSize: file.size }) });
      const msgData = await msgRes.json();
      if (msgRes.ok && msgData.message) {
        if (isGroup) socket?.emit('group-message', { groupId: selectedChat._id, ...msgData.message });
        else socket?.emit('private-message', { chatId: selectedChat._id, ...msgData.message });
        setMessages(prev => [...prev, { ...msgData.message, senderId: user._id, sender: { _id: user._id, username: user.username, avatar: user.avatar }, createdAt: new Date().toISOString(), fileUrl: url, fileType: file.type, fileName: file.name, fileSize: file.size }]);
      }
      e.target.value = '';
    } catch (err) { alert(err.message); } finally { setSendingMessage(false); }
  };

  const handleDeleteMessage = async (deleteType) => {
    if (!deleteModal.message) return;
    const isGroup = selectedChat.type === 'group';
    try {
      const url = isGroup
        ? `/api/group/${selectedChat._id}/messages?messageId=${deleteModal.message._id}&deleteType=${deleteType}`
        : `/api/chat/${selectedChat._id}/messages?messageId=${deleteModal.message._id}&deleteType=${deleteType}`;
      const res = await fetch(url, { method: 'DELETE' }); const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(prev => prev.filter(m => m._id !== deleteModal.message._id));
      setDeleteModal({ show: false, message: null });
      if (deleteType === 'everyone') socket?.emit('delete-message', { chatId: selectedChat._id, messageId: deleteModal.message._id });
    } catch (e) { alert(e.message); }
  };

  // ══════════════════════════════════════
  //  PRIVATE WEBRTC CALL
  // ══════════════════════════════════════
  const STUN = { iceServers: [{ urls: process.env.NEXT_PUBLIC_STUN_SERVER || 'stun:stun.l.google.com:19302' }] };

  const createPeer = (stream, sock) => {
    const pc = new RTCPeerConnection(STUN);
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    pc.ontrack = e => setRemoteStream(e.streams[0]);
    pc.onicecandidate = e => { if (e.candidate) (sock || socket)?.emit('ice-candidate', { targetId: privateCall?.socketId, candidate: e.candidate }); };
    peerRef.current = pc; return pc;
  };

  const startPrivateCall = async (type = 'audio') => {
    if (!selectedChat || selectedChat.type === 'group') return;
    const targetUserId = selectedChat.otherUser?._id; if (!targetUserId) return;
    const getSocketId = () => new Promise(resolve => {
      socket.emit('get-socket-id', { userId: targetUserId });
      const h = ({ userId, socketId }) => { if (userId === targetUserId) { socket.off('socket-id-result', h); resolve(socketId); } };
      socket.on('socket-id-result', h);
      setTimeout(() => { socket.off('socket-id-result', h); resolve(null); }, 3000);
    });
    try {
      const targetSocketId = await getSocketId();
      if (!targetSocketId) { alert('User sedang offline.'); return; }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      setLocalStream(stream);
      const pc = createPeer(stream, socket);
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      socket.emit('call-offer', { targetId: targetSocketId, offer, fromUserId: user._id, fromUsername: user.username, callType: type });
      setPrivateCall({ type, status: 'calling', with: selectedChat.otherUser, socketId: targetSocketId });
    } catch (e) { alert('Gagal memulai call: ' + e.message); }
  };

  const handleAcceptCall = async (fromSocketId, offer, callType, sock) => {
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
      setPrivateCall(prev => ({ ...prev, status: 'active' }));
    } catch (e) { console.error(e); cleanupPrivateCall(); }
  };

  const cleanupPrivateCall = () => {
    localStream?.getTracks().forEach(t => t.stop());
    peerRef.current?.close(); peerRef.current = null;
    setLocalStream(null); setRemoteStream(null); setPrivateCall(null);
  };

  const endPrivateCall = () => {
    if (privateCall?.socketId) socket?.emit('call-end', { targetId: privateCall.socketId });
    cleanupPrivateCall();
  };

  // ══════════════════════════════════════
  //  GROUP CALL
  // ══════════════════════════════════════
  const startGroupCall = (type = 'audio') => {
    if (!selectedChat || selectedChat.type !== 'group') return;
    // Notify all group members
    socket?.emit('group-call-start', { groupId: selectedChat._id, groupName: selectedChat.name, callType: type, fromUsername: user.username });
    setGroupCall({ groupId: selectedChat._id, groupName: selectedChat.name, callType: type });
  };

  const acceptGroupCall = () => {
    if (!incomingGroupCall) return;
    setGroupCall({ ...incomingGroupCall });
    setIncomingGroupCall(null);
  };

  // ══════════════════════════════════════
  //  MISC HELPERS
  // ══════════════════════════════════════
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }); Cookies.remove('token'); socket?.disconnect(); router.push('/login');
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    try { const d = new Date(ts), now = new Date(); if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); if (now - d < 172800000) return 'Kemarin'; return d.toLocaleDateString([], { month: 'short', day: 'numeric' }); } catch { return ''; }
  };

  const isUserOnline  = uid => onlineUsers.includes(uid?.toString());
  const isGroupAdmin  = () => { if (!selectedChat || selectedChat.type !== 'group') return false; const g = groups.find(g => g._id === selectedChat._id); return (g?.admins || []).map(a => typeof a === 'object' ? a._id?.toString() : a?.toString()).includes(user?._id?.toString()); };
  const canSend       = () => { if (!selectedChat) return false; if (selectedChat.type === 'private') return true; const g = groups.find(g => g._id === selectedChat._id); if (!g) return true; const adminIds = (g.admins || []).map(a => typeof a === 'object' ? a._id?.toString() : a?.toString()); return !g.onlyAdmins || adminIds.includes(user?._id?.toString()); };

  const filteredChats  = chats.filter(c => (c.otherUser?.username || '').toLowerCase().includes(sidebarSearch.toLowerCase()));
  const filteredGroups = groups.filter(g => (g.name || '').toLowerCase().includes(sidebarSearch.toLowerCase()));
  const filteredUsers  = users.filter(u => u._id !== user?._id && u.username?.toLowerCase().includes(sidebarSearch.toLowerCase()));

  // ══════════════════════════════════════
  //  LOADING
  // ══════════════════════════════════════
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0c10' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderWidth: 3, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#00e5c3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#6b7280', fontSize: 14 }}>Loading...</span>
      </div>
    </div>
  );

  // ══════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════
  return (
    <div style={{ height: '100vh', display: 'flex', background: 'var(--bg-base)', fontFamily: "'DM Sans','Geist',sans-serif", overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        :root{--bg-base:#0a0c10;--bg-surface:#111318;--bg-elevated:#1a1d26;--bg-hover:#20242f;--accent:#00e5c3;--accent-muted:rgba(0,229,195,0.12);--accent-glow:rgba(0,229,195,0.25);--text-primary:#e8ecf0;--text-muted:#6b7280;--text-subtle:#2d3240;--border:rgba(255,255,255,0.07);--border-accent:rgba(0,229,195,0.3);--danger:#ff4d6d;--danger-muted:rgba(255,77,109,0.12);--bubble-me:#00c4a8;--bubble-them:#1e2130;--radius-sm:8px;--radius-md:12px;--radius-lg:18px;--shadow-glow:0 0 20px rgba(0,229,195,0.15)}
        *{box-sizing:border-box;margin:0;padding:0}body{background:var(--bg-base);color:var(--text-primary)}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}
        @keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@keyframes dots{0%,80%,100%{opacity:.2;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}
        .row-hov:hover{background:var(--bg-elevated)!important}.send-btn:hover:not(:disabled){transform:scale(1.07);box-shadow:var(--shadow-glow)}.send-btn:disabled{opacity:.4;cursor:not-allowed}.msg{animation:fadeUp .16s ease}::placeholder{color:var(--text-muted)}
        .tab-btn{padding:8px 0;font-size:13px;font-weight:600;flex:1;cursor:pointer;border:none;border-bottom:2px solid transparent;background:transparent;font-family:inherit;color:var(--text-muted);transition:all .15s}.tab-active{color:var(--accent)!important;border-bottom-color:var(--accent)!important}
      `}</style>

      {/* ════════ SIDEBAR ════════ */}
      <aside style={{ width: 300, minWidth: 260, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* My profile */}
        <div style={{ padding: '14px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ cursor: 'pointer' }} onClick={() => setShowEditProfile(true)} title="Edit profil">
            <Avatar user={user} size={40} showRing />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <OnlineDot online /><span style={{ fontSize: 11, color: 'var(--accent)' }}>Online</span>
            </div>
          </div>
          <IconBtn onClick={() => setShowEditProfile(true)} title="Edit profil"><Icon.Edit /></IconBtn>
          <IconBtn onClick={handleLogout} title="Logout" danger><Icon.Logout /></IconBtn>
        </div>

        {/* Search bar */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}><Icon.Search /></span>
            <input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} placeholder="Cari..." style={{ width: '100%', padding: '8px 12px 8px 32px', background: 'var(--bg-elevated)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = 'var(--border-accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 12px' }}>
          <button className={`tab-btn${activeTab === 'chats' ? ' tab-active' : ''}`} onClick={() => setActiveTab('chats')}>Chat</button>
          <button className={`tab-btn${activeTab === 'groups' ? ' tab-active' : ''}`} onClick={() => setActiveTab('groups')}>Grup</button>
          <button className={`tab-btn${activeTab === 'people' ? ' tab-active' : ''}`} onClick={() => setActiveTab('people')}>People</button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'chats' && (
            filteredChats.length === 0
              ? <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--text-muted)' }}>Belum ada chat. Buka tab People!</div>
              : filteredChats.map(chat => {
                const ou = chat.otherUser || {}; const isOnline = isUserOnline(ou._id); const unread = unreadCounts[chat._id] || 0;
                const isSel = selectedChat?._id === chat._id && selectedChat?.type === 'private';
                return (
                  <div key={chat._id} className="row-hov" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer', margin: '1px 0', borderLeft: isSel ? '2px solid var(--accent)' : '2px solid transparent', background: isSel ? 'var(--accent-muted)' : 'transparent', transition: 'all 0.12s' }}
                    onClick={() => { setSelectedChat({ ...chat, type: 'private' }); setUnreadCounts(prev => ({ ...prev, [chat._id]: 0 })); socket?.emit('join-chat', chat._id); socket?.emit('mark-read', { chatId: chat._id, userId: user._id }); loadMessages(chat._id, 'private'); }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar user={ou} size={38} showRing={isSel} />
                      <span style={{ position: 'absolute', bottom: 0, right: 0 }}><OnlineDot online={isOnline} /></span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: unread > 0 ? 700 : 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ou.username || 'Unknown'}</div>
                      {chat.lastMessage && <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{typeof chat.lastMessage === 'object' ? chat.lastMessage.content : chat.lastMessage}</div>}
                    </div>
                    {unread > 0 && <span style={{ background: 'var(--accent)', color: '#0a0c10', fontSize: 11, fontWeight: 700, borderRadius: 12, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>{unread}</span>}
                  </div>
                );
              })
          )}

          {activeTab === 'groups' && (
            <>
              <div style={{ padding: '10px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>GRUP</span>
                <button onClick={() => setShowCreateGroup(true)} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 10px', background: 'var(--accent-muted)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-accent)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Icon.Plus /> Baru
                </button>
              </div>
              {filteredGroups.length === 0
                ? <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>Belum ada grup.</div>
                : filteredGroups.map(group => {
                  const unread = unreadCounts[group._id] || 0; const isSel = selectedChat?._id === group._id && selectedChat?.type === 'group';
                  return (
                    <div key={group._id} className="row-hov" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer', margin: '1px 0', borderLeft: isSel ? '2px solid var(--accent)' : '2px solid transparent', background: isSel ? 'var(--accent-muted)' : 'transparent', transition: 'all 0.12s' }}
                      onClick={() => openGroup(group)}>
                      <Avatar user={{ name: group.name, avatar: group.photo }} size={38} isGroup showRing={isSel} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: unread > 0 ? 700 : 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{group.members?.length || 0} member</div>
                      </div>
                      {unread > 0 && <span style={{ background: 'var(--accent)', color: '#0a0c10', fontSize: 11, fontWeight: 700, borderRadius: 12, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>{unread}</span>}
                    </div>
                  );
                })}
            </>
          )}

          {activeTab === 'people' && (
            <>
              <div style={{ padding: '10px 16px 6px', fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>SEMUA USER</div>
              {filteredUsers.length === 0
                ? <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>Tidak ada user.</div>
                : filteredUsers.map(u => (
                  <div key={u._id} className="row-hov" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer' }}
                    onClick={() => { createOrOpenChat(u); setActiveTab('chats'); }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar user={u} size={34} />
                      <span style={{ position: 'absolute', bottom: 0, right: 0 }}><OnlineDot online={isUserOnline(u._id)} /></span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{u.username}</div>
                      <div style={{ fontSize: 11, color: isUserOnline(u._id) ? 'var(--accent)' : 'var(--text-muted)' }}>{isUserOnline(u._id) ? 'Online' : 'Offline'}</div>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      </aside>

      {/* ════════ MAIN AREA ════════ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedChat ? (
            <>
              {/* Header */}
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer', minWidth: 0 }}
                  onClick={() => { if (selectedChat.type === 'group') setShowGroupSettings(true); else { setViewProfileUser(selectedChat.otherUser); setShowViewProfile(true); } }}>
                  <div style={{ position: 'relative' }}>
                    {selectedChat.type === 'group'
                      ? <Avatar user={{ name: selectedChat.name, avatar: selectedChat.photo }} size={42} isGroup />
                      : <><Avatar user={selectedChat.otherUser} size={42} showRing={isUserOnline(selectedChat.otherUser?._id)} /><span style={{ position: 'absolute', bottom: 1, right: 1 }}><OnlineDot online={isUserOnline(selectedChat.otherUser?._id)} /></span></>
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedChat.type === 'group' ? selectedChat.name : selectedChat.otherUser?.username}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                      {selectedChat.type === 'group'
                        ? `${selectedChat.members?.length || 0} member${selectedChat.onlyAdmins ? ' · 📢 Admin only' : ''}`
                        : (isUserOnline(selectedChat.otherUser?._id) ? <span style={{ color: 'var(--accent)' }}>Online</span> : 'Offline')
                      }
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {selectedChat.type === 'private' && <>
                    <IconBtn onClick={() => startPrivateCall('audio')} title="Voice call"><Icon.Phone /></IconBtn>
                    <IconBtn onClick={() => startPrivateCall('video')} title="Video call"><Icon.Video /></IconBtn>
                  </>}
                  {selectedChat.type === 'group' && <>
                    <IconBtn onClick={() => startGroupCall('audio')} title="Group voice call"><Icon.Phone /></IconBtn>
                    <IconBtn onClick={() => startGroupCall('video')} title="Group video call"><Icon.Video /></IconBtn>
                  </>}
                  <IconBtn onClick={() => setShowSearchPanel(v => !v)} title="Cari pesan" active={showSearchPanel}><Icon.Search /></IconBtn>
                  <IconBtn onClick={() => fileInputRef.current?.click()} title="Lampirkan file"><Icon.Attach /></IconBtn>
                  {selectedChat.type === 'group' && isGroupAdmin() && <IconBtn onClick={() => setShowGroupSettings(true)} title="Pengaturan grup"><Icon.Settings /></IconBtn>}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {loadingMessages
                  ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat pesan...</div>
                  : messages.length === 0
                    ? <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)' }}><span style={{ fontSize: 36 }}>💬</span><span style={{ fontSize: 14 }}>Belum ada pesan — mulai percakapan!</span></div>
                    : messages.map((msg, idx) => {
                      const sid   = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
                      const isMe  = sid === user?._id;
                      const sName = msg.sender?.username || (typeof msg.senderId === 'object' ? msg.senderId?.username : 'User');
                      const key   = msg._id ? `${msg._id}-${idx}` : `tmp-${idx}`;
                      const msgDate  = msg.createdAt ? new Date(msg.createdAt).toDateString() : null;
                      const prevDate = idx > 0 && messages[idx-1].createdAt ? new Date(messages[idx-1].createdAt).toDateString() : null;
                      return (
                        <div key={key} ref={el => { if (msg._id) messageRefs.current[msg._id] = el; }}>
                          {msgDate && msgDate !== prevDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 6px' }}>
                              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(msg.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                            </div>
                          )}
                          <div className="msg" style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 7, marginBottom: 2 }}>
                            {!isMe && <Avatar user={{ username: sName, avatar: msg.sender?.avatar }} size={27} />}
                            <div style={{ position: 'relative', maxWidth: '65%' }}
                              onMouseEnter={() => setShowMessageActions(key)} onMouseLeave={() => setShowMessageActions(null)}>
                              {selectedChat.type === 'group' && !isMe && (
                                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 2, paddingLeft: 4 }}>{sName}</div>
                              )}
                              {isMe && showMessageActions === key && (
                                <div style={{ position: 'absolute', top: -38, right: 0, display: 'flex', gap: 4, background: 'var(--bg-surface)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 6px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', zIndex: 10 }}>
                                  <IconBtn onClick={() => setDeleteModal({ show: true, message: msg })} danger style={{ width: 26, height: 26 }}><Icon.Trash /></IconBtn>
                                  <IconBtn onClick={() => navigator.clipboard.writeText(msg.content)} style={{ width: 26, height: 26 }}><Icon.Copy /></IconBtn>
                                </div>
                              )}
                              <div style={{ padding: '9px 13px', borderRadius: isMe ? 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)' : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px', background: isMe ? 'var(--bubble-me)' : 'var(--bubble-them)', color: isMe ? '#0a0c10' : 'var(--text-primary)', fontSize: 14, lineHeight: 1.5, boxShadow: isMe ? '0 2px 10px rgba(0,196,168,0.2)' : '0 2px 6px rgba(0,0,0,0.2)' }}>
                                {msg.fileUrl
                                  ? msg.fileType?.startsWith('image/')
                                    ? <img src={msg.fileUrl} alt={msg.fileName} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'block' }} onClick={() => { setPreviewFile(msg); setShowFileModal(true); }} />
                                    : <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => { setPreviewFile(msg); setShowFileModal(true); }}><span style={{ fontSize: 20 }}>📎</span><span style={{ fontSize: 13 }}>{msg.fileName || msg.content}</span></div>
                                  : msg.content}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(msg.createdAt)}</span>
                                {isMe && msg.read && <span style={{ fontSize: 11, color: 'var(--accent)' }}>✓✓</span>}
                              </div>
                            </div>
                            {isMe && <Avatar user={user} size={27} />}
                          </div>
                        </div>
                      );
                    })
                }
                {typingUser && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ padding: '10px 13px', background: 'var(--bubble-them)', borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px', display: 'flex', gap: 4 }}>
                      {[0, 0.2, 0.4].map((d, i) => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: `dots 1.2s ${d}s infinite` }} />)}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{typingUser} sedang mengetik</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <form onSubmit={sendMessage} style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {canSend() ? (
                  <>
                    <input type="text" value={newMessage} onChange={e => { setNewMessage(e.target.value); handleTyping(); }} placeholder="Kirim pesan..."
                      style={{ flex: 1, padding: '10px 16px', background: 'var(--bg-elevated)', borderWidth: 1, borderStyle: 'solid', borderColor: inputFocused ? 'var(--border-accent)' : 'var(--border)', borderRadius: 24, color: 'var(--text-primary)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
                      onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} />
                    <button type="submit" className="send-btn" disabled={!newMessage.trim() || sendingMessage} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'var(--accent)', color: '#0a0c10', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
                      {sendingMessage ? <Spinner size={14} /> : <Icon.Send />}
                    </button>
                  </>
                ) : (
                  <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>📢 Hanya admin yang bisa kirim pesan di grup ini</div>
                )}
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: 'var(--text-muted)' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-surface)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>💬</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Pilih percakapan</div>
              <div style={{ fontSize: 13 }}>Pilih chat atau grup dari sidebar</div>
            </div>
          )}
        </div>

        {/* Search panel */}
        {showSearchPanel && selectedChat && (
          <SearchPanel messages={messages} onClose={() => setShowSearchPanel(false)} onJumpTo={id => { messageRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setShowSearchPanel(false); }} />
        )}
      </div>

      {/* ════════ MODALS ════════ */}

      {/* Edit profile */}
      <EditProfileModal show={showEditProfile} onClose={() => setShowEditProfile(false)} currentUser={user}
        onSaved={updatedUser => { setUser(updatedUser); setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u)); }} />

      {/* View other user profile */}
      <ViewProfileModal show={showViewProfile} onClose={() => setShowViewProfile(false)} targetUser={viewProfileUser} isOnline={isUserOnline(viewProfileUser?._id)} />

      {/* Group settings */}
      <GroupSettingsModal show={showGroupSettings} onClose={() => setShowGroupSettings(false)}
        group={groups.find(g => g._id === selectedChat?._id)} currentUser={user} users={users} socket={socket}
        onUpdated={updated => { setGroups(prev => prev.map(g => g._id === updated._id ? { ...g, ...updated, type: 'group' } : g)); if (selectedChat?._id === updated._id) setSelectedChat(prev => ({ ...prev, ...updated })); }}
        onDeleted={id => { setGroups(prev => prev.filter(g => g._id !== id)); if (selectedChat?._id === id) setSelectedChat(null); }} />

      {/* Create group */}
      <CreateGroupModal show={showCreateGroup} onClose={() => setShowCreateGroup(false)} users={users} currentUser={user}
        onCreated={g => { const wt = { ...g, type: 'group' }; setGroups(prev => [wt, ...prev]); setActiveTab('groups'); openGroup(wt); }} />

      {/* File preview */}
      {showFileModal && previewFile && (
        <Overlay onClose={() => setShowFileModal(false)}>
          <div style={{ background: 'var(--bg-surface)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)', width: '90vw', maxWidth: 800, maxHeight: '90vh', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{previewFile.fileName || 'File'}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <a href={previewFile.fileUrl} download={previewFile.fileName}><IconBtn><Icon.Download /></IconBtn></a>
                <IconBtn onClick={() => setShowFileModal(false)}><Icon.Close /></IconBtn>
              </div>
            </div>
            <div style={{ padding: 18, overflowY: 'auto', maxHeight: 'calc(90vh - 58px)' }}>
              {previewFile.fileType?.startsWith('image/')
                ? <img src={previewFile.fileUrl} alt="" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--radius-md)', display: 'block', margin: '0 auto' }} />
                : previewFile.fileType === 'application/pdf'
                  ? <iframe src={previewFile.fileUrl} style={{ width: '100%', height: '70vh', border: 'none' }} title="" />
                  : <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>📄</div>
                    <a href={previewFile.fileUrl} download={previewFile.fileName} style={{ padding: '10px 20px', background: 'var(--accent)', color: '#0a0c10', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>Download</a>
                  </div>
              }
            </div>
          </div>
        </Overlay>
      )}

      {/* Delete message */}
      {deleteModal.show && (
        <Overlay onClose={() => setDeleteModal({ show: false, message: null })}>
          <ModalBox maxWidth={340}>
            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Hapus Pesan</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>Hapus untuk siapa?</div>
              <button style={{ width: '100%', padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 8 }} onClick={() => handleDeleteMessage('self')}>Hapus untuk saya</button>
              <button style={{ width: '100%', padding: '10px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginBottom: 8 }} onClick={() => handleDeleteMessage('everyone')}>Hapus untuk semua</button>
              <button style={{ width: '100%', padding: '10px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }} onClick={() => setDeleteModal({ show: false, message: null })}>Batal</button>
            </div>
          </ModalBox>
        </Overlay>
      )}

      {/* Incoming group call notification */}
      {incomingGroupCall && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 250, background: 'var(--bg-surface)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-accent)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 14, animation: 'fadeUp 0.2s ease', minWidth: 280 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', animation: 'pulse 1.2s ease infinite' }}>
            {incomingGroupCall.callType === 'video' ? <Icon.Video /> : <Icon.Phone />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{incomingGroupCall.groupName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{incomingGroupCall.fromUsername} mengundang ke {incomingGroupCall.callType === 'video' ? 'video' : 'voice'} call</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={acceptGroupCall} style={{ padding: '7px 14px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Join</button>
            <button onClick={() => setIncomingGroupCall(null)} style={{ padding: '7px 14px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>Tolak</button>
          </div>
        </div>
      )}

      {/* Private call overlay */}
      {privateCall && (
        <PrivateCallOverlay call={privateCall} onEnd={endPrivateCall} localStream={localStream} remoteStream={remoteStream} />
      )}

      {/* Group call overlay */}
      {groupCall && socket && (
        <GroupCallOverlay
          groupId={groupCall.groupId} groupName={groupCall.groupName} callType={groupCall.callType}
          currentUser={user} socket={socket} onEnd={() => setGroupCall(null)} />
      )}
    </div>
  );
}