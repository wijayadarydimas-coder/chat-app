'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { connectSocket } from '@/lib/socket-client';
import Cookies from 'js-cookie';

// ═══════════════════════════════════════════════════════════
//  ICONS (zero deps)
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
  Group:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Edit:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Settings: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Crown:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>,
  MicOff:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  VideoOff: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  PhoneOff: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11l-.94.94"/><line x1="23" y1="1" x2="1" y2="23"/></svg>,
  Plus:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Camera:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  X:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// ═══════════════════════════════════════════════════════════
//  SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════
function Avatar({ user, size = 36, showRing = false, isGroup = false }) {
  const name = user?.name || user?.username || 'G';
  const src = user?.avatar || user?.photo
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${isGroup ? '1a1d26' : '00c4a8'}&color=${isGroup ? '00e5c3' : '0a0c10'}&bold=true&length=1`;
  return (
    <div style={{
      width: size, height: size, borderRadius: isGroup ? 'var(--radius-sm)' : '50%', flexShrink: 0,
      borderWidth: 2, borderStyle: 'solid', borderColor: showRing ? 'var(--accent)' : 'var(--border)',
      boxShadow: showRing ? 'var(--shadow-glow)' : 'none', overflow: 'hidden', transition: 'all 0.2s ease',
    }}>
      <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

function OnlineDot({ online }) {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: online ? 'var(--accent)' : 'var(--text-subtle)', boxShadow: online ? '0 0 6px var(--accent)' : 'none', flexShrink: 0 }} />;
}

function IconBtn({ children, onClick, title, danger = false, active = false, style = {} }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34, borderRadius: 'var(--radius-sm)',
        borderWidth: 1, borderStyle: 'solid', borderColor: active ? 'var(--accent)' : 'var(--border)',
        background: active ? 'var(--accent-muted)' : hovered ? (danger ? 'var(--danger-muted)' : 'var(--bg-elevated)') : 'transparent',
        color: active ? 'var(--accent)' : hovered ? (danger ? 'var(--danger)' : 'var(--text-primary)') : (danger ? 'var(--danger)' : 'var(--text-muted)'),
        cursor: 'pointer', transition: 'all 0.15s ease', ...style
      }}>
      {children}
    </button>
  );
}

function Spinner() {
  return <div style={{ width: 16, height: 16, borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />;
}

function Modal({ show, onClose, children, maxWidth = 420 }) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth, boxShadow: '0 32px 64px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder, style = {} }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', borderWidth: 1, borderStyle: 'solid', borderColor: focused ? 'var(--border-accent)' : 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', fontFamily: 'inherit' }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  CALL OVERLAY
// ═══════════════════════════════════════════════════════════
function CallOverlay({ call, onEnd, localStream, remoteStream }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [localStream, remoteStream]);

  const toggleMute = () => {
    if (localStream) localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMuted(m => !m);
  };
  const toggleVideo = () => {
    if (localStream) localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setVideoOff(v => !v);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050709', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      {/* Remote video */}
      <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, objectFit: 'cover', opacity: remoteStream ? 1 : 0 }} />
      {/* No video placeholder */}
      {!remoteStream && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, zIndex: 1 }}>
          <Avatar user={call?.with} size={96} showRing />
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{call?.with?.username}</div>
          <div style={{ fontSize: 14, color: 'var(--accent)', animation: 'pulse 1.5s ease infinite' }}>
            {call?.status === 'incoming' ? 'Incoming call...' : 'Calling...'}
          </div>
        </div>
      )}
      {/* Local video PiP */}
      <video ref={localVideoRef} autoPlay playsInline muted style={{ position: 'absolute', bottom: 100, right: 20, width: 120, height: 160, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid var(--border)', zIndex: 2 }} />
      {/* Controls */}
      <div style={{ position: 'absolute', bottom: 32, display: 'flex', gap: 16, zIndex: 3 }}>
        {call?.type === 'video' && (
          <button onClick={toggleVideo} style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', background: videoOff ? 'var(--danger)' : 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {videoOff ? <Icon.VideoOff /> : <Icon.Video />}
          </button>
        )}
        <button onClick={onEnd} style={{ width: 64, height: 64, borderRadius: '50%', border: 'none', background: 'var(--danger)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,77,109,0.4)' }}>
          <Icon.PhoneOff />
        </button>
        <button onClick={toggleMute} style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', background: muted ? 'var(--danger)' : 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {muted ? <Icon.MicOff /> : <Icon.Phone />}
        </button>
      </div>
      {/* Incoming call accept */}
      {call?.status === 'incoming' && (
        <div style={{ position: 'absolute', bottom: 120, display: 'flex', gap: 20, zIndex: 3 }}>
          <button onClick={call.onAccept} style={{ padding: '12px 28px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--accent)', color: '#0a0c10', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>Accept</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SEARCH IN CHAT PANEL
// ═══════════════════════════════════════════════════════════
function SearchPanel({ messages, onClose, onJumpTo }) {
  const [query, setQuery] = useState('');
  const results = query.trim().length > 0
    ? messages.filter(m => m.content?.toLowerCase().includes(query.toLowerCase()))
    : [];
  return (
    <div style={{ width: 280, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon.Search />
        <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search in chat..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit' }} />
        <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {query && results.length === 0 && <div style={{ padding: 16, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No results found</div>}
        {results.map((msg, i) => (
          <div key={i} onClick={() => onJumpTo(msg._id)} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginBottom: 4, background: 'var(--bg-elevated)', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}>
            <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 4 }}>{msg.sender?.username || 'User'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {msg.content.split(new RegExp(`(${query})`, 'gi')).map((part, j) =>
                part.toLowerCase() === query.toLowerCase()
                  ? <mark key={j} style={{ background: 'var(--accent)', color: '#0a0c10', borderRadius: 2, padding: '0 2px' }}>{part}</mark>
                  : part
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
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
  const [tab, setTab] = useState('info'); // info | members
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (group) {
      setName(group.name || '');
      setPhoto(group.photo || '');
      setOnlyAdmins(group.onlyAdmins || false);
    }
  }, [group]);

  if (!group) return null;
  const isAdmin = group.admins?.includes(currentUser._id);
  const members = group.members || [];

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/group/${group._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, photo, onlyAdmins })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      socket?.emit('group-updated', { groupId: group._id, ...data.group });
      onUpdated(data.group);
      onClose();
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete group "${group.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/group/${group._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      socket?.emit('group-deleted', { groupId: group._id });
      onDeleted(group._id);
      onClose();
    } catch (e) { alert(e.message); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('chatId', group._id);
    try {
      const res = await fetch('/api/chat/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok) setPhoto(data.fileUrl);
    } catch (e) { console.error(e); }
  };

  const handleToggleAdmin = async (memberId) => {
    try {
      const isCurrentAdmin = group.admins?.includes(memberId);
      const res = await fetch(`/api/group/${group._id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: memberId, role: isCurrentAdmin ? 'member' : 'admin' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated(data.group);
    } catch (e) { alert(e.message); }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member from the group?')) return;
    try {
      const res = await fetch(`/api/group/${group._id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: memberId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated(data.group);
    } catch (e) { alert(e.message); }
  };

  const tabStyle = (t) => ({
    padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
    background: tab === t ? 'var(--accent-muted)' : 'transparent',
    color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
    borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
    transition: 'all 0.15s',
  });

  return (
    <Modal show={show} onClose={onClose} maxWidth={460}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Group Settings</span>
        <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
      </div>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', margin: '12px 0 0' }}>
        <button style={tabStyle('info')} onClick={() => setTab('info')}>Info</button>
        <button style={tabStyle('members')} onClick={() => setTab('members')}>Members ({members.length})</button>
      </div>

      <div style={{ padding: '20px 24px 24px' }}>
        {tab === 'info' && (
          <>
            {/* Group photo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ position: 'relative', cursor: isAdmin ? 'pointer' : 'default' }} onClick={() => isAdmin && photoInputRef.current?.click()}>
                <Avatar user={{ name: name || 'G', avatar: photo }} size={80} isGroup />
                {isAdmin && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                    <Icon.Camera />
                  </div>
                )}
              </div>
              {isAdmin && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Click photo to change</span>}
              <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </div>
            {/* Group name */}
            <Input label="Group Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Team Alpha" />
            {/* Created date */}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Created {group.createdAt ? new Date(group.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              {group.createdBy && ` by ${users.find(u => u._id === group.createdBy)?.username || 'Unknown'}`}
            </div>
            {/* Only admins can send */}
            {isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Only admins can send</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Like WhatsApp announcement mode</div>
                </div>
                <div onClick={() => setOnlyAdmins(v => !v)} style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                  background: onlyAdmins ? 'var(--accent)' : 'var(--text-subtle)',
                }}>
                  <div style={{ position: 'absolute', top: 3, left: onlyAdmins ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
              </div>
            )}
            {isAdmin && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {saving ? <Spinner /> : 'Save Changes'}
                </button>
                <button onClick={handleDelete} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Delete Group</button>
              </div>
            )}
          </>
        )}

        {tab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map(memberId => {
              const member = users.find(u => u._id === (typeof memberId === 'object' ? memberId._id : memberId));
              const mid = typeof memberId === 'object' ? memberId._id : memberId;
              if (!member) return null;
              const isMemberAdmin = group.admins?.includes(mid);
              return (
                <div key={mid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)' }}>
                  <Avatar user={member} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {member.username}
                      {isMemberAdmin && <span style={{ color: 'var(--accent)', display: 'flex' }}><Icon.Crown /></span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{isMemberAdmin ? 'Admin' : 'Member'}</div>
                  </div>
                  {isAdmin && mid !== currentUser._id && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleToggleAdmin(mid)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border-accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>
                        {isMemberAdmin ? 'Remove admin' : 'Make admin'}
                      </button>
                      <button onClick={() => handleRemoveMember(mid)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer' }}>Remove</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
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
  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/group/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, members: [...selected, currentUser._id] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data.group);
      setName(''); setSelected([]); setSearch('');
      onClose();
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <Modal show={show} onClose={onClose}>
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>New Group</span>
          <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
        </div>
        <Input label="Group Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Project Alpha" />
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Add Members</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 8, fontFamily: 'inherit' }} />
        </div>
        {/* Selected chips */}
        {selected.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {selected.map(id => {
              const u = users.find(x => x._id === id);
              return u ? (
                <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 4px', background: 'var(--accent-muted)', border: '1px solid var(--border-accent)', borderRadius: 20, fontSize: 12, color: 'var(--accent)' }}>
                  <Avatar user={u} size={18} />
                  {u.username}
                  <span style={{ cursor: 'pointer', display: 'flex' }} onClick={() => toggle(id)}><Icon.X /></span>
                </span>
              ) : null;
            })}
          </div>
        )}
        <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
          {filtered.map(u => (
            <div key={u._id} onClick={() => toggle(u._id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: selected.includes(u._id) ? 'var(--accent-muted)' : 'transparent', transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!selected.includes(u._id)) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { if (!selected.includes(u._id)) e.currentTarget.style.background = 'transparent'; }}>
              <Avatar user={u} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{u.username}</div>
              </div>
              <div style={{ width: 18, height: 18, borderRadius: '50%', borderWidth: 2, borderStyle: 'solid', borderColor: selected.includes(u._id) ? 'var(--accent)' : 'var(--border)', background: selected.includes(u._id) ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                {selected.includes(u._id) && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#0a0c10" strokeWidth="2" strokeLinecap="round"/></svg>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleCreate} disabled={!name.trim() || selected.length === 0 || loading} style={{ width: '100%', padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!name.trim() || selected.length === 0) ? 0.5 : 1 }}>
          {loading ? <Spinner /> : `Create Group (${selected.length} members)`}
        </button>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN CHAT PAGE
// ═══════════════════════════════════════════════════════════
export default function ChatPage() {
  const router = useRouter();

  // ── Core state ──
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);         // private chats
  const [groups, setGroups] = useState([]);        // group chats
  const [activeTab, setActiveTab] = useState('chats'); // chats | groups
  const [selectedChat, setSelectedChat] = useState(null);   // { ...chat, type: 'private'|'group' }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socket, setSocket] = useState(null);

  // ── Online / typing ──
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  // ── UI state ──
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [showMessageActions, setShowMessageActions] = useState(null);

  // ── Modals ──
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, message: null });

  // ── Search in chat ──
  const [showSearchPanel, setShowSearchPanel] = useState(false);

  // ── Call state ──
  const [callState, setCallState] = useState(null); // null | { type, status, with, ... }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerRef = useRef(null);

  // ── Refs ──
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingRef = useRef(false);
  const messageRefs = useRef({});

  // ── Scroll ──
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollToMessage = (id) => messageRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // ── Load on mount ──
  useEffect(() => { loadUser(); loadUsers(); }, []);
  useEffect(() => { if (user) { loadChats(); loadGroups(); } }, [user]);
  useEffect(() => { scrollToBottom(); }, [messages]);

  // ══════════════════════════════════════
  //  SOCKET
  // ══════════════════════════════════════
  useEffect(() => {
    if (!user) return;
    const token = Cookies.get('token');
    const sock = connectSocket(token);
    setSocket(sock);
    sock.emit('user-online', user._id);

    // Online presence
    sock.on('online-users', setOnlineUsers);
    sock.on('user-online', uid => setOnlineUsers(prev => [...new Set([...prev, uid])]));
    sock.on('user-offline', uid => setOnlineUsers(prev => prev.filter(id => id !== uid)));

    // Typing
    sock.on('user-typing', data => {
      if (data.chatId === selectedChat?._id && data.userId !== user._id) {
        setTypingUser(data.username);
        setTimeout(() => setTypingUser(null), 3000);
      }
    });
    sock.on('user-stop-typing', data => { if (data.chatId === selectedChat?._id) setTypingUser(null); });

    // Read receipts
    sock.on('messages-read', data => {
      if (data.chatId === selectedChat?._id) setMessages(prev => prev.map(m => ({ ...m, read: true })));
    });

    // Message deleted
    sock.on('message-deleted', data => {
      if (data.chatId === selectedChat?._id) setMessages(prev => prev.filter(m => m._id !== data.messageId));
    });

    // New private message (realtime, no reload needed)
    const receivedIds = new Set();
    sock.on('new-message', message => {
      if (receivedIds.has(message._id)) return;
      receivedIds.add(message._id);
      const formatted = { ...message, senderId: message.senderId?._id || message.senderId, sender: message.sender || message.senderId };
      if (selectedChat && message.chatId === selectedChat._id) {
        setMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev;
          sock.emit('mark-read', { chatId: selectedChat._id, userId: user._id });
          return [...prev, formatted];
        });
      } else {
        setUnreadCounts(prev => ({ ...prev, [message.chatId]: (prev[message.chatId] || 0) + 1 }));
      }
      // Update last message in chat list without full reload
      setChats(prev => prev.map(c => c._id === message.chatId ? { ...c, lastMessage: message } : c));
    });

    // New group message (realtime)
    sock.on('new-group-message', message => {
      if (receivedIds.has(message._id)) return;
      receivedIds.add(message._id);
      const formatted = { ...message, senderId: message.senderId?._id || message.senderId, sender: message.sender || message.senderId };
      if (selectedChat && message.groupId === selectedChat._id && selectedChat.type === 'group') {
        setMessages(prev => prev.some(m => m._id === message._id) ? prev : [...prev, formatted]);
      } else {
        setUnreadCounts(prev => ({ ...prev, [message.groupId]: (prev[message.groupId] || 0) + 1 }));
      }
      setGroups(prev => prev.map(g => g._id === message.groupId ? { ...g, lastMessage: message } : g));
    });

    // Group updated/deleted
    sock.on('group-updated', updatedGroup => setGroups(prev => prev.map(g => g._id === updatedGroup._id ? { ...g, ...updatedGroup } : g)));
    sock.on('group-deleted', ({ groupId }) => {
      setGroups(prev => prev.filter(g => g._id !== groupId));
      if (selectedChat?._id === groupId) setSelectedChat(null);
    });

    // WebRTC call signaling
    sock.on('call-offer', async ({ offer, from, fromUserId, fromUsername, callType }) => {
      const callerUser = users.find(u => u._id === fromUserId) || { username: fromUsername, _id: fromUserId };
      setCallState({ type: callType || 'audio', status: 'incoming', with: callerUser, socketId: from, offer, onAccept: () => handleAcceptCall(from, offer, callType) });
    });
    sock.on('call-answer', async ({ answer }) => {
      if (peerRef.current) await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });
    sock.on('ice-candidate', candidate => {
      if (peerRef.current && candidate) peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
    });
    sock.on('call-ended', () => cleanupCall());

    sock.on('connect', () => sock.emit('user-online', user._id));

    return () => {
      ['new-message','new-group-message','connect','online-users','user-online','user-offline','user-typing','user-stop-typing','messages-read','message-deleted','group-updated','group-deleted','call-offer','call-answer','ice-candidate','call-ended'].forEach(e => sock.off(e));
      receivedIds.clear();
    };
  }, [user, selectedChat]);

  // ══════════════════════════════════════
  //  DATA FETCHING
  // ══════════════════════════════════════
  const loadUser = async () => {
    try {
      const res = await fetch('/api/user/me');
      const data = await res.json();
      if (data.user) setUser(data.user); else router.push('/login');
    } catch (e) { console.error(e); }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/user/list');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) { console.error(e); }
  };

  const loadChats = async () => {
    try {
      const res = await fetch('/api/chat/list');
      const data = await res.json();
      const formatted = (data.chats || []).map(chat => {
        if (chat.otherUser) return { ...chat, type: 'private' };
        const otherId = Array.isArray(chat.members) ? chat.members.find(id => (typeof id === 'object' ? id._id?.toString() : id.toString()) !== user?._id) : null;
        let otherUser = typeof otherId === 'object' ? otherId : users.find(u => u._id === otherId);
        return { ...chat, type: 'private', otherUser: otherUser || { _id: otherId, username: 'Unknown' } };
      });
      setChats(formatted);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadGroups = async () => {
    try {
      const res = await fetch('/api/group/list');
      const data = await res.json();
      setGroups((data.groups || []).map(g => ({ ...g, type: 'group' })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadMessages = async (chatId, type = 'private') => {
    setLoadingMessages(true);
    try {
      const url = type === 'group' ? `/api/group/${chatId}/messages` : `/api/chat/${chatId}/messages`;
      const res = await fetch(url);
      const data = await res.json();
      setMessages((data.messages || []).map(msg => ({
        ...msg,
        senderId: msg.senderId?._id || msg.senderId,
        sender: msg.sender || msg.senderId
      })));
    } catch (e) { console.error(e); } finally { setLoadingMessages(false); }
  };

  const createOrOpenChat = async (targetUser) => {
    try {
      const res = await fetch('/api/chat/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId: targetUser._id }) });
      const data = await res.json();
      if (!res.ok) { alert('Error: ' + data.error); return; }
      if (data.chat) {
        const chatWithUser = { ...data.chat, type: 'private', otherUser: data.chat.otherUser || targetUser };
        setSelectedChat(chatWithUser);
        setUnreadCounts(prev => ({ ...prev, [data.chat._id]: 0 }));
        socket?.emit('join-chat', data.chat._id);
        socket?.emit('mark-read', { chatId: data.chat._id, userId: user._id });
        await loadMessages(data.chat._id, 'private');
        setChats(prev => prev.some(c => c._id === data.chat._id) ? prev : [chatWithUser, ...prev]);
        setActiveTab('chats');
      }
    } catch (e) { console.error(e); }
  };

  const openGroup = async (group) => {
    setSelectedChat({ ...group, type: 'group' });
    setUnreadCounts(prev => ({ ...prev, [group._id]: 0 }));
    socket?.emit('join-chat', group._id);
    await loadMessages(group._id, 'group');
  };

  // ══════════════════════════════════════
  //  MESSAGING
  // ══════════════════════════════════════
  const handleTyping = () => {
    if (!typingRef.current && socket && selectedChat) {
      typingRef.current = true;
      socket.emit('typing', { chatId: selectedChat._id, userId: user._id, username: user.username });
    }
    if (typingTimeout) clearTimeout(typingTimeout);
    const t = setTimeout(() => {
      socket?.emit('stop-typing', { chatId: selectedChat._id, userId: user._id });
      typingRef.current = false;
    }, 2000);
    setTypingTimeout(t);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sendingMessage) return;
    const isGroup = selectedChat.type === 'group';

    // Check permissions for group
    if (isGroup) {
      const g = groups.find(g => g._id === selectedChat._id);
      if (g?.onlyAdmins && !g.admins?.includes(user._id)) {
        alert('Only admins can send messages in this group.');
        return;
      }
    }

    setSendingMessage(true);
    try {
      const url = isGroup ? `/api/group/${selectedChat._id}/messages` : `/api/chat/${selectedChat._id}/messages`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newMessage }) });
      const data = await res.json();
      if (!res.ok) { alert(`Error: ${data.error}`); return; }

      socket?.emit('stop-typing', { chatId: selectedChat._id, userId: user._id });

      // Emit via socket for realtime delivery
      if (isGroup) {
        socket?.emit('group-message', { groupId: selectedChat._id, ...data.message });
      } else {
        socket?.emit('private-message', { chatId: selectedChat._id, ...data.message });
      }

      const newMsg = { ...data.message, senderId: user._id, sender: { _id: user._id, username: user.username, avatar: user.avatar }, createdAt: new Date().toISOString(), read: true };
      setMessages(prev => prev.some(m => m._id === data.message._id) ? prev : [...prev, newMsg]);
      setNewMessage('');
    } catch (e) { console.error(e); } finally { setSendingMessage(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedChat) return;
    setSendingMessage(true);
    const isGroup = selectedChat.type === 'group';
    const form = new FormData();
    form.append('file', file);
    form.append('chatId', selectedChat._id);
    try {
      const upRes = await fetch('/api/chat/upload', { method: 'POST', body: form });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error);
      const url = isGroup ? `/api/group/${selectedChat._id}/messages` : `/api/chat/${selectedChat._id}/messages`;
      const msgRes = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `📎 ${file.name}`, fileUrl: upData.fileUrl, fileType: file.type, fileName: file.name, fileSize: file.size }) });
      const msgData = await msgRes.json();
      if (msgRes.ok && msgData.message) {
        if (isGroup) socket?.emit('group-message', { groupId: selectedChat._id, ...msgData.message });
        else socket?.emit('private-message', { chatId: selectedChat._id, ...msgData.message });
        setMessages(prev => [...prev, { ...msgData.message, senderId: user._id, sender: { _id: user._id, username: user.username, avatar: user.avatar }, createdAt: new Date().toISOString(), fileUrl: upData.fileUrl, fileType: file.type, fileName: file.name, fileSize: file.size }]);
      }
      e.target.value = '';
    } catch (err) { alert('Error: ' + err.message); } finally { setSendingMessage(false); }
  };

  const handleDeleteMessage = async (deleteType) => {
    if (!deleteModal.message) return;
    const isGroup = selectedChat.type === 'group';
    try {
      const url = isGroup
        ? `/api/group/${selectedChat._id}/messages?messageId=${deleteModal.message._id}&deleteType=${deleteType}`
        : `/api/chat/${selectedChat._id}/messages?messageId=${deleteModal.message._id}&deleteType=${deleteType}`;
      const res = await fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(prev => prev.filter(m => m._id !== deleteModal.message._id));
      setDeleteModal({ show: false, message: null });
      if (deleteType === 'everyone') socket?.emit('delete-message', { chatId: selectedChat._id, messageId: deleteModal.message._id });
    } catch (e) { alert('Error: ' + e.message); }
  };

  // ══════════════════════════════════════
  //  WEBRTC CALLS
  // ══════════════════════════════════════
  const createPeer = (stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: process.env.NEXT_PUBLIC_STUN_SERVER || 'stun:stun.l.google.com:19302' }]
    });
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    pc.ontrack = e => setRemoteStream(e.streams[0]);
    pc.onicecandidate = e => {
      if (e.candidate && socket) socket.emit('ice-candidate', { targetId: callState?.socketId, candidate: e.candidate });
    };
    peerRef.current = pc;
    return pc;
  };

  const startCall = async (type = 'audio') => {
    if (!selectedChat || selectedChat.type === 'group') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      setLocalStream(stream);
      const targetSocketId = socket.id; // In production, resolve target socket from userSockets map
      const pc = createPeer(stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('call-offer', { targetId: targetSocketId, offer, fromUserId: user._id, fromUsername: user.username, callType: type });
      setCallState({ type, status: 'calling', with: selectedChat.otherUser, socketId: targetSocketId });
    } catch (e) { alert('Could not start call: ' + e.message); }
  };

  const handleAcceptCall = async (fromSocketId, offer, callType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
      setLocalStream(stream);
      const pc = createPeer(stream);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('call-answer', { targetId: fromSocketId, answer });
      setCallState(prev => ({ ...prev, status: 'active' }));
    } catch (e) { console.error(e); cleanupCall(); }
  };

  const cleanupCall = () => {
    localStream?.getTracks().forEach(t => t.stop());
    peerRef.current?.close();
    peerRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallState(null);
  };

  const endCall = () => {
    if (callState?.socketId && socket) socket.emit('call-end', { targetId: callState.socketId });
    cleanupCall();
  };

  // ══════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    Cookies.remove('token');
    socket?.disconnect();
    router.push('/login');
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts), now = new Date();
      if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (now - d < 172800000) return 'Yesterday';
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  const isUserOnline = uid => onlineUsers.includes(uid);

  const isGroupAdmin = () => {
    if (!selectedChat || selectedChat.type !== 'group') return false;
    const g = groups.find(g => g._id === selectedChat._id);
    return g?.admins?.includes(user?._id);
  };

  const canSendMessage = () => {
    if (!selectedChat) return false;
    if (selectedChat.type === 'private') return true;
    const g = groups.find(g => g._id === selectedChat._id);
    if (!g) return true;
    return !g.onlyAdmins || g.admins?.includes(user?._id);
  };

  // Sidebar filtered items
  const filteredUsers = users.filter(u => u._id !== user?._id && u.username?.toLowerCase().includes(sidebarSearch.toLowerCase()));
  const filteredChats = chats.filter(c => (c.otherUser?.username || '').toLowerCase().includes(sidebarSearch.toLowerCase()));
  const filteredGroups = groups.filter(g => (g.name || '').toLowerCase().includes(sidebarSearch.toLowerCase()));

  // ══════════════════════════════════════
  //  STYLES
  // ══════════════════════════════════════
  const S = {
    shell: { height: '100vh', display: 'flex', background: 'var(--bg-base)', fontFamily: "'DM Sans','Geist',sans-serif", overflow: 'hidden' },
    sidebar: { width: 300, minWidth: 260, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    sidebarSection: { padding: '10px 16px 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-subtle)', textTransform: 'uppercase' },
    userRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', transition: 'background 0.15s', margin: '1px 6px', borderRadius: 'var(--radius-sm)' },
    chatArea: { flex: 1, display: 'flex', overflow: 'hidden', background: 'var(--bg-base)' },
    chatMain: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    chatHeader: { padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 12 },
    messages: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 4 },
    inputBar: { padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 8 },
    input: { flex: 1, padding: '10px 16px', background: 'var(--bg-elevated)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 24, color: 'var(--text-primary)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' },
    sendBtn: { width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'var(--accent)', color: '#0a0c10', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', flexShrink: 0 },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
    modal: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, width: '90%', maxWidth: 380, boxShadow: '0 24px 48px rgba(0,0,0,0.5)' },
  };

  // ══════════════════════════════════════
  //  LOADING
  // ══════════════════════════════════════
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.9}}`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, borderWidth: 3, borderStyle: 'solid', borderColor: 'var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</span>
      </div>
    </div>
  );

  // ══════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════
  return (
    <div style={S.shell}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        :root {
          --bg-base:#0a0c10;--bg-surface:#111318;--bg-elevated:#1a1d26;--bg-hover:#20242f;
          --accent:#00e5c3;--accent-muted:rgba(0,229,195,0.12);--accent-glow:rgba(0,229,195,0.25);
          --text-primary:#e8ecf0;--text-muted:#6b7280;--text-subtle:#2d3240;
          --border:rgba(255,255,255,0.07);--border-accent:rgba(0,229,195,0.3);
          --danger:#ff4d6d;--danger-muted:rgba(255,77,109,0.12);
          --bubble-me:#00c4a8;--bubble-them:#1e2130;
          --radius-sm:8px;--radius-md:12px;--radius-lg:18px;
          --shadow-glow:0 0 20px rgba(0,229,195,0.15);
        }
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--bg-base);color:var(--text-primary)}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:var(--text-subtle)}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dots{0%,80%,100%{opacity:.2;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:.9}}
        .row-hover:hover{background:var(--bg-elevated)!important}
        .chat-selected{background:var(--accent-muted)!important;border-left-color:var(--accent)!important}
        .send-btn:hover:not(:disabled){transform:scale(1.08);box-shadow:var(--shadow-glow)}
        .send-btn:disabled{opacity:.4;cursor:not-allowed}
        .msg{animation:fadeUp .18s ease}
        ::placeholder{color:var(--text-muted)}
        .tab-btn{padding:8px 0;font-size:13px;font-weight:600;flex:1;cursor:pointer;border:none;border-bottom:2px solid transparent;background:transparent;transition:all .15s;font-family:inherit}
        .tab-active{color:var(--accent)!important;border-bottom-color:var(--accent)!important}
      `}</style>

      {/* ════════════════════════════════
          SIDEBAR
      ════════════════════════════════ */}
      <aside style={S.sidebar}>
        {/* My profile top */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ cursor: 'pointer' }} onClick={() => { setSelectedUser(user); setShowUserProfile(true); }}>
            <Avatar user={user} size={38} showRing />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <OnlineDot online /><span style={{ fontSize: 11, color: 'var(--accent)' }}>Online</span>
            </div>
          </div>
          <IconBtn onClick={handleLogout} title="Logout" danger><Icon.Logout /></IconBtn>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}><Icon.Search /></span>
            <input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} placeholder="Search..." style={{ width: '100%', padding: '8px 12px 8px 32px', background: 'var(--bg-elevated)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = 'var(--border-accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
        </div>

        {/* Tabs: Chats / Groups */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 12px' }}>
          <button className={`tab-btn${activeTab === 'chats' ? ' tab-active' : ''}`} style={{ color: activeTab === 'chats' ? 'var(--accent)' : 'var(--text-muted)' }} onClick={() => setActiveTab('chats')}>Chats</button>
          <button className={`tab-btn${activeTab === 'groups' ? ' tab-active' : ''}`} style={{ color: activeTab === 'groups' ? 'var(--accent)' : 'var(--text-muted)' }} onClick={() => setActiveTab('groups')}>Groups</button>
          <button className={`tab-btn${activeTab === 'people' ? ' tab-active' : ''}`} style={{ color: activeTab === 'people' ? 'var(--accent)' : 'var(--text-muted)' }} onClick={() => setActiveTab('people')}>People</button>
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* CHATS TAB */}
          {activeTab === 'chats' && (
            <>
              {filteredChats.length === 0
                ? <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--text-muted)' }}>No chats yet. Go to People tab to start!</div>
                : filteredChats.map(chat => {
                  const ou = chat.otherUser || {};
                  const isSelected = selectedChat?._id === chat._id && selectedChat?.type === 'private';
                  const unread = unreadCounts[chat._id] || 0;
                  return (
                    <div key={chat._id} className={`row-hover${isSelected ? ' chat-selected' : ''}`}
                      style={{ ...S.userRow, borderLeft: '2px solid transparent', borderRadius: isSelected ? '0 var(--radius-sm) var(--radius-sm) 0' : 'var(--radius-sm)', margin: '1px 0 1px 0', paddingLeft: 12 }}
                      onClick={() => { setSelectedChat({ ...chat, type: 'private' }); setUnreadCounts(prev => ({ ...prev, [chat._id]: 0 })); socket?.emit('join-chat', chat._id); socket?.emit('mark-read', { chatId: chat._id, userId: user._id }); loadMessages(chat._id, 'private'); }}>
                      <div style={{ position: 'relative' }}>
                        <Avatar user={ou} size={38} showRing={isSelected} />
                        <span style={{ position: 'absolute', bottom: 0, right: 0 }}><OnlineDot online={isUserOnline(ou._id)} /></span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: unread > 0 ? 700 : 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ou.username || 'Unknown'}</div>
                        {chat.lastMessage && <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{typeof chat.lastMessage === 'object' ? chat.lastMessage.content : chat.lastMessage}</div>}
                      </div>
                      {unread > 0 && <div style={{ background: 'var(--accent)', color: '#0a0c10', fontSize: 11, fontWeight: 700, borderRadius: 12, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>{unread}</div>}
                    </div>
                  );
                })}
            </>
          )}

          {/* GROUPS TAB */}
          {activeTab === 'groups' && (
            <>
              <div style={{ padding: '10px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={S.sidebarSection}>Groups</span>
                <button onClick={() => setShowCreateGroup(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--accent-muted)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Icon.Plus /> New
                </button>
              </div>
              {filteredGroups.length === 0
                ? <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>No groups yet. Create one!</div>
                : filteredGroups.map(group => {
                  const isSelected = selectedChat?._id === group._id && selectedChat?.type === 'group';
                  const unread = unreadCounts[group._id] || 0;
                  return (
                    <div key={group._id} className={`row-hover${isSelected ? ' chat-selected' : ''}`}
                      style={{ ...S.userRow, borderLeft: '2px solid transparent', borderRadius: isSelected ? '0 var(--radius-sm) var(--radius-sm) 0' : 'var(--radius-sm)', margin: '1px 0', paddingLeft: 12 }}
                      onClick={() => openGroup(group)}>
                      <Avatar user={{ name: group.name, avatar: group.photo }} size={38} isGroup showRing={isSelected} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: unread > 0 ? 700 : 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{group.members?.length || 0} members</div>
                      </div>
                      {unread > 0 && <div style={{ background: 'var(--accent)', color: '#0a0c10', fontSize: 11, fontWeight: 700, borderRadius: 12, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>{unread}</div>}
                    </div>
                  );
                })}
            </>
          )}

          {/* PEOPLE TAB */}
          {activeTab === 'people' && (
            <>
              <div style={S.sidebarSection}>All Users</div>
              {filteredUsers.length === 0
                ? <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>No users found</div>
                : filteredUsers.map(u => (
                  <div key={u._id} className="row-hover" style={S.userRow} onClick={() => { createOrOpenChat(u); setActiveTab('chats'); }}>
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

      {/* ════════════════════════════════
          MAIN CHAT AREA
      ════════════════════════════════ */}
      <div style={S.chatArea}>
        <div style={S.chatMain}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div style={S.chatHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer', minWidth: 0 }}
                  onClick={() => {
                    if (selectedChat.type === 'group') setShowGroupSettings(true);
                    else { setSelectedUser(selectedChat.otherUser); setShowUserProfile(true); }
                  }}>
                  <div style={{ position: 'relative' }}>
                    {selectedChat.type === 'group'
                      ? <Avatar user={{ name: selectedChat.name, avatar: selectedChat.photo }} size={42} isGroup />
                      : <>
                        <Avatar user={selectedChat.otherUser} size={42} showRing={isUserOnline(selectedChat.otherUser?._id)} />
                        <span style={{ position: 'absolute', bottom: 1, right: 1 }}><OnlineDot online={isUserOnline(selectedChat.otherUser?._id)} /></span>
                      </>
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedChat.type === 'group' ? selectedChat.name : selectedChat.otherUser?.username}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                      {selectedChat.type === 'group'
                        ? `${selectedChat.members?.length || 0} members${selectedChat.onlyAdmins ? ' · 📢 Admins only' : ''}`
                        : (isUserOnline(selectedChat.otherUser?._id) ? <span style={{ color: 'var(--accent)' }}>Online</span> : 'Offline')
                      }
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {selectedChat.type === 'private' && <>
                    <IconBtn onClick={() => startCall('audio')} title="Voice call"><Icon.Phone /></IconBtn>
                    <IconBtn onClick={() => startCall('video')} title="Video call"><Icon.Video /></IconBtn>
                  </>}
                  <IconBtn onClick={() => setShowSearchPanel(v => !v)} title="Search in chat" active={showSearchPanel}><Icon.Search /></IconBtn>
                  <IconBtn onClick={() => fileInputRef.current?.click()} title="Attach file"><Icon.Attach /></IconBtn>
                  {selectedChat.type === 'group' && isGroupAdmin() && (
                    <IconBtn onClick={() => setShowGroupSettings(true)} title="Group settings"><Icon.Settings /></IconBtn>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
              </div>

              {/* Messages */}
              <div style={S.messages}>
                {loadingMessages
                  ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading messages...</div>
                  : messages.length === 0
                    ? <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)' }}>
                      <span style={{ fontSize: 36 }}>💬</span>
                      <span style={{ fontSize: 14 }}>No messages yet — say hi!</span>
                    </div>
                    : messages.map((msg, idx) => {
                      const senderId = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
                      const isMe = senderId === user?._id;
                      const senderName = msg.sender?.username || (typeof msg.senderId === 'object' ? msg.senderId?.username : 'User');
                      const senderUser = { username: senderName, avatar: msg.sender?.avatar || null };
                      const key = msg._id ? `${msg._id}-${idx}` : `tmp-${idx}-${Math.random()}`;

                      // Date divider
                      const msgDate = msg.createdAt ? new Date(msg.createdAt).toDateString() : null;
                      const prevDate = idx > 0 && messages[idx - 1].createdAt ? new Date(messages[idx - 1].createdAt).toDateString() : null;
                      const showDateDivider = msgDate && msgDate !== prevDate;

                      return (
                        <div key={key} ref={el => { if (msg._id) messageRefs.current[msg._id] = el; }}>
                          {showDateDivider && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 8px' }}>
                              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(msg.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                            </div>
                          )}
                          <div className="msg" style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 2 }}>
                            {!isMe && <Avatar user={senderUser} size={28} />}
                            <div style={{ position: 'relative', maxWidth: '65%' }}
                              onMouseEnter={() => setShowMessageActions(key)}
                              onMouseLeave={() => setShowMessageActions(null)}>
                              {/* Group sender name */}
                              {selectedChat.type === 'group' && !isMe && (
                                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 3, paddingLeft: 4 }}>{senderName}</div>
                              )}
                              {/* Hover actions */}
                              {isMe && showMessageActions === key && (
                                <div style={{ position: 'absolute', top: -36, right: 0, display: 'flex', gap: 4, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 6px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', zIndex: 10 }}>
                                  <IconBtn onClick={() => setDeleteModal({ show: true, message: msg })} title="Delete" danger style={{ width: 26, height: 26 }}><Icon.Trash /></IconBtn>
                                  <IconBtn onClick={() => navigator.clipboard.writeText(msg.content)} title="Copy" style={{ width: 26, height: 26 }}><Icon.Copy /></IconBtn>
                                </div>
                              )}
                              {/* Bubble */}
                              <div style={{
                                padding: '10px 14px',
                                borderRadius: isMe ? 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)' : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px',
                                background: isMe ? 'var(--bubble-me)' : 'var(--bubble-them)',
                                color: isMe ? '#0a0c10' : 'var(--text-primary)',
                                fontSize: 14, lineHeight: 1.5,
                                boxShadow: isMe ? '0 2px 12px rgba(0,196,168,0.2)' : '0 2px 8px rgba(0,0,0,0.2)',
                              }}>
                                {msg.fileUrl ? (
                                  msg.fileType?.startsWith('image/')
                                    ? <img src={msg.fileUrl} alt={msg.fileName} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'block' }} onClick={() => { setPreviewFile(msg); setShowFileModal(true); }} />
                                    : <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => { setPreviewFile(msg); setShowFileModal(true); }}>
                                      <span style={{ fontSize: 20 }}>📎</span>
                                      <span style={{ fontSize: 13 }}>{msg.fileName || msg.content}</span>
                                    </div>
                                ) : msg.content}
                              </div>
                              {/* Timestamp */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(msg.createdAt)}</span>
                                {isMe && msg.read && <span style={{ fontSize: 11, color: 'var(--accent)' }}>✓✓</span>}
                              </div>
                            </div>
                            {isMe && <Avatar user={user} size={28} />}
                          </div>
                        </div>
                      );
                    })
                }
                {/* Typing indicator */}
                {typingUser && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ padding: '10px 14px', background: 'var(--bubble-them)', borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px', display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 0.2, 0.4].map((d, i) => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: `dots 1.2s ${d}s infinite` }} />)}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{typingUser} is typing</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <form onSubmit={sendMessage} style={S.inputBar}>
                {canSendMessage() ? (
                  <>
                    <input type="text" value={newMessage} onChange={e => { setNewMessage(e.target.value); handleTyping(); }} placeholder="Send a message..." style={{ ...S.input, borderColor: inputFocused ? 'var(--border-accent)' : 'var(--border)' }} onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} />
                    <button type="submit" className="send-btn" disabled={!newMessage.trim() || sendingMessage} style={S.sendBtn}><Icon.Send /></button>
                  </>
                ) : (
                  <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
                    📢 Only admins can send messages in this group
                  </div>
                )}
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--text-muted)' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-surface)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>💬</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Select a conversation</div>
              <div style={{ fontSize: 13 }}>Choose a chat or group from the sidebar</div>
            </div>
          )}
        </div>

        {/* Search in chat panel */}
        {showSearchPanel && selectedChat && (
          <SearchPanel messages={messages} onClose={() => setShowSearchPanel(false)} onJumpTo={id => { scrollToMessage(id); setShowSearchPanel(false); }} />
        )}
      </div>

      {/* ════════════════════════════════
          MODALS
      ════════════════════════════════ */}

      {/* File preview */}
      {showFileModal && previewFile && (
        <div style={S.overlay} onClick={() => setShowFileModal(false)}>
          <div style={{ background: 'var(--bg-surface)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: 800, maxHeight: '90vh', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{previewFile.fileName || 'File'}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={previewFile.fileUrl} download={previewFile.fileName}><IconBtn><Icon.Download /></IconBtn></a>
                <IconBtn onClick={() => setShowFileModal(false)}><Icon.Close /></IconBtn>
              </div>
            </div>
            <div style={{ padding: 20, overflowY: 'auto', maxHeight: 'calc(90vh - 60px)' }}>
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
        </div>
      )}

      {/* Delete message */}
      {deleteModal.show && (
        <div style={S.overlay} onClick={() => setDeleteModal({ show: false, message: null })}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Delete Message</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>Who do you want to delete this message for?</div>
            <button style={{ width: '100%', padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 8 }} onClick={() => handleDeleteMessage('self')}>Delete for me</button>
            <button style={{ width: '100%', padding: '10px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginBottom: 8 }} onClick={() => handleDeleteMessage('everyone')}>Delete for everyone</button>
            <button style={{ width: '100%', padding: '10px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }} onClick={() => setDeleteModal({ show: false, message: null })}>Cancel</button>
          </div>
        </div>
      )}

      {/* User profile */}
      {showUserProfile && selectedUser && (
        <div style={S.overlay} onClick={() => setShowUserProfile(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Profile</span>
              <IconBtn onClick={() => setShowUserProfile(false)}><Icon.Close /></IconBtn>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Avatar user={selectedUser} size={80} showRing={isUserOnline(selectedUser._id)} />
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedUser.username}</div>
              {selectedUser.email && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedUser.email}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <OnlineDot online={isUserOnline(selectedUser._id)} />
                <span style={{ fontSize: 13, color: isUserOnline(selectedUser._id) ? 'var(--accent)' : 'var(--text-muted)' }}>{isUserOnline(selectedUser._id) ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group settings */}
      <GroupSettingsModal
        show={showGroupSettings}
        onClose={() => setShowGroupSettings(false)}
        group={groups.find(g => g._id === selectedChat?._id)}
        currentUser={user}
        users={users}
        socket={socket}
        onUpdated={updated => {
          setGroups(prev => prev.map(g => g._id === updated._id ? { ...g, ...updated, type: 'group' } : g));
          if (selectedChat?._id === updated._id) setSelectedChat(prev => ({ ...prev, ...updated }));
        }}
        onDeleted={id => {
          setGroups(prev => prev.filter(g => g._id !== id));
          if (selectedChat?._id === id) setSelectedChat(null);
        }}
      />

      {/* Create group */}
      <CreateGroupModal
        show={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        users={users}
        currentUser={user}
        onCreated={newGroup => {
          const withType = { ...newGroup, type: 'group' };
          setGroups(prev => [withType, ...prev]);
          setActiveTab('groups');
          openGroup(withType);
        }}
      />

      {/* Call overlay */}
      {callState && (
        <CallOverlay call={callState} onEnd={endCall} localStream={localStream} remoteStream={remoteStream} />
      )}
    </div>
  );
}