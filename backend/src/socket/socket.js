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
    });
  });
};

export default socketHandler;
