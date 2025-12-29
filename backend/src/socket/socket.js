import Message from '../models/messageModel.js';
import Chat from '../models/chatModel.js';

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`🟢 Client connected: ${socket.id}`);

    /* ---------------- JOIN ROOM ---------------- */
    socket.on('joinRoom', (userId) => {
      if (!userId) {
        console.warn(`⚠️ joinRoom called without userId`);
        return;
      }

      socket.join(userId);
      socket.userId = userId; // store for reference
      console.log(`👤 User ${userId} joined room ${userId}`);
    });

    /* ---------------- SEND MESSAGE ---------------- */
    socket.on('sendMessage', async (messageData, callback) => {
        // Legacy: This is now handled by POST /api/messages
        // Kept only if needed for typing indicators or other signals
        console.warn('⚠️ Socket sendMessage event is deprecated. Use REST API.');
        if (callback) callback({ status: 'error', message: 'Use REST API' });
    });

    /* ---------------- DISCONNECT ---------------- */
    socket.on('disconnect', () => {
      console.log(`🔴 Client disconnected: ${socket.id} (user: ${socket.userId || 'unknown'})`);
      removeFromQueue(socket.id);
    });

    /* ---------------- ANONYMOUS CHAT ---------------- */
    socket.on('startAnonymous', () => {
        addToQueue(socket);
    });

    socket.on('stopAnonymous', () => {
        removeFromQueue(socket.id);
    });

    socket.on('sendAnonymousMessage', ({ roomId, content }) => {
        const room = io.sockets.adapter.rooms.get(roomId);
        const size = room ? room.size : 0;
        console.log(`Msg in room ${roomId}: ${content} (Clients: ${size})`);
        
        // Broadcast to room excluding sender
        socket.to(roomId).emit('receiveAnonymousMessage', { 
            content, 
            senderId: 'Partner', // Hide real ID
            createdAt: new Date().toISOString()
        });
    });
  });
};

/* ---------------- QUEUE LOGIC ---------------- */
let anonymousQueue = [];

const addToQueue = (socket) => {
    if (anonymousQueue.find(s => s.id === socket.id)) return;
    
    console.log(`🕵️ User ${socket.id} joining anon queue. Size: ${anonymousQueue.length + 1}`);
    anonymousQueue.push(socket);

    if (anonymousQueue.length >= 2) {
        const user1 = anonymousQueue.shift();
        const user2 = anonymousQueue.shift();

        const roomId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        user1.join(roomId);
        user2.join(roomId);

        user1.emit('anonymousMatched', { roomId, initiator: true });
        user2.emit('anonymousMatched', { roomId, initiator: false });

        console.log(`🤝 ANONYMOUS MATCH: ${user1.id} <-> ${user2.id} in ${roomId}`);
    }
};

const removeFromQueue = (socketId) => {
    anonymousQueue = anonymousQueue.filter(s => s.id !== socketId);
};

export default socketHandler;
