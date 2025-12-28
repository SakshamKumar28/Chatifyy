import express from 'express';
import { getUserChats, getOrCreateChat} from '../controllers/chatController.js';
import protectRoute from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);

router.get('/:userId', getUserChats);
router.post('/', getOrCreateChat);
export default router;