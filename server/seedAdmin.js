require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin already exists:', existingAdmin.email);
            process.exit(0);
        }

        const admin = new User({
            name: 'Admin',
            email: process.env.ADMIN_USERNAME || 'admin@realcheck.com',
            password: process.env.ADMIN_PASSWORD || 'admin123',
            role: 'admin'
        });
        await admin.save();

        console.log('Admin user created successfully!');
        console.log('Email:', admin.email);
        console.log('Password:', process.env.ADMIN_PASSWORD || 'admin123');
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seedAdmin();
