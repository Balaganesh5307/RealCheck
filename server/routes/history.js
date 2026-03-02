const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Result = require('../models/Result');
const userAuth = require('../middleware/auth');

// GET - fetch only the logged-in user's history
router.get('/', userAuth, async (req, res) => {
    try {
        const results = await Result.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(50);
        res.json(results);
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// DELETE single record - only if it belongs to the logged-in user
router.delete('/:id', userAuth, async (req, res) => {
    try {
        const result = await Result.findOne({ _id: req.params.id, userId: req.user.userId });
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
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete record' });
    }
});

// DELETE all - only delete the logged-in user's records
router.delete('/', userAuth, async (req, res) => {
    try {
        const results = await Result.find({ userId: req.user.userId });
        for (const result of results) {
            const imagePath = path.join(__dirname, '..', result.imagePath);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        await Result.deleteMany({ userId: req.user.userId });
        res.json({ message: 'All records deleted successfully' });
    } catch (error) {
        console.error('Delete all error:', error);
        res.status(500).json({ error: 'Failed to delete all records' });
    }
});

module.exports = router;
