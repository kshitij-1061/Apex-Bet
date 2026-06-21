import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
// Route imports
import authRoutes from './routes/auth.js';
import betRoutes from './routes/bets.js';
import walletRoutes from './routes/wallet.js';
// Services
import { startSimulator } from './services/matchSimulator.js';
import Match from './models/Match.js';
dotenv.config();
const app = express();
const server = http.createServer(app);
// Enable CORS
app.use(cors({
  origin: '*', // In development, allow all origins. Can be restricted to React domain.
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/wallet', walletRoutes);
// Simple Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Betting site API is running.' });
});
// Socket.io Server Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
// Store sockets associated with users
io.on('connection', async (socket) => {
  console.log(`Client connected: ${socket.id}`);
  // User authentication via socket room
  socket.on('authenticate', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`Socket ${socket.id} authenticated for user: ${userId}`);
    }
  });
  // Send initial list of non-finished matches to client immediately
  try {
    const activeMatches = await Match.find({ status: { $ne: 'finished' } }).sort({ status: -1 });
    socket.emit('initial_matches', activeMatches);
  } catch (error) {
    console.error('Error sending initial matches to socket:', error);
  }
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});
// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/live_sports_betting';
mongoose.connect(mongoURI)
  .then(() => {
    console.log('Successfully connected to MongoDB database.');
    
    // Start HTTP Server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Backend Server listening on port ${PORT}`);
      
      // Start real-time match simulation
      startSimulator(io);
    });
  })
  .catch((err) => {
    console.error('MongoDB database connection error:', err);
    process.exit(1);
  });