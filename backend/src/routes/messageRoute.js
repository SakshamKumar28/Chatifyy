import express from 'express';
import { getMessages, getOrCreateChat, sendMessage} from '../controllers/chatController.js';
import protectRoute from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);

router.get('/:chatId', getMessages);
router.post('/', sendMessage);
router.post('/getOrCreateChat', getOrCreateChat);

export default router;