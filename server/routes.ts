import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { nanoid } from "nanoid";
import { setupSocketHandlers, emitToGame } from "./socket-handlers";
import { validateWin, type PatternName } from "../shared/pattern-validator";
import QRCode from "qrcode";
import { autoCallManager } from "./auto-caller";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server and Socket.IO instance
  const server = createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5000",
      credentials: true
    }
  });

  // Setup Socket.IO handlers
  setupSocketHandlers(io);

  // Initialize auto-call manager with Socket.IO instance
  autoCallManager.setIO(io);

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

    // Check player limit
    const currentPlayers = await storage.getGamePlayers(game.id);
    if (currentPlayers.length >= game.playerLimit) {
      return res.status(403).json({ message: "Game is full" });
    }

    const player = await storage.createPlayer({
      id: nanoid(),
      gameId: game.id,
      name: req.body.name,
      cardCount: req.body.cardCount || 1
    });

    // Emit player joined event via Socket.IO
    emitToGame(io, game.id, "player-joined", {
      playerId: player.id,
      playerName: player.name
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

    // Emit number called event via Socket.IO
    emitToGame(io, game.id, "number-called", {
      number: nextNum,
      timestamp: Date.now()
    });

    res.json({ nextNum });
  });

  app.post("/api/games/:id/bingo", async (req, res) => {
    const game = await storage.getGame(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    // Get player's cards
    const playerCards = await storage.getPlayerCards(req.body.playerId);
    if (playerCards.length === 0) {
      return res.status(400).json({ message: "No cards found for player" });
    }

    // Validate at least one card has the winning pattern
    const hasWinningCard = playerCards.some(card =>
      validateWin(
        { numbers: card.numbers as number[], marked: card.marked as number[] },
        game.calledNumbers as number[],
        game.winPattern as PatternName
      )
    );

    if (!hasWinningCard) {
      emitToGame(io, req.params.id, "bingo-invalid", {
        playerId: req.body.playerId,
        message: "No winning pattern found"
      });
      return res.status(400).json({ message: "No winning pattern found" });
    }

    // Valid win - create winner record
    const winner = await storage.createWinner({
      id: nanoid(),
      gameId: req.params.id,
      playerId: req.body.playerId,
      name: req.body.name,
      pattern: game.winPattern
    });

    // Emit game ended event via Socket.IO
    emitToGame(io, req.params.id, "game-ended", {
      winner: winner.name,
      pattern: winner.pattern,
      timestamp: Date.now()
    });

    res.json(winner);
  });

  // Game control endpoints
  app.post("/api/games/:id/start", async (req, res) => {
    const game = await storage.getGame(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    await storage.updateGameStatus(req.params.id, "playing");

    emitToGame(io, req.params.id, "game-started", {
      timestamp: Date.now()
    });

    res.json({ status: "playing" });
  });

  app.post("/api/games/:id/pause", async (req, res) => {
    const game = await storage.getGame(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    await storage.updateGameStatus(req.params.id, "paused");

    emitToGame(io, req.params.id, "game-paused", {
      timestamp: Date.now()
    });

    res.json({ status: "paused" });
  });

  app.post("/api/games/:id/restart", async (req, res) => {
    const game = await storage.getGame(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    await storage.updateCalledNumbers(req.params.id, []);
    await storage.updateGameStatus(req.params.id, "waiting");
    await storage.updateStagedNumber(req.params.id, null);

    emitToGame(io, req.params.id, "game-restarted", {
      timestamp: Date.now()
    });

    res.json({ status: "waiting" });
  });

  // Card management endpoints
  app.post("/api/games/:gameId/cards", async (req, res) => {
    const { playerId, cardCount } = req.body;
    if (!playerId || !cardCount || cardCount < 1 || cardCount > 10) {
      return res.status(400).json({ message: "Invalid card count (1-10)" });
    }

    const game = await storage.getGame(req.params.gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });

    // Generate cards server-side
    const generateCardNumbers = (): number[] => {
      const card: number[] = [];
      for (let col = 0; col < 5; col++) {
        const colNumbers: number[] = [];
        while (colNumbers.length < 5) {
          const num = Math.floor(Math.random() * 15) + 1 + (col * 15);
          if (!colNumbers.includes(num)) colNumbers.push(num);
        }
        card.push(...colNumbers);
      }
      return card;
    };

    const cards = [];
    for (let i = 0; i < cardCount; i++) {
      const card = await storage.createCard({
        id: nanoid(),
        playerId,
        gameId: req.params.gameId,
        numbers: generateCardNumbers(),
        marked: [12] // FREE space
      });
      cards.push(card);
    }

    res.json(cards);
  });

  app.get("/api/games/:gameId/players/:playerId/cards", async (req, res) => {
    const cards = await storage.getPlayerCards(req.params.playerId);
    res.json(cards);
  });

  app.patch("/api/games/:gameId/cards/:cardId/marked", async (req, res) => {
    const { marked } = req.body;
    if (!Array.isArray(marked) || marked.some((i: any) => i < 0 || i > 24)) {
      return res.status(400).json({ message: "Invalid marked indices" });
    }

    await storage.updateCardMarked(req.params.cardId, marked);
    res.json({ success: true });
  });

  // QR Code generation endpoint
  app.get("/api/games/:id/qr", async (req, res) => {
    const game = await storage.getGame(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    try {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5000";
      const gameUrl = `${clientUrl}/game/${req.params.id}`;

      // Generate QR code as SVG
      const qrSvg = await QRCode.toString(gameUrl, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 2,
        width: 300
      });

      res.setHeader("Content-Type", "image/svg+xml");
      res.send(qrSvg);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Pattern update endpoint
  app.patch("/api/games/:id/pattern", async (req, res) => {
    const game = await storage.getGame(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    if (game.status !== "waiting") {
      return res.status(403).json({ message: "Cannot change pattern after game starts" });
    }

    const { pattern } = req.body;
    if (!pattern) {
      return res.status(400).json({ message: "Pattern name required" });
    }

    await storage.updateGamePattern(req.params.id, pattern);

    emitToGame(io, req.params.id, "pattern-changed", {
      pattern,
      timestamp: Date.now()
    });

    res.json({ pattern });
  });

  // Auto-call endpoints
  app.post("/api/games/:id/auto-call/start", async (req, res) => {
    const { interval } = req.body;
    const validIntervals = [5, 10, 15, 30];

    if (!validIntervals.includes(interval)) {
      return res.status(400).json({ message: "Interval must be 5, 10, 15, or 30 seconds" });
    }

    const game = await storage.getGame(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    if (game.status !== "playing") {
      return res.status(400).json({ message: "Game must be in playing state" });
    }

    await autoCallManager.start(req.params.id, interval);

    res.json({ active: true, interval });
  });

  app.post("/api/games/:id/auto-call/stop", async (req, res) => {
    autoCallManager.stop(req.params.id);
    res.json({ active: false });
  });

  app.get("/api/games/:id/auto-call/status", async (req, res) => {
    const active = autoCallManager.isActive(req.params.id);
    const interval = autoCallManager.getInterval(req.params.id);
    res.json({ active, interval });
  });

  // Developer mode endpoints
  app.post("/api/games/:id/dev/stage-number", async (req, res) => {
    const { number, playerId } = req.body;

    if (!number || number < 1 || number > 75) {
      return res.status(400).json({ message: "Number must be between 1 and 75" });
    }

    const game = await storage.getGame(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const called = (game.calledNumbers as number[]) || [];
    if (called.includes(number)) {
      return res.status(400).json({ message: "Number already called" });
    }

    await storage.updateStagedNumber(req.params.id, number);

    // Log action
    await storage.createDeveloperAction({
      id: nanoid(),
      gameId: req.params.id,
      playerId,
      action: "stage_number",
      details: { number }
    });

    emitToGame(io, req.params.id, "number-staged", { number });

    res.json({ success: true, number });
  });

  app.post("/api/games/:id/dev/modify-card", async (req, res) => {
    const { cardId, numbers, playerId } = req.body;

    if (!Array.isArray(numbers) || numbers.length !== 25) {
      return res.status(400).json({ message: "Card must have exactly 25 numbers" });
    }

    if (numbers.some((n: any) => n < 1 || n > 75)) {
      return res.status(400).json({ message: "All numbers must be between 1 and 75" });
    }

    // Update card numbers (we'll need to add this method to storage)
    // For now, just log the action
    await storage.createDeveloperAction({
      id: nanoid(),
      gameId: req.params.id,
      playerId,
      action: "modify_card",
      details: { cardId, numbers }
    });

    res.json({ success: true });
  });

  app.get("/api/games/:id/dev/logs", async (req, res) => {
    const logs = await storage.getGameDeveloperActions(req.params.id);
    res.json(logs);
  });

  return server;
}