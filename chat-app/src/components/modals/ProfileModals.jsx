import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/constants/icons';
import { Overlay, ModalBox, IconBtn, Spinner, FocusInput, Avatar, OnlineDot } from '@/components/ui/Shared';

export function ImageCropperModal({ show, imageSrc, onCancel, onCrop }) {
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
    ctx.save(); ctx.translate(SIZE/2+offset.x, SIZE/2+offset.y); ctx.rotate(rotation*Math.PI/180); ctx.scale(zoom,zoom);
    const w = imgRef.current.width, h = imgRef.current.height;
    ctx.drawImage(imgRef.current, -w/2, -h/2, w, h); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'destination-in'; ctx.beginPath(); ctx.arc(SIZE/2, SIZE/2, SIZE/2, 0, Math.PI*2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.beginPath(); ctx.arc(SIZE/2, SIZE/2, SIZE/2-1, 0, Math.PI*2); ctx.strokeStyle = 'var(--accent)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }, [zoom, rotation, offset, imageSrc]);

  const onMouseDown = (e) => { setDragging(true); dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }; };
  const onMouseMove = (e) => { if (!dragging || !dragStart.current) return; setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); };
  const onMouseUp = () => setDragging(false);
  const onTouchStart = (e) => { const t = e.touches[0]; setDragging(true); dragStart.current = { x: t.clientX - offset.x, y: t.clientY - offset.y }; };
  const onTouchMove = (e) => { if (!dragging) return; const t = e.touches[0]; setOffset({ x: t.clientX - dragStart.current.x, y: t.clientY - dragStart.current.y }); e.preventDefault(); };

  const handleCrop = () => { canvasRef.current.toBlob(blob => { if (!blob) return; onCrop(new File([blob], 'avatar.png', { type: 'image/png' })); }, 'image/png', 0.92); };

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
            <canvas ref={canvasRef} width={SIZE} height={SIZE} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onMouseUp} style={{ borderRadius: '50%', cursor: dragging ? 'grabbing' : 'grab', border: '2px solid var(--border-accent)', maxWidth: '100%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><Icon.ZoomOut /></span>
              <input type="range" min="0.5" max="3" step="0.05" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }} />
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><Icon.ZoomIn /></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <button onClick={() => setRotation(r => r-90)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>↺ Putar Kiri</button>
              <button onClick={() => setRotation(r => r+90)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Putar Kanan ↻</button>
            </div>
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

async function uploadFile(file, chatId = 'profile') {
  const form = new FormData();
  form.append('file', file);
  form.append('chatId', chatId);
  const res  = await fetch('/api/chat/upload', { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload gagal');
  return data.fileUrl;
}

export function EditProfileModal({ show, onClose, currentUser, onSaved }) {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [cropSrc, setCropSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { 
    if (currentUser && show) { 
      setUsername(currentUser.username || ''); 
      setBio(currentUser.bio || '');
      setShowOnlineStatus(currentUser.showOnlineStatus !== false);
      setAvatarUrl(currentUser.avatar || ''); 
      setCropSrc(null); 
    } 
  }, [currentUser, show]);

  if (!show) return null;

  const handleFileChange = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = ev => { setCropSrc(ev.target.result); setShowCropper(true); }; reader.readAsDataURL(file); e.target.value = ''; };
  const handleCropDone = async (croppedFile) => { setShowCropper(false); setUploading(true); try { const url = await uploadFile(croppedFile, 'profile'); setAvatarUrl(url); } catch (err) { alert(err.message); } finally { setUploading(false); } };
  
  const handleSave = async () => { 
    if (!username.trim()) return; 
    setSaving(true); 
    try { 
      const res = await fetch('/api/user/me', { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          username: username.trim(), 
          avatar: avatarUrl,
          bio: bio.trim(),
          showOnlineStatus
        }) 
      }); 
      const data = await res.json(); 
      if (!res.ok) throw new Error(data.error); 
      onSaved(data.user); 
      onClose(); 
    } catch (err) { 
      alert(err.message); 
    } finally { 
      setSaving(false); 
    } 
  };

  return (
    <>
      <Overlay onClose={onClose}>
        <ModalBox maxWidth={380}>
          <div style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Edit Profil</span>
              <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ position: 'relative', cursor: 'pointer', borderRadius: '50%' }} onClick={() => !uploading && fileRef.current?.click()}>
                <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border-accent)', position: 'relative', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setAvatarUrl('')} /> : <span style={{ fontSize: 40, fontWeight: 700, color: 'var(--accent)' }}>{(username || '?').charAt(0).toUpperCase()}</span>}
                  <div className="avatar-hover-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                    {uploading ? <Spinner size={20} /> : <Icon.Camera />}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>{uploading ? 'Mengupload...' : 'Klik foto untuk ganti & crop'}</span>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <FocusInput label="USERNAME" value={username} onChange={e => setUsername(e.target.value)} placeholder="Nama kamu..." />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INFO / BIO</label>
                <textarea 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  placeholder="Ceritakan tentang dirimu..."
                  maxLength={160}
                  style={{ width: '100%', height: 80, padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Tampilkan Status Online</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Orang lain bisa melihat saat kamu online</div>
                </div>
                <div 
                  onClick={() => setShowOnlineStatus(!showOnlineStatus)}
                  style={{ width: 44, height: 24, borderRadius: 12, background: showOnlineStatus ? 'var(--accent)' : 'var(--bg-base)', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative', transition: 'all 0.3s' }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: showOnlineStatus ? '#0a0c10' : 'var(--text-muted)', position: 'absolute', top: 2, left: showOnlineStatus ? 22 : 2, transition: 'all 0.3s' }} />
                </div>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving || uploading || !username.trim()} style={{ width: '100%', padding: '12px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!username.trim() || uploading) ? 0.5 : 1 }}>
              {saving ? <Spinner size={20} /> : <><Icon.Check /> Simpan</>}
            </button>
          </div>
        </ModalBox>
      </Overlay>
      <ImageCropperModal show={showCropper} imageSrc={cropSrc} onCancel={() => setShowCropper(false)} onCrop={handleCropDone} />
    </>
  );
}

export function ViewProfileModal({ show, onClose, targetUser, isOnline, currentUser, onEdit }) {
  if (!show || !targetUser) return null;
  const targetId = targetUser._id?.toString();
  const currentId = currentUser?._id?.toString();
  const isMe = currentId && targetId === currentId;
  // Sembunyikan status jika user menonaktifkannya (kecuali jika kita sedang melihat diri sendiri)
  const effectivelyOnline = isMe ? true : (isOnline && targetUser.showOnlineStatus !== false);

  return (
    <Overlay onClose={onClose}>
      <ModalBox maxWidth={380}>
        <div style={{ padding: '24px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{isMe ? 'Profil Saya' : 'Detail Profil'}</span>
            <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <Avatar user={targetUser} size={92} showRing={effectivelyOnline} />
              <div style={{ position: 'absolute', bottom: 4, right: 4 }}><OnlineDot online={effectivelyOnline} /></div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{targetUser.username}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{targetUser.email}</div>
            </div>
            
            <div style={{ width: '100%', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginTop: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>Tentang</div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {targetUser.bio || 'Tidak ada info.'}
              </div>
            </div>

            {!isMe && (
              <div style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Informasi Akun</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Email</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{targetUser.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Bergabung pada</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{targetUser.createdAt ? new Date(targetUser.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Baru saja'}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 13, color: effectivelyOnline ? 'var(--accent)' : 'var(--text-muted)' }}>
                {effectivelyOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {isMe && (
              <button 
                onClick={() => { onClose(); onEdit(); }}
                style={{ width: '100%', marginTop: 10, padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Icon.Edit /> Edit Profil
              </button>
            )}
          </div>
        </div>
      </ModalBox>
    </Overlay>
  );
}
