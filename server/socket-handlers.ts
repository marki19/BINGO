import { Server as SocketIOServer, Socket } from "socket.io";
import { storage } from "./storage";
import { log } from "./app";

export function setupSocketHandlers(io: SocketIOServer) {
  io.on("connection", (socket: Socket) => {
    log(`Socket connected: ${socket.id}`, "socket.io");

    // Join game room
    socket.on("join-game", async (data: { gameId: string; playerId: string; playerName: string }) => {
      try {
        const game = await storage.getGame(data.gameId);
        if (!game) {
          socket.emit("error", { message: "Game not found" });
          return;
        }

        // Join the Socket.IO room for this game
        socket.join(data.gameId);
        log(`Player ${data.playerName} joined game ${data.gameId}`, "socket.io");

        // Broadcast to all players in the room
        io.to(data.gameId).emit("player-joined", {
          playerId: data.playerId,
          playerName: data.playerName
        });
      } catch (error) {
        log(`Error in join-game: ${error}`, "socket.io");
        socket.emit("error", { message: "Failed to join game" });
      }
    });

    // Leave game room
    socket.on("leave-game", async (data: { gameId: string; playerId: string; playerName: string }) => {
      socket.leave(data.gameId);
      io.to(data.gameId).emit("player-left", {
        playerId: data.playerId,
        playerName: data.playerName
      });
      log(`Player ${data.playerName} left game ${data.gameId}`, "socket.io");
    });

    // Call number (from host)
    socket.on("call-number", async (data: { gameId: string; number: number }) => {
      try {
        io.to(data.gameId).emit("number-called", {
          number: data.number,
          timestamp: Date.now()
        });
        log(`Number ${data.number} called in game ${data.gameId}`, "socket.io");
      } catch (error) {
        log(`Error in call-number: ${error}`, "socket.io");
      }
    });

    // Bingo claim
    socket.on("bingo-claim", async (data: { gameId: string; playerId: string; cardId: string }) => {
      try {
        log(`Bingo claimed by player ${data.playerId} in game ${data.gameId}`, "socket.io");
        // Server will validate and emit result through REST endpoint
        socket.emit("bingo-validation-pending", { message: "Validating..." });
      } catch (error) {
        log(`Error in bingo-claim: ${error}`, "socket.io");
      }
    });

    // Game state changes
    socket.on("game-state-change", async (data: { gameId: string; status: string }) => {
      io.to(data.gameId).emit("game-status-changed", {
        status: data.status,
        timestamp: Date.now()
      });
      log(`Game ${data.gameId} status changed to ${data.status}`, "socket.io");
    });

    // Chat message
    socket.on("chat-message", async (data: { gameId: string; playerId: string; playerName: string; text: string }) => {
      try {
        io.to(data.gameId).emit("chat-message", {
          playerId: data.playerId,
          playerName: data.playerName,
          text: data.text,
          timestamp: Date.now()
        });
        log(`Chat message from ${data.playerName} in game ${data.gameId}`, "socket.io");
      } catch (error) {
        log(`Error in chat-message: ${error}`, "socket.io");
      }
    });

    // Developer mode commands
    socket.on("dev-command", async (data: { gameId: string; command: string; payload: any }) => {
      try {
        log(`Dev command: ${data.command} in game ${data.gameId}`, "socket.io");
        // Handle developer mode commands
        switch (data.command) {
          case "stage-number":
            io.to(data.gameId).emit("number-staged", { number: data.payload.number });
            break;
          case "card-modified":
            // Emit only to specific player
            io.to(data.gameId).emit("card-modified", { playerId: data.payload.playerId });
            break;
          default:
            break;
        }
      } catch (error) {
        log(`Error in dev-command: ${error}`, "socket.io");
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      log(`Socket disconnected: ${socket.id}`, "socket.io");
    });
  });

  log("Socket.IO handlers initialized", "socket.io");
}

// Helper to emit events from REST endpoints
export function emitToGame(io: SocketIOServer, gameId: string, event: string, data: any) {
  io.to(gameId).emit(event, data);
  log(`Emitted ${event} to game ${gameId}`, "socket.io");
}
