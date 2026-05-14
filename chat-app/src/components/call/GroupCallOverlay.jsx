import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/constants/icons';
import { useCallTimer } from '@/hooks/useCallTimer';

const btnCallStyle = (active) => ({ width: 52, height: 52, borderRadius: '50%', border: 'none', background: active ? 'rgba(255,77,109,0.25)' : 'rgba(255,255,255,0.12)', color: active ? '#ff4d6d' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'all 0.15s' });

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:80?transport=udp', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turns:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
  iceTransportPolicy: 'all',
  iceCandidatePoolSize: 10,
};

function PeerTile({ stream, username, callType }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!stream) return;
    if (videoRef.current) videoRef.current.srcObject = stream;
    if (!audioRef.current) {
      const audio = new Audio();
      audio.autoplay = true;
      audio.srcObject = stream;
      audio.play().catch(e => console.warn('Peer audio error:', e));
      audioRef.current = audio;
    }
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.srcObject = null; audioRef.current = null; }
    };
  }, [stream]);

  return (
    <div style={{ position: 'relative', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: callType === 'video' ? 'block' : 'none' }} />
      {callType !== 'video' && <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent-muted)', border: '2px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{(username||'?').charAt(0).toUpperCase()}</div>}
      <div style={{ position: 'absolute', bottom: 7, left: 9, fontSize: 11, color: '#fff', fontWeight: 600, background: 'rgba(0,0,0,0.55)', padding: '2px 7px', borderRadius: 20 }}>{username}</div>
    </div>
  );
}

export function GroupCallOverlay({ groupId, groupName, callType, currentUser, socket, onEnd, minimized, onMinimize, onMaximize }) {
  const [peers, setPeers] = useState({});
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const localRef = useRef(null);
  const peerConns = useRef({});
  const localStreamRef = useRef(null);
  const { seconds, start, fmt } = useCallTimer();

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
        localStreamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;
        socket.emit('group-call-join', { groupId, userId: currentUser._id, username: currentUser.username, callType });
        start();
      } catch (e) { alert('Tidak bisa akses mikrofon/kamera: ' + e.message); onEnd(); }
    };
    init();

    const handleUserJoined = async ({ socketId, username }) => {
      const pc = createPC(socketId, username);
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      socket.emit('group-call-offer', { targetId: socketId, offer, callType });
    };

    const handleCallOffer = async ({ offer, from, fromUsername }) => {
      const pc = createPC(from, fromUsername);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
      socket.emit('group-call-answer', { targetId: from, answer });
    };

    const handleCallAnswer = async ({ answer, from }) => { await peerConns.current[from]?.setRemoteDescription(new RTCSessionDescription(answer)); };
    const handleCallIce = ({ candidate, from }) => { peerConns.current[from]?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {}); };
    const handleUserLeft = ({ socketId }) => {
      peerConns.current[socketId]?.close(); delete peerConns.current[socketId];
      setPeers(prev => { const n = { ...prev }; delete n[socketId]; return n; });
    };

    socket.on('group-call-user-joined', handleUserJoined);
    socket.on('group-call-offer', handleCallOffer);
    socket.on('group-call-answer', handleCallAnswer);
    socket.on('group-call-ice', handleCallIce);
    socket.on('group-call-user-left', handleUserLeft);

    return () => {
      socket.off('group-call-user-joined', handleUserJoined);
      socket.off('group-call-offer', handleCallOffer);
      socket.off('group-call-answer', handleCallAnswer);
      socket.off('group-call-ice', handleCallIce);
      socket.off('group-call-user-left', handleUserLeft);
    };
  }, [groupId, currentUser, socket, callType, start, onEnd]);

  const createPC = (socketId, username) => {
    const pc = new RTCPeerConnection(ICE_CONFIG);
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
  const toggleMute  = () => { localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; }); setMuted(m => !m); };
  const toggleVideo = () => { localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; }); setVideoOff(v => !v); };
  const peerList = Object.entries(peers);

  if (minimized) {
    return (
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 400, width: 220, borderRadius: 18, overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.7)', border: '1px solid var(--border-accent)', background: 'var(--bg-base)', cursor: 'pointer' }} onClick={onMaximize}>
        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--accent-muted)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}><Icon.Users /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{groupName}</div>
            <div style={{ fontSize: 11, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{fmt(seconds)} · {peerList.length + 1} orang</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '0 14px 12px', justifyContent: 'flex-end' }}>
          <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: muted ? 'var(--danger-muted)' : 'rgba(255,255,255,0.12)', color: muted ? 'var(--danger)' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon.MicOff /></button>
          <button onClick={(e) => { e.stopPropagation(); handleEnd(); }} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--danger)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon.PhoneOff /></button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#080a0f', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 18px', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--accent)' }}><Icon.Users /></span>
        {groupName} · {callType === 'video' ? '📹 Video' : '🎙 Voice'}
        <span style={{ marginLeft: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{peerList.length + 1} orang</span>
        <span style={{ marginLeft: 4, fontSize: 12, color: '#00e5c3', fontVariantNumeric: 'tabular-nums' }}>· {fmt(seconds)}</span>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={onMinimize} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Perkecil"><Icon.Minimize /></button>
        </div>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: peerList.length === 0 ? '1fr' : peerList.length < 3 ? '1fr 1fr' : 'repeat(3,1fr)', gap: 8, padding: '0 10px', alignContent: 'center' }}>
        <div style={{ position: 'relative', background: '#1a1d26', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video ref={localRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: callType === 'video' && !videoOff ? 'block' : 'none' }} />
          {(callType !== 'video' || videoOff) && <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent-muted)', border: '2px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{(currentUser?.username||'?').charAt(0).toUpperCase()}</div>}
          <div style={{ position: 'absolute', bottom: 7, left: 9, fontSize: 11, color: '#fff', fontWeight: 600, background: 'rgba(0,0,0,0.55)', padding: '2px 7px', borderRadius: 20 }}>{currentUser.username} (Saya)</div>
        </div>
        {peerList.map(([sid, peer]) => <PeerTile key={sid} stream={peer.stream} username={peer.username} callType={callType} />)}
        {peerList.length === 0 && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}><Icon.Users /> Menunggu member lain bergabung...</div>}
      </div>
      <div style={{ padding: '14px 0 30px', display: 'flex', justifyContent: 'center', gap: 14 }}>
        {callType === 'video' && <button onClick={toggleVideo} style={btnCallStyle(videoOff)}>{videoOff ? <Icon.VideoOff /> : <Icon.Video />}</button>}
        <button onClick={handleEnd} style={{ ...btnCallStyle(false), width: 62, height: 62, background: 'var(--danger)', boxShadow: '0 0 20px rgba(255,77,109,0.4)' }}><Icon.PhoneOff /></button>
        <button onClick={toggleMute} style={btnCallStyle(muted)}>{muted ? <Icon.MicOff /> : <Icon.Mic />}</button>
      </div>
    </div>
  );
}
