require('dotenv').config();
const mongoose = require('mongoose');
const Attack = require('./models/Attack');

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        const attacks = await Attack.find().sort('-timestamp').limit(10);
        console.log('Latest 10 alerts:');
        attacks.forEach(a => {
            console.log(`ID: ${a._id}, EventID: ${a.eventId}, IP: ${a.srcIP}, Time: ${a.timestamp}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debug();
