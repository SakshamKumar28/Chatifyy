import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Chat from './models/chatModel.js';
import User from './models/userModel.js';

dotenv.config();

const checkDuplicates = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const chats = await Chat.find({});
    console.log(`Total chats: ${chats.length}`);

    const map = new Map();

    for (const chat of chats) {
      // Sort participants to ensure set consistency
      const participants = chat.participants.map(p => p.toString()).sort();
      const key = participants.join('-');

      if (map.has(key)) {
        console.log(`⚠️ DUPLICATE FOUND!`);
        console.log(`Key: ${key}`);
        console.log(`Chat 1 ID: ${map.get(key)._id}, Messages: ${map.get(key).messages.length}`);
        console.log(`Chat 2 ID: ${chat._id}, Messages: ${chat.messages.length}`);
      } else {
        map.set(key, chat);
      }
    }

    console.log("Check complete.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkDuplicates();
