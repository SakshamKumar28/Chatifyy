import Message from "../models/messageModel.js";
import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";

export const sendMessage = async (req, res) => {
    try{
        const { senderId, recieverId, content} = req.body;

        //Create new Message
        const newMessage = new Message({
            sender: senderId,
            reciever: recieverId,
            content
        });
        const savedMessage = await newMessage.save();
        //Find or Create Chat between participants
        let chat = await Chat.findOne({
            participants: { $all: [senderId, recieverId] }
        });
        if(!chat){
            chat = new Chat({
                participants: [senderId, recieverId],
                messages: []
            });
        }
        chat.messages.push(savedMessage._id);
        await chat.save();
        res.status(201).json({ message: "Message sent successfully", data: savedMessage });

    }catch(err){
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

export const getMessages = async (req, res) => {
    try{
        const { chatId } = req.params;
        const chat = await Chat.findById(chatId).populate({
            path: "messages",
            populate: { path: "sender reciever", select: "username avatar" }
        });
        if(!chat){
            return res.status(404).json({ message: "Chat not found" });
        }
        res.status(200).json({ message: "Messages fetched successfully", data: chat.messages });

    }catch(err){
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }   
};

export const getUserChats = async (req, res) => {
    try{
        const { userId } = req.params;
        const chats = await Chat.find({
            participants: userId
        }).populate({
            path: "participants",
            select: "username avatar"
        }).populate({
            path: "messages",
            options: { sort: { createdAt: -1 }, limit: 1 },
            populate: { path: "sender reciever", select: "username avatar" }
        });
        res.status(200).json({ message: "Chats fetched successfully", data: chats });
    }catch(err){
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

export const getOrCreateChat = async (req, res) => {
    try{
        const { userId1, userId2 } = req.body;
        let chat = await Chat.findOne({
            participants: { $all: [userId1, userId2] }
        }).populate({
            path: "participants",
            select: "username avatar"
        }).populate({
            path: "messages",
            options: { sort: { createdAt: -1 }, limit: 1 },
            populate: { path: "sender reciever", select: "username avatar" }
        });
        if(!chat){
            chat = new Chat({
                participants: [userId1, userId2],
                messages: []
            });
            await chat.save();
            chat = await Chat.findById(chat._id).populate({
                path: "participants",
                select: "username avatar"
            }).populate({
                path: "messages",
                options: { sort: { createdAt: -1 }, limit: 1 },
                populate: { path: "sender reciever", select: "username avatar" }
            });
        }
        res.status(200).json({ message: "Chat fetched successfully", data: chat });
    }catch(err){
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};


export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, { username: 1, avatar: 1 });
        res.status(200).json({ message: "Users fetched successfully", data: users });
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};
