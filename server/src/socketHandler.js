const { randomUUID } = require('crypto');
const { PresenceManager, STATUS } = require('./presence');
const { connectedUsers, waitingQueue } = require('./store');
const gameEngine = require('./gameEngine');

module.exports = (io) => {
    const presence = new PresenceManager(io);

    const findMatch = () => {
        if (waitingQueue.size < 2) return;

        const queueArray = Array.from(waitingQueue);
        const user1Id = queueArray[0];
        const user1 = connectedUsers.get(user1Id);

        let user2Id = null;

        for (let i = 1; i < queueArray.length; i++) {
            const potentialId = queueArray[i];
            const potentialUser = connectedUsers.get(potentialId);

            if (potentialUser && potentialUser.sessionId !== user1.sessionId) {
                user2Id = potentialId;
                break;
            }
        }

        if (user2Id) {
            const user2 = connectedUsers.get(user2Id);

            waitingQueue.delete(user1Id);
            waitingQueue.delete(user2Id);

            const roomId = randomUUID();

            const socket1 = io.sockets.sockets.get(user1Id);
            const socket2 = io.sockets.sockets.get(user2Id);

            if (socket1 && socket2) {
                socket1.join(roomId);
                socket2.join(roomId);

                presence.updateUserStatus(socket1, STATUS.IN_CALL, { roomId });
                presence.updateUserStatus(socket2, STATUS.IN_CALL, { roomId });

                setTimeout(() => {
                    io.to(user1Id).emit('matchFound', {
                        roomId,
                        peerInfo: { socketId: user2.socketId, deviceInfo: user2.deviceInfo },
                        isInitiator: true
                    });
                    io.to(user2Id).emit('matchFound', {
                        roomId,
                        peerInfo: { socketId: user1.socketId, deviceInfo: user1.deviceInfo },
                        isInitiator: false
                    });
                }, 100);

                console.log(`Match found: ${roomId}`);
            } else {
                if (socket1) waitingQueue.add(user1Id);
                if (socket2) waitingQueue.add(user2Id);

                if (waitingQueue.size >= 2) findMatch();
            }
        }
    };

    io.on('connection', (socket) => {
        const { sessionId, deviceInfo } = socket.handshake.auth;

        if (!sessionId) {
            console.log(`[${socket.id}] Connection rejected: No session ID provided.`);
            return socket.disconnect();
        }

        const user = {
            socketId: socket.id,
            sessionId,
            deviceInfo: deviceInfo || 'Unknown Device',
            status: STATUS.ONLINE,
            roomId: null,
            connectedAt: new Date()
        };

        connectedUsers.set(socket.id, user);

        console.log(`User connected: ${sessionId}`);
        console.log(`Total connected users: ${connectedUsers.size}`);

        io.emit('onlineUsersCount', connectedUsers.size);

        socket.broadcast.emit('userStatusUpdate', { socketId: socket.id, status: user.status });

        socket.on('getInitialPresence', () => {
            presence.sendInitialPresence(socket);
        });

        // Matchmaking
        socket.on('joinCall', () => {
            presence.updateUserStatus(socket, STATUS.SEARCHING);
            waitingQueue.add(socket.id);
            findMatch();
        });

        socket.on('leaveQueue', () => {
            waitingQueue.delete(socket.id);
            presence.updateUserStatus(socket, STATUS.ONLINE);
        });

        socket.on('endCall', ({ roomId }) => {
            // Clean up any active game
            gameEngine.endGame(roomId);

            const roomSockets = io.sockets.adapter.rooms.get(roomId);
            if (roomSockets) {
                io.to(roomId).emit('callEnded');
                roomSockets.forEach(socketId => {
                    const peerSocket = io.sockets.sockets.get(socketId);
                    if (peerSocket) {
                        presence.updateUserStatus(peerSocket, STATUS.ONLINE);
                        peerSocket.leave(roomId);
                    }
                });
            }
        });

        // WebRTC Signaling
        socket.on('offer', ({ roomId, sdp }) => {
            socket.to(roomId).emit('receiveOffer', { sdp, senderId: socket.id });
        });

        socket.on('answer', ({ roomId, sdp }) => {
            socket.to(roomId).emit('receiveAnswer', { sdp, senderId: socket.id });
        });

        socket.on('ice-candidate', ({ roomId, candidate }) => {
            socket.to(roomId).emit('iceCandidate', { candidate, senderId: socket.id });
        });

        // Chat Messages
        socket.on('chatMessage', ({ roomId, text }) => {
            socket.to(roomId).emit('chatMessage', { senderId: socket.id, text });
        });

        // ── Game Invite Events ────────────────────────────────────

        // User A invites User B to play a game
        socket.on('game:invite', ({ roomId, gameId, gameName }) => {
            console.log(`[Game] 📩 Invite: ${socket.id} → room ${roomId} (${gameName})`);
            const roomSockets = io.sockets.adapter.rooms.get(roomId);
            console.log(`[Game]    Room members: ${roomSockets ? Array.from(roomSockets).join(', ') : 'NONE'}`);
            socket.to(roomId).emit('game:invite', {
                gameId,
                gameName,
                fromSocketId: socket.id,
            });
        });

        // User B responds to the invite (accepted or declined)
        socket.on('game:invite-response', ({ roomId, gameId, accepted }) => {
            console.log(`[Game] 📨 Response: ${socket.id} → room ${roomId} (accepted: ${accepted})`);
            socket.to(roomId).emit('game:invite-response', {
                gameId,
                accepted,
                fromSocketId: socket.id,
            });
        });

        // ── Game Events ────────────────────────────────────────

        socket.on('game:start', ({ roomId, gameId }) => {
            // Get both players in the room
            const roomSockets = io.sockets.adapter.rooms.get(roomId);
            if (!roomSockets || roomSockets.size < 2) {
                socket.emit('game:error', { message: 'Need two players to start a game' });
                return;
            }

            const players = Array.from(roomSockets);
            const session = gameEngine.createGame(gameId, roomId, players[0], players[1]);
            if (!session) {
                socket.emit('game:error', { message: `Unknown game: ${gameId}` });
                return;
            }

            // Tell each player their role
            if (gameId === 'tic-tac-toe') {
                io.to(players[0]).emit('game:started', {
                    gameId, state: session, yourSymbol: 'X', currentTurn: session.currentTurn
                });
                io.to(players[1]).emit('game:started', {
                    gameId, state: session, yourSymbol: 'O', currentTurn: session.currentTurn
                });
            } else if (gameId === 'connect-four') {
                io.to(players[0]).emit('game:started', {
                    gameId, state: session, yourColor: 'red', currentTurn: session.currentTurn
                });
                io.to(players[1]).emit('game:started', {
                    gameId, state: session, yourColor: 'yellow', currentTurn: session.currentTurn
                });
            } else if (gameId === 'rock-paper-scissors') {
                io.to(players[0]).emit('game:started', { gameId, state: { status: 'choosing' }, playerId: players[0] });
                io.to(players[1]).emit('game:started', { gameId, state: { status: 'choosing' }, playerId: players[1] });
            } else if (gameId === 'chess') {
                io.to(players[0]).emit('game:started', {
                    gameId, state: session, yourColor: 'w', currentTurn: 'w'
                });
                io.to(players[1]).emit('game:started', {
                    gameId, state: session, yourColor: 'b', currentTurn: 'w'
                });
            }

            console.log(`Game started: ${gameId} in room ${roomId}`);
        });

        socket.on('game:move', ({ roomId, move }) => {
            const result = gameEngine.makeMove(roomId, socket.id, move);

            if (result.error) {
                socket.emit('game:error', { message: result.error });
                return;
            }

            const session = result.state;

            // For RPS, only reveal when both have chosen
            if (session.gameId === 'rock-paper-scissors') {
                if (session.status === 'choosing') {
                    // Tell THIS player their choice was locked in
                    socket.emit('game:choiceLocked', { locked: true });
                } else if (session.status === 'reveal') {
                    // Reveal to both players
                    io.to(roomId).emit('game:state', {
                        choices: session.choices,
                        result: session.result,
                        winner: session.winner,
                        status: 'reveal'
                    });
                }
            } else if (session.gameId === 'chess') {
                // Chess: broadcast FEN and lastMove
                io.to(roomId).emit('game:state', {
                    fen: session.fen,
                    lastMove: session.lastMove,
                    currentTurn: session.currentTurn,
                    status: session.status,
                    winner: session.winner
                });
            } else {
                // Other board games: broadcast new state to the room
                io.to(roomId).emit('game:state', {
                    board: session.board,
                    currentTurn: session.currentTurn,
                    status: session.status,
                    winner: session.winner
                });
            }

            // If game ended, emit game:end
            if (session.status === 'won' || session.status === 'draw' || session.status === 'reveal') {
                io.to(roomId).emit('game:end', {
                    winner: session.winner,
                    status: session.status,
                    result: session.result || null
                });
            }
        });

        socket.on('game:reset', ({ roomId }) => {
            const newSession = gameEngine.resetGame(roomId);
            if (!newSession) {
                socket.emit('game:error', { message: 'No game to reset' });
                return;
            }

            // Re-notify players of their roles for the new round
            if (newSession.gameId === 'tic-tac-toe') {
                const xPlayer = newSession.players.X;
                const oPlayer = newSession.players.O;
                io.to(xPlayer).emit('game:started', {
                    gameId: newSession.gameId, state: newSession, yourSymbol: 'X', currentTurn: newSession.currentTurn
                });
                io.to(oPlayer).emit('game:started', {
                    gameId: newSession.gameId, state: newSession, yourSymbol: 'O', currentTurn: newSession.currentTurn
                });
            } else if (newSession.gameId === 'connect-four') {
                const redPlayer = newSession.players.red;
                const yellowPlayer = newSession.players.yellow;
                io.to(redPlayer).emit('game:started', {
                    gameId: newSession.gameId, state: newSession, yourColor: 'red', currentTurn: newSession.currentTurn
                });
                io.to(yellowPlayer).emit('game:started', {
                    gameId: newSession.gameId, state: newSession, yourColor: 'yellow', currentTurn: newSession.currentTurn
                });
            } else if (newSession.gameId === 'rock-paper-scissors') {
                const p1 = newSession.players.player1;
                const p2 = newSession.players.player2;
                io.to(p1).emit('game:started', { gameId: newSession.gameId, state: { status: 'choosing' }, playerId: p1 });
                io.to(p2).emit('game:started', { gameId: newSession.gameId, state: { status: 'choosing' }, playerId: p2 });
            } else if (newSession.gameId === 'chess') {
                const wPlayer = newSession.players.w;
                const bPlayer = newSession.players.b;
                io.to(wPlayer).emit('game:started', {
                    gameId: newSession.gameId, state: newSession, yourColor: 'w', currentTurn: 'w'
                });
                io.to(bPlayer).emit('game:started', {
                    gameId: newSession.gameId, state: newSession, yourColor: 'b', currentTurn: 'w'
                });
            }

            console.log(`Game reset in room ${roomId}`);
        });

        // Disconnect
        socket.on('disconnect', () => {
            waitingQueue.delete(socket.id);
            // Clean up any game sessions this user was in
            for (const [roomId, session] of gameEngine.activeGames) {
                const players = Object.values(session.players || {});
                if (players.includes(socket.id)) {
                    gameEngine.endGame(roomId);
                    socket.to(roomId).emit('game:end', { winner: null, status: 'opponent_disconnected' });
                }
            }
            presence.handleDisconnect(socket);
            console.log(`User disconnected: ${sessionId}`);
            console.log(`Total connected users: ${connectedUsers.size}`);
            io.emit('onlineUsersCount', connectedUsers.size);
        });
    });
};
