import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@/constants/icons';

export function VoiceNoteRecorder({ onSend, onCancel, disabled }) {
  const [state, setState] = useState('idle');
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
        setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob)); setState('preview');
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(100); mediaRef.current = mr; setState('recording'); setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      const animate = () => { setWaveHeights(Array(20).fill(0).map(() => Math.floor(Math.random() * 14) + 2)); animRef.current = requestAnimationFrame(() => setTimeout(animate, 100)); };
      animate();
    } catch (e) { alert('Tidak bisa akses mikrofon: ' + e.message); }
  };

  const stopRecording = () => { clearInterval(timerRef.current); cancelAnimationFrame(animRef.current); mediaRef.current?.stop(); };

  const handleSend = async () => {
    if (!audioBlob) return;
    const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
    onSend(file, duration); resetAll();
  };

  const resetAll = () => {
    setState('idle'); setDuration(0); setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null); setIsPlaying(false);
    if (audioRef.current) audioRef.current.pause();
    setWaveHeights(Array(20).fill(3));
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  useEffect(() => () => { clearInterval(timerRef.current); cancelAnimationFrame(animRef.current); if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  if (state === 'idle') return (
    <button type="button" onClick={startRecording} disabled={disabled} title="Rekam voice note"
      style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
      <Icon.Mic />
    </button>
  );

  if (state === 'recording') return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0, animation: 'pulse 1s ease infinite' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, height: 28, overflow: 'hidden' }}>
        {waveHeights.map((h, i) => <div key={i} style={{ flex: 1, height: h, background: 'var(--accent)', borderRadius: 2, transition: 'height 0.1s', minHeight: 2 }} />)}
      </div>
      <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmt(duration)}</span>
      <button type="button" onClick={stopRecording} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--danger)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon.StopCircle />
      </button>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 2px' }}>
      {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />}
      <button type="button" onClick={togglePlay} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--accent)', color: '#0a0c10', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isPlaying ? <Icon.Pause /> : <Icon.Play />}
      </button>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><Icon.Waveform /></span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmt(duration)}</span>
      </div>
      <button type="button" onClick={resetAll} style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon.Redo />
      </button>
      <button type="button" onClick={handleSend} style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--accent)', color: '#0a0c10', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon.Send />
      </button>
    </div>
  );
}

export function VoiceNoteBubble({ msg, isMe }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s)%60).padStart(2,'0')}`;
  const totalDur = msg.voiceDuration || 0;
  const togglePlay = () => { if (!audioRef.current) return; if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); } else { audioRef.current.play(); setIsPlaying(true); } };
  const handleTimeUpdate = () => { if (!audioRef.current) return; const t = audioRef.current.currentTime, d = audioRef.current.duration || totalDur || 1; setCurrentTime(t); setProgress((t/d)*100); };
  const handleSeek = (e) => { if (!audioRef.current) return; const rect = e.currentTarget.getBoundingClientRect(), ratio = (e.clientX - rect.left) / rect.width, d = audioRef.current.duration || totalDur || 1; audioRef.current.currentTime = ratio * d; };
  const mutedColor = isMe ? 'rgba(10,12,16,0.6)' : 'var(--text-muted)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180, maxWidth: 240 }}>
      {msg.fileUrl && <audio ref={audioRef} src={msg.fileUrl} onTimeUpdate={handleTimeUpdate} onEnded={() => { setIsPlaying(false); setProgress(0); setCurrentTime(0); }} />}
      <button onClick={togglePlay} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: isMe ? 'rgba(10,12,16,0.2)' : 'var(--accent-muted)', color: isMe ? '#0a0c10' : 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isPlaying ? <Icon.Pause /> : <Icon.Play />}
      </button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 1.5, height: 18, cursor: 'pointer' }} onClick={handleSeek}>
          {Array(24).fill(0).map((_, i) => { const filled = (i/24*100) <= progress; const h = [8,14,10,16,8,12,18,10,14,8,16,12,10,18,8,14,10,16,12,8,14,18,10,12][i]; return <div key={i} style={{ flex: 1, height: h, borderRadius: 2, background: filled ? (isMe ? 'rgba(10,12,16,0.7)' : 'var(--accent)') : (isMe ? 'rgba(10,12,16,0.25)' : 'rgba(255,255,255,0.12)'), transition: 'background 0.1s' }} />; })}
        </div>
        <span style={{ fontSize: 10, color: mutedColor }}>{fmt(currentTime)} / {fmt(totalDur)}</span>
      </div>
    </div>
  );
}
