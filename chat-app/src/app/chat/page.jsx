'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { connectSocket, getSocket } from '@/lib/socket-client';

// Constants & Utilities
import { Icon } from '@/constants/icons';
import { uploadFile } from '@/lib/utils';

// UI Components
import { 
  Avatar, OnlineDot, IconBtn, Spinner, Overlay, ModalBox 
} from '@/components/ui/Shared';

// Hooks
import { useRingtone } from '@/hooks/useRingtone';

// Specialized Components
import { PrivateCallOverlay } from '@/components/call/PrivateCallOverlay';
import { GroupCallOverlay } from '@/components/call/GroupCallOverlay';
import { VoiceNoteRecorder, VoiceNoteBubble } from '@/components/chat/VoiceNote';
import { ContextMenu, SelectionBar, SearchPanel } from '@/components/chat/ChatLayout';
import { StoryBar } from '@/components/story/StoryFeature';
import { StickerPicker } from '@/components/chat/StickerPicker';

// Modals
import { 
  RingtoneSettingsModal, CallHistoryModal 
} from '@/components/modals/SettingsModals';
import { 
  EditProfileModal, ViewProfileModal
} from '@/components/modals/ProfileModals';
import { 
  GroupSettingsModal, CreateGroupModal 
} from '@/components/modals/GroupModals';

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turns:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
  iceTransportPolicy: 'all',
  iceCandidatePoolSize: 10,
};

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stories, setStories] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unread, setUnread] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [sidebarSearch, setSidebarSearch] = useState('');
  
  // Theme State
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cosmed_theme') || 'dark';
    }
    return 'dark';
  });

  // UI States
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [viewProfileUser, setViewProfileUser] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showRingtoneSettings, setShowRingtoneSettings] = useState(false);
  const [selectedRingtone, setSelectedRingtone] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  
  // Messaging States
  const [newMessage, setNewMessage] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMsgs, setSelectedMsgs] = useState(new Set());
  const [deleteModal, setDeleteModal] = useState({ show: false, type: 'multi' });
  const [showStickers, setShowStickers] = useState(false);

  // Call States
  const [privateCall, setPrivateCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [callMinimized, setCallMinimized] = useState(false);
  const [groupCall, setGroupCall] = useState(null);
  const [incomingGroupCall, setIncomingGroupCall] = useState(null);
  const iceQueue = useRef([]);

  const socket = getSocket();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const longPressRef = useRef(null);
  const messageRefs = useRef({});
  const peerRef = useRef(null);
  const { playRingtone, stopRingtone } = useRingtone();

  // ── Initialization ──
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const r = await fetch('/api/user/me');
        if (!r.ok) throw new Error('Not authenticated');
        const d = await r.json(); 
        setUser(d.user);
        connectSocket(); // No need to pass token if server handles it
        const rt = localStorage.getItem('cosmed_ringtone');
        if (rt) {
          try { setSelectedRingtone(JSON.parse(rt)); } catch (e) { console.warn('Corrupted ringtone in storage'); }
        }
      } catch (err) { 
        console.error('Auth check failed:', err);
        router.push('/login'); 
      } finally { 
        setLoading(false); 
      }
    };
    checkAuth();
    const h = () => setIsMobile(window.innerWidth < 768);
    h(); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h);
  }, [router]);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('cosmed_theme', theme);
  }, [theme]);

  // ── Sockets ──
  useEffect(() => {
    if (!socket || !user) return;
    socket.emit('user-online', user._id);
    socket.on('online-users', users => setOnlineUsers(users));
    socket.on('user-online', uid => setOnlineUsers(p => Array.from(new Set([...p, uid]))));
    socket.on('user-offline', uid => setOnlineUsers(p => p.filter(id => id !== uid)));
    socket.emit('get-online-users');
    socket.on('private-message', msg => {
      if (selectedChat?.type === 'private' && selectedChat._id === msg.chatId) {
        setMessages(p => p.some(m => m._id === msg._id) ? p : [...p, msg]);
        socket.emit('mark-read', { chatId: msg.chatId, userId: user._id });
      } else {
        setUnread(p => ({ ...p, [msg.chatId]: (p[msg.chatId] || 0) + 1 }));
      }
    });
    socket.on('group-message', msg => {
      if (selectedChat?.type === 'group' && selectedChat._id === msg.groupId) {
        setMessages(p => p.some(m => m._id === msg._id) ? p : [...p, msg]);
        socket.emit('mark-read', { chatId: msg.groupId, userId: user._id });
      } else {
        setUnread(p => ({ ...p, [msg.groupId]: (p[msg.groupId] || 0) + 1 }));
      }
    });
    socket.on('user-typing', ({ chatId, username }) => { if (selectedChat?._id === chatId) setTypingUser(username); });
    socket.on('user-stop-typing', ({ chatId }) => { if (selectedChat?._id === chatId) setTypingUser(null); });
    socket.on('messages-read', ({ chatId }) => { if (selectedChat?._id === chatId) setMessages(p => p.map(m => ({ ...m, read: true }))); });
    
    socket.on('call-offer', async ({ fromSocketId, offer, fromUserId, fromUsername, callType }) => {
      playRingtone(selectedRingtone);
      const tid = fromUserId;
      try {
        const r = await fetch('/api/calls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ participants: [user._id, tid], callType, initiatorId: tid }) });
        const d = await r.json(); if (d.call) setCurrentCallId(d.call._id);
      } catch {}
      setPrivateCall({ type: callType, status: 'incoming', with: { _id: fromUserId, username: fromUsername }, socketId: fromSocketId, onAccept: () => acceptCall(fromSocketId, offer, callType) });
    });
    socket.on('call-answer', async ({ answer }) => { 
      await peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer)); 
      // Process queued candidates for the caller
      while (iceQueue.current.length > 0) {
        const candidate = iceQueue.current.shift();
        peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
      setPrivateCall(p => ({ ...p, status: 'active' })); 
      if (currentCallId) { 
        try { await fetch(`/api/calls/${currentCallId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'answered', startedAt: new Date() }) }); } catch {} 
      } 
    });
    socket.on('ice-candidate', ({ candidate }) => { 
      if (peerRef.current && peerRef.current.remoteDescription) {
        peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      } else {
        iceQueue.current.push(candidate);
      }
    });
    socket.on('call-ended', () => cleanupCall());
    socket.on('group-call-start', ({ groupId, groupName, callType, fromUsername }) => { 
      const isMember = groups.some(g => g._id === groupId);
      if (isMember) { 
        setIncomingGroupCall({ groupId, groupName, callType, fromUsername }); 
        playRingtone(selectedRingtone); 
      } 
    });

    return () => {
      socket.off('online-users'); socket.off('private-message'); socket.off('group-message');
      socket.off('user-typing'); socket.off('user-stop-typing'); socket.off('messages-read');
      socket.off('call-offer'); socket.off('call-answer'); socket.off('ice-candidate'); socket.off('call-end'); socket.off('group-call-start');
    };
  }, [socket, user, selectedChat, selectedRingtone, playRingtone]);

  // ── Data Fetching ──
  const load = async () => {
    try {
      const [u, c, g, s] = await Promise.all([
        fetch('/api/user/list'), 
        fetch('/api/chat/list'), 
        fetch('/api/group/list'),
        fetch('/api/story')
      ]);
      const [ud, cd, gd, sd] = await Promise.all([u.json(), c.json(), g.json(), s.json()]);
      setUsers(ud.users || []); setChats(cd.chats || []); setGroups(gd.groups || []); setStories(sd.stories || []);
      const unr = {};
      (cd.chats || []).forEach(x => { if (x.unreadCount > 0) unr[x._id] = x.unreadCount; });
      (gd.groups || []).forEach(x => { if (x.unreadCount > 0) unr[x._id] = x.unreadCount; });
      setUnread(unr);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  // Ensure view modal stays in sync with current user state
  useEffect(() => {
    if (viewProfileUser && user && viewProfileUser._id?.toString() === user._id?.toString()) {
      if (viewProfileUser !== user) setViewProfileUser(user);
    }
  }, [user, viewProfileUser]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typingUser]);

  // ── Actions ──
  const openChat = async (chat) => {
    if (isMobile) setSidebarOpen(false);
    setSelectedChat({ ...chat, type: 'private' });
    setLoadingMsgs(true); setMessages([]); setTypingUser(null); exitSelectionMode();
    setUnread(p => ({ ...p, [chat._id]: 0 }));
    try {
      const r = await fetch(`/api/chat/${chat._id}/messages`);
      const d = await r.json(); setMessages(d.messages || []);
      socket?.emit('mark-read', { chatId: chat._id, userId: user._id });
    } catch {} finally { setLoadingMsgs(false); }
  };

  const openGroup = async (group) => {
    if (isMobile) setSidebarOpen(false);
    setSelectedChat({ ...group, type: 'group' });
    setLoadingMsgs(true); setMessages([]); setTypingUser(null); exitSelectionMode();
    setUnread(p => ({ ...p, [group._id]: 0 }));
    try {
      const r = await fetch(`/api/group/${group._id}/messages`);
      const d = await r.json(); setMessages(d.messages || []);
      socket?.emit('mark-read', { chatId: group._id, userId: user._id });
    } catch {} finally { setLoadingMsgs(false); }
  };

  const createOrOpenChat = async (target) => {
    try {
      const r = await fetch('/api/chat/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId: target._id }) });
      const d = await r.json();
      if (!chats.some(c => c._id === d.chat._id)) setChats(p => [d.chat, ...p]);
      openChat(d.chat);
    } catch {}
  };

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sendingMsg) return;
    const isGroup = selectedChat.type === 'group';
    if (isGroup) {
      const g = groups.find(x => x._id === selectedChat._id);
      const aids = (g?.admins || []).map(a => (typeof a === 'object' ? a._id : a)?.toString());
      if (g?.onlyAdmins && !aids.includes(user._id?.toString())) { alert('Hanya admin yang bisa kirim pesan.'); return; }
    }
    setSendingMsg(true);
    try {
      const url = isGroup ? `/api/group/${selectedChat._id}/messages` : `/api/chat/${selectedChat._id}/messages`;
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newMessage }) });
      const d = await r.json(); if (!r.ok) { alert(d.error); return; }
      socket?.emit('stop-typing', { chatId: selectedChat._id, userId: user._id });
      if (isGroup) socket?.emit('group-message', { groupId: selectedChat._id, ...d.message });
      else socket?.emit('private-message', { chatId: selectedChat._id, ...d.message });
      setMessages(p => p.some(m => m._id === d.message._id) ? p : [...p, { ...d.message, senderId: user._id, sender: { _id: user._id, username: user.username, avatar: user.avatar }, createdAt: new Date().toISOString(), read: true }]);
      setNewMessage('');
    } catch {} finally { setSendingMsg(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file || !selectedChat) return;
    setSendingMsg(true); const isGroup = selectedChat.type === 'group';
    try {
      const fileUrl = await uploadFile(file, selectedChat._id);
      const msgUrl  = isGroup ? `/api/group/${selectedChat._id}/messages` : `/api/chat/${selectedChat._id}/messages`;
      const r = await fetch(msgUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `📎 ${file.name}`, fileUrl, fileType: file.type, fileName: file.name, fileSize: file.size }) });
      const d = await r.json();
      if (r.ok && d.message) {
        if (isGroup) socket?.emit('group-message', { groupId: selectedChat._id, ...d.message });
        else socket?.emit('private-message', { chatId: selectedChat._id, ...d.message });
        setMessages(p => [...p, { ...d.message, senderId: user._id, sender: { _id: user._id, username: user.username, avatar: user.avatar }, createdAt: new Date().toISOString(), fileUrl, fileType: file.type, fileName: file.name, fileSize: file.size }]);
      }
      e.target.value = '';
    } catch (err) { alert(err.message); } finally { setSendingMsg(false); }
  };

  const handleVoiceNoteSend = async (file, duration) => {
    if (!selectedChat) return; setSendingMsg(true);
    const isGroup = selectedChat.type === 'group';
    try {
      const fileUrl = await uploadFile(file, selectedChat._id);
      const msgUrl = isGroup ? `/api/group/${selectedChat._id}/messages` : `/api/chat/${selectedChat._id}/messages`;
      const r = await fetch(msgUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: '🎙 Voice note', fileUrl, fileType: 'audio/webm', fileName: file.name, isVoice: true, voiceDuration: duration }) });
      const d = await r.json();
      if (r.ok && d.message) {
        const newMsg = { ...d.message, senderId: user._id, sender: { _id: user._id, username: user.username, avatar: user.avatar }, createdAt: new Date().toISOString(), fileUrl, fileType: 'audio/webm', isVoice: true, voiceDuration: duration };
        if (isGroup) socket?.emit('group-message', { groupId: selectedChat._id, ...d.message, isVoice: true, voiceDuration: duration });
        else socket?.emit('private-message', { chatId: selectedChat._id, ...d.message, isVoice: true, voiceDuration: duration });
        setMessages(p => [...p, newMsg]);
      }
    } catch (err) { alert(err.message); } finally { setSendingMsg(false); }
  };

  const sendSticker = async (sticker) => {
    if (!selectedChat) return;
    setSendingMsg(true);
    const isGroup = selectedChat.type === 'group';
    try {
      const msgUrl = isGroup ? `/api/group/${selectedChat._id}/messages` : `/api/chat/${selectedChat._id}/messages`;
      const r = await fetch(msgUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          content: `[Sticker]`, 
          fileUrl: sticker.url, 
          fileType: 'image/gif', 
          isSticker: true 
        }) 
      });
      const d = await r.json();
      if (r.ok && d.message) {
        const newMsg = { ...d.message, senderId: user._id, sender: { _id: user._id, username: user.username, avatar: user.avatar }, createdAt: new Date().toISOString(), fileUrl: sticker.url, fileType: 'image/gif', isSticker: true };
        if (isGroup) socket?.emit('group-message', { groupId: selectedChat._id, ...d.message, isSticker: true });
        else socket?.emit('private-message', { chatId: selectedChat._id, ...d.message, isSticker: true });
        setMessages(p => [...p, newMsg]);
      }
    } catch (err) { console.error(err); } finally { setSendingMsg(false); setShowStickers(false); }
  };

  // ── Calls ──
  const cleanupCall = async () => {
    localStream?.getTracks().forEach(t => t.stop());
    peerRef.current?.close(); peerRef.current = null;
    iceQueue.current = [];
    setLocalStream(null); setRemoteStream(null); setPrivateCall(null);
    setCurrentCallId(null); setCallMinimized(false); stopRingtone();
  };

  const startPrivateCall = async (type = 'audio') => {
    if (!selectedChat || selectedChat.type === 'group') return;
    const tid = selectedChat.otherUser?._id; if (!tid) return;
    const getTargetSocket = () => new Promise(resolve => {
      socket.emit('get-socket-id', { userId: tid });
      const h = ({ userId, socketId }) => { if (userId === tid) { socket.off('socket-id-result', h); resolve(socketId); } };
      socket.on('socket-id-result', h); setTimeout(() => { socket.off('socket-id-result', h); resolve(null); }, 3000);
    });
    try {
      const sid = await getTargetSocket(); if (!sid) { alert('User sedang offline.'); return; }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      setLocalStream(stream);
      const pc = new RTCPeerConnection(ICE_CONFIG);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      pc.ontrack = e => {
        console.log('🎬 Remote track received:', e.streams[0]);
        setRemoteStream(e.streams[0]);
      };
      pc.onicecandidate = e => { 
        if (e.candidate) {
          console.log('📡 Sending ICE candidate to:', sid);
          socket.emit('ice-candidate', { targetId: sid, candidate: e.candidate }); 
        }
      };
      pc.oniceconnectionstatechange = () => console.log('⚡ ICE Connection State:', pc.iceConnectionState);
      
      peerRef.current = pc;
      const offer = await pc.createOffer(); 
      console.log('📨 Creating offer...');
      await pc.setLocalDescription(offer);
      socket.emit('call-offer', { targetUserId: tid, offer, fromUserId: user._id, fromUsername: user.username, callType: type });
      setPrivateCall({ type, status: 'calling', with: selectedChat.otherUser, socketId: sid });
      try {
        const r = await fetch('/api/calls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ participants: [user._id, tid], callType: type, initiatorId: user._id }) });
        const d = await r.json(); if (d.call) setCurrentCallId(d.call._id);
      } catch {}
    } catch (e) { alert('Gagal memulai call: ' + e.message); }
  };

  const acceptCall = async (fromSocketId, offer, callType) => {
    stopRingtone();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
      setLocalStream(stream);
      const pc = new RTCPeerConnection(ICE_CONFIG);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      pc.ontrack = e => {
        console.log('🎬 Remote track received (Answering):', e.streams[0]);
        setRemoteStream(e.streams[0]);
      };
      pc.onicecandidate = e => { 
        if (e.candidate) {
          console.log('📡 Sending ICE candidate to caller:', fromSocketId);
          socket?.emit('ice-candidate', { targetId: fromSocketId, candidate: e.candidate }); 
        }
      };
      pc.oniceconnectionstatechange = () => console.log('⚡ ICE Connection State (Answering):', pc.iceConnectionState);
      
      peerRef.current = pc;
      console.log('📥 Setting remote description (Offer)...');
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      // Process queued candidates
      while (iceQueue.current.length > 0) {
        const candidate = iceQueue.current.shift();
        console.log('📦 Processing queued ICE candidate');
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
      console.log('📨 Creating answer...');
      const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
      socket?.emit('call-answer', { targetId: fromSocketId, answer });
      setPrivateCall(p => ({ ...p, status: 'active' }));
      if (currentCallId) { try { await fetch(`/api/calls/${currentCallId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'answered', startedAt: new Date() }) }); } catch {} }
    } catch { cleanupCall(); }
  };

  const endCall = () => { if (privateCall?.socketId) socket?.emit('call-end', { targetId: privateCall.socketId }); cleanupCall(); };

  const startGroupCall = (type = 'audio') => {
    if (!selectedChat || selectedChat.type !== 'group') return;
    socket?.emit('group-call-start', { groupId: selectedChat._id, groupName: selectedChat.name, callType: type, fromUsername: user.username });
    setGroupCall({ groupId: selectedChat._id, groupName: selectedChat.name, callType: type });
  };

  // ── Typing ──
  const handleTyping = () => {
    if (!selectedChat) return;
    socket?.emit('typing', { chatId: selectedChat._id, userId: user._id, username: user.username });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('stop-typing', { chatId: selectedChat._id, userId: user._id });
    }, 2000);
  };

  // ── Selection & Context Menu ──
  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, msgId: msg._id, msgContent: msg.content, isVoice: !!msg.isVoice });
  };
  const enterSelectionMode = (id) => { setSelectionMode(true); setSelectedMsgs(new Set([id])); };
  const exitSelectionMode = () => { setSelectionMode(false); setSelectedMsgs(new Set()); };
  const toggleMsgSelect = (id) => { const n = new Set(selectedMsgs); if (n.has(id)) n.delete(id); else n.add(id); setSelectedMsgs(n); };
  const handleLongPressStart = (id) => { longPressRef.current = setTimeout(() => enterSelectionMode(id), 600); };
  const handleLongPressEnd = () => clearTimeout(longPressRef.current);

  const handleDeleteSelected = async (target) => {
    const ids = Array.from(selectedMsgs); if (!ids.length || !selectedChat) return;
    const isGroup = selectedChat.type === 'group';
    try {
      const url = isGroup ? `/api/group/${selectedChat._id}/messages` : `/api/chat/${selectedChat._id}/messages`;
      const res = await fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageIds: ids, deleteFor: target }) });
      if (res.ok) { setMessages(p => p.filter(m => !ids.includes(m._id))); exitSelectionMode(); setDeleteModal({ show: false, type: 'multi' }); }
    } catch {}
  };

  // ── Helpers ──
  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); Cookies.remove('token'); socket?.disconnect(); router.push('/login'); };
  const formatTime = ts => { if (!ts) return ''; try { const d = new Date(ts), now = new Date(); if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); if (now - d < 172800000) return 'Kemarin'; return d.toLocaleDateString([], { month: 'short', day: 'numeric' }); } catch { return ''; } };
  const isOnline = uid => {
    if (!onlineUsers.includes(uid?.toString())) return false;
    const target = users.find(u => u._id === uid);
    return target?.showOnlineStatus !== false;
  };
  const canSend = () => { if (!selectedChat) return false; if (selectedChat.type === 'private') return true; const g = groups.find(g => g._id === selectedChat._id); if (!g) return true; const aids = (g.admins || []).map(a => (typeof a === 'object' ? a._id : a)?.toString()); return !g.onlyAdmins || aids.includes(user?._id?.toString()); };

  const fChats  = chats.filter(c => (c.otherUser?.username || '').toLowerCase().includes(sidebarSearch.toLowerCase()));
  const fGroups = groups.filter(g => (g.name || '').toLowerCase().includes(sidebarSearch.toLowerCase()));
  const fUsers  = users.filter(u => u?._id !== user?._id && (u?.username || '').toLowerCase().includes(sidebarSearch.toLowerCase()));

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <Spinner size={40} />
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', background: 'var(--bg-base)', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', position: 'relative' }}>
      <style>{`
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dots{0%,80%,100%{opacity:.2;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
        @keyframes selPop{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}
        .row-hov:hover{background:var(--bg-elevated)!important}
        .msg{animation:fadeUp .16s ease}
        .tab-btn{padding:8px 0;font-size:12px;font-weight:600;flex:1;cursor:pointer;border:none;border-bottom:2px solid transparent;background:transparent;font-family:inherit;color:var(--text-muted);transition:all .15s}
        .tab-active{color:var(--accent)!important;border-bottom-color:var(--accent)!important}
        .sidebar-backdrop{display:block;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:49}
        .msg-bubble-wrap{cursor:pointer;border-radius:var(--radius-md);transition:background 0.12s}
        .msg-bubble-wrap.sel-mode:hover{background:rgba(0,229,195,0.06)}
        .msg-selected .bubble-inner{outline:2px solid var(--accent);outline-offset:2px}
        .sel-check{width:20px;height:20px;border-radius:50%;border:2px solid var(--border);background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;animation:selPop .15s ease}
        .sel-check.checked{border-color:var(--accent);background:var(--accent)}
      `}</style>

      {isMobile && sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {!sidebarOpen && (
        <button 
          onClick={() => setSidebarOpen(true)}
          style={{ 
            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', 
            zIndex: 100, width: 24, height: 60, background: 'var(--bg-surface)', 
            border: '1px solid var(--border)', borderLeft: 'none', 
            borderTopRightRadius: 12, borderBottomRightRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--accent)', boxShadow: '4px 0 12px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease', padding: 0
          }}
          className="sidebar-trigger"
          onMouseEnter={e => e.currentTarget.style.width = '30px'}
          onMouseLeave={e => e.currentTarget.style.width = '24px'}
        >
          <Icon.ChevRight />
        </button>
      )}

      <aside style={{ width: sidebarOpen ? (isMobile ? '80vw' : 290) : 0, minWidth: 0, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'width 0.25s cubic-bezier(.4,0,.2,1)', flexShrink: 0, position: isMobile ? 'fixed' : 'relative', top: 0, left: 0, bottom: 0, zIndex: isMobile ? 50 : 'auto', boxShadow: isMobile && sidebarOpen ? '4px 0 24px rgba(0,0,0,0.4)' : 'none' }}>
        {/* Top Branding Bar */}
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/Logo.png" alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.05em' }}>COSMED</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <IconBtn onClick={() => setShowCallHistory(true)} title="Riwayat Panggilan" style={{ width: 28, height: 28 }}><Icon.History /></IconBtn>
            <IconBtn onClick={handleLogout} title="Logout" danger style={{ width: 28, height: 28 }}><Icon.Logout /></IconBtn>
            {!isMobile && <IconBtn onClick={() => setSidebarOpen(false)} title="Sembunyikan sidebar" style={{ width: 28, height: 28 }}><Icon.ChevLeft /></IconBtn>}
          </div>
        </div>

        {/* User Profile Card */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-elevated)', margin: '0 12px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }} onClick={() => { setViewProfileUser(user); setShowViewProfile(true); }}>
            <Avatar user={user} size={40} showRing />
            <div style={{ position: 'absolute', bottom: 0, right: 0 }}><OnlineDot online /></div>
          </div>
          <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => { setViewProfileUser(user); setShowViewProfile(true); }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>Online</span>
            </div>
          </div>
          <IconBtn 
            onClick={() => setTheme(p => p === 'dark' ? 'light' : 'dark')} 
            title="Toggle Theme" 
            style={{ width: 32, height: 32, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10 }}
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </IconBtn>
        </div>

        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}><Icon.Search /></span>
            <input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} placeholder="Cari..." style={{ width: '100%', padding: '7px 10px 7px 30px', background: 'var(--bg-elevated)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 10px' }}>
          <button className={`tab-btn${activeTab === 'chats' ? ' tab-active' : ''}`} onClick={() => setActiveTab('chats')}>Chat</button>
          <button className={`tab-btn${activeTab === 'groups' ? ' tab-active' : ''}`} onClick={() => setActiveTab('groups')}>Grup</button>
          <button className={`tab-btn${activeTab === 'people' ? ' tab-active' : ''}`} onClick={() => setActiveTab('people')}>People</button>
        </div>

        <StoryBar stories={stories} currentUser={user} onRefresh={load} />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'chats' && (
            <>
              <div style={{ padding: '8px 10px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>CHAT TERAKHIR</span>
                <button onClick={() => setActiveTab('people')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', background: 'var(--accent-muted)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-accent)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}><Icon.Plus /> Baru</button>
              </div>
              {fChats.length === 0
                ? <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>Belum ada chat.</div>
                : fChats.map(chat => {
                const ou = chat.otherUser || {}; const cnt = unread[chat._id] || 0;
                const sel = selectedChat?._id === chat._id && selectedChat?.type === 'private';
                return (
                  <div key={chat._id} className="row-hov" onClick={() => openChat(chat)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', cursor: 'pointer', borderLeft: sel ? '2px solid var(--accent)' : '2px solid transparent', background: sel ? 'var(--accent-muted)' : 'transparent' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar user={ou} size={36} showRing={sel} />
                      <span style={{ position: 'absolute', bottom: 0, right: 0 }}><OnlineDot online={isOnline(ou._id)} /></span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: cnt > 0 ? 700 : 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ou.username || 'Unknown'}</div>
                      {chat.lastMessage && <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{typeof chat.lastMessage === 'object' ? chat.lastMessage.content : chat.lastMessage}</div>}
                    </div>
                    {cnt > 0 && <span style={{ background: 'var(--accent)', color: '#0a0c10', fontSize: 10, fontWeight: 700, borderRadius: 10, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>{cnt}</span>}
                  </div>
                );
              })
            }</>)}

          {activeTab === 'groups' && (
            <>
              <div style={{ padding: '8px 10px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>GRUP</span>
                <button onClick={() => setShowCreateGroup(true)} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', background: 'var(--accent-muted)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-accent)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}><Icon.Plus /> Baru</button>
              </div>
              {fGroups.length === 0
                ? <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>Belum ada grup.</div>
                : fGroups.map(group => {
                  const cnt = unread[group._id] || 0; const sel = selectedChat?._id === group._id && selectedChat?.type === 'group';
                  return (
                    <div key={group._id} className="row-hov" onClick={() => openGroup(group)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', cursor: 'pointer', borderLeft: sel ? '2px solid var(--accent)' : '2px solid transparent', background: sel ? 'var(--accent-muted)' : 'transparent' }}>
                      <Avatar user={{ name: group.name, avatar: group.photo, photo: group.photo }} size={36} isGroup showRing={sel} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: cnt > 0 ? 700 : 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{group.members?.length || 0} member</div>
                      </div>
                      {cnt > 0 && <span style={{ background: 'var(--accent)', color: '#0a0c10', fontSize: 10, fontWeight: 700, borderRadius: 10, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>{cnt}</span>}
                    </div>
                  );
                })}
            </>
          )}

          {activeTab === 'people' && (
            <>
              <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>SEMUA USER</div>
              {fUsers.length === 0
                ? <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>Tidak ada user.</div>
                : fUsers.map(u => (
                  <div key={u._id} className="row-hov" onClick={() => { createOrOpenChat(u); setActiveTab('chats'); }} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 12px', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar user={u} size={34} />
                      <span style={{ position: 'absolute', bottom: 0, right: 0 }}><OnlineDot online={isOnline(u._id)} /></span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{u.username}</div>
                      <div style={{ fontSize: 11, color: isOnline(u._id) ? 'var(--accent)' : 'var(--text-muted)' }}>{isOnline(u._id) ? 'Online' : 'Offline'}</div>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {selectedChat ? (
          <>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, minHeight: 58 }}>
              {(!sidebarOpen || isMobile) && (
                <IconBtn onClick={() => { if (isMobile) { setSelectedChat(null); setSidebarOpen(true); } else setSidebarOpen(true); }}>
                  {isMobile ? <Icon.Back /> : <Icon.ChevRight />}
                </IconBtn>
              )}
              {selectionMode ? (
                <SelectionBar count={selectedMsgs.size} onDelete={() => setDeleteModal({ show: true, type: 'multi' })} onCancel={exitSelectionMode} />
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer', minWidth: 0, overflow: 'hidden' }}
                    onClick={() => { if (selectedChat.type === 'group') setShowGroupSettings(true); else { setViewProfileUser(selectedChat.otherUser); setShowViewProfile(true); } }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {selectedChat.type === 'group'
                        ? <Avatar user={{ name: selectedChat.name, avatar: selectedChat.photo, photo: selectedChat.photo }} size={40} isGroup />
                        : <><Avatar user={selectedChat.otherUser} size={40} showRing={isOnline(selectedChat.otherUser?._id)} /><span style={{ position: 'absolute', bottom: 1, right: 1 }}><OnlineDot online={isOnline(selectedChat.otherUser?._id)} /></span></>
                      }
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedChat.type === 'group' ? selectedChat.name : selectedChat.otherUser?.username}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        {selectedChat.type === 'group'
                          ? `${selectedChat.members?.length || 0} member`
                          : (isOnline(selectedChat.otherUser?._id) ? <span style={{ color: 'var(--accent)' }}>Online</span> : 'Offline')
                        }
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {selectedChat.type === 'private' && <>
                      <IconBtn onClick={() => startPrivateCall('audio')} title="Voice call"><Icon.Phone /></IconBtn>
                      <IconBtn onClick={() => startPrivateCall('video')} title="Video call"><Icon.Video /></IconBtn>
                    </>}
                    {selectedChat.type === 'group' && <>
                      <IconBtn onClick={() => startGroupCall('audio')} title="Voice call grup"><Icon.Phone /></IconBtn>
                      <IconBtn onClick={() => startGroupCall('video')} title="Video call grup"><Icon.Video /></IconBtn>
                    </>}
                    <IconBtn onClick={() => setShowSearch(v => !v)} title="Cari pesan" active={showSearch}><Icon.Search /></IconBtn>
                    <IconBtn onClick={() => fileInputRef.current?.click()} title="Lampirkan"><Icon.Attach /></IconBtn>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                </>
              )}
            </div>

            {/* Body */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 3 }} onClick={() => { if (contextMenu) setContextMenu(null); }}>
                {loadingMsgs
                  ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><Spinner /></div>
                  : messages.length === 0
                    ? <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)' }}><span style={{ fontSize: 34 }}>💬</span><span style={{ fontSize: 13 }}>Belum ada pesan — mulai duluan!</span></div>
                    : messages.map((msg, idx) => {
                      const sid   = (typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId);
                      const isMe  = sid === user?._id;
                      const sName = msg.sender?.username || (typeof msg.senderId === 'object' ? msg.senderId?.username : 'User');
                      const mDate = msg.createdAt ? new Date(msg.createdAt).toDateString() : null;
                      const pDate = idx > 0 && messages[idx-1].createdAt ? new Date(messages[idx-1].createdAt).toDateString() : null;
                      const isSelected = selectedMsgs.has(msg._id);
                      const isVoice = Boolean(msg.isVoice) || (msg.fileType?.startsWith('audio/') && msg.content === '🎙 Voice note');
                      const isSticker = Boolean(msg.isSticker);

                      return (
                        <div key={msg._id || idx} ref={el => { if (msg._id) messageRefs.current[msg._id] = el; }}>
                          {mDate && mDate !== pDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 6px' }}>
                              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(msg.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                            </div>
                          )}
                          <div className={`msg msg-bubble-wrap ${selectionMode ? 'sel-mode' : ''} ${isSelected ? 'msg-selected' : ''}`}
                            style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 6, marginBottom: 2, padding: '2px 0', background: isSelected ? 'rgba(0,229,195,0.05)' : 'transparent', borderRadius: 'var(--radius-sm)' }}
                            onClick={() => { if (selectionMode && msg._id) toggleMsgSelect(msg._id); }}
                            onContextMenu={(e) => { if (!selectionMode && msg._id) handleContextMenu(e, msg); }}
                            onTouchStart={() => { if (!selectionMode && msg._id) handleLongPressStart(msg._id); }}
                            onTouchEnd={handleLongPressEnd} onTouchMove={handleLongPressEnd}>
                            {selectionMode && (
                              <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 8, flexShrink: 0, order: isMe ? 3 : 0 }}>
                                <div className={`sel-check ${isSelected ? 'checked' : ''}`}>
                                  {isSelected && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#0a0c10" strokeWidth="2.5" strokeLinecap="round"/></svg>}
                                </div>
                              </div>
                            )}
                            {!isMe && <Avatar user={{ username: sName, avatar: msg.sender?.avatar }} size={26} />}
                            <div style={{ position: 'relative', maxWidth: isMobile ? '80%' : '65%' }}>
                              {selectedChat.type === 'group' && !isMe && <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginBottom: 2, paddingLeft: 4 }}>{sName}</div>}
                              <div className="bubble-inner" style={{ 
                                padding: isVoice ? '8px 10px' : isSticker ? '0' : '8px 12px', 
                                borderRadius: isMe ? '14px 14px 3px 14px' : '14px 14px 14px 3px', 
                                background: isSticker ? 'transparent' : (isMe ? 'var(--bubble-me)' : 'var(--bubble-them)'), 
                                color: isMe ? '#0a0c10' : 'var(--text-primary)', 
                                fontSize: 14, 
                                lineHeight: 1.5, 
                                boxShadow: isSticker ? 'none' : (isMe ? '0 2px 8px rgba(0,196,168,0.2)' : '0 2px 6px rgba(0,0,0,0.2)') 
                              }}>
                                {(() => {
                                  if (isVoice) return <VoiceNoteBubble msg={msg} isMe={isMe} />;
                                  if (isSticker) return <img src={msg.fileUrl} alt="sticker" style={{ width: 150, height: 150, objectFit: 'contain', display: 'block' }} />;
                                  if (msg.fileUrl) {
                                    if (msg.fileType?.startsWith('image/')) return <img src={msg.fileUrl} alt={msg.fileName} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6, cursor: 'pointer', display: 'block' }} onClick={e => { if (!selectionMode) { setPreviewFile(msg); setShowFileModal(true); } e.stopPropagation(); }} />;
                                    return <div style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }} onClick={e => { if (!selectionMode) { setPreviewFile(msg); setShowFileModal(true); } e.stopPropagation(); }}><span style={{ fontSize: 18 }}>📎</span><span style={{ fontSize: 13 }}>{msg.fileName || msg.content}</span></div>;
                                  }
                                  return msg.content;
                                })()}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatTime(msg.createdAt)}</span>
                                {isMe && msg.read && <span style={{ fontSize: 10, color: 'var(--accent)' }}>✓✓</span>}
                              </div>
                            </div>
                            {isMe && <Avatar user={user} size={26} />}
                          </div>
                        </div>
                      );
                    })
                }
                {typingUser && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ padding: '9px 12px', background: 'var(--bubble-them)', borderRadius: '14px 14px 14px 3px', display: 'flex', gap: 4 }}>
                      {[0,.2,.4].map((d,i) => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: `dots 1.2s ${d}s infinite` }} />)}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{typingUser} mengetik</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {showSearch && <SearchPanel messages={messages} onClose={() => setShowSearch(false)} onJumpTo={id => { messageRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setShowSearch(false); }} />}
            </div>

            {/* Input */}
            {!selectionMode && (
              <div style={{ padding: '9px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                {canSend() ? (
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
                    {showStickers && <StickerPicker onSelect={sendSticker} onClose={() => setShowStickers(false)} />}
                    <IconBtn onClick={() => setShowStickers(p => !p)} active={showStickers} title="Stickers"><span style={{ fontSize: 20 }}>✨</span></IconBtn>
                    <VoiceNoteRecorder onSend={handleVoiceNoteSend} disabled={sendingMsg} />
                    <input type="text" value={newMessage} onChange={e => { setNewMessage(e.target.value); handleTyping(); }} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Kirim pesan..."
                      style={{ flex: 1, padding: '9px 14px', background: 'var(--bg-elevated)', borderWidth: 1, borderStyle: 'solid', borderColor: inputFocused ? 'var(--border-accent)' : 'var(--border)', borderRadius: 22, color: 'var(--text-primary)', fontSize: 14, outline: 'none', transition: 'border-color .2s', fontFamily: 'inherit' }}
                      onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} />
                    <button type="button" onClick={sendMessage} disabled={!newMessage.trim() || sendingMsg}
                      style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--accent)', color: '#0a0c10', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', flexShrink: 0, opacity: !newMessage.trim() ? 0.4 : 1 }}>
                      {sendingMsg ? <Spinner size={14} /> : <Icon.Send />}
                    </button>
                  </div>
                ) : (
                  <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '7px 0' }}>📢 Hanya admin yang bisa kirim</div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)', background: 'var(--bg-base)' }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 10 }}>
              <img src="/Logo.png" alt="Cosmed Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} onError={(e) => e.target.style.display = 'none'} />
              <div style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', background: 'var(--accent-muted)', filter: 'blur(30px)', opacity: 0.5 }}></div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>COSMED</div>
            <div style={{ fontSize: 14, maxWidth: 300, textAlign: 'center', lineHeight: 1.6 }}>Kirim dan terima pesan secara real-time.</div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} onSelectMessage={() => enterSelectionMode(contextMenu.msgId)} onCopy={contextMenu.msgContent && !contextMenu.isVoice ? () => navigator.clipboard.writeText(contextMenu.msgContent) : null} onClose={() => setContextMenu(null)} />}

      {/* Modals */}
      <EditProfileModal show={showEditProfile} onClose={() => setShowEditProfile(false)} currentUser={user} onSaved={u => { setUser(u); setUsers(p => p.map(x => x._id?.toString() === u._id?.toString() ? u : x)); }} />
      <ViewProfileModal 
        show={showViewProfile} 
        onClose={() => setShowViewProfile(false)} 
        targetUser={viewProfileUser?._id?.toString() === user?._id?.toString() ? user : viewProfileUser} 
        isOnline={viewProfileUser?._id?.toString() === user?._id?.toString() ? true : isOnline(viewProfileUser?._id)} 
        currentUser={user} 
        onEdit={() => setShowEditProfile(true)} 
      />
      <GroupSettingsModal show={showGroupSettings} onClose={() => setShowGroupSettings(false)} group={groups.find(g => g._id === selectedChat?._id)} currentUser={user} users={users} socket={socket} onUpdated={updated => { setGroups(p => p.map(g => g._id === updated._id ? { ...g, ...updated, type: 'group' } : g)); if (selectedChat?._id === updated._id) setSelectedChat(p => ({ ...p, ...updated })); }} onDeleted={id => { setGroups(p => p.filter(g => g._id !== id)); if (selectedChat?._id === id) setSelectedChat(null); }} />
      <CreateGroupModal show={showCreateGroup} onClose={() => setShowCreateGroup(false)} users={users} currentUser={user} onCreated={g => { const wt = { ...g, type: 'group' }; setGroups(p => [wt, ...p]); setActiveTab('groups'); openGroup(wt); }} />
      <CallHistoryModal show={showCallHistory} onClose={() => setShowCallHistory(false)} currentUser={user} />
      <RingtoneSettingsModal show={showRingtoneSettings} onClose={() => setShowRingtoneSettings(false)} currentRingtone={selectedRingtone} onSave={rt => { setSelectedRingtone(rt); try { localStorage.setItem('cosmed_ringtone', JSON.stringify(rt)); } catch {} }} />

      {/* File preview */}
      {showFileModal && previewFile && (
        <Overlay onClose={() => setShowFileModal(false)}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '92vw', maxWidth: 760, maxHeight: '90vh', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{previewFile.fileName || 'File'}</span>
              <div style={{ display: 'flex', gap: 5 }}>
                <a href={previewFile.fileUrl} download={previewFile.fileName}><IconBtn><Icon.Download /></IconBtn></a>
                <IconBtn onClick={() => setShowFileModal(false)}><Icon.Close /></IconBtn>
              </div>
            </div>
            <div style={{ padding: 16, overflowY: 'auto', maxHeight: 'calc(90vh - 56px)' }}>
              {previewFile.fileType?.startsWith('image/')
                ? <img src={previewFile.fileUrl} alt="" style={{ maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain', borderRadius: 'var(--radius-md)', display: 'block', margin: '0 auto' }} />
                : previewFile.fileType === 'application/pdf'
                  ? <iframe src={previewFile.fileUrl} style={{ width: '100%', height: '68vh', border: 'none' }} title="" />
                  : <div style={{ textAlign: 'center', padding: 32 }}><div style={{ fontSize: 52, marginBottom: 10 }}>📄</div><a href={previewFile.fileUrl} download={previewFile.fileName} style={{ padding: '9px 18px', background: 'var(--accent)', color: '#0a0c10', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>Download</a></div>
              }
            </div>
          </div>
        </Overlay>
      )}

      {/* Delete modal */}
      {deleteModal.show && (
        <Overlay onClose={() => setDeleteModal({ show: false, type: 'multi' })}>
          <ModalBox maxWidth={320}>
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Hapus {selectedMsgs.size} Pesan</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Pilih opsi penghapusan:</div>
              <button style={{ width: '100%', padding: '9px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 7 }} onClick={() => handleDeleteSelected('self')}>Hapus untuk saya</button>
              <button style={{ width: '100%', padding: '9px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginBottom: 7 }} onClick={() => handleDeleteSelected('everyone')}>Hapus untuk semua</button>
              <button style={{ width: '100%', padding: '9px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }} onClick={() => setDeleteModal({ show: false, type: 'multi' })}>Batal</button>
            </div>
          </ModalBox>
        </Overlay>
      )}

      {/* Incoming group call toast */}
      {incomingGroupCall && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 250, background: 'var(--bg-surface)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-accent)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeUp 0.2s ease', maxWidth: 320, width: 'calc(100vw - 32px)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', animation: 'pulse 1.2s ease infinite', flexShrink: 0 }}>
            {incomingGroupCall.callType === 'video' ? <Icon.Video /> : <Icon.Phone />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{incomingGroupCall.groupName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{incomingGroupCall.fromUsername} mengundang</div>
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <button onClick={() => { stopRingtone(); setGroupCall({ ...incomingGroupCall }); setIncomingGroupCall(null); }} style={{ padding: '6px 12px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0c10', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Join</button>
            <button onClick={() => { stopRingtone(); setIncomingGroupCall(null); }} style={{ padding: '6px 10px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>Tolak</button>
          </div>
        </div>
      )}

      {/* Call overlays */}
      {privateCall && <PrivateCallOverlay call={privateCall} onEnd={endCall} localStream={localStream} remoteStream={remoteStream} minimized={callMinimized} onMinimize={() => setCallMinimized(true)} onMaximize={() => setCallMinimized(false)} />}
      {groupCall && socket && <GroupCallOverlay groupId={groupCall.groupId} groupName={groupCall.groupName} callType={groupCall.callType} currentUser={user} socket={socket} onEnd={() => { setGroupCall(null); setGroupCallMinimized(false); }} minimized={groupCallMinimized} onMinimize={() => setGroupCallMinimized(true)} onMaximize={() => setGroupCallMinimized(false)} />}
    </div>
  );
}