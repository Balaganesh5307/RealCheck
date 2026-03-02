const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const userAuth = require('../middleware/auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth — verify token, find/create user, return JWT
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Google credential is required' });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, name, email, picture } = payload;

        // Determine if this email is the designated admin
        const isAdmin = email === process.env.ADMIN_USERNAME;

        // Find existing user or create one
        let user = await User.findOne({ $or: [{ googleId }, { email }] });
        if (!user) {
            // New user — create with a random placeholder password
            const randomPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
            user = new User({
                name,
                email,
                googleId,
                password: randomPassword,
                role: isAdmin ? 'admin' : 'user'
            });
            await user.save();
        } else {
            // Update googleId if not linked yet, and enforce admin role if needed
            let changed = false;
            if (!user.googleId) { user.googleId = googleId; changed = true; }
            if (isAdmin && user.role !== 'admin') { user.role = 'admin'; changed = true; }
            if (changed) await user.save();
        }

        const token = jwt.sign(
            { userId: user._id, name: user.name, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({ error: 'Google authentication failed' });
    }
});




router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const user = new User({ name, email, password });
        await user.save();

        const token = jwt.sign(
            { userId: user._id, name: user.name, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user._id, name: user.name, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

router.get('/me', userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ id: user._id, name: user.name, email: user.email });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

module.exports = router;
