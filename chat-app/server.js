const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

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

  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

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

    // Call signaling
    socket.on('call-offer', (data) => {
      socket.to(data.targetId).emit('call-offer', {
        offer: data.offer,
        from: socket.id,
        fromUserId: data.fromUserId
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

    // Disconnect
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> 🚀 Ready on http://${hostname}:${port}`);
    console.log(`> 🔌 Socket.io listening on ws://${hostname}:${port}/socket.io/`);
  });
});