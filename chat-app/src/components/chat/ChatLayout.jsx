import React, { useState, useEffect } from 'react';
import { Icon } from '@/constants/icons';
import { IconBtn } from '@/components/ui/Shared';

export function ContextMenu({ x, y, onSelectMessage, onCopy, onClose }) {
  useEffect(() => { const h = () => onClose(); window.addEventListener('click', h); window.addEventListener('scroll', h); return () => { window.removeEventListener('click', h); window.removeEventListener('scroll', h); }; }, [onClose]);
  return (
    <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', left: x, top: y, zIndex: 500, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 160, overflow: 'hidden', animation: 'fadeUp 0.12s ease' }}>
      <button onClick={() => { onSelectMessage(); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Pilih Pesan</button>
      {onCopy && <button onClick={() => { onCopy(); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Icon.Copy /> Salin Teks</button>}
    </div>
  );
}

export function SelectionBar({ count, onDelete, onCancel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, animation: 'fadeUp 0.15s ease' }}>
      <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><Icon.X /></button>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{count} pesan dipilih</span>
      <button onClick={onDelete} disabled={count === 0} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: count > 0 ? 'var(--danger-muted)' : 'transparent', border: `1px solid ${count > 0 ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', color: count > 0 ? 'var(--danger)' : 'var(--text-muted)', cursor: count > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all .15s' }}>
        <Icon.Trash /> Hapus ({count})
      </button>
    </div>
  );
}

export function SearchPanel({ messages, onClose, onJumpTo }) {
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
              {msg.content.split(new RegExp(`(${query})`, 'gi')).map((p, j) => p.toLowerCase() === query.toLowerCase() ? <mark key={j} style={{ background: 'var(--accent)', color: '#0a0c10', borderRadius: 2 }}>{p}</mark> : p)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
