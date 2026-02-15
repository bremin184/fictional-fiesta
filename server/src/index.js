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
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST']
    }
});

socketHandler(io);

const PORT = process.env.PORT || 3001;

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use.`);
        console.error(`   Kill the existing process: npx kill-port ${PORT}`);
        console.error(`   Or use a different port: PORT=3002 npm run dev:server\n`);
        process.exit(1);
    }
    throw err;
});

// Pre-flight: actively probe the port to catch conflicts that EADDRINUSE misses
// (e.g. VS Code binding 0.0.0.0 while we bind 127.0.0.1)
const checkPortFree = (port) => new Promise((resolve) => {
    const testReq = require('http').request(
        { hostname: 'localhost', port, path: '/health', method: 'HEAD', timeout: 1000 },
        (res) => {
            // If we get ANY response, something else is on this port
            resolve(false);
        }
    );
    testReq.on('error', () => resolve(true)); // Connection refused = port is free
    testReq.on('timeout', () => { testReq.destroy(); resolve(true); });
    testReq.end();
});

checkPortFree(PORT).then((isFree) => {
    if (!isFree) {
        console.error(`\n❌ Port ${PORT} is already occupied by another process.`);
        console.error(`   Kill it: npx kill-port ${PORT}`);
        console.error(`   Or use a different port: PORT=3002 npm run dev:server\n`);
        process.exit(1);
    }

    server.listen(PORT, '0.0.0.0', () => {
        const { networkInterfaces } = require('os');
        const nets = networkInterfaces();
        const lanIPs = Object.values(nets).flat()
            .filter(n => n.family === 'IPv4' && !n.internal)
            .map(n => n.address);
        console.log(`Visha signaling server running on port ${PORT}`);
        console.log(`Local:   http://localhost:${PORT}`);
        if (lanIPs.length > 0) {
            console.log(`Network: ${lanIPs.map(ip => `http://${ip}:${PORT}`).join(', ')}`);
        }
    });
});
