import { pgTable, text, varchar, integer, json, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = pgTable("games", {
  id: varchar("id").primaryKey(),
  hostId: varchar("host_id").notNull(),
  hostName: text("host_name").notNull(),
  status: varchar("status").notNull().default("waiting"),
  playerLimit: integer("player_limit").notNull(),
  winPattern: varchar("win_pattern").notNull().default("line"),
  calledNumbers: json("called_numbers").$type<number[]>().default([]).notNull(),
  stagedNumber: integer("staged_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey(),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cardCount: integer("card_count").default(1).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const cards = pgTable("cards", {
  id: varchar("id").primaryKey(),
  playerId: varchar("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  numbers: json("numbers").$type<number[]>().notNull(),
  marked: json("marked").$type<number[]>().default([]).notNull(),
});

export const winners = pgTable("winners", {
  id: varchar("id").primaryKey(),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  playerId: varchar("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  pattern: text("pattern").notNull(),
  wonAt: timestamp("won_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey(),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(),
  text: text("text").notNull(),
  isSystem: boolean("is_system").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const developerActions = pgTable("developer_actions", {
  id: varchar("id").primaryKey(),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  playerId: varchar("player_id").notNull(),
  action: text("action").notNull(),
  details: json("details").$type<Record<string, any>>().notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Add these to your shared/schema.ts
export interface IStorage {
  // Game Methods
  createGame(game: InsertGame): Promise<Game>;
  getGame(gameId: string): Promise<Game | undefined>;
  updateGameStatus(gameId: string, status: string): Promise<void>;
  updateCalledNumbers(gameId: string, numbers: number[]): Promise<void>;
  updateStagedNumber(gameId: string, number: number | null): Promise<void>;

  // Player Methods
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayer(playerId: string): Promise<Player | undefined>;
  getGamePlayers(gameId: string): Promise<Player[]>;

  // Card Methods
  createCard(card: InsertCard): Promise<Card>;
  getPlayerCards(playerId: string): Promise<Card[]>;
  updateCardMarked(cardId: string, marked: number[]): Promise<void>;

  // Winner & Message Methods
  createWinner(winner: InsertWinner): Promise<Winner>;
  getGameWinners(gameId: string): Promise<Winner[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getGameMessages(gameId: string): Promise<Message[]>;
}

// Schemas & Types
export const insertGameSchema = createInsertSchema(games);
export const insertPlayerSchema = createInsertSchema(players);
export const insertCardSchema = createInsertSchema(cards);
export const insertWinnerSchema = createInsertSchema(winners);
export const insertMessageSchema = createInsertSchema(messages);
export const insertDeveloperActionSchema = createInsertSchema(developerActions);

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Winner = typeof winners.$inferSelect;
export type InsertWinner = z.infer<typeof insertWinnerSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type DeveloperAction = typeof developerActions.$inferSelect;
export type InsertDeveloperAction = z.infer<typeof insertDeveloperActionSchema>;