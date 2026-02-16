require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const { startAttackGenerator } = require('./utils/attackGenerator');

// Import routes
const authRoutes = require('./routes/auth');
const attackRoutes = require('./routes/attacks');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attacks', attackRoutes);
app.use('/api/admin', adminRoutes);

// Initialize Socket.IO
const io = initSocket(server);

// Start attack simulation
startAttackGenerator(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));