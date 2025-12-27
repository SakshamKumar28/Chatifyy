import express from 'express';
import { getMessages, getOrCreateChat, sendMessage} from '../controllers/chatController.js';

const router = express.Router();
router.get('/:chatId', getMessages);
router.post('/', sendMessage);
router.post('/getOrCreateChat', getOrCreateChat);

export default router;