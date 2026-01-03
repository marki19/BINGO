import { db } from "./db";
import {
  games, players, cards, winners, messages, developerActions,
  type Game, type InsertGame, type Player, type InsertPlayer,
  type Card, type InsertCard, type Winner, type InsertWinner,
  type Message, type InsertMessage, type DeveloperAction, type InsertDeveloperAction, type IStorage
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class PostgresStorage implements IStorage {
  // GAMES
  async createGame(game: InsertGame): Promise<Game> {
    const [result] = await db.insert(games).values(game).returning();
    return result;
  }

  async getGame(gameId: string): Promise<Game | undefined> {
    const [result] = await db.select().from(games).where(eq(games.id, gameId));
    return result;
  }

  async updateGameStatus(gameId: string, status: string): Promise<void> {
    await db.update(games).set({ status, updatedAt: new Date() }).where(eq(games.id, gameId));
  }

  async updateCalledNumbers(gameId: string, numbers: number[]): Promise<void> {
    await db.update(games).set({ calledNumbers: numbers, updatedAt: new Date() }).where(eq(games.id, gameId));
  }

  async updateStagedNumber(gameId: string, number: number | null): Promise<void> {
    await db.update(games).set({ stagedNumber: number, updatedAt: new Date() }).where(eq(games.id, gameId));
  }

  async updateGamePattern(gameId: string, pattern: string): Promise<void> {
    await db.update(games).set({ winPattern: pattern, updatedAt: new Date() }).where(eq(games.id, gameId));
  }

  // PLAYERS
  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [result] = await db.insert(players).values(player).returning();
    return result;
  }

  async getPlayer(playerId: string): Promise<Player | undefined> {
    const [result] = await db.select().from(players).where(eq(players.id, playerId));
    return result;
  }

  async getGamePlayers(gameId: string): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.gameId, gameId));
  }

  // CARDS
  async createCard(card: InsertCard): Promise<Card> {
    const [result] = await db.insert(cards).values(card).returning();
    return result;
  }

  async getPlayerCards(playerId: string): Promise<Card[]> {
    return await db.select().from(cards).where(eq(cards.playerId, playerId));
  }

  async updateCardMarked(cardId: string, marked: number[]): Promise<void> {
    await db.update(cards).set({ marked }).where(eq(cards.id, cardId));
  }

  // WINNERS (Atomic Transaction)
  async createWinner(winner: InsertWinner): Promise<Winner> {
    return await db.transaction(async (tx) => {
      const [result] = await tx.insert(winners).values(winner).returning();
      await tx.update(games).set({ status: "finished", updatedAt: new Date() }).where(eq(games.id, winner.gameId));
      return result;
    });
  }

  async getGameWinners(gameId: string): Promise<Winner[]> {
    return await db.select().from(winners).where(eq(winners.gameId, gameId)).orderBy(desc(winners.wonAt));
  }

  // MESSAGES
  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();
    return result;
  }

  async getGameMessages(gameId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.gameId, gameId)).orderBy(desc(messages.createdAt));
  }

  // DEVELOPER ACTIONS
  async createDeveloperAction(action: InsertDeveloperAction): Promise<DeveloperAction> {
    const [result] = await db.insert(developerActions).values(action).returning();
    return result;
  }

  async getGameDeveloperActions(gameId: string): Promise<DeveloperAction[]> {
    return await db.select().from(developerActions).where(eq(developerActions.gameId, gameId)).orderBy(desc(developerActions.timestamp));
  }
}

export const storage = new PostgresStorage();