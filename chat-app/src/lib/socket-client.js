// src/lib/socket-client.js — Fixed untuk production online status
import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  console.log('🔌 Connecting socket to:', baseUrl);

  socket = io(baseUrl, {
    path: '/socket.io/',
    auth: token ? { token } : undefined,
    // PENTING: polling dulu untuk Cloudflare tunnel
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 30000,
    forceNew: false,
    withCredentials: false,
    upgrade: true,
  });

  socket.on('connect', () => {
    console.log(`✅ Socket connected: ${socket.id}`);
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Socket connect error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Disconnected:', reason);
    if (reason === 'io server disconnect') {
      socket.connect();
    }
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}