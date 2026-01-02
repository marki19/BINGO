import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.get("/api/games/:id", async (req, res) => {
    const game = await storage.getGame(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });
    const players = await storage.getGamePlayers(game.id);
    const winners = await storage.getGameWinners(game.id);
    const messages = await storage.getGameMessages(game.id);
    res.json({ ...game, players, winners, messages });
  });

  app.post("/api/games/create", async (req, res) => {
    const game = await storage.createGame({
      id: nanoid(6).toUpperCase(),
      hostName: req.body.hostName,
      hostId: nanoid(),
      playerLimit: parseInt(req.body.playerLimit),
      winPattern: req.body.winPattern || "line",
      status: "waiting",
      calledNumbers: []
    });
    res.json(game);
  });

  app.post("/api/games/:id/join", async (req, res) => {
    const game = await storage.getGame(req.params.id);
    if (!game) return res.status(404).json({ message: "Room not found" });
    const player = await storage.createPlayer({
      id: nanoid(),
      gameId: game.id,
      name: req.body.name,
      cardCount: req.body.cardCount || 1
    });
    res.json({ game, player });
  });

  app.post("/api/games/:id/call", async (req, res) => {
    const game = await storage.getGame(req.params.id);
    if (!game || game.status !== "playing") return res.status(400).json({ message: "Game not active" });

    const called = (game.calledNumbers as number[]) || [];
    if (called.length >= 75) return res.status(400).json({ message: "All numbers called" });

    let nextNum: number;
    if (game.stagedNumber && !called.includes(game.stagedNumber)) {
      nextNum = game.stagedNumber;
    } else {
      const pool = Array.from({ length: 75 }, (_, i) => i + 1).filter(n => !called.includes(n));
      nextNum = pool[Math.floor(Math.random() * pool.length)];
    }

    await storage.updateCalledNumbers(game.id, [...called, nextNum]);
    await storage.updateStagedNumber(game.id, null);
    res.json({ nextNum });
  });

  app.post("/api/games/:id/bingo", async (req, res) => {
    const winner = await storage.createWinner({
      id: nanoid(),
      gameId: req.params.id,
      playerId: req.body.playerId,
      name: req.body.name,
      pattern: req.body.pattern
    });
    res.json(winner);
  });

  return createServer(app);
}