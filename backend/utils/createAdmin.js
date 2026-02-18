require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        const adminEmail = 'abc@gmail.com';
        const adminPassword = 'Password@1234';
        const adminUsername = 'admin_abc';

        // Check if user already exists
        const existingUser = await User.findOne({ email: adminEmail });
        if (existingUser) {
            console.log(`User with email ${adminEmail} already exists.`);
            process.exit(0);
        }

        // Create new admin user
        const user = new User({
            username: adminUsername,
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            accessLevel: 'senior'
        });

        await user.save();
        console.log(`Admin user created successfully!`);
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);

        process.exit(0);
    } catch (err) {
        console.error('Error creating admin user:', err.message);
        process.exit(1);
    }
};

createAdmin();
