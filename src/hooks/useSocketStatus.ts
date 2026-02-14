import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';

export type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseSocketStatusResult {
    status: SocketStatus;
    socketId: string | null;
    serverUrl: string;
    reconnect: () => void;
}

/**
 * Reactive socket connection status for UI indicators.
 */
export function useSocketStatus(): UseSocketStatusResult {
    const [status, setStatus] = useState<SocketStatus>('connecting');
    const [socketId, setSocketId] = useState<string | null>(null);

    const socket = getSocket();
    const serverUrl = (socket as any).io?.uri || 'unknown';

    useEffect(() => {
        if (!socket) {
            setStatus('disconnected');
            return;
        }

        // Set initial state
        if (socket.connected) {
            setStatus('connected');
            setSocketId(socket.id || null);
        }

        const onConnect = () => {
            setStatus('connected');
            setSocketId(socket.id || null);
        };

        const onDisconnect = () => {
            setStatus('disconnected');
            setSocketId(null);
        };

        const onConnectError = () => {
            setStatus('error');
            setSocketId(null);
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
        };
    }, [socket]);

    const reconnect = useCallback(() => {
        if (socket && !socket.connected) {
            setStatus('connecting');
            socket.connect();
        }
    }, [socket]);

    return { status, socketId, serverUrl, reconnect };
}
