import User from "../models/userModel.js";

/* ---------------- SEARCH USERS (For adding friends) ---------------- */
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.id;

    if (!query) return res.status(400).json({ message: "Query required" });

    // Find users matching query, exclude self
    const users = await User.find({
      username: { $regex: query, $options: "i" },
      _id: { $ne: currentUserId },
    }).select("username avatar");

    res.status(200).json({ data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- SEND FRIEND REQUEST ---------------- */
export const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body; // Target user ID
    const currentUserId = req.user.id;

    if (userId === currentUserId)
      return res.status(400).json({ message: "Cannot add yourself" });

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // Check if already friends
    if (targetUser.friends.includes(currentUserId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if request already sent
    const existingRequest = targetUser.friendRequests.find(
      (r) => r.from.toString() === currentUserId && r.status === "pending"
    );

    if (existingRequest) {
      return res.status(400).json({ message: "Request already sent" });
    }

    // Add request
    targetUser.friendRequests.push({ from: currentUserId });
    await targetUser.save();

    // Emit socket event to the target user
    const io = req.io;
    const senderData = {
        _id: req.user.id, // ID is needed!
        username: req.user.username,
        avatar: req.user.avatar
    };

    io.to(userId).emit('newFriendRequest', {
        _id: targetUser.friendRequests[targetUser.friendRequests.length - 1]._id,
        from: senderData,
        status: 'pending'
    });

    res.status(200).json({ message: "Friend request sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- ACCEPT FRIEND REQUEST ---------------- */
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const currentUserId = req.user.id;

    const user = await User.findById(currentUserId);
    const request = user.friendRequests.id(requestId);

    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.status !== "pending")
        return res.status(400).json({ message: "Request already handled" });

    const senderId = request.from;
    const sender = await User.findById(senderId);

    if (!sender) return res.status(404).json({ message: "Sender not found" });

    // Add to both friends lists (avoiding duplicates)
    if(!user.friends.includes(senderId)) user.friends.push(senderId);
    if(!sender.friends.includes(currentUserId)) sender.friends.push(currentUserId);

    // Update request status
    request.status = "accepted";
    
    // Remove the request from the list (cleanup)
    user.friendRequests = user.friendRequests.filter(r => r._id.toString() !== requestId);

    await user.save();
    await sender.save();

    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- GET FRIENDS ---------------- */
export const getFriends = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const user = await User.findById(currentUserId).populate(
      "friends",
      "username avatar"
    );

    // Deduplicate friends list (in case DB has duplicates)
    const uniqueFriends = user.friends.filter((friend, index, self) => 
        index === self.findIndex((f) => f._id.toString() === friend._id.toString())
    );

    res.status(200).json({ data: uniqueFriends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- GET FRIEND REQUESTS ---------------- */
export const getFriendRequests = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const user = await User.findById(currentUserId).populate(
      "friendRequests.from",
      "username avatar"
    );

    // Filter only pending
    const requests = user.friendRequests.filter(r => r.status === "pending");

    res.status(200).json({ data: requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- REMOVE FRIEND ---------------- */
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    const currentUserId = req.user.id;

    if (!friendId) return res.status(400).json({ message: "Friend ID required" });

    const currentUser = await User.findById(currentUserId);
    const friendUser = await User.findById(friendId);

    if (!friendUser) return res.status(404).json({ message: "User not found" });

    // Remove from both friend lists
    currentUser.friends = currentUser.friends.filter(id => id.toString() !== friendId);
    friendUser.friends = friendUser.friends.filter(id => id.toString() !== currentUserId);

    await currentUser.save();
    await friendUser.save();

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
