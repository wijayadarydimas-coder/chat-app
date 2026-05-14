import React, { useState, useEffect } from 'react';
import { Icon } from '@/constants/icons';
import { IconBtn, Spinner } from '@/components/ui/Shared';

export function StickerPicker({ onSelect, onClose }) {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('trending'); // trending, search

  useEffect(() => {
    fetchStickers();
  }, []);

  const fetchStickers = async (query = '') => {
    setLoading(true);
    try {
      const url = query ? `/api/stickers?q=${encodeURIComponent(query)}` : '/api/stickers';
      const res = await fetch(url);
      const data = await res.json();
      if (data.stickers) {
        setStickers(data.stickers);
      }
    } catch (err) {
      console.error('Failed to fetch stickers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) {
      setTab('trending');
      fetchStickers();
    } else {
      setTab('search');
      fetchStickers(search.trim());
    }
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '100%',
      left: 0,
      width: 320,
      height: 400,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 1000,
      marginBottom: 10,
      animation: 'slideUp 0.2s ease'
    }}>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <form onSubmit={handleSearch} style={{ flex: 1, position: 'relative' }}>
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari sticker..." 
            style={{ width: '100%', padding: '8px 12px 8px 32px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
          />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}><Icon.Search /></span>
        </form>
        <IconBtn onClick={onClose} style={{ width: 32, height: 32 }}><Icon.Close /></IconBtn>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner size={32} />
          </div>
        ) : stickers.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {stickers.map(sticker => (
              <div 
                key={sticker.id} 
                onClick={() => onSelect(sticker)}
                style={{ 
                  aspectRatio: '1/1', 
                  cursor: 'pointer', 
                  borderRadius: 'var(--radius-sm)', 
                  overflow: 'hidden', 
                  background: 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <img src={sticker.url} alt={sticker.title} style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
            Tidak ada sticker ditemukan.
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, background: 'var(--bg-elevated)' }}>
        <button 
          onClick={() => { setTab('trending'); setSearch(''); fetchStickers(); }}
          style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            color: tab === 'trending' ? 'var(--accent)' : 'var(--text-muted)', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            padding: '4px 8px',
            fontFamily: 'inherit'
          }}
        >
          Trending
        </button>
        <button 
          style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            color: tab === 'favorites' ? 'var(--accent)' : 'var(--text-muted)', 
            background: 'none', 
            border: 'none', 
            cursor: 'not-allowed',
            padding: '4px 8px',
            fontFamily: 'inherit',
            opacity: 0.5
          }}
        >
          Favorit
        </button>
      </div>
    </div>
  );
}
