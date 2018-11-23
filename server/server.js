const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const publicPath = path.join(__dirname, '../public');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const io = socketIO(server);

app.use(express.static(publicPath));

io.on('connection', (socket) => {
  console.log('New user connected.');
});

app.get('/score/:player/:val', (req, res) => {
  const { player, val } = req.params;
  console.log(player, val);
  
  io.emit('score', { player, val });
  res.status(200).end();
});

app.get('/reset-streak', (req, res) => {
  io.emit('resetStreak');
  res.status(200).end();
});

app.get('/restart', (req, res) => {
  io.emit('restart');
  res.status(200).end();
});

server.listen(port, () => console.log(`Server listening on port ${port}`));
