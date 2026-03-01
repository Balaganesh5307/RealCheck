require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const results = await mongoose.connection.db.collection('results').find({}).project({ userId: 1, prediction: 1 }).toArray();
    console.log('=== RESULTS ===');
    results.forEach(r => console.log('  userId:', r.userId, '| prediction:', r.prediction));

    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('\n=== USERS ===');
    users.forEach(u => console.log('  _id:', u._id.toString(), '| name:', u.name, '| role:', u.role));

    process.exit(0);
});
