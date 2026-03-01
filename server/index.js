const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const uploadRoute = require('./routes/upload');
const historyRoute = require('./routes/history');
const adminRoute = require('./routes/admin');
const authRoute = require('./routes/auth');
const dashboardRoute = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/upload', uploadRoute);
app.use('/api/history', historyRoute);
app.use('/api/admin', adminRoute);
app.use('/api/auth', authRoute);
app.use('/api/dashboard', dashboardRoute);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'RealCheck API is running' });
});

const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
