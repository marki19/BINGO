import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, X } from "lucide-react";

interface WinnerCelebrationProps {
  winnerName: string;
  pattern: string;
  onClose: () => void;
}

export const WinnerCelebration = ({ winnerName, pattern, onClose }: WinnerCelebrationProps) => {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    // Auto-close after 10 seconds
    const closeTimer = setTimeout(() => {
      onClose();
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={500}
          recycle={false}
          colors={["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"]}
        />
      )}

      <Card className="relative max-w-md w-full mx-4 p-8 text-center space-y-6 animate-in zoom-in duration-300">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Trophy className="w-12 h-12 text-yellow-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold">🎉 BINGO! 🎉</h1>
          <p className="text-2xl font-semibold text-primary">{winnerName}</p>
          <p className="text-lg text-muted-foreground">
            Won with <span className="font-semibold text-foreground">{pattern}</span>!
          </p>
        </div>

        <div className="pt-4">
          <Button onClick={onClose} size="lg" className="w-full">
            Continue
          </Button>
        </div>
      </Card>
    </div>
  );
};
