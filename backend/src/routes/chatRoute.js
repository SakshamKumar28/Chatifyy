import express from 'express';
import { getUserChats, getOrCreateChat} from '../controllers/chatController.js';

const router = express.Router();
router.get('/:userId', getUserChats);
router.post('/', getOrCreateChat);
export default router;