import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/constants/icons';
import { useCallTimer } from '@/hooks/useCallTimer';

const btnCallStyle = (active) => ({ width: 52, height: 52, borderRadius: '50%', border: 'none', background: active ? 'rgba(255,77,109,0.25)' : 'rgba(255,255,255,0.12)', color: active ? '#ff4d6d' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'all 0.15s' });

export function PrivateCallOverlay({ call, onEnd, localStream, remoteStream, minimized, onMinimize, onMaximize }) {
  const localRef  = useRef(null);
  const remoteRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [muted, setMuted]       = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const { seconds, start, fmt } = useCallTimer();

  useEffect(() => {
    if (localRef.current && localStream) localRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!remoteStream) return;
    if (remoteRef.current) remoteRef.current.srcObject = remoteStream;
    if (!remoteAudioRef.current) {
      const audio = new Audio();
      audio.autoplay = true;
      audio.srcObject = remoteStream;
      audio.play().catch(e => console.warn('Remote audio play error:', e));
      remoteAudioRef.current = audio;
    } else {
      remoteAudioRef.current.srcObject = remoteStream;
    }
    start();
  }, [remoteStream, start]);

  useEffect(() => {
    return () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
        remoteAudioRef.current = null;
      }
    };
  }, []);

  const toggleMute  = () => { localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; }); setMuted(m => !m); };
  const toggleVideo = () => { localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; }); setVideoOff(v => !v); };

  const isVideo    = call?.type === 'video';
  const isActive   = !!remoteStream;
  const isIncoming = call?.status === 'incoming';

  if (minimized) {
    return (
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 400, width: 220, borderRadius: 18, overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.7)', border: '1px solid var(--border-accent)', cursor: 'pointer', background: 'var(--bg-base)' }} onClick={onMaximize}>
        {isVideo && remoteStream ? (
          <div style={{ position: 'relative', height: 130 }}>
            <video ref={remoteRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {localStream && (
              <div style={{ position: 'absolute', bottom: 6, right: 6, width: 52, height: 70, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                <video ref={localRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
        ) : (
          <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
              {call?.with?.avatar ? <img src={call.with.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (call?.with?.username||'?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{call?.with?.username}</div>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{isActive ? fmt(seconds) : '...'}</div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-base)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {isActive ? <span style={{ color: 'var(--accent)' }}>{fmt(seconds)}</span> : 'Menghubungkan...'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: muted ? 'var(--danger-muted)' : 'rgba(255,255,255,0.12)', color: muted ? 'var(--danger)' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
              {muted ? <Icon.MicOff /> : <Icon.Mic />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onEnd(); }} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--danger)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.PhoneOff />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: isVideo && isActive ? '#000' : 'linear-gradient(135deg, #0d1117 0%, #161b22 60%, #0d1117 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {isVideo && (
        <>
          <video ref={remoteRef} autoPlay playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: remoteStream ? 'block' : 'none', zIndex: 0 }} />
          {!remoteStream && (
            <div style={{ position: 'absolute', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 }}>
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📹</div>
                Menunggu video...
              </div>
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 180, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)', zIndex: 1, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)', zIndex: 1, pointerEvents: 'none' }} />
        </>
      )}

      {!isVideo && (
        <>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '10%', left: '5%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,195,0.07) 0%, transparent 70%)', animation: 'pulse 4s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', bottom: '15%', right: '5%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,195,0.05) 0%, transparent 70%)', animation: 'pulse 4s ease-in-out infinite 2s' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <div style={{ position: 'relative' }}>
              {!isActive && (
                <>
                  <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: '2px solid rgba(0,229,195,0.25)', animation: 'ripple 2s ease-out infinite' }} />
                  <div style={{ position: 'absolute', inset: -38, borderRadius: '50%', border: '1px solid rgba(0,229,195,0.12)', animation: 'ripple 2s ease-out infinite 0.7s' }} />
                  <div style={{ position: 'absolute', inset: -56, borderRadius: '50%', border: '1px solid rgba(0,229,195,0.06)', animation: 'ripple 2s ease-out infinite 1.4s' }} />
                </>
              )}
              <div style={{ width: 128, height: 128, borderRadius: '50%', padding: 3, background: isActive ? 'linear-gradient(135deg, #00e5c3, #00a896)' : 'linear-gradient(135deg, rgba(0,229,195,0.6), rgba(0,168,150,0.3))', boxShadow: isActive ? '0 0 48px rgba(0,229,195,0.45)' : '0 0 24px rgba(0,229,195,0.18)' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#1a1d26' }}>
                  {call?.with?.avatar || call?.with?.photo
                    ? <img src={call.with.avatar || call.with.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 700, color: '#00e5c3' }}>{(call?.with?.username || '?').charAt(0).toUpperCase()}</div>
                  }
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{call?.with?.username || 'Unknown'}</div>
              <div style={{ marginTop: 10, fontSize: 14, minHeight: 24, color: 'rgba(255,255,255,0.65)' }}>
                {isActive
                  ? <span style={{ color: '#00e5c3', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(seconds)}</span>
                  : isIncoming
                    ? <span style={{ animation: 'pulse 1s ease infinite' }}>📞 Panggilan suara masuk...</span>
                    : <span style={{ animation: 'pulse 1s ease infinite' }}>Memanggil...</span>
                }
              </div>
            </div>
          </div>
        </>
      )}

      {isVideo && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{call?.with?.username}</div>
            <div style={{ fontSize: 13, color: isActive ? '#00e5c3' : 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>
              {isActive ? fmt(seconds) : isIncoming ? '📹 Video call masuk...' : 'Memanggil...'}
            </div>
          </div>
          <button onClick={onMinimize} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.4)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} title="Perkecil">
            <Icon.Minimize />
          </button>
        </div>
      )}

      {!isVideo && !isIncoming && (
        <button onClick={onMinimize} style={{ position: 'absolute', top: 16, right: 16, zIndex: 5, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Perkecil">
          <Icon.Minimize />
        </button>
      )}

      {isVideo && localStream && (
        <div style={{ position: 'fixed', bottom: 120, right: 20, width: 104, height: 148, borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.18)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 10 }}>
          <video ref={localRef} autoPlay playsInline muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: videoOff ? 'none' : 'block' }} />
          {videoOff && <div style={{ width: '100%', height: '100%', background: '#1a1d26', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e5c3', fontSize: 22, fontWeight: 700 }}>{(call?.with?.username||'?').charAt(0).toUpperCase()}</div>}
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 44, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 3 }}>
        {isIncoming && !isActive ? (
          <div style={{ display: 'flex', gap: 40, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <button onClick={onEnd} style={{ width: 64, height: 64, borderRadius: '50%', border: 'none', background: '#ff4d6d', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(255,77,109,0.55)', transition: 'transform 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.08)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}><Icon.PhoneOff /></button>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Tolak</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <button onClick={call.onAccept} style={{ width: 64, height: 64, borderRadius: '50%', border: 'none', background: '#00e5c3', color: '#0a0c10', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(0,229,195,0.55)', animation: 'pulse 1.2s ease infinite', transition: 'transform 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.08)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}><Icon.Phone /></button>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Terima</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
            {!isVideo && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <button onClick={onMinimize} style={{ ...btnCallStyle(false), width: 52, height: 52 }}><Icon.Minimize /></button>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Kecilkan</span>
              </div>
            )}
            {isVideo && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <button onClick={toggleVideo} style={{ ...btnCallStyle(videoOff), width: 52, height: 52 }}>{videoOff ? <Icon.VideoOff /> : <Icon.Video />}</button>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{videoOff ? 'Kamera Off' : 'Kamera'}</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <button onClick={onEnd} style={{ width: 66, height: 66, borderRadius: '50%', border: 'none', background: '#ff4d6d', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(255,77,109,0.55)', transition: 'transform 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.08)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}><Icon.PhoneOff /></button>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Akhiri</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <button onClick={toggleMute} style={{ ...btnCallStyle(muted), width: 52, height: 52 }}>{muted ? <Icon.MicOff /> : <Icon.Mic />}</button>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{muted ? 'Unmute' : 'Mute'}</span>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes ripple{0%{transform:scale(1);opacity:1}100%{transform:scale(1.5);opacity:0}}`}</style>
    </div>
  );
}
