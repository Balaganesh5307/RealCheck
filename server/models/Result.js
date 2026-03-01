const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    imagePath: {
        type: String,
        required: true
    },
    prediction: {
        type: String,
        required: true,
        enum: ['Real', 'AI Generated']
    },
    confidence: {
        type: Number,
        required: true
    },
    explanation: {
        type: mongoose.Schema.Types.Mixed,
        default: ''
    },
    heatmapImage: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Result', resultSchema);
