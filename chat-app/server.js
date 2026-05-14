// server.js — Fixed untuk production (status online issue)
const { createServer } = require('http');
const { parse }        = require('url');
const next             = require('next');
const { Server }       = require('socket.io');

const dev      = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port     = process.env.PORT || 3000;
const app      = next({ dev, hostname, port });
const handle   = app.getRequestHandler();

const onlineUsers = new Set();
const userSockets = new Map(); // userId → Set<socketId>
const socketUsers = new Map(); // socketId → userId

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try { await handle(req, res, parse(req.url, true)); }
    catch (err) { console.error(err); res.statusCode = 500; res.end('Internal Server Error'); }
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: false,
    },
    path: '/socket.io/',
    // PENTING: polling dulu agar Cloudflare tunnel bisa konek
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    allowUpgrades: true,
    // Tambahan untuk production stability
    connectTimeout: 45000,
    maxHttpBufferSize: 1e7,
  });

  io.on('connection', (socket) => {
    console.log(`✅ Connected: ${socket.id} (transport: ${socket.conn.transport.name})`);

    socket.conn.on('upgrade', (transport) => {
      console.log(`⬆️  Upgraded: ${socket.id} → ${transport.name}`);
    });

    // ─── PRESENCE ─────────────────────────────────────────
    socket.on('user-online', (userId) => {
      if (!userId) return;

      if (!userSockets.has(userId)) userSockets.set(userId, new Set());
      userSockets.get(userId).add(socket.id);
      socketUsers.set(socket.id, userId);
      onlineUsers.add(userId);

      // Broadcast ke SEMUA termasuk pengirim agar state sync
      io.emit('online-users', Array.from(onlineUsers));
      // Broadcast ke orang lain bahwa user ini online
      socket.broadcast.emit('user-online', userId);

      console.log(`🟢 ${userId} online (socket: ${socket.id}, total online: ${onlineUsers.size})`);
    });

    socket.on('get-online-users', () => {
      console.log(`📋 get-online-users req dari ${socket.id}, mengirim ${onlineUsers.size} users`);
      socket.emit('online-users', Array.from(onlineUsers));
    });

    // ─── RESOLVE SOCKET ID ─────────────────────────────────
    socket.on('get-socket-id', ({ userId }) => {
      const sockets = userSockets.get(userId);
      const socketId = sockets?.size > 0 ? [...sockets].at(-1) : null;
      socket.emit('socket-id-result', { userId, socketId });
    });

    // ─── JOIN ROOM ─────────────────────────────────────────
    socket.on('join-chat', (chatId) => {
      if (!chatId) return;
      socket.join(chatId);
    });

    // ─── PRIVATE MESSAGING ─────────────────────────────────
    socket.on('private-message', (data) => {
      if (!data?.chatId) return;
      io.to(data.chatId).emit('new-message', {
        ...data,
        createdAt: data.createdAt || new Date(),
      });
    });

    // ─── GROUP MESSAGING ───────────────────────────────────
    socket.on('group-message', (data) => {
      if (!data?.groupId) return;
      io.to(data.groupId).emit('new-group-message', {
        ...data,
        createdAt: data.createdAt || new Date(),
      });
    });

    socket.on('group-updated', (data) => {
      if (data?.groupId) io.to(data.groupId).emit('group-updated', data);
    });

    socket.on('group-deleted', (data) => {
      if (data?.groupId) io.to(data.groupId).emit('group-deleted', data);
    });

    // ─── TYPING ────────────────────────────────────────────
    socket.on('typing', (d) => {
      if (!d?.chatId) return;
      socket.to(d.chatId).emit('user-typing', {
        chatId: d.chatId, userId: d.userId, username: d.username,
      });
    });

    socket.on('stop-typing', (d) => {
      if (!d?.chatId) return;
      socket.to(d.chatId).emit('user-stop-typing', {
        chatId: d.chatId, userId: d.userId,
      });
    });

    // ─── READ / DELETE ─────────────────────────────────────
    socket.on('mark-read', (d) => {
      if (!d?.chatId) return;
      socket.to(d.chatId).emit('messages-read', {
        chatId: d.chatId, userId: d.userId, timestamp: new Date(),
      });
    });

    socket.on('delete-message', (d) => {
      if (!d?.chatId) return;
      io.to(d.chatId).emit('message-deleted', {
        chatId: d.chatId, messageId: d.messageId,
      });
    });

    // ─── PRIVATE CALL ──────────────────────────────────────
    socket.on('call-offer', (data) => {
      const targetUserId = data.targetUserId;
      const targetSocketId = data.targetId;
      console.log(`📡 Call Offer from ${socket.id} (${data.fromUsername}) to User: ${targetUserId || 'N/A'}, Socket: ${targetSocketId || 'N/A'}`);
      
      const sendOffer = (sid) => {
        console.log(`   >> Forwarding offer to socket: ${sid}`);
        socket.to(sid).emit('call-offer', {
          offer: data.offer, 
          fromSocketId: socket.id,
          fromUserId: data.fromUserId, 
          fromUsername: data.fromUsername,
          callType: data.callType || 'audio',
        });
      };

      if (targetUserId) {
        const sockets = userSockets.get(targetUserId);
        if (sockets && sockets.size > 0) {
          console.log(`   >> Found ${sockets.size} active sockets for user ${targetUserId}`);
          sockets.forEach(sid => sendOffer(sid));
        } else {
          console.log(`   ⚠️ No active sockets found for user ${targetUserId}`);
        }
      } else if (targetSocketId) {
        sendOffer(targetSocketId);
      }
    });

    socket.on('call-answer', (data) => {
      console.log(`📡 Call Answer from ${socket.id} to ${data.targetId}`);
      if (!data?.targetId) return;
      socket.to(data.targetId).emit('call-answer', { 
        answer: data.answer, 
        fromSocketId: socket.id 
      });
    });

    socket.on('ice-candidate', (data) => {
      console.log(`📡 ICE Candidate from ${socket.id} to ${data.targetId}`);
      if (!data?.targetId) return;
      socket.to(data.targetId).emit('ice-candidate', { 
        candidate: data.candidate,
        fromSocketId: socket.id
      });
    });

    socket.on('call-end', (data) => {
      if (!data?.targetId) return;
      socket.to(data.targetId).emit('call-ended', { 
        fromSocketId: socket.id 
      });
    });

    // ─── GROUP CALL ────────────────────────────────────────
    socket.on('group-call-start', ({ groupId, groupName, callType, fromUsername }) => {
      if (!groupId) return;
      socket.to(groupId).emit('group-call-invite', { groupId, groupName, callType, fromUsername });
    });

    socket.on('group-call-join', ({ groupId, userId, username, callType }) => {
      if (!groupId) return;
      socket.join(`call:${groupId}`);
      socket.to(`call:${groupId}`).emit('group-call-user-joined', {
        socketId: socket.id, userId, username, callType,
      });
    });

    socket.on('group-call-offer', ({ targetId, offer, callType }) => {
      if (!targetId) return;
      socket.to(targetId).emit('group-call-offer', {
        offer, from: socket.id,
        fromUsername: socketUsers.get(socket.id) || 'Unknown',
        callType,
      });
    });

    socket.on('group-call-answer', ({ targetId, answer }) => {
      if (!targetId) return;
      socket.to(targetId).emit('group-call-answer', { answer, from: socket.id });
    });

    socket.on('group-call-ice', ({ targetId, candidate }) => {
      if (!targetId) return;
      socket.to(targetId).emit('group-call-ice', { candidate, from: socket.id });
    });

    socket.on('group-call-leave', ({ groupId }) => {
      if (!groupId) return;
      socket.leave(`call:${groupId}`);
      socket.to(`call:${groupId}`).emit('group-call-user-left', { socketId: socket.id });
    });

    // ─── DISCONNECT ────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      const userId = socketUsers.get(socket.id);
      if (userId) {
        socketUsers.delete(socket.id);
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(userId);
            onlineUsers.delete(userId);
            io.emit('user-offline', userId);
            io.emit('online-users', Array.from(onlineUsers));
            console.log(`🔴 ${userId} offline (total online: ${onlineUsers.size})`);
          }
        }
      }
      socket.rooms.forEach(room => {
        if (room.startsWith('call:')) {
          socket.to(room).emit('group-call-user-left', { socketId: socket.id });
        }
      });
      console.log(`❌ Disconnected: ${socket.id} (${reason})`);
    });
  });

  setInterval(() => {
    const total = io.sockets.sockets.size;
    if (onlineUsers.size > 0 || total > 0) {
      console.log(`📊 Online: ${onlineUsers.size} users | ${total} sockets`);
    }
  }, 30000);

  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server ready → http://${hostname}:${port}`);
    console.log(`🌍 Mode: ${dev ? 'development' : 'production'}`);
  });
});