require('dotenv').config();
const mongoose = require('mongoose');
const Attack = require('./models/Attack');
const { classifyAttack } = require('./utils/mlMock');

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const srcIP = '1.2.3.4';
        const dstIP = '5.6.7.8';
        const newAttackData = classifyAttack({ srcIP, dstIP });

        const lastAttack = await Attack.findOne().sort('-eventId');
        const nextEventId = (lastAttack && lastAttack.eventId) ? lastAttack.eventId + 1 : 1;

        console.log(`Calculated nextEventId: ${nextEventId}`);

        const attack = new Attack({ ...newAttackData, eventId: nextEventId });
        await attack.save();
        console.log(`Saved attack with eventId: ${attack.eventId}`);

        process.exit(0);
    } catch (err) {
        console.error('Error during verification:', err);
        process.exit(1);
    }
};

verify();
