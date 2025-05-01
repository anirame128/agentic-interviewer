require('dotenv').config();
const http = require('http');
const express = require('express');
const WebSocketService = require('./services/websocket');

const app = express();
const server = http.createServer(app);
new WebSocketService(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
});

