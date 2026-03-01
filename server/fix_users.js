require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const result = await mongoose.connection.db.collection('users').updateMany(
        { role: { $exists: false } },
        { $set: { role: 'user', status: 'active' } }
    );
    console.log('Updated', result.modifiedCount, 'legacy users');

    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    users.forEach(u => console.log(`  ${u.name} — role: ${u.role}, status: ${u.status}`));
    process.exit(0);
});
