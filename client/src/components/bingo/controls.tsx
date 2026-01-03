import React, { useState } from "react";
import { useGame } from "@/lib/game-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Play, Pause, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/api-utils";

export const GameControls = () => {
  const { gameState, callNumber, startGame, pauseGame, restartGame, role } = useGame();
  const [isCalling, setIsCalling] = React.useState(false);
  const [autoCallEnabled, setAutoCallEnabled] = useState(false);
  const [autoCallInterval, setAutoCallInterval] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const handleCall = async () => {
    if (isCalling || autoCallEnabled) return;
    setIsCalling(true);
    await callNumber();
    setTimeout(() => setIsCalling(false), 1500);
  };

  const handleStartGame = async () => {
    setIsLoading(true);
    try {
      await startGame();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseGame = async () => {
    setIsLoading(true);
    try {
      await pauseGame();
      // Stop auto-call when pausing
      if (autoCallEnabled) {
        await handleAutoCallToggle(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartGame = async () => {
    setIsLoading(true);
    try {
      // Stop auto-call first
      if (autoCallEnabled) {
        await handleAutoCallToggle(false);
      }
      await restartGame();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoCallToggle = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      if (enabled) {
        await apiRequest("POST", `${getApiUrl()}/api/games/${gameState.gameId}/auto-call/start`, {
          interval: autoCallInterval
        });
        setAutoCallEnabled(true);
      } else {
        await apiRequest("POST", `${getApiUrl()}/api/games/${gameState.gameId}/auto-call/stop`);
        setAutoCallEnabled(false);
      }
    } catch (error) {
      console.error("Auto-call toggle failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntervalChange = async (newInterval: string) => {
    const interval = parseInt(newInterval);
    setAutoCallInterval(interval);

    if (autoCallEnabled) {
      // Restart auto-call with new interval
      await handleAutoCallToggle(false);
      await handleAutoCallToggle(true);
    }
  };

  if (role !== 'host') return null;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm p-4 bg-card rounded-lg border">
      <div className="text-center space-y-1 w-full">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Current Pattern</p>
        <Badge variant="outline" className="text-lg px-4 py-1 border-primary/50 text-primary">
          {gameState.winPattern.toUpperCase()}
        </Badge>
      </div>

      {/* Game State Controls */}
      {gameState.status === "waiting" && (
        <Button
          size="lg"
          onClick={handleStartGame}
          disabled={isLoading}
          className="w-full h-14 rounded-xl text-lg shadow-lg hover:scale-105 transition-all"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <><Play className="mr-2" /> Start Game</>}
        </Button>
      )}

      {gameState.status === "playing" && (
        <>
          {/* Manual Call Button */}
          <Button
            size="lg"
            disabled={isCalling || autoCallEnabled}
            onClick={handleCall}
            className="w-full h-14 rounded-xl text-lg shadow-lg hover:scale-105 transition-all disabled:opacity-50"
          >
            {isCalling ? <Loader2 className="animate-spin" /> : "CALL NEXT NUMBER"}
          </Button>

          {/* Auto-Call Controls */}
          <div className="w-full space-y-3 p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto-Call</label>
              <Switch
                checked={autoCallEnabled}
                onCheckedChange={handleAutoCallToggle}
                disabled={isLoading}
              />
            </div>

            {autoCallEnabled && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Interval</label>
                <Select value={autoCallInterval.toString()} onValueChange={handleIntervalChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground text-center">
                  Auto-calling every {autoCallInterval} seconds
                </p>
              </div>
            )}
          </div>

          {/* Pause Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={handlePauseGame}
            disabled={isLoading}
            className="w-full h-12 rounded-xl hover:scale-105 transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <><Pause className="mr-2" /> Pause Game</>}
          </Button>
        </>
      )}

      {gameState.status === "paused" && (
        <Button
          size="lg"
          onClick={handleStartGame}
          disabled={isLoading}
          className="w-full h-14 rounded-xl text-lg shadow-lg hover:scale-105 transition-all"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <><Play className="mr-2" /> Resume Game</>}
        </Button>
      )}

      {(gameState.status === "finished" || gameState.status === "paused") && (
        <Button
          variant="secondary"
          size="lg"
          onClick={handleRestartGame}
          disabled={isLoading}
          className="w-full h-12 rounded-xl hover:scale-105 transition-all"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <><RotateCcw className="mr-2" /> Restart Game</>}
        </Button>
      )}

      {/* Game Stats */}
      <div className="w-full pt-2 border-t text-center space-y-1">
        <p className="text-xs text-muted-foreground">Numbers Called</p>
        <p className="text-2xl font-bold">{gameState.calledNumbers.length} / 75</p>
      </div>
    </div>
  );
};
