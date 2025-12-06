import { db } from "./db.js";
import { games, players, cards, winners, messages } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { Game, InsertGame, Player, InsertPlayer, Card, InsertCard, Winner, InsertWinner, Message, InsertMessage } from "@shared/schema";

export interface IStorage {
  // Games
  createGame(game: InsertGame): Promise<Game>;
  getGame(gameId: string): Promise<Game | undefined>;
  updateGameStatus(gameId: string, status: string): Promise<void>;
  updateCalledNumbers(gameId: string, numbers: number[]): Promise<void>;
  updateStagedNumber(gameId: string, number: number | null): Promise<void>;

  // Players
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayer(playerId: string): Promise<Player | undefined>;
  getGamePlayers(gameId: string): Promise<Player[]>;
  updatePlayerCardCount(playerId: string, count: number): Promise<void>;
  deletePlayer(playerId: string): Promise<void>;

  // Cards
  createCard(card: InsertCard): Promise<Card>;
  getPlayerCards(playerId: string): Promise<Card[]>;
  updateCardMarked(cardId: string, marked: number[]): Promise<void>;
  deleteCard(cardId: string): Promise<void>;

  // Winners
  createWinner(winner: InsertWinner): Promise<Winner>;
  getGameWinners(gameId: string): Promise<Winner[]>;

  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getGameMessages(gameId: string): Promise<Message[]>;
}

export class PostgresStorage implements IStorage {
  // Games
  async createGame(game: InsertGame): Promise<Game> {
    const [result] = await db.insert(games).values(game).returning();
    return result;
  }

  async getGame(gameId: string): Promise<Game | undefined> {
    const result = await db.query.games.findFirst({ where: eq(games.id, gameId) });
    return result;
  }

  async updateGameStatus(gameId: string, status: string): Promise<void> {
    await db.update(games).set({ status, updatedAt: new Date() }).where(eq(games.id, gameId));
  }

  async updateCalledNumbers(gameId: string, numbers: number[]): Promise<void> {
    await db.update(games).set({ calledNumbers: numbers as any, updatedAt: new Date() }).where(eq(games.id, gameId));
  }

  async updateStagedNumber(gameId: string, number: number | null): Promise<void> {
    await db.update(games).set({ stagedNumber: number, updatedAt: new Date() }).where(eq(games.id, gameId));
  }

  // Players
  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [result] = await db.insert(players).values(player).returning();
    return result;
  }

  async getPlayer(playerId: string): Promise<Player | undefined> {
    const result = await db.query.players.findFirst({ where: eq(players.id, playerId) });
    return result;
  }

  async getGamePlayers(gameId: string): Promise<Player[]> {
    return db.query.players.findMany({ where: eq(players.gameId, gameId) });
  }

  async updatePlayerCardCount(playerId: string, count: number): Promise<void> {
    await db.update(players).set({ cardCount: count }).where(eq(players.id, playerId));
  }

  async deletePlayer(playerId: string): Promise<void> {
    await db.delete(players).where(eq(players.id, playerId));
  }

  // Cards
  async createCard(card: InsertCard): Promise<Card> {
    const [result] = await db.insert(cards).values(card).returning();
    return result;
  }

  async getPlayerCards(playerId: string): Promise<Card[]> {
    return db.query.cards.findMany({ where: eq(cards.playerId, playerId) });
  }

  async updateCardMarked(cardId: string, marked: number[]): Promise<void> {
    await db.update(cards).set({ marked: marked as any }).where(eq(cards.id, cardId));
  }

  async deleteCard(cardId: string): Promise<void> {
    await db.delete(cards).where(eq(cards.id, cardId));
  }

  // Winners
  async createWinner(winner: InsertWinner): Promise<Winner> {
    const [result] = await db.insert(winners).values(winner).returning();
    return result;
  }

  async getGameWinners(gameId: string): Promise<Winner[]> {
    return db.query.winners.findMany({ where: eq(winners.gameId, gameId) });
  }

  // Messages
  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();
    return result;
  }

  async getGameMessages(gameId: string): Promise<Message[]> {
    return db.query.messages.findMany({ where: eq(messages.gameId, gameId) });
  }
}

export class MemStorage implements IStorage {
  private games: Map<string, Game> = new Map();
  private players: Map<string, Player> = new Map();
  private cards: Map<string, Card> = new Map();
  private winners: Map<number, Winner> = new Map();
  private messages: Map<string, Message> = new Map();
  private winnerIdCounter = 1;

  // Games
  async createGame(insertGame: InsertGame): Promise<Game> {
    const game: Game = {
      ...insertGame,
      createdAt: new Date(),
      updatedAt: new Date(),
      calledNumbers: insertGame.calledNumbers as unknown as number[] || [],
      stagedNumber: insertGame.stagedNumber || null,
      status: insertGame.status || "waiting",
      winPattern: insertGame.winPattern || "line"
    };
    this.games.set(game.id, game);
    return game;
  }

  async getGame(gameId: string): Promise<Game | undefined> {
    return this.games.get(gameId);
  }

  async updateGameStatus(gameId: string, status: string): Promise<void> {
    const game = this.games.get(gameId);
    if (game) {
      game.status = status;
      game.updatedAt = new Date();
      this.games.set(gameId, game);
    }
  }

  async updateCalledNumbers(gameId: string, numbers: number[]): Promise<void> {
    const game = this.games.get(gameId);
    if (game) {
      game.calledNumbers = numbers;
      game.updatedAt = new Date();
      this.games.set(gameId, game);
    }
  }

  async updateStagedNumber(gameId: string, number: number | null): Promise<void> {
    const game = this.games.get(gameId);
    if (game) {
      game.stagedNumber = number;
      game.updatedAt = new Date();
      this.games.set(gameId, game);
    }
  }

  // Players
  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const player: Player = {
      ...insertPlayer,
      joinedAt: new Date(),
      cardCount: insertPlayer.cardCount || 1
    };
    this.players.set(player.id, player);
    return player;
  }

  async getPlayer(playerId: string): Promise<Player | undefined> {
    return this.players.get(playerId);
  }

  async getGamePlayers(gameId: string): Promise<Player[]> {
    return Array.from(this.players.values()).filter(p => p.gameId === gameId);
  }

  async updatePlayerCardCount(playerId: string, count: number): Promise<void> {
    const player = this.players.get(playerId);
    if (player) {
      player.cardCount = count;
      this.players.set(playerId, player);
    }
  }

  async deletePlayer(playerId: string): Promise<void> {
    this.players.delete(playerId);
  }

  // Cards
  async createCard(insertCard: InsertCard): Promise<Card> {
    const card: Card = {
      ...insertCard,
      marked: insertCard.marked as unknown as number[] || []
    };
    this.cards.set(card.id, card);
    return card;
  }

  async getPlayerCards(playerId: string): Promise<Card[]> {
    return Array.from(this.cards.values()).filter(c => c.playerId === playerId);
  }

  async updateCardMarked(cardId: string, marked: number[]): Promise<void> {
    const card = this.cards.get(cardId);
    if (card) {
      card.marked = marked;
      this.cards.set(cardId, card);
    }
  }

  async deleteCard(cardId: string): Promise<void> {
    this.cards.delete(cardId);
  }

  // Winners
  async createWinner(insertWinner: InsertWinner): Promise<Winner> {
    const winner: Winner = {
      ...insertWinner,
      id: this.winnerIdCounter++,
      wonAt: new Date()
    };
    this.winners.set(winner.id, winner);
    return winner;
  }

  async getGameWinners(gameId: string): Promise<Winner[]> {
    return Array.from(this.winners.values()).filter(w => w.gameId === gameId);
  }

  // Messages
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      ...insertMessage,
      createdAt: new Date(),
      isSystem: insertMessage.isSystem || false
    };
    this.messages.set(message.id, message);
    return message;
  }

  async getGameMessages(gameId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.gameId === gameId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export const storage = process.env.USE_MEM_STORAGE === 'true' ? new MemStorage() : new PostgresStorage();
