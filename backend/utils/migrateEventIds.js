require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Attack = require('../models/Attack');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Delete test records
        const deleted = await Attack.deleteMany({ srcIP: '1.2.3.4' });
        console.log(`Deleted ${deleted.deletedCount} test records with IP 1.2.3.4`);

        // 2. Find all records and sort them by timestamp (oldest first)
        const attacks = await Attack.find().sort('timestamp');
        console.log(`Found ${attacks.length} total records to check/migrate`);

        let count = 0;
        for (let i = 0; i < attacks.length; i++) {
            const attack = attacks[i];
            const newEventId = i + 1;

            // Always set the eventId to ensure a clean sequence from 1 to N
            attack.eventId = newEventId;
            await attack.save();
            count++;
        }

        console.log(`Success! Updated ${count} records with sequential IDs (0001 to ${String(count).padStart(4, '0')})`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
};

migrate();
