const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const socketHandler = require('./socketHandler');

const app = express();
const server = http.createServer(app);

app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:8080',
        methods: ['GET', 'POST']
    }
});

socketHandler(io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Visha signaling server running on port ${PORT}`);
});
