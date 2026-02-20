// src/lib/socket-events.js
export const setupSocketEvents = (socket, userId, setOnlineUsers) => {
  if (!socket) return;

  // User online
  socket.emit('user-online', userId);

  // Dapatkan daftar user online
  socket.on('online-users', (users) => {
    console.log('Online users received:', users);
    setOnlineUsers(users);
  });

  // User lain online
  socket.on('user-online', (onlineUserId) => {
    console.log('User online:', onlineUserId);
    setOnlineUsers(prev => [...new Set([...prev, onlineUserId])]);
  });

  // User offline
  socket.on('user-offline', (offlineUserId) => {
    console.log('User offline:', offlineUserId);
    setOnlineUsers(prev => prev.filter(id => id !== offlineUserId));
  });

  // Minta daftar online users
  socket.emit('get-online-users');
};