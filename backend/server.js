require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const { startAttackGenerator } = require('./utils/attackGenerator');

// Import routes
const attackRoutes = require('./routes/attacks');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());

// Routes
app.use('/api/attacks', attackRoutes);

// Initialize Socket.IO
const io = initSocket(server);

// Start attack simulation
startAttackGenerator(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));