import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "./api-utils";
import { apiRequest } from "./queryClient";

export interface BingoCard {
  id: string;
  numbers: number[];
  marked: number[];
}

export interface GameState {
  status: "waiting" | "playing" | "paused" | "finished";
  gameId: string;
  hostName: string;
  players: any[];
  calledNumbers: number[];
  winPattern: string;
  winners: { name: string; pattern: string }[];
}

interface GameContextType {
  gameState: GameState;
  role: "host" | "player";
  currentUser: { name: string; id: string };
  myCards: BingoCard[];
  joinGame: (gameId: string, name: string, cards: number) => Promise<boolean>;
  createGame: (hostName: string, limit: number) => Promise<string | null>;
  callNumber: () => Promise<void>;
  markNumber: (cardId: string, num: number) => void;
  claimBingo: () => Promise<void>;
  exitGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [role, setRole] = useState<"host" | "player">("player");
  const [myCards, setMyCards] = useState<BingoCard[]>([]);
  const [currentUser, setCurrentUser] = useState({ name: "", id: "" });
  const [gameState, setGameState] = useState<GameState>({
    status: "waiting", gameId: "", hostName: "", players: [], calledNumbers: [], winPattern: "line", winners: []
  });

  const generateCard = (): BingoCard => {
    const card: number[] = [];
    for (let i = 0; i < 5; i++) {
      const col: number[] = [];
      while (col.length < 5) {
        const n = Math.floor(Math.random() * 15) + 1 + (i * 15);
        if (!col.includes(n)) col.push(n);
      }
      card.push(...col);
    }
    return { id: Math.random().toString(36).substr(2, 9), numbers: card, marked: [12] }; // 12 is FREE space
  };

  const refreshGameState = useCallback(async () => {
    if (!gameState.gameId || document.visibilityState !== 'visible') return;
    try {
      const res = await fetch(`${getApiUrl()}/api/games/${gameState.gameId}`);
      const data = await res.json();
      setGameState(data);
    } catch (e) { console.error("Sync error", e); }
  }, [gameState.gameId]);

  useEffect(() => {
    const timer = setInterval(refreshGameState, gameState.status === 'playing' ? 2000 : 5000);
    return () => clearInterval(timer);
  }, [refreshGameState, gameState.status]);

  const joinGame = async (gameId: string, name: string, cardCount: number) => {
    try {
      const res = await apiRequest("POST", `${getApiUrl()}/api/games/${gameId}/join`, { name, cardCount });
      const data = await res.json();
      setCurrentUser({ name, id: data.player.id });
      setGameState(data.game);
      setMyCards(Array.from({ length: cardCount }, () => generateCard()));
      setRole("player");
      return true;
    } catch (e) {
      toast({ title: "Join Failed", description: "Room not found or full", variant: "destructive" });
      return false;
    }
  };

  const createGame = async (hostName: string, playerLimit: number) => {
    try {
      const res = await apiRequest("POST", `${getApiUrl()}/api/games/create`, { hostName, playerLimit });
      const data = await res.json();
      setGameState(data);
      setCurrentUser({ name: hostName, id: data.hostId });
      setRole("host");
      return data.id;
    } catch (e) { return null; }
  };

  const markNumber = (cardId: string, num: number) => {
    if (!gameState.calledNumbers.includes(num)) return;
    setMyCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;
      const idx = card.numbers.indexOf(num);
      if (idx === -1 || card.marked.includes(idx)) return card;
      return { ...card, marked: [...card.marked, idx] };
    }));
  };

  const claimBingo = async () => {
    // Win detection logic for 'line' pattern
    const winLines = [[0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24]];
    const hasWon = myCards.some(c => winLines.some(line => line.every(idx => c.marked.includes(idx))));
    
    if (!hasWon) {
      toast({ title: "Wait!", description: "You don't have a valid pattern yet!", variant: "destructive" });
      return;
    }

    await apiRequest("POST", `${getApiUrl()}/api/games/${gameState.gameId}/bingo`, {
      playerId: currentUser.id, pattern: gameState.winPattern
    });
    toast({ title: "BINGO CLAIMED!", description: "Waiting for host validation..." });
  };

  const callNumber = async () => {
    await apiRequest("POST", `${getApiUrl()}/api/games/${gameState.gameId}/call`);
    refreshGameState();
  };

  return (
    <GameContext.Provider value={{ 
      gameState, role, currentUser, myCards, joinGame, createGame,
      callNumber, markNumber, claimBingo, exitGame: () => window.location.href = "/" 
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
};