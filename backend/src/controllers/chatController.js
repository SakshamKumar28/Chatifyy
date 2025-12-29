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
    const { receiverId, content, chatId } = req.body;

    if ((!receiverId && !chatId) || !content?.trim()) {
      return res.status(400).json({ message: "Invalid message data" });
    }

    console.log(`📝 [REST] Saving message ${senderId} -> ${receiverId || chatId}`);

    let chat;

    if (chatId) {
        // Group Message or Explicit Chat
         chat = await Chat.findById(chatId);
         if (!chat) return res.status(404).json({ message: "Chat not found" });

         // Verify user is in chat
         if (!chat.participants.includes(senderId)) {
             return res.status(403).json({ message: "User not in this chat" });
         }
    } else {
        // 1-on-1 Legacy
        chat = await getUniqueChat(senderId, receiverId);
        if (!chat) {
            chat = await Chat.create({
                participants: [senderId, receiverId],
                messages: [],
            });
            console.log(`🆕 [sendMessage] Created NEW chat: ${chat._id}`);
        }
    }

    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId || null,
      chat: chat._id,
      content: content.trim(),
    });

    chat.messages.push(newMessage._id);
    
    // Update Unread Counts
    if (!chat.unreadCounts) chat.unreadCounts = new Map();
    
    chat.participants.forEach(p => {
        const pId = p.toString();
        if (pId !== senderId.toString()) {
            const current = chat.unreadCounts.get(pId) || 0;
            chat.unreadCounts.set(pId, current + 1);
        }
    });

    chat.updatedAt = new Date();
    await chat.save();
    console.log(`✅ [sendMessage] Saved to chat ${chat._id}. Total msgs: ${chat.messages.length}`);

    const populatedMessage = await Message.findById(newMessage._id)
        .populate("sender", "username avatar")
        .populate("receiver", "username avatar")
        .populate("chat");

    if (req.io) {
        if(chat.isGroup) {
            // Emit to Room (Chat ID)
            req.io.to(chat._id.toString()).emit('receiveMessage', populatedMessage);
            console.log(`📡 [REST] Emitted to Group Room ${chat._id}`);
        } else {
            // Emitting to receiver for 1-on-1
            const rId = receiverId || chat.participants.find(p => p.toString() !== senderId.toString());
            req.io.to(rId.toString()).emit('receiveMessage', populatedMessage); 
            console.log(`📡 [REST] Emitted to ${rId}`);
        }
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

/* -------------------------------- MARK CHAT READ -------------------------------- */
export const markChatRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await Chat.findById(chatId);
        if(!chat) return res.status(404).json({ message: "Chat not found" });

        if(chat.unreadCounts) {
            chat.unreadCounts.set(userId, 0);
            await chat.save();
        }

        res.status(200).json({ message: "Marked as read" });
    } catch (err) {
         res.status(500).json({ error: err.message });
    }
};

/* -------------------------------- CREATE GROUP CHAT -------------------------------- */
export const createGroupChat = async (req, res) => {
    try {
        const { users, name } = req.body;
        const currentUserId = req.user.id;

        if (!users || !name) {
            return res.status(400).json({ message: "Please fill all fields" });
        }

        // Parse users if sent as string
        let participants = users;
        if(typeof users === 'string') {
             participants = JSON.parse(users);
        }

        if (participants.length < 2) {
             return res.status(400).json({ message: "More than 2 users are required to form a group chat" });
        }

        participants.push(currentUserId);

        const groupChat = await Chat.create({
            groupName: name,
            participants: participants,
            isGroup: true,
            groupAdmin: currentUserId,
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("participants", "-password")
            .populate("groupAdmin", "-password");

        res.status(200).json(fullGroupChat);

    } catch (error) {
        res.status(500).json({ error: error.message });
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
