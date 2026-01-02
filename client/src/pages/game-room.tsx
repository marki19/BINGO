import React, { useEffect } from "react";
import { useGame } from "@/lib/game-state";
import { NumberBoard } from "@/components/bingo/board";
import { BingoCard } from "@/components/bingo/card";
import { CurrentNumber } from "@/components/bingo/current-number";
import { PlayerList } from "@/components/bingo/player-list";
import { Button } from "@/components/ui/button";
import { Trophy, LogOut } from "lucide-react";

export default function GameRoom() {
  const { gameState, myCards, claimBingo, exitGame } = useGame();

  // Mobile Keyboard Viewport Fix
  useEffect(() => {
    const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    window.addEventListener('resize', setVh);
    setVh();
    return () => window.removeEventListener('resize', setVh);
  }, []);

  if (!gameState.gameId) return <div className="h-screen flex items-center justify-center font-bold">Connecting...</div>;

  return (
    <div className="flex flex-col h-[calc(var(--vh,1vh)*100)] bg-background overflow-hidden">
      <header className="p-4 border-b flex justify-between items-center bg-card z-10">
        <h1 className="font-black text-2xl tracking-tighter text-primary">BINGO MAX</h1>
        <Button variant="ghost" size="sm" onClick={exitGame}><LogOut className="w-4 h-4 mr-2"/> Exit</Button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-32">
        <div className="max-w-5xl mx-auto space-y-12">
          <CurrentNumber />
          
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div className="space-y-12">
              <div className="flex flex-wrap gap-6 justify-center">
                {myCards.map(card => <BingoCard key={card.id} card={card} />)}
              </div>
              <div className="pt-8 border-t">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Game Board</h3>
                <NumberBoard />
              </div>
            </div>
            
            <aside className="hidden lg:block space-y-6">
              <PlayerList />
            </aside>
          </div>
        </div>
      </main>

      {/* Floating Bingo Button for all devices */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <Button 
          size="lg" 
          className="h-20 w-20 rounded-full shadow-2xl animate-winner hover:scale-110 transition-transform"
          onClick={claimBingo}
        >
          <Trophy className="h-10 w-10" />
        </Button>
      </div>
    </div>
  );
}