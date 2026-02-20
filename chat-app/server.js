//chat-app\server.js
// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store online users
let onlineUsers = new Set();
// Store user's socket ID mapping
const userSockets = new Map(); // userId -> socketId
const socketUsers = new Map(); // socketId -> userId

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/socket.io/'
  });

  const stunServer = process.env.STUN_SERVER || 'stun:stun.l.google.com:19302';

  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // Handle user online
    socket.on('user-online', (userId) => {
      console.log(`User ${userId} is now online with socket ${socket.id}`);
      
      // Store user mapping
      userSockets.set(userId, socket.id);
      socketUsers.set(socket.id, userId);
      
      // Add to online users
      onlineUsers.add(userId);
      
      // Kirim daftar online users ke semua client
      io.emit('online-users', Array.from(onlineUsers));
      
      // Beri tahu user lain bahwa user ini online
      socket.broadcast.emit('user-online', userId);
      
      console.log('Online users:', Array.from(onlineUsers));
    });

    // User join room (untuk private chat)
    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat: ${chatId}`);
    });

    // Private message
    socket.on('private-message', async (data) => {
      console.log('Private message:', data);
      
      // Broadcast ke room chat
      io.to(data.chatId).emit('new-message', {
        ...data,
        createdAt: new Date(),
        id: Date.now()
      });
    });

    // Get online users
    socket.on('get-online-users', () => {
      socket.emit('online-users', Array.from(onlineUsers));
    });

    // Check if specific user is online
    socket.on('check-user-online', (userId) => {
      const isOnline = onlineUsers.has(userId);
      socket.emit('user-online-status', { userId, online: isOnline });
    });

    // Group message
    socket.on('group-message', (data) => {
      console.log('Group message:', data);
      io.to(data.groupId).emit('new-group-message', data);
    });

    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(data.chatId).emit('user-typing', {
        userId: data.userId,
        username: data.username
      });
    });

    // Stop typing indicator
    socket.on('stop-typing', (data) => {
      socket.to(data.chatId).emit('user-stop-typing', {
        userId: data.userId
      });
    });

    // Mark messages as read
    socket.on('mark-read', (data) => {
      socket.to(data.chatId).emit('messages-read', {
        chatId: data.chatId,
        userId: data.userId,
        timestamp: new Date()
      });
    });

    // Call signaling
    socket.on('call-offer', (data) => {
      socket.to(data.targetId).emit('call-offer', {
        offer: data.offer,
        from: socket.id,
        fromUserId: data.fromUserId,
        fromUsername: data.fromUsername
      });
    });

    socket.on('call-answer', (data) => {
      socket.to(data.targetId).emit('call-answer', {
        answer: data.answer,
        from: socket.id
      });
    });

    socket.on('ice-candidate', (data) => {
      socket.to(data.targetId).emit('ice-candidate', data.candidate);
    });

    socket.on('call-end', (data) => {
      socket.to(data.targetId).emit('call-ended', {
        from: socket.id
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      const userId = socketUsers.get(socket.id);
      
      if (userId) {
        console.log(`❌ User ${userId} disconnected:`, socket.id);
        
        // Remove from online users
        onlineUsers.delete(userId);
        userSockets.delete(userId);
        socketUsers.delete(socket.id);
        
        // Beri tahu semua client user ini offline
        io.emit('user-offline', userId);
        io.emit('online-users', Array.from(onlineUsers));
        
        console.log('Online users:', Array.from(onlineUsers));
      } else {
        console.log('❌ Unknown user disconnected:', socket.id);
      }
    });

    socket.on('delete-message', (data) => {
      console.log('Message deleted:', data);
      io.to(data.chatId).emit('message-deleted', {
        chatId: data.chatId,
        messageId: data.messageId
      });
    });

  socket.on('group-message', (data) => {
    io.to(data.groupId).emit('new-group-message', { ...data, createdAt: new Date() });
  });
  socket.on('group-updated', (data) => {
    io.to(data.groupId).emit('group-updated', data);
  });
  socket.on('group-deleted', (data) => {
    io.to(data.groupId).emit('group-deleted', data);
  });
  });

  // Periodic cleanup (opsional, untuk menghapus mapping yang stale)
  setInterval(() => {
    // Log current online users
    console.log('📊 Online users count:', onlineUsers.size);
  }, 60000); // Setiap 1 menit

  server.listen(port, () => {
    console.log(`> 🚀 Ready on http://${hostname}:${port}`);
    console.log(`> 🔌 Socket.io listening on ws://${hostname}:${port}/socket.io/`);
  });
});