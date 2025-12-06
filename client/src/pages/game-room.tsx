import React from "react";
import { Redirect, useRoute } from "wouter";
import { useGame } from "@/lib/game-state";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Components
import { BingoCard } from "@/components/bingo/card";
import { NumberBoard } from "@/components/bingo/board";
import { PlayerList } from "@/components/bingo/player-list";
import { GameControls } from "@/components/bingo/controls";
import { CurrentNumber } from "@/components/bingo/current-number";
import { DevPanel } from "@/components/dev-panel";
import { Chat } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Icons
import { Trophy, MessageSquare, Users, Plus, X, LogOut, Copy, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GameRoom() {
  const { 
    gameState, role, myCards, claimBingo, currentUser, 
    addCard, removeCard, joinGame, exitGame 
  } = useGame();
  
  const { toast } = useToast();
  const [, params] = useRoute("/game/:gameId");
  const gameIdFromUrl = params?.gameId;

  // CHECK IF CURRENT PLAYER HAS WON
  const hasCurrentPlayerWon = gameState.winners.some(w => w.name === currentUser.name);

  // --- RECONNECTION LOGIC (Preserved) ---
  React.useEffect(() => {
    if (gameIdFromUrl && !gameState.gameId) {
      console.log("🔄 [GAME-ROOM] Refresh detected! GameID:", gameIdFromUrl);
      const playerId = sessionStorage.getItem("neon-bingo-player-id");
      const playerName = sessionStorage.getItem("neon-bingo-player-name") || "Guest";

      if (playerId) {
        joinGame(gameIdFromUrl, playerName, playerId);
      } else {
        joinGame(gameIdFromUrl, playerName, 1);
      }
    }
  }, [gameIdFromUrl, gameState.gameId, joinGame]);

  // --- LOADING STATE ---
  if (!gameState.gameId && gameIdFromUrl) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-xl text-center space-y-6 max-w-sm w-full animate-in zoom-in duration-300">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold">Connecting...</h2>
            <p className="text-muted-foreground text-sm">Restoring session for room <span className="font-mono font-bold text-foreground">{gameIdFromUrl}</span></p>
          </div>
          <Button variant="outline" onClick={() => window.location.href = "/"} className="w-full">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!gameState.gameId && !gameIdFromUrl && role === "spectator") {
    return <Redirect to="/" />;
  }

  const copyGameId = () => {
    navigator.clipboard.writeText(gameState.gameId);
    toast({ title: "Copied!", description: "Game ID copied to clipboard" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* --- OVERLAYS (Pause / Winner) --- */}
      <AnimatePresence>
        {gameState.status === "paused" && role !== "host" && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <div className="glass-panel p-8 rounded-xl text-center max-w-sm w-full">
              <div className="text-5xl mb-4 animate-pulse">⏸️</div>
              <h1 className="text-3xl font-display font-bold mb-2">PAUSED</h1>
              <p className="text-muted-foreground">The host has paused the game.</p>
            </div>
          </motion.div>
        )}

        {gameState.status === "finished" && role !== "host" && gameState.winner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <div className="glass-panel p-8 rounded-2xl text-center max-w-md w-full border-primary/30 shadow-[0_0_50px_rgba(var(--primary),0.3)]">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6 animate-bounce" />
              <h1 className="text-4xl font-display font-bold mb-2 text-foreground">BINGO!</h1>
              <p className="text-xl text-muted-foreground">
                <span className="font-bold text-primary">{gameState.winner.name}</span> takes the win!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-40 glass-panel border-x-0 border-t-0 h-16">
        <div className="container h-full mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:block">
              BINGO MAX
            </h1>
            
            <div 
              onClick={copyGameId}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 hover:bg-secondary/30 border border-white/10 cursor-pointer transition-all group"
            >
              <span className="text-xs font-mono text-muted-foreground">ID</span>
              <span className="text-sm font-mono font-bold tracking-wider">{gameState.gameId}</span>
              <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-bold leading-none">{currentUser.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{role}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => confirm("Exit game?") && exitGame()}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT GRID --- */}
      <main className="flex-1 container mx-auto p-4 py-6 grid lg:grid-cols-[1fr_340px] gap-6 h-[calc(100vh-64px)] min-h-0">

        {/* LEFT COLUMN: Game Board & Cards */}
        <div className="flex flex-col gap-6 min-h-0 overflow-y-auto no-scrollbar">
          
          {/* Status & Controls Bar */}
          <Card className="glass-panel border-0 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
               <CurrentNumber />
               <div className="h-10 w-px bg-white/10 mx-2 hidden sm:block" />
               <div className="flex flex-col">
                 <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Status</span>
                 <div className="flex items-center gap-2">
                   <span className={`w-2 h-2 rounded-full ${gameState.status === 'playing' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                   <span className="font-medium capitalize">{gameState.status}</span>
                 </div>
               </div>
            </div>
            <div className="w-full sm:w-auto">
              <GameControls />
            </div>
          </Card>

          {/* The Big Board */}
          <div className="glass-panel rounded-xl p-4 overflow-hidden">
             <NumberBoard />
          </div>

          {/* Player Cards Section */}
          {(role === "player" || role === "developer" || role === "host") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  My Cards <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-sans">{myCards.length}</span>
                </h2>
                <Button size="sm" onClick={addCard} variant="secondary" className="hover-lift shadow-sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Card
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myCards.map((card, idx) => (
                  <Card key={card.id} className={cn("glass-panel border-0 p-4 relative overflow-hidden transition-all", hasCurrentPlayerWon && "opacity-60 grayscale")}>
                    {/* Card Decoration */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-50" />
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Card #{idx + 1}</span>
                      <Button 
                        size="icon" variant="ghost" 
                        className="h-6 w-6 -mr-2 text-muted-foreground hover:text-destructive"
                        onClick={() => removeCard(card.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* The Card Component */}
                    <BingoCard card={card} />

                    <Button
                      size="lg"
                      onClick={() => claimBingo(card.id)}
                      disabled={gameState.status !== "playing" || hasCurrentPlayerWon}
                      className={cn(
                        "w-full mt-4 font-bold text-lg shadow-lg transition-all",
                        !hasCurrentPlayerWon && gameState.status === "playing" 
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:to-amber-600 hover:scale-[1.02] animate-pulse" 
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {hasCurrentPlayerWon ? "Winner!" : "BINGO!"}
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Chat & Players (Hidden on Mobile, separate drawer) */}
        <div className="hidden lg:flex flex-col gap-4 min-h-0">
          
          {/* Players List */}
          <Card className="glass-panel border-0 flex-1 min-h-0 flex flex-col">
            <div className="p-3 border-b border-white/5 bg-black/20 flex items-center gap-2">
              <Users className="w-4 h-4 text-secondary" />
              <span className="font-bold text-sm">Players</span>
              <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full">{gameState.players.length}</span>
            </div>
            <div className="flex-1 overflow-hidden relative">
               <PlayerList />
            </div>
          </Card>

          {/* Chat */}
          <Card className="glass-panel border-0 flex-[1.5] min-h-0 flex flex-col">
            <div className="p-3 border-b border-white/5 bg-black/20 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">Chat</span>
            </div>
            <div className="flex-1 overflow-hidden relative p-0">
               <Chat />
            </div>
          </Card>
        </div>

      </main>

      {/* --- MOBILE FLOATING ACTION BUTTONS --- */}
      <div className="lg:hidden fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        
        {/* Mobile Players Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="h-12 w-12 rounded-full shadow-xl bg-secondary text-secondary-foreground hover-lift">
              <Users className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] glass-panel border-t-0 rounded-t-2xl p-0 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-secondary" /> Players ({gameState.players.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <PlayerList />
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile Chat Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground hover-lift">
              <MessageSquare className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] glass-panel border-t-0 rounded-t-2xl p-0 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Live Chat
              </h3>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <Chat />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {role === "host" && <DevPanel />}
    </div>
  );
}