require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Attack = require('../models/Attack');

const sync = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Find all records sorted by timestamp
        const attacks = await Attack.find().sort('timestamp');
        console.log(`Checking ${attacks.length} alerts...`);

        let updatedCount = 0;
        for (let i = 0; i < attacks.length; i++) {
            const attack = attacks[i];
            const targetId = i + 1;

            // If eventId is missing or wrong, update it
            if (attack.eventId !== targetId) {
                attack.eventId = targetId;
                await attack.save();
                updatedCount++;
            }
        }

        console.log(`Success! Synced ${updatedCount} records. Sequence now goes from 0001 to ${String(attacks.length).padStart(4, '0')}.`);
        process.exit(0);
    } catch (err) {
        console.error('Sync failed:', err.message);
        process.exit(1);
    }
};

sync();
