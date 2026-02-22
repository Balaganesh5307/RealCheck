const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
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
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Result', resultSchema);
