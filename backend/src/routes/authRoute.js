import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { register, login, logout, getProfile } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.get('/profile', authMiddleware, getProfile);

export default router;