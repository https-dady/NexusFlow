import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
let socket = null;
let currentToken = null;

export function connectSocket(token) {
  if (!token) return null;
  if (socket && currentToken === token && socket.connected) return socket;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  currentToken = token;
  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1200,
    timeout: 12_000,
    withCredentials: true,
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = null;
  currentToken = null;
}

export const subscribeDevice = (deviceId) => socket?.emit('subscribe:device', deviceId);
export const unsubscribeDevice = (deviceId) => socket?.emit('unsubscribe:device', deviceId);
