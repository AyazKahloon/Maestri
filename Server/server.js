const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { socketAuth } = require('./config/socket');
const handleMessage = require('./socket/messageHandler');

require('./models/Student');
require('./models/Tutor');
require('./models/Subject');
require('./models/Conversation');
require('./models/Message');
require('./models/Review');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3173", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});


// Socket.IO middleware
io.use(socketAuth);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);
  
  // Handle messaging
  handleMessage(io, socket);
});

// Make io accessible to routes
app.set('io', io);

// Middleware
// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3173", "http://localhost:5173"],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Tutoring Platform API with Socket.IO' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
