// server.js - Node.js server using Express and Socket.io
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require("cors");
const path = require('path');

const app = express();
const server = http.createServer(app);

// ✅ Correctly apply CORS middleware
app.use(cors({
  origin: "https://dapper-croquembouche-947cbd.netlify.app", // ❌ Removed trailing slash
  methods: ["GET", "POST"]
}));

// ✅ Apply CORS to Socket.io as well
const io = socketIo(server, {
  cors: {
    origin: "https://dapper-croquembouche-947cbd.netlify.app", // ❌ Removed trailing slash
    methods: ["GET", "POST"]
  }
});

// ✅ Serve static files AFTER defining Express
app.use(express.static(path.join(__dirname, 'public')));

// Store active users and their pixels
const users = {};

// Socket.io connection handling

//1st version (working)
// io.on('connection', (socket) => {
//   console.log('New user connected:', socket.id);

//   // Assign random position and color to new user
//   const color = getRandomColor();
//   users[socket.id] = {
//     id: socket.id,
//     x: Math.floor((Math.random() * 76) + 2) * 5,  // Ensures multiples of 5
//     y: Math.floor((Math.random() * 76) + 2) * 5,  // Ensures multiples of 5
//     color: color
//   };

//   // Send the new user their ID and current state of all users
//   socket.emit('initialize', {
//     yourId: socket.id,
//     yourColor: color,
//     allUsers: users
//   });

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);
  
    // Assign a random position in the grid and a default color
    const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFFFFF", "#FFA500"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    users[socket.id] = {
        id: socket.id,
        x: Math.floor(Math.random() * 76) * 5,
        y: Math.floor(Math.random() * 76) * 5,
        color: randomColor
    };

    // Send initial data to the user
    socket.emit('initialize', {
        yourId: socket.id,
        yourColor: randomColor,
        allUsers: users
    });

    // Notify others
    socket.broadcast.emit('userJoined', users[socket.id]);

    // Handle movement updates
    socket.on('move', (direction) => {
        const user = users[socket.id];
        if (!user) return;
        
        switch(direction) {
            case 'up': if (user.y > 0) user.y -= 5; break;
            case 'down': if (user.y < 395) user.y += 5; break;
            case 'left': if (user.x > 0) user.x -= 5; break;
            case 'right': if (user.x < 395) user.x += 5; break;
        }

        io.emit('updatePosition', { id: socket.id, x: user.x, y: user.y });
    });

    // Handle color change
    socket.on('changeColor', () => {
        const user = users[socket.id];
        if (!user) return;

        const currentIndex = colors.indexOf(user.color);
        const newIndex = (currentIndex + 1) % colors.length;
        user.color = colors[newIndex];

        io.emit('updateColor', { id: socket.id, color: user.color });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        io.emit('userLeft', socket.id);
        delete users[socket.id];
    });
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
    if (user.y > 0) user.y -= 5; // Move by 5 pixels
    break;
  case 'down':
    if (user.y < 395) user.y += 5; // Stay within canvas limits
    break;
  case 'left':
    if (user.x > 0) user.x -= 5;
    break;
  case 'right':
    if (user.x < 395) user.x += 5;
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
    if (users[socket.id]) {
      io.emit('userLeft', socket.id);
      delete users[socket.id];
    }
  });
});

// Utility function to generate random color
function getRandomColor() {
  const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF3333', '#33FFEC', '#ECFF33', '#FF33A1', '#33FFA1', '#A133FF'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
