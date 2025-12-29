import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { register, login, logout, getProfile, checkUsername } from '../controllers/authController.js';
import { getAllUsers } from '../controllers/chatController.js';

const router = express.Router();

router.post('/register', register);
router.post('/check-username', checkUsername);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.get('/profile', authMiddleware, getProfile);
router.get('/users', authMiddleware, getAllUsers);

export default router;