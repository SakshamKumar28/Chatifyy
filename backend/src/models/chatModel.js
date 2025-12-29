import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    isGroup: { type: Boolean, default: false },
    groupName: { type: String, trim: true },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;