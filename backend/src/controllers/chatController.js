import Message from "../models/messageModel.js";
import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";

/* ---------------- HELPER: GET UNIQUE CHAT ---------------- */
const getUniqueChat = async (user1, user2) => {
  // Find chats with EXACTLY these 2 participants
  const chats = await Chat.find({
    participants: { $all: [user1, user2], $size: 2 },
  });

  if (chats.length === 0) return null;

  if (chats.length === 1) return chats[0];

  console.warn(`⚠️ FOUND ${chats.length} DUPLICATE 1-on-1 CHATS for ${user1} & ${user2}. Merging...`);

  // Sort by number of messages (descending) to keep the "main" one
  chats.sort((a, b) => (b.messages?.length || 0) - (a.messages?.length || 0));

  const mainChat = chats[0];
  const duplicates = chats.slice(1);

  // Use a Set to ensure unique Message IDs
  // We map to string for uniqueness, then Mongoose will cast back to ObjectId on save
  const mainMsgs = mainChat.messages || [];
  const uniqueMessageIds = new Set(mainMsgs.map(m => m.toString()));

  for (const dup of duplicates) {
    if (dup.messages && Array.isArray(dup.messages)) {
        dup.messages.forEach(m => uniqueMessageIds.add(m.toString()));
    }
    
    // Delete the duplicate chat
    await Chat.findByIdAndDelete(dup._id);
    console.warn(`🗑️ Deleted duplicate chat: ${dup._id}`);
  }

  // Assign merged unique messages back to main chat
  mainChat.messages = Array.from(uniqueMessageIds);

  await mainChat.save();
  console.log(`✅ Merged all into: ${mainChat._id}. Total unique msgs: ${mainChat.messages.length}`);
  return mainChat;
};

/* -------------------------------- SEND MESSAGE -------------------------------- */
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user?.id || req.body.senderId; 
    const { receiverId, content } = req.body;

    if (!receiverId || !content?.trim()) {
      return res.status(400).json({ message: "Invalid message data" });
    }

    console.log(`📝 [REST] Saving message ${senderId} -> ${receiverId}`);

    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: content.trim(),
    });

    // Use Helper
    let chat = await getUniqueChat(senderId, receiverId);

    if (!chat) {
      chat = await Chat.create({
        participants: [senderId, receiverId],
        messages: [],
      });
      console.log(`🆕 [sendMessage] Created NEW chat: ${chat._id}`);
    } else {
      console.log(`📂 [sendMessage] Found existing chat: ${chat._id}`);
    }

    chat.messages.push(newMessage._id);
    chat.updatedAt = new Date();
    await chat.save();
    console.log(`✅ [sendMessage] Saved to chat ${chat._id}. Total msgs: ${chat.messages.length}`);

    const populatedMessage = {
       _id: newMessage._id,
       senderId,
       receiverId,
       content: newMessage.content,
       createdAt: newMessage.createdAt
    };

    if (req.io) {
        req.io.to(receiverId).emit('receiveMessage', populatedMessage);
        console.log(`📡 [REST] Emitted to ${receiverId}`);
    }

    res.status(201).json({
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (err) {
    console.error("❌ sendMessage Error:", err);
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

/* -------------------------------- GET MESSAGES -------------------------------- */
export const getMessages = async (req, res) => {
    // ... existing implementation or updated if needed
    // Assuming getMessages uses ID, so it's fine.
    try {
        const { chatId } = req.params;
        const chat = await Chat.findById(chatId).populate({
          path: "messages",
          populate: { path: "sender receiver", select: "username avatar" },
          options: { sort: { createdAt: 1 } },
        });
    
        if (!chat) return res.status(404).json({ message: "Chat not found" });
    
        res.status(200).json({ message: "Messages fetched", data: chat.messages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* -------------------------------- GET USER CHATS -------------------------------- */
/* -------------------------------- GET USER CHATS -------------------------------- */
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.userId;

    const chats = await Chat.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select: "username avatar",
      })
      .populate({
        path: "messages",
        options: { sort: { createdAt: -1 }, limit: 1 },
        populate: {
          path: "sender receiver",
          select: "username avatar",
        },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      message: "Chats fetched successfully",
      data: chats,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

/* -------------------------- GET OR CREATE CHAT -------------------------- */
export const getOrCreateChat = async (req, res) => {
  try {
    const userId1 = req.user?.id || req.body.userId1;
    const { userId2 } = req.body;

    if (!userId2) return res.status(400).json({ message: "User ID missing" });

    console.log(`🔍 getOrCreateChat called for ${userId1} and ${userId2}`);

    // Use Helper
    let chat = await getUniqueChat(userId1, userId2);

    if (!chat) {
      console.log(`⚠️ Chat not found in controller. Creating new...`);
      chat = await Chat.create({
        participants: [userId1, userId2],
        messages: [],
      });
      console.log(`🆕 [getOrCreateChat] Created NEW chat: ${chat._id}`);
    } else {
        console.log(`📂 [getOrCreateChat] Found existing chat: ${chat._id}`);
    }

    // Populate for return
    chat = await Chat.findById(chat._id)
    .populate({
        path: "participants",
        select: "username avatar",
    })
    .populate({
        path: "messages",
        options: { sort: { createdAt: 1 } },
        populate: {
        path: "sender receiver",
        select: "username avatar",
        },
    });

    console.log(`📊 [getOrCreateChat] Messages count: ${chat.messages?.length || 0}`);

    res.status(200).json({
      message: "Chat fetched successfully",
      data: chat,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

/* -------------------------------- GET USERS -------------------------------- */
export const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    const users = await User.find(
      { _id: { $ne: currentUserId } },
      { username: 1, avatar: 1 }
    );

    res.status(200).json({
      message: "Users fetched successfully",
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
