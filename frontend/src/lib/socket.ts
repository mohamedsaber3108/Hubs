import { io, Socket } from 'socket.io-client';
import { tokenStorage } from './api';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

let chatSocket: Socket | null = null;
let notifSocket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!chatSocket) {
    chatSocket = io(`${WS_URL}/chat`, {
      auth: { token: tokenStorage.get() },
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return chatSocket;
}

export function getNotifSocket(): Socket {
  if (!notifSocket) {
    notifSocket = io(`${WS_URL}/notifications`, {
      auth: { token: tokenStorage.get() },
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return notifSocket;
}

export function connectSockets() {
  getChatSocket().connect();
  getNotifSocket().connect();
}

export function disconnectSockets() {
  chatSocket?.disconnect();
  notifSocket?.disconnect();
  chatSocket = null;
  notifSocket = null;
}
