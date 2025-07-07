const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const webpush = require('web-push');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email or username' });
    }
    
    const user = new User({ username, email, password });
    await user.save();
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: user._id, username, email, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



// Regular user login (also checks admin credentials)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if it's admin login from env variables first
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@neuroblog.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = {
        id: 'admin',
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        role: 'admin'
      };
      const token = jwt.sign({ userId: 'admin', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, user: adminUser });
    }
    
    // Regular user login
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, username: user.username, email, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin login (separate endpoint)
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Admin login attempt:', { email, password });
    console.log('Expected admin credentials:', {
      adminEmail: process.env.ADMIN_EMAIL,
      adminPassword: process.env.ADMIN_PASSWORD,
      adminUsername: process.env.ADMIN_USERNAME
    });
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check admin credentials (temporary hard-coded for testing)
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@neuroblog.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log('Admin credentials match! Logging in...');
      const adminUser = {
        id: 'admin',
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        role: 'admin'
      };
      const token = jwt.sign({ userId: 'admin', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, user: adminUser });
    }
    
    console.log('Admin credentials do not match');
    return res.status(401).json({ error: 'Invalid admin credentials' });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Handle admin user
    if (req.user.userId === 'admin') {
      const adminUser = {
        id: 'admin',
        username: process.env.ADMIN_USERNAME || 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@neuroblog.com',
        role: 'admin',
        followersCount: 0,
        followingCount: 0
      };
      return res.json(adminUser);
    }
    
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('followers', 'username')
      .populate('following', 'username');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const userWithStats = {
      ...user.toObject(),
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0
    };
    
    res.json(userWithStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.subscriptions = user.subscriptions || [];
    if (!user.subscriptions.some(sub => sub.endpoint === subscription.endpoint)) {
      user.subscriptions.push(subscription);
      await user.save();
      
      try {
        const payload = JSON.stringify({
          title: 'Welcome to NeuroBlog!',
          body: 'You have successfully subscribed to notifications.',
        });
        await webpush.sendNotification(subscription, payload);
      } catch (pushError) {
        console.error('Push notification failed:', pushError);
      }
      
      res.json({ message: 'Subscribed to notifications' });
    } else {
      res.json({ message: 'Already subscribed' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Check if username/email already taken by another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }
    
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already taken' });
      }
    }
    
    user.username = username || user.username;
    user.email = email || user.email;
    await user.save();
    
    res.json({ user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Follow/Unfollow user
router.post('/follow/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    
    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }
    
    // Handle anonymous or non-existent users
    let userToFollow = null;
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      userToFollow = await User.findById(userId);
    }
    
    const isFollowing = currentUser.following.includes(userId);
    
    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
      if (userToFollow) {
        userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== currentUserId);
        await userToFollow.save();
      }
      await currentUser.save();
      res.json({ message: 'Unfollowed successfully', isFollowing: false });
    } else {
      // Follow
      currentUser.following.push(userId);
      if (userToFollow) {
        userToFollow.followers.push(currentUserId);
        await userToFollow.save();
      }
      await currentUser.save();
      res.json({ message: 'Followed successfully', isFollowing: true });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user profile with follow stats
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if ID is valid MongoDB ObjectId
    if (!userId || userId === 'anonymous' || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('followers', 'username')
      .populate('following', 'username');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      ...user.toObject(),
      followersCount: user.followers.length,
      followingCount: user.following.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get followers list
router.get('/followers/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'username email')
      .select('followers');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.followers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get following list
router.get('/following/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', 'username email')
      .select('following');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.following);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;