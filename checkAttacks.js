require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');
const Attack = require('./backend/models/Attack');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        const attacks = await Attack.find().sort('-timestamp').limit(5);
        console.log('Last 5 attacks:');
        attacks.forEach(a => {
            console.log(`ID: ${a._id}, EventID: ${a.eventId}, Time: ${a.timestamp}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
