const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Result = require('../models/Result');

router.get('/', async (req, res) => {
    try {
        const results = await Result.find().sort({ createdAt: -1 }).limit(50);
        res.json(results);
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

router.delete('/:id', async (req, res) => {
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
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete record' });
    }
});

router.delete('/', async (req, res) => {
    try {
        const results = await Result.find();
        for (const result of results) {
            const imagePath = path.join(__dirname, '..', result.imagePath);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        await Result.deleteMany({});
        res.json({ message: 'All records deleted successfully' });
    } catch (error) {
        console.error('Delete all error:', error);
        res.status(500).json({ error: 'Failed to delete all records' });
    }
});

module.exports = router;
