import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "./api-utils";
import { apiRequest } from "./queryClient";
import { getSocket, joinGameRoom, leaveGameRoom, onEvent, offEvent, emitEvent } from "./socket";
import { validateMarked, type PatternName } from "@shared/pattern-validator";

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
  startGame: () => Promise<void>;
  pauseGame: () => Promise<void>;
  restartGame: () => Promise<void>;
  markNumber: (cardId: string, num: number) => void;
  claimBingo: () => Promise<void>;
  sendMessage: (text: string) => void;
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
    if (!gameState.gameId) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/games/${gameState.gameId}`);
      const data = await res.json();
      setGameState(data);
    } catch (e) { console.error("Sync error", e); }
  }, [gameState.gameId]);

  // Socket.IO event listeners
  useEffect(() => {
    if (!gameState.gameId) return;

    const socket = getSocket();

    const handleNumberCalled = (data: { number: number }) => {
      setGameState(prev => ({
        ...prev,
        calledNumbers: [...prev.calledNumbers, data.number]
      }));
    };

    const handlePlayerJoined = () => {
      refreshGameState();
    };

    const handlePlayerLeft = () => {
      refreshGameState();
    };

    const handleGameStarted = () => {
      setGameState(prev => ({ ...prev, status: "playing" }));
      toast({ title: "Game Started!", description: "Good luck!" });
    };

    const handleGamePaused = () => {
      setGameState(prev => ({ ...prev, status: "paused" }));
      toast({ title: "Game Paused", description: "Host paused the game" });
    };

    const handleGameEnded = (data: { winner: string; pattern: string }) => {
      setGameState(prev => ({ ...prev, status: "finished" }));
      toast({
        title: "🎉 BINGO! 🎉",
        description: `${data.winner} won with ${data.pattern}!`
      });
      refreshGameState();
    };

    const handleGameRestarted = () => {
      setGameState(prev => ({
        ...prev,
        status: "waiting",
        calledNumbers: [],
        winners: []
      }));
      toast({ title: "New Round", description: "Game has been restarted!" });
    };

    const handleChatMessage = (data: { playerName: string; text: string; timestamp: number }) => {
      // Chat messages will be handled by chat component
      refreshGameState();
    };

    onEvent("number-called", handleNumberCalled);
    onEvent("player-joined", handlePlayerJoined);
    onEvent("player-left", handlePlayerLeft);
    onEvent("game-started", handleGameStarted);
    onEvent("game-paused", handleGamePaused);
    onEvent("game-ended", handleGameEnded);
    onEvent("game-restarted", handleGameRestarted);
    onEvent("chat-message", handleChatMessage);

    return () => {
      offEvent("number-called", handleNumberCalled);
      offEvent("player-joined", handlePlayerJoined);
      offEvent("player-left", handlePlayerLeft);
      offEvent("game-started", handleGameStarted);
      offEvent("game-paused", handleGamePaused);
      offEvent("game-ended", handleGameEnded);
      offEvent("game-restarted", handleGameRestarted);
      offEvent("chat-message", handleChatMessage);
    };
  }, [gameState.gameId, toast, refreshGameState]);

  const joinGame = async (gameId: string, name: string, cardCount: number) => {
    try {
      const res = await apiRequest("POST", `${getApiUrl()}/api/games/${gameId}/join`, { name, cardCount });
      const data = await res.json();
      setCurrentUser({ name, id: data.player.id });
      setGameState(data.game);
      setMyCards(Array.from({ length: cardCount }, () => generateCard()));
      setRole("player");

      // Join Socket.IO room
      joinGameRoom(gameId, data.player.id, name);

      return true;
    } catch (e: any) {
      const errorMsg = e.message || "Room not found or full";
      toast({ title: "Join Failed", description: errorMsg, variant: "destructive" });
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

      // Join Socket.IO room as host
      joinGameRoom(data.id, data.hostId, hostName);

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
    // Use pattern validator to check if any card has winning pattern
    const hasWon = myCards.some(card =>
      validateMarked(card.marked, gameState.winPattern as PatternName)
    );

    if (!hasWon) {
      toast({ title: "Wait!", description: "You don't have a valid pattern yet!", variant: "destructive" });
      return;
    }

    await apiRequest("POST", `${getApiUrl()}/api/games/${gameState.gameId}/bingo`, {
      playerId: currentUser.id,
      name: currentUser.name,
      pattern: gameState.winPattern
    });
    toast({ title: "BINGO CLAIMED!", description: "Waiting for validation..." });
  };

  const callNumber = async () => {
    await apiRequest("POST", `${getApiUrl()}/api/games/${gameState.gameId}/call`);
  };

  const startGame = async () => {
    await apiRequest("POST", `${getApiUrl()}/api/games/${gameState.gameId}/start`);
  };

  const pauseGame = async () => {
    await apiRequest("POST", `${getApiUrl()}/api/games/${gameState.gameId}/pause`);
  };

  const restartGame = async () => {
    await apiRequest("POST", `${getApiUrl()}/api/games/${gameState.gameId}/restart`);
    setMyCards([]);
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    emitEvent("chat-message", {
      gameId: gameState.gameId,
      playerId: currentUser.id,
      playerName: currentUser.name,
      text: text.trim()
    });
  };

  const exitGame = () => {
    if (gameState.gameId) {
      leaveGameRoom(gameState.gameId, currentUser.id, currentUser.name);
    }
    window.location.href = "/";
  };

  return (
    <GameContext.Provider value={{
      gameState, role, currentUser, myCards, joinGame, createGame,
      callNumber, startGame, pauseGame, restartGame,
      markNumber, claimBingo, sendMessage, exitGame
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