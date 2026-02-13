const { connectedUsers } = require('./store');

const STATUS = {
    ONLINE: 'online',
    SEARCHING: 'searching',
    IN_CALL: 'in_call',
};

class PresenceManager {
    constructor(io) {
        this.io = io;
    }

    updateUserStatus(socket, newStatus, details = {}) {
        const user = connectedUsers.get(socket.id);
        if (user) {
            user.status = newStatus;
            user.roomId = details.roomId || user.roomId;

            if (newStatus !== STATUS.IN_CALL) {
                user.roomId = null;
            }

            this.io.emit('userStatusUpdate', {
                socketId: socket.id,
                status: newStatus,
            });
            console.log(`[Presence] User ${user.sessionId} is now ${newStatus}`);
        }
    }

    handleDisconnect(socket) {
        const disconnectedUser = connectedUsers.get(socket.id);
        if (disconnectedUser) {
            if (disconnectedUser.status === STATUS.IN_CALL && disconnectedUser.roomId) {
                socket.to(disconnectedUser.roomId).emit('peerDisconnected');

                const roomSockets = this.io.sockets.adapter.rooms.get(disconnectedUser.roomId);
                if (roomSockets) {
                    const peerSocketId = Array.from(roomSockets).find(id => id !== socket.id);
                    if (peerSocketId) {
                        const peerSocket = this.io.sockets.sockets.get(peerSocketId);
                        if (peerSocket) this.updateUserStatus(peerSocket, STATUS.ONLINE);
                    }
                }
            }

            connectedUsers.delete(socket.id);
            this.io.emit('userDisconnected', socket.id);
        }
    }

    sendInitialPresence(socket) {
        const usersForClient = {};
        for (const [socketId, user] of connectedUsers.entries()) {
            usersForClient[socketId] = { status: user.status };
        }
        socket.emit('currentUsers', usersForClient);
    }
}

module.exports = { PresenceManager, STATUS };
