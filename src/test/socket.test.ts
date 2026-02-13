import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Socket.io
vi.mock('@/lib/socket', () => {
    const mockSocket = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        connected: true,
        id: 'test-socket-id',
    };
    return {
        getSocket: vi.fn(() => mockSocket),
        initSocket: vi.fn(() => mockSocket),
    };
});

describe('Socket Client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return a socket instance from getSocket', async () => {
        const { getSocket } = await import('@/lib/socket');
        const socket = getSocket();
        expect(socket).toBeDefined();
        expect(socket.id).toBe('test-socket-id');
    });

    it('should emit joinCall event', async () => {
        const { getSocket } = await import('@/lib/socket');
        const socket = getSocket();
        socket.emit('joinCall');
        expect(socket.emit).toHaveBeenCalledWith('joinCall');
    });

    it('should emit chatMessage with roomId and text', async () => {
        const { getSocket } = await import('@/lib/socket');
        const socket = getSocket();
        socket.emit('chatMessage', { roomId: 'room-123', text: 'Hello!' });
        expect(socket.emit).toHaveBeenCalledWith('chatMessage', {
            roomId: 'room-123',
            text: 'Hello!',
        });
    });

    it('should emit endCall with roomId', async () => {
        const { getSocket } = await import('@/lib/socket');
        const socket = getSocket();
        socket.emit('endCall', { roomId: 'room-123' });
        expect(socket.emit).toHaveBeenCalledWith('endCall', { roomId: 'room-123' });
    });

    it('should register and clean up event listeners', async () => {
        const { getSocket } = await import('@/lib/socket');
        const socket = getSocket();
        const handler = vi.fn();

        socket.on('matchFound', handler);
        expect(socket.on).toHaveBeenCalledWith('matchFound', handler);

        socket.off('matchFound', handler);
        expect(socket.off).toHaveBeenCalledWith('matchFound', handler);
    });
});
