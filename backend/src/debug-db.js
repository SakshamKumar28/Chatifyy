import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from './models/messageModel.js';
import Chat from './models/chatModel.js';

dotenv.config();

const checkDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected.');

    const count = await Message.countDocuments();
    console.log(`📊 Total Messages in DB: ${count}`);

    const lastMessages = await Message.find().sort({ createdAt: -1 }).limit(5).populate('sender receiver', 'username');
    console.log('📜 Last 5 Messages:');
    lastMessages.forEach(m => {
      console.log(`[${m.createdAt}] ${m.sender?.username} -> ${m.receiver?.username}: "${m.content}"`);
    });

    const chats = await Chat.find();
    console.log(`📊 Total Chats in DB: ${chats.length}`);
    chats.forEach(c => {
        console.log(`Chat ${c._id}: ${c.messages.length} messages`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkDB();
