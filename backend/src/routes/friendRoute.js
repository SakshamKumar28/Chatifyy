import express from 'express';
import { 
    searchUsers, 
    sendFriendRequest, 
    acceptFriendRequest, 
    getFriends, 
    getFriendRequests,
    removeFriend
} from '../controllers/friendController.js';
import protectRoute from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);

router.get('/search', searchUsers);
router.post('/request', sendFriendRequest);
router.post('/accept', acceptFriendRequest);
router.get('/', getFriends);          // Get my friends
router.get('/requests', getFriendRequests); // Get pending requests
router.post('/remove', removeFriend);       // Remove a friend


export default router;
