import React, { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useGame } from "@/lib/game-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Gamepad2, Users } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { createGame, joinGame } = useGame();

  // Join Game State
  const [playerName, setPlayerName] = useState("");
  const [gameId, setGameId] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Host Game State
  const [hostName, setHostName] = useState("");
  const [playerLimit, setPlayerLimit] = useState("100");
  const [isCreating, setIsCreating] = useState(false);

  const handleJoin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !gameId) return;
    
    setIsJoining(true);
    const success = await joinGame(gameId, playerName, 1);
    if (success) {
      setLocation(`/game/${gameId}`);
    }
    setIsJoining(false);
  }, [playerName, gameId, joinGame, setLocation]);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName) return;
    
    setIsCreating(true);
    try {
      console.log("🎮 [HOME] Creating game with hostName:", hostName, "playerLimit:", playerLimit);
      const newGameId = await createGame(hostName, parseInt(playerLimit), 1, "line");
      
      if (newGameId && newGameId.trim()) {
        console.log("✅ [HOME] gameId is valid:", newGameId);
        setLocation(`/game/${newGameId}`);
      } else {
        console.error("❌ [HOME] Game creation FAILED");
      }
    } catch (error) {
      console.error("❌ [HOME] Error creating game:", error);
    } finally {
      setIsCreating(false);
    }
  }, [hostName, playerLimit, createGame, setLocation]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-background/50">
      
      {/* Main Card with Glass Effect */}
      <Card className="glass-panel w-full max-w-md border-0 ring-1 ring-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
        
        <CardHeader className="text-center space-y-2 pb-6 sm:pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg hover-lift mb-4 ring-4 ring-background/50">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-4xl sm:text-5xl font-display font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              BINGO MAX
            </CardTitle>
            <CardDescription className="text-lg font-medium mt-2">
              Next Gen Multiplayer Bingo
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted/50 rounded-xl h-auto">
              <TabsTrigger value="join" className="rounded-lg font-bold py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all">
                <Gamepad2 className="w-4 h-4 mr-2" /> Join Game
              </TabsTrigger>
              <TabsTrigger value="create" className="rounded-lg font-bold py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all">
                <Users className="w-4 h-4 mr-2" /> Host Game
              </TabsTrigger>
            </TabsList>

            {/* JOIN GAME TAB */}
            <TabsContent value="join" className="space-y-4 animate-in slide-in-from-left-2 fade-in duration-300 outline-none">
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="player-name" className="text-sm font-semibold text-muted-foreground ml-1">Player Name</label>
                  <Input
                    id="player-name"
                    placeholder="e.g. Lucky Player"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    className="h-12 bg-background/50 border-input/50 focus:ring-primary/50 text-lg transition-all hover:bg-background/80"
                    required
                    data-testid="input-player-name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="game-id" className="text-sm font-semibold text-muted-foreground ml-1">Game ID</label>
                  <Input
                    id="game-id"
                    placeholder="e.g. DEMO123"
                    value={gameId}
                    onChange={e => setGameId(e.target.value.toUpperCase())}
                    className="h-12 bg-background/50 border-input/50 font-mono tracking-widest uppercase text-lg transition-all hover:bg-background/80"
                    required
                    data-testid="input-game-id"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isJoining}
                  className="w-full h-12 text-lg font-bold hover-lift shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all mt-2" 
                  data-testid="button-join-room"
                >
                  {isJoining ? (
                    <span className="flex items-center gap-2">Connecting... <span className="animate-spin">⏳</span></span>
                  ) : "Enter Room"}
                </Button>
              </form>
            </TabsContent>

            {/* HOST GAME TAB */}
            <TabsContent value="create" className="space-y-4 animate-in slide-in-from-right-2 fade-in duration-300 outline-none">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="host-name" className="text-sm font-semibold text-muted-foreground ml-1">Host Name</label>
                  <Input
                    id="host-name"
                    placeholder="e.g. Bingo Master"
                    value={hostName}
                    onChange={e => setHostName(e.target.value)}
                    className="h-12 bg-background/50 border-input/50 text-lg transition-all hover:bg-background/80"
                    required
                    data-testid="input-host-name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="player-limit" className="text-sm font-semibold text-muted-foreground ml-1">Max Players</label>
                  <div className="relative">
                    <select
                      id="player-limit"
                      className="flex h-12 w-full items-center justify-between rounded-md border border-input/50 bg-background/50 px-3 py-2 text-lg ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-background/80 transition-all appearance-none"
                      value={playerLimit}
                      onChange={e => setPlayerLimit(e.target.value)}
                      data-testid="select-player-limit"
                    >
                      <option value="2">2 Players (Duel)</option>
                      <option value="5">5 Players (Small)</option>
                      <option value="10">10 Players (Party)</option>
                      <option value="50">50 Players (Large)</option>
                      <option value="100">100 Players (Huge)</option>
                      <option value="500">500 Players (Massive)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                      ▼
                    </div>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isCreating}
                  className="w-full h-12 text-lg font-bold hover-lift shadow-lg shadow-secondary/20 bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all mt-2" 
                  data-testid="button-create-room"
                >
                  {isCreating ? "Creating Room..." : "Create New Room"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center text-xs font-medium text-muted-foreground/40 animate-in fade-in duration-1000 delay-500">
        <p>v1.0.0 • Render • Neon DB • Vercel</p>
      </div>
    </div>
  );
}