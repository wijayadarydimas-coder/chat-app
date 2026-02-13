import { io } from 'socket.io-client';

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      path: '/socket.io/',
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};

export const connectSocket = (token) => {
  const socket = getSocket();
  if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};