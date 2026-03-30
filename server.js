// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.use(express.static('public')); // Serve client files

let rooms = {}; // { roomId: { players: [], currentCardIndex: 0 } }

// WebSocket logic
io.on('connection', socket => {
  console.log('User connected: ' + socket.id);

  socket.on('joinRoom', roomId => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = { players: [], currentCardIndex: 0 };
    rooms[roomId].players.push(socket.id);

    // Notify players
    io.to(roomId).emit('playerUpdate', rooms[roomId].players.length);
    console.log(`Player ${socket.id} joined room ${roomId}`);
  });

  socket.on('nextCard', (roomId, cardData) => {
    // Broadcast card to all in the room
    io.to(roomId).emit('showCard', cardData);
  });

  socket.on('answer', (roomId, data) => {
    // Broadcast answer (optional: anonymize if desired)
    io.to(roomId).emit('playerAnswer', data);
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter(id => id !== socket.id);
      io.to(roomId).emit('playerUpdate', rooms[roomId].players.length);
    }
    console.log('User disconnected: ' + socket.id);
  });
});

http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
