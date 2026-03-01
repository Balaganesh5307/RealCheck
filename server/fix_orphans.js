require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    // Find Balaganesh's userId
    const user = await mongoose.connection.db.collection('users').findOne({ name: 'Balaganesh' });
    if (!user) { console.log('User not found'); process.exit(1); }

    // Link all orphan results to Balaganesh
    const result = await mongoose.connection.db.collection('results').updateMany(
        { userId: null },
        { $set: { userId: user._id } }
    );
    console.log(`Linked ${result.modifiedCount} orphan results to ${user.name} (${user._id})`);
    process.exit(0);
});
