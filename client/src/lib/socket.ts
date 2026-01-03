import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
    socket = io(apiUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10
    });

    socket.on("connect", () => {
      console.log("Socket.IO connected:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO disconnected");
    });

    socket.on("error", (error: { message: string }) => {
      console.error("Socket.IO error:", error);
    });
  }

  return socket;
}

export function joinGameRoom(gameId: string, playerId: string, playerName: string) {
  const socket = getSocket();
  socket.emit("join-game", { gameId, playerId, playerName });
}

export function leaveGameRoom(gameId: string, playerId: string, playerName: string) {
  const socket = getSocket();
  socket.emit("leave-game", { gameId, playerId, playerName });
}

export function onEvent(eventName: string, callback: (...args: any[]) => void) {
  const socket = getSocket();
  socket.on(eventName, callback);
}

export function offEvent(eventName: string, callback?: (...args: any[]) => void) {
  const socket = getSocket();
  if (callback) {
    socket.off(eventName, callback);
  } else {
    socket.off(eventName);
  }
}

export function emitEvent(eventName: string, data: any) {
  const socket = getSocket();
  socket.emit(eventName, data);
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
