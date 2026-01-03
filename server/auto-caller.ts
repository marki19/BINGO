import { storage } from "./storage";
import { log } from "./app";
import type { Server as SocketIOServer } from "socket.io";
import { emitToGame } from "./socket-handlers";

/**
 * AutoCallManager - Manages automatic number calling for games
 * Singleton pattern to manage timers across all games
 */
export class AutoCallManager {
  private static instance: AutoCallManager;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private intervals: Map<string, number> = new Map();
  private io: SocketIOServer | null = null;

  private constructor() {}

  static getInstance(): AutoCallManager {
    if (!AutoCallManager.instance) {
      AutoCallManager.instance = new AutoCallManager();
    }
    return AutoCallManager.instance;
  }

  setIO(io: SocketIOServer) {
    this.io = io;
  }

  async start(gameId: string, intervalSeconds: number): Promise<void> {
    // Stop existing timer if any
    this.stop(gameId);

    // Store interval for this game
    this.intervals.set(gameId, intervalSeconds);

    log(`Starting auto-call for game ${gameId} with ${intervalSeconds}s interval`, "auto-call");

    // Create interval timer
    const timer = setInterval(async () => {
      try {
        const game = await storage.getGame(gameId);

        // Stop if game doesn't exist or not playing
        if (!game || game.status !== "playing") {
          log(`Auto-call stopped for game ${gameId} - game not playing`, "auto-call");
          this.stop(gameId);
          return;
        }

        const called = (game.calledNumbers as number[]) || [];

        // Stop if all numbers called
        if (called.length >= 75) {
          log(`Auto-call stopped for game ${gameId} - all numbers called`, "auto-call");
          this.stop(gameId);
          if (this.io) {
            emitToGame(this.io, gameId, "all-numbers-called", {
              timestamp: Date.now()
            });
          }
          return;
        }

        // Call next number
        let nextNum: number;
        if (game.stagedNumber && !called.includes(game.stagedNumber)) {
          nextNum = game.stagedNumber;
          await storage.updateStagedNumber(gameId, null);
        } else {
          const pool = Array.from({ length: 75 }, (_, i) => i + 1).filter(n => !called.includes(n));
          nextNum = pool[Math.floor(Math.random() * pool.length)];
        }

        await storage.updateCalledNumbers(gameId, [...called, nextNum]);

        // Emit via Socket.IO
        if (this.io) {
          emitToGame(this.io, gameId, "number-called", {
            number: nextNum,
            timestamp: Date.now()
          });
        }

        log(`Auto-called number ${nextNum} for game ${gameId}`, "auto-call");
      } catch (error) {
        log(`Error in auto-call for game ${gameId}: ${error}`, "auto-call");
      }
    }, intervalSeconds * 1000);

    this.timers.set(gameId, timer);
  }

  stop(gameId: string): void {
    const timer = this.timers.get(gameId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(gameId);
      this.intervals.delete(gameId);
      log(`Auto-call stopped for game ${gameId}`, "auto-call");
    }
  }

  isActive(gameId: string): boolean {
    return this.timers.has(gameId);
  }

  getInterval(gameId: string): number | null {
    return this.intervals.get(gameId) || null;
  }

  updateInterval(gameId: string, intervalSeconds: number): void {
    if (this.isActive(gameId)) {
      this.start(gameId, intervalSeconds);
    }
  }
}

export const autoCallManager = AutoCallManager.getInstance();
