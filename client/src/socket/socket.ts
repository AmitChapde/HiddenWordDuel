import { io, Socket } from "socket.io-client";


const SERVER_URL = import.meta.env.VITE_API_URL;

export const socket: Socket = io(SERVER_URL, {
  autoConnect: false, 
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});