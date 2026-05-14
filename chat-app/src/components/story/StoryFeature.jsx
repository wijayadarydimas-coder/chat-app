import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/constants/icons';
import { Overlay, ModalBox, IconBtn, Spinner, Avatar } from '@/components/ui/Shared';
import { uploadFile } from '@/lib/utils';

// ─── STORY BAR ───
export function StoryBar({ stories, currentUser, onRefresh }) {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const myStoriesGroup = stories.find(g => g.user._id === currentUser?._id);
  const otherGroups = stories.filter(g => g.user._id !== currentUser?._id);

  return (
    <div style={{ display: 'flex', gap: 14, padding: '12px 16px', overflowX: 'auto', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', scrollbarWidth: 'none' }}>
      {/* My Story Circle */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }} onClick={() => myStoriesGroup ? setSelectedGroup(myStoriesGroup) : setShowUpload(true)}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', padding: 2, border: myStoriesGroup ? '2px solid var(--accent)' : 'none', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Avatar user={currentUser} size={50} />
          </div>
          {!myStoriesGroup && (
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0c10' }}>
              <Icon.Plus />
            </div>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500 }}>Cerita Saya</span>
      </div>

      {/* Others' Circles */}
      {otherGroups.map(group => {
        const hasUnviewed = group.stories.some(s => !s.viewers.some(v => v.userId === currentUser?._id));
        return (
          <div key={group.user._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }} onClick={() => setSelectedGroup(group)}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', padding: 2, border: `2px solid ${hasUnviewed ? 'var(--accent)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Avatar user={group.user} size={50} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-primary)', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.user.username}</span>
          </div>
        );
      })}

      {showUpload && <StoryUploadModal onClose={() => setShowUpload(false)} onUploaded={onRefresh} />}
      {selectedGroup && <StoryViewerModal group={selectedGroup} currentUser={currentUser} onClose={() => { setSelectedGroup(null); onRefresh(); }} />}
    </div>
  );
}

// ─── VIEWER MODAL ───
function StoryViewerModal({ group, currentUser, onClose }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const currentStory = group.stories[index];
  const isOwner = group.user._id === currentUser?._id;
  const DURATION = 5000; // 5 detik per story

  useEffect(() => {
    // Reset progress saat pindah story
    setProgress(0);
    markAsViewed(currentStory._id);

    if (currentStory.type !== 'video') {
      const step = 100 / (DURATION / 100);
      timerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { next(); return 100; }
          return p + step;
        });
      }, 100);
    }

    return () => clearInterval(timerRef.current);
  }, [index]);

  const markAsViewed = async (id) => {
    try { await fetch(`/api/story/${id}/view`, { method: 'POST' }); } catch {}
  };

  const next = () => {
    if (index < group.stories.length - 1) setIndex(index + 1);
    else onClose();
  };

  const prev = () => {
    if (index > 0) setIndex(index - 1);
    else setIndex(0);
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(p);
    if (p >= 100) next();
  };

  const loadViewers = async () => {
    setLoadingViewers(true); setShowViewers(true);
    try {
      const res = await fetch(`/api/story/${currentStory._id}/viewers`);
      const data = await res.json();
      setViewers(data.viewers || []);
    } catch {} finally { setLoadingViewers(false); }
  };

  return (
    <Overlay zIndex={1000} background="#000">
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#000', color: '#fff' }}>
        {/* Progress Bars */}
        <div style={{ display: 'flex', gap: 4, padding: '10px 16px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
          {group.stories.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#fff', width: i < index ? '100%' : (i === index ? `${progress}%` : '0%'), transition: i === index && currentStory.type !== 'video' ? 'width 0.1s linear' : 'none' }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px', position: 'absolute', top: 12, left: 0, right: 0, zIndex: 10 }}>
          <Avatar user={group.user} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{group.user.username}</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>{new Date(currentStory.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>
          </div>
          {isOwner && (
            <IconBtn 
              title="Hapus Cerita"
              onClick={async (e) => {
                e.stopPropagation();
                if (!confirm('Hapus cerita ini?')) return;
                try {
                  const res = await fetch(`/api/story/${currentStory._id}`, { method: 'DELETE' });
                  if (res.ok) {
                    if (group.stories.length === 1) onClose();
                    else if (index < group.stories.length - 1) setIndex(index); // Re-render current index which is now the next story
                    else onClose();
                    onRefresh();
                  }
                } catch (err) { alert(err.message); }
              }} 
              style={{ color: '#fff', marginRight: 4 }}
            >
              <Icon.Trash />
            </IconBtn>
          )}
          <IconBtn onClick={onClose} style={{ color: '#fff' }}><Icon.Close /></IconBtn>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <div style={{ flex: 1 }} onClick={prev} />
            <div style={{ flex: 1 }} onClick={next} />
          </div>

          {currentStory.type === 'text' && (
            <div style={{ width: '100%', height: '100%', background: currentStory.backgroundColor || 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', fontSize: 24, fontWeight: 700 }}>
              {currentStory.content}
            </div>
          )}
          {currentStory.type === 'image' && (
            <img src={currentStory.content} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          )}
          {currentStory.type === 'video' && (
            <video ref={videoRef} src={currentStory.content} autoPlay muted playsInline onTimeUpdate={handleVideoTimeUpdate} style={{ maxWidth: '100%', maxHeight: '100%' }} />
          )}
        </div>

        {/* Viewers Trigger */}
        {isOwner && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.5))' }} onClick={loadViewers}>
            <div style={{ color: '#fff', fontSize: 18 }}><Icon.ChevLeft style={{ transform: 'rotate(90deg)' }} /></div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{currentStory.viewers.length} Penonton</div>
          </div>
        )}
      </div>

      {/* Viewers List Modal */}
      {showViewers && (
        <Overlay zIndex={1100} onClose={() => setShowViewers(false)}>
          <ModalBox maxWidth={320}>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 700 }}>Dilihat oleh</span>
                <IconBtn onClick={() => setShowViewers(false)}><Icon.Close /></IconBtn>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {loadingViewers ? <Spinner /> : viewers.length === 0 ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada penonton</div> : viewers.map(v => (
                  <div key={v.userId._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                    <Avatar user={v.userId} size={36} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{v.userId.username}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(v.viewedAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ModalBox>
        </Overlay>
      )}
    </Overlay>
  );
}

// ─── UPLOAD MODAL ───
function StoryUploadModal({ onClose, onUploaded }) {
  const [type, setType] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setFile(f); setType(f.type.startsWith('video/') ? 'video' : 'image');
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    setLoading(true);
    try {
      let content = text;
      if (type !== 'text') {
        content = await uploadFile(file, 'story');
      }
      const res = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content, backgroundColor: '#673ab7' })
      });
      if (res.ok) { onUploaded(); onClose(); }
      else { const d = await res.json(); alert(d.error); }
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <Overlay zIndex={1000} onClose={onClose}>
      <ModalBox maxWidth={380}>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontWeight: 700 }}>Buat Cerita</span>
            <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
          </div>
          
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button onClick={() => { setType('text'); setPreview(null); }} style={{ flex: 1, padding: 8, background: type === 'text' ? 'var(--accent)' : 'var(--bg-elevated)', border: 'none', borderRadius: 8, cursor: 'pointer' }}>📝 Teks</button>
            <button onClick={() => fileRef.current?.click()} style={{ flex: 1, padding: 8, background: type !== 'text' ? 'var(--accent)' : 'var(--bg-elevated)', border: 'none', borderRadius: 8, cursor: 'pointer' }}>🖼️ Media</button>
            <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFile} />
          </div>

          <div style={{ minHeight: 200, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 20 }}>
            {type === 'text' ? (
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Apa yang sedang kamu pikirkan?" style={{ width: '100%', height: 160, padding: 16, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 18, textAlign: 'center', fontFamily: 'inherit', resize: 'none' }} />
            ) : (
              type === 'video' ? <video src={preview} style={{ width: '100%' }} controls /> : <img src={preview} style={{ width: '100%' }} alt="" />
            )}
          </div>

          <button onClick={handleUpload} disabled={loading || (type === 'text' ? !text.trim() : !file)} style={{ width: '100%', padding: 12, background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#0a0c10', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
            {loading ? <Spinner size={16} /> : 'Bagikan ke Cerita'}
          </button>
        </div>
      </ModalBox>
    </Overlay>
  );
}
