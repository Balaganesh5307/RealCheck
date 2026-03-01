const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const Result = require('../models/Result');
const User = require('../models/User');

const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email, role: 'admin' });
        if (!user) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, name: user.name, email: user.email, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { name: user.name, email: user.email } });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
        const total = await Result.countDocuments();
        const realCount = await Result.countDocuments({ prediction: 'Real' });
        const aiCount = await Result.countDocuments({ prediction: 'AI Generated' });

        const avgConfidenceResult = await Result.aggregate([
            { $group: { _id: null, avgConfidence: { $avg: '$confidence' } } }
        ]);
        const avgConfidence = avgConfidenceResult.length > 0
            ? Math.round(avgConfidenceResult[0].avgConfidence * 100) / 100
            : 0;

        const dailyStats = await Result.aggregate([
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        prediction: '$prediction'
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);

        const dailyMap = {};
        dailyStats.forEach(item => {
            const date = item._id.date;
            if (!dailyMap[date]) {
                dailyMap[date] = { date, real: 0, ai: 0, total: 0 };
            }
            if (item._id.prediction === 'Real') {
                dailyMap[date].real = item.count;
            } else {
                dailyMap[date].ai = item.count;
            }
            dailyMap[date].total += item.count;
        });
        const dailyData = Object.values(dailyMap).slice(-30);

        res.json({
            totalUsers,
            total,
            realCount,
            aiCount,
            avgConfidence,
            dailyData
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } })
            .select('-password')
            .sort({ createdAt: -1 });

        const usersWithUploads = await Promise.all(
            users.map(async (user) => {
                const uploadCount = await Result.countDocuments({ userId: user._id });
                return {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    status: user.status,
                    createdAt: user.createdAt,
                    uploadCount
                };
            })
        );

        res.json(usersWithUploads);
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.patch('/users/:id/status', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'suspended'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const user = await User.findOneAndUpdate(
            { _id: req.params.id, role: { $ne: 'admin' } },
            { status },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: `User ${status === 'suspended' ? 'suspended' : 'activated'}`, user });
    } catch (error) {
        console.error('Admin status error:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

router.patch('/users/:id/reset-password', adminAuth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, role: { $ne: 'admin' } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.password = 'realcheck123';
        await user.save();

        res.json({ message: 'Password reset to default (realcheck123)' });
    } catch (error) {
        console.error('Admin reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, role: { $ne: 'admin' } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const results = await Result.find({ userId: user._id });
        for (const result of results) {
            const imagePath = path.join(__dirname, '..', result.imagePath);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        await Result.deleteMany({ userId: user._id });
        await User.findByIdAndDelete(user._id);

        res.json({ message: 'User and all their data deleted' });
    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

router.get('/history', adminAuth, async (req, res) => {
    try {
        const { from, to, userId } = req.query;
        const filter = {};

        if (userId) {
            filter.userId = userId;
        }

        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = toDate;
            }
        }

        const results = await Result.find(filter)
            .select('-heatmapImage')
            .sort({ createdAt: -1 })
            .limit(200)
            .populate('userId', 'name email');

        res.json(results);
    } catch (error) {
        console.error('Admin history error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

router.delete('/history/:id', adminAuth, async (req, res) => {
    try {
        const result = await Result.findById(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Record not found' });
        }

        const imagePath = path.join(__dirname, '..', result.imagePath);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await Result.findByIdAndDelete(req.params.id);
        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Admin delete error:', error);
        res.status(500).json({ error: 'Failed to delete record' });
    }
});

module.exports = router;
