import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/constants/icons';
import { RINGTONE_PRESETS } from '@/constants/ringtones';
import { Overlay, ModalBox, IconBtn, Spinner } from '@/components/ui/Shared';

export function RingtoneSettingsModal({ show, onClose, currentRingtone, onSave }) {
  const [selected, setSelected] = useState(currentRingtone || { type: 'preset', id: 'classic' });
  const [customRingtones, setCustomRingtones] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const previewRef = useRef(null);
  const [previewing, setPreviewing] = useState(null);

  useEffect(() => {
    if (show) {
      setSelected(currentRingtone || { type: 'preset', id: 'classic' });
      loadCustomRingtones();
    }
    return () => stopPreview();
  }, [show, currentRingtone]);

  const loadCustomRingtones = async () => {
    try {
      const r = await fetch('/api/ringtones');
      const d = await r.json();
      setCustomRingtones(d.ringtones || []);
    } catch {}
  };

  const stopPreview = () => {
    if (previewRef.current) { previewRef.current.pause(); previewRef.current = null; }
    setPreviewing(null);
  };

  const previewPreset = (preset) => {
    stopPreview();
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const { ring, interval } = preset.play(ctx);
      const timer = setInterval(ring, interval);
      setTimeout(() => { clearInterval(timer); try { ctx.close(); } catch {} setPreviewing(null); }, 3000);
      setPreviewing(preset.id);
    } catch {}
  };

  const previewFile = (url, id) => {
    stopPreview();
    const audio = new Audio(url);
    audio.volume = 0.7;
    audio.play().catch(() => {});
    previewRef.current = audio;
    setPreviewing(id);
    setTimeout(() => { audio.pause(); setPreviewing(null); }, 3000);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const allowed = ['audio/mpeg','audio/mp3','audio/ogg','audio/wav','audio/webm','audio/aac'];
    if (!allowed.includes(file.type)) { alert('Format tidak didukung. Gunakan MP3, OGG, WAV, atau AAC.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Ukuran file maksimal 5MB.'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await fetch('/api/ringtones/upload', { method: 'POST', body: form });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCustomRingtones(p => [...p, d.ringtone]);
      setSelected({ type: 'file', url: d.ringtone.url, name: d.ringtone.name });
    } catch (err) { alert(err.message); } finally { setUploading(false); e.target.value = ''; }
  };

  const handleSave = () => { stopPreview(); onSave(selected); onClose(); };

  if (!show) return null;
  return (
    <Overlay onClose={() => { stopPreview(); onClose(); }}>
      <ModalBox maxWidth={380}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>🎵 Pilih Ringtone</span>
          <IconBtn onClick={() => { stopPreview(); onClose(); }}><Icon.Close /></IconBtn>
        </div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ padding: '10px 20px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>RINGTONE BAWAAN</div>
          {RINGTONE_PRESETS.map(preset => {
            const isSel = selected.type === 'preset' && selected.id === preset.id;
            const isPrev = previewing === preset.id;
            return (
              <div key={preset.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', cursor: 'pointer', background: isSel ? 'var(--accent-muted)' : 'transparent', borderLeft: isSel ? '3px solid var(--accent)' : '3px solid transparent', transition: 'all .12s' }} onClick={() => setSelected({ type: 'preset', id: preset.id })}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`, background: isSel ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .12s' }}>
                  {isSel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0a0c10' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{preset.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{preset.description}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); isPrev ? stopPreview() : previewPreset(preset); }} style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${isPrev ? 'var(--accent)' : 'var(--border)'}`, background: isPrev ? 'var(--accent-muted)' : 'transparent', color: isPrev ? 'var(--accent)' : 'var(--text-muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isPrev ? <><Icon.Pause /> Stop</> : <><Icon.Play /> Coba</>}
                </button>
              </div>
            );
          })}

          <div style={{ padding: '10px 20px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6 }}>RINGTONE KUSTOM</div>
          {customRingtones.map((rt, i) => {
            const rtId = `custom-${i}`;
            const isSel = selected.type === 'file' && selected.url === rt.url;
            const isPrev = previewing === rtId;
            return (
              <div key={rtId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', cursor: 'pointer', background: isSel ? 'var(--accent-muted)' : 'transparent', borderLeft: isSel ? '3px solid var(--accent)' : '3px solid transparent', transition: 'all .12s' }} onClick={() => setSelected({ type: 'file', url: rt.url, name: rt.name })}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`, background: isSel ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isSel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0a0c10' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🎶 {rt.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Upload kustom</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); isPrev ? stopPreview() : previewFile(rt.url, rtId); }} style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${isPrev ? 'var(--accent)' : 'var(--border)'}`, background: isPrev ? 'var(--accent-muted)' : 'transparent', color: isPrev ? 'var(--accent)' : 'var(--text-muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isPrev ? <><Icon.Pause /> Stop</> : <><Icon.Play /> Coba</>}
                </button>
              </div>
            );
          })}

          <div style={{ padding: '10px 20px 14px' }}>
            <input ref={fileRef} type="file" accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/webm,audio/aac" onChange={handleUpload} style={{ display: 'none' }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ width: '100%', padding: '9px', background: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: 'var(--border-accent)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: uploading ? 0.5 : 1 }}>
              {uploading ? <><Spinner size={14} /> Mengupload...</> : <><Icon.Plus /> Upload Ringtone Sendiri (MP3/OGG/WAV, max 5MB)</>}
            </button>
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <button onClick={() => { stopPreview(); onClose(); }} style={{ flex: 1, padding: '9px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Batal</button>
          <button onClick={handleSave} style={{ flex: 2, padding: '9px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Simpan</button>
        </div>
      </ModalBox>
    </Overlay>
  );
}

export function CallHistoryModal({ show, onClose, currentUser }) {
  const [calls, setCalls]   = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (show) { setLoading(true); fetch('/api/calls').then(r=>r.json()).then(d=>setCalls(d.calls||[])).catch(()=>{}).finally(()=>setLoading(false)); } }, [show]);
  if (!show) return null;

  const fmtDur = (s) => { if (!s) return '—'; const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60; if(h>0) return `${h}j ${m}m ${sec}d`; if(m>0) return `${m}m ${sec}d`; return `${sec}d`; };
  const fmtDate = (d) => { if (!d) return ''; const date=new Date(d),now=new Date(),diff=now-date; if(diff<86400000) return date.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}); if(diff<172800000) return 'Kemarin'; return date.toLocaleDateString('id-ID',{day:'numeric',month:'short'}); };

  const grouped = calls.reduce((acc, call) => {
    const key = new Date(call.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(call); return acc;
  }, {});

  return (
    <Overlay onClose={onClose}>
      <ModalBox maxWidth={380}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>📞 Riwayat Panggilan</span>
          <IconBtn onClick={onClose}><Icon.Close /></IconBtn>
        </div>
        <div style={{ maxHeight: '68vh', overflowY: 'auto' }}>
          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={24} /></div>}
          {!loading && calls.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 13 }}><div style={{ fontSize: 44, marginBottom: 12 }}>📵</div>Belum ada riwayat panggilan</div>}
          {!loading && Object.entries(grouped).map(([dateKey, dayCalls]) => (
            <div key={dateKey}>
              <div style={{ padding: '9px 20px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>{dateKey}</div>
              {dayCalls.map(call => {
                const myId = currentUser?._id?.toString();
                const isInit = (call.initiatorId?._id?.toString() || call.initiatorId?.toString()) === myId;
                const others = (call.participants||[]).filter(p=>(p._id?.toString()||p.toString())!==myId);
                const otherName = call.callMode === 'group' ? (call.groupName||'Grup') : (others[0]?.username||'Unknown');
                const otherAvatar = others[0]?.avatar||null;
                const sColor = call.status === 'missed' ? '#ff4d6d' : '#00e5c3';
                const arrow  = call.status === 'missed' ? '↙' : isInit ? '↗' : '↙';
                const label  = call.status === 'missed' ? 'Tidak diangkat' : isInit ? 'Keluar' : 'Masuk';
                return (
                  <div key={call._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: '#1a1d26', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
                      {otherAvatar ? <img src={otherAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent)' }}>{otherName.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{otherName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                        <span style={{ fontSize: 13, color: sColor, fontWeight: 700 }}>{arrow}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
                        {call.durationSeconds > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {fmtDur(call.durationSeconds)}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(call.createdAt)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{call.callType === 'video' ? <Icon.Video /> : <Icon.Phone />}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ModalBox>
    </Overlay>
  );
}
