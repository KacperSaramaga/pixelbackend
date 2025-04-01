// server.js - Node.js server using Express and Socket.io
const cors = require("cors");
app.use(cors({
  origin: "https://67ebe7deaf3550207dd670a1--dapper-croquembouche-947cbd.netlify.app/",
  methods: ["GET", "POST"]
}));

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "https://67ebe7deaf3550207dd670a1--dapper-croquembouche-947cbd.netlify.app/", // Replace with your actual Netlify URL
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store active users and their pixels
const users = {};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);
  
  // Assign random position and color to new user
  const color = getRandomColor();
  users[socket.id] = {
    id: socket.id,
    x: Math.floor(Math.random() * 380) + 10,
    y: Math.floor(Math.random() * 380) + 10,
    color: color
  };
  
  // Send the new user their ID and current state of all users
  socket.emit('initialize', {
    yourId: socket.id,
    yourColor: color,
    allUsers: users
  });
  
  // Broadcast new user to all other users
  socket.broadcast.emit('userJoined', users[socket.id]);
  
  // Handle movement updates
  socket.on('move', (direction) => {
    const user = users[socket.id];
    if (!user) return;
    
    // Update position based on direction
    switch(direction) {
      case 'up':
        if (user.y > 0) user.y--;
        break;
      case 'down':
        if (user.y < 399) user.y++;
        break;
      case 'left':
        if (user.x > 0) user.x--;
        break;
      case 'right':
        if (user.x < 399) user.x++;
        break;
    }
    
    // Broadcast updated position to all users
    io.emit('updatePosition', {
      id: socket.id,
      x: user.x,
      y: user.y
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove user from users object
    if (users[socket.id]) {
      // Notify all clients that a user has left
      io.emit('userLeft', socket.id);
      delete users[socket.id];
    }
  });
});

// Utility function to generate random color
function getRandomColor() {
  const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF3333',
    '#33FFEC', '#ECFF33', '#FF33A1', '#33FFA1', '#A133FF'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
