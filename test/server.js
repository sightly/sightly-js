const IOServer = require('socket.io');
const express = require('express');
const app = express();

console.log('Starting the test server...');

// Start Express server
const server = app
// To test if server is running
.get('/test', (req, res) => {

  res.status(200).send('OK');

})
// To kill the process after tests have finished
.post('/kill', (req, res) => {

  console.log('Server was shutdown');

  process.exit();

})
.listen(3000, () => {

  console.log('Test server running on port 3000');

});

// Start Socket IO server
const io = IOServer(server, { path: '/socket' });

io
// Auth
.use((socket, next) => {

  if ( socket.handshake.query.token !== 'test-token' ) next(new Error('Authentication error!'));
  else next();

})
// On connect
.on('connect', socket => {

  // On log received
  socket.on('log', log => {
console.log('Got log at level', log.level)
    socket.emit('log', log);

  });

})
// On errors
.on('error', console.error);
