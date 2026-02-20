// chat-app\server.js
const { createServer } = require('http');
const { parse }        = require('url');
const next             = require('next');
const { Server }       = require('socket.io');

const dev      = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port     = process.env.PORT || 3000;
const app      = next({ dev, hostname, port });
const handle   = app.getRequestHandler();

// ── Maps ──
let onlineUsers   = new Set();
const userSockets = new Map(); // userId   → socketId
const socketUsers = new Map(); // socketId → userId

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try { await handle(req, res, parse(req.url, true)); }
    catch (err) { console.error(err); res.statusCode = 500; res.end('Internal Server Error'); }
  });

  const io = new Server(server, {
    cors: { origin: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000', methods: ['GET', 'POST'], credentials: true },
    path: '/socket.io/',
  });

  io.on('connection', (socket) => {
    console.log('✅ Connected:', socket.id);

    // ─── PRESENCE ─────────────────────────────────────────
    socket.on('user-online', (userId) => {
      userSockets.set(userId, socket.id);
      socketUsers.set(socket.id, userId);
      onlineUsers.add(userId);
      io.emit('online-users', Array.from(onlineUsers));
      socket.broadcast.emit('user-online', userId);
      console.log(`🟢 ${userId} online`);
    });

    socket.on('get-online-users', () => socket.emit('online-users', Array.from(onlineUsers)));

    // ─── RESOLVE SOCKET ID (untuk private call) ────────────
    socket.on('get-socket-id', ({ userId }) => {
      socket.emit('socket-id-result', { userId, socketId: userSockets.get(userId) || null });
    });

    // ─── JOIN ROOM ─────────────────────────────────────────
    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
      console.log(`🔗 ${socket.id} → room ${chatId}`);
    });

    // ─── PRIVATE MESSAGING ─────────────────────────────────
    socket.on('private-message', (data) => {
      io.to(data.chatId).emit('new-message', { ...data, createdAt: new Date() });
    });

    // ─── GROUP MESSAGING ───────────────────────────────────
    socket.on('group-message', (data) => {
      io.to(data.groupId).emit('new-group-message', { ...data, createdAt: new Date() });
    });

    socket.on('group-updated', (data) => io.to(data.groupId).emit('group-updated', data));
    socket.on('group-deleted', (data) => io.to(data.groupId).emit('group-deleted', data));

    // ─── TYPING ────────────────────────────────────────────
    socket.on('typing',      (d) => socket.to(d.chatId).emit('user-typing',      { chatId: d.chatId, userId: d.userId, username: d.username }));
    socket.on('stop-typing', (d) => socket.to(d.chatId).emit('user-stop-typing', { chatId: d.chatId, userId: d.userId }));

    // ─── READ / DELETE ─────────────────────────────────────
    socket.on('mark-read',     (d) => socket.to(d.chatId).emit('messages-read',  { chatId: d.chatId, userId: d.userId, timestamp: new Date() }));
    socket.on('delete-message',(d) => io.to(d.chatId).emit('message-deleted',    { chatId: d.chatId, messageId: d.messageId }));

    // ─── PRIVATE 1-on-1 CALL SIGNALING ─────────────────────
    socket.on('call-offer', (data) => {
      console.log(`📞 1-on-1 offer: ${socket.id} → ${data.targetId} (${data.callType})`);
      socket.to(data.targetId).emit('call-offer', {
        offer: data.offer, from: socket.id,
        fromUserId: data.fromUserId, fromUsername: data.fromUsername,
        callType: data.callType || 'audio',
      });
    });

    socket.on('call-answer', (data) => {
      socket.to(data.targetId).emit('call-answer', { answer: data.answer, from: socket.id });
    });

    socket.on('ice-candidate', (data) => {
      socket.to(data.targetId).emit('ice-candidate', data.candidate);
    });

    socket.on('call-end', (data) => {
      socket.to(data.targetId).emit('call-ended', { from: socket.id });
    });

    // ─── GROUP CALL SIGNALING ──────────────────────────────
    // Initiator broadcasts invite to the whole room
    socket.on('group-call-start', ({ groupId, groupName, callType, fromUsername }) => {
      console.log(`📹 Group call started in ${groupId} by ${fromUsername} (${callType})`);
      // Notify everyone in the room EXCEPT the initiator
      socket.to(groupId).emit('group-call-invite', { groupId, groupName, callType, fromUsername });
    });

    // Member joins the call room (server just announces to others)
    socket.on('group-call-join', ({ groupId, userId, username, callType }) => {
      socket.join(`call:${groupId}`);
      console.log(`📹 ${username} joined group call in ${groupId}`);
      // Tell everyone already in the call room that a new peer arrived
      socket.to(`call:${groupId}`).emit('group-call-user-joined', {
        socketId: socket.id, userId, username, callType,
      });
    });

    // WebRTC offer from one peer to another inside a group call
    socket.on('group-call-offer', ({ targetId, offer, callType }) => {
      socket.to(targetId).emit('group-call-offer', {
        offer, from: socket.id,
        fromUsername: socketUsers.get(socket.id) || 'Unknown',
        callType,
      });
    });

    socket.on('group-call-answer', ({ targetId, answer }) => {
      socket.to(targetId).emit('group-call-answer', { answer, from: socket.id });
    });

    socket.on('group-call-ice', ({ targetId, candidate }) => {
      socket.to(targetId).emit('group-call-ice', { candidate, from: socket.id });
    });

    // Member leaves the call
    socket.on('group-call-leave', ({ groupId }) => {
      socket.leave(`call:${groupId}`);
      socket.to(`call:${groupId}`).emit('group-call-user-left', { socketId: socket.id });
      console.log(`📹 ${socket.id} left group call in ${groupId}`);
    });

    // ─── DISCONNECT ────────────────────────────────────────
    socket.on('disconnect', () => {
      const userId = socketUsers.get(socket.id);
      if (userId) {
        onlineUsers.delete(userId);
        userSockets.delete(userId);
        socketUsers.delete(socket.id);
        io.emit('user-offline', userId);
        io.emit('online-users', Array.from(onlineUsers));
        console.log(`🔴 ${userId} offline`);
      }
      // Notify all call rooms this socket was in
      socket.rooms.forEach(room => {
        if (room.startsWith('call:')) {
          socket.to(room).emit('group-call-user-left', { socketId: socket.id });
        }
      });
    });
  });

  setInterval(() => {
    if (onlineUsers.size > 0) console.log(`📊 Online: ${onlineUsers.size} users`);
  }, 60000);

  server.listen(port, () => {
    console.log(`🚀 http://${hostname}:${port}`);
    console.log(`🔌 Socket.io: ws://${hostname}:${port}/socket.io/`);
    console.log(`📡 STUN: ${process.env.STUN_SERVER || 'stun:stun.l.google.com:19302'}`);
  });
});