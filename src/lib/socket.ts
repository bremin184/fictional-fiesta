import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

// Dynamically resolve the signaling server URL.
// If the page is loaded via a LAN IP (e.g. 192.168.45.111:8080),
// the socket connects to the same host on port 3001.
// Respects the page protocol (HTTP/HTTPS).
const getSocketUrl = (): string => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (typeof window === 'undefined') return 'http://localhost:3001';
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  const host = window.location.hostname;
  return `${protocol}://${host}:3001`;
};
const SOCKET_URL = getSocketUrl();

let socket: Socket | null = null;

const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') return '';

  // Use sessionStorage so each tab gets its own identity.
  // This allows two tabs in the same browser to match with each other
  // (the server rejects same-sessionId matching to prevent self-matching).
  let sessionId = sessionStorage.getItem('vchat_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('vchat_session_id', sessionId);
  }
  return sessionId;
};

export const getSocket = (): Socket => {
  if (!socket) {
    const sessionId = getOrCreateSessionId();
    const deviceInfo = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';

    socket = io(SOCKET_URL, {
      auth: {
        sessionId,
        deviceInfo,
      },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Connected to signaling server with ID:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from signaling server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
