export const BingoCard = ({ card }: { card: BingoCardType }) => {
  const { markNumber, gameState, currentUser } = useGame();
  
  // Refined: Check if THIS specific card is part of a win
  const isWinningCard = gameState.winners.some(w => w.playerId === currentUser.id);

  return (
    <div className={cn(
      "relative overflow-hidden p-4 rounded-2xl border-4 transition-all duration-500",
      isWinningCard 
        ? "border-yellow-400 bg-yellow-50/10 shadow-[0_0_30px_rgba(250,204,21,0.4)] scale-[1.02]" 
        : "border-border bg-card"
    )}>
      {/* Dabber Animation Overlay */}
      <div className="grid grid-cols-5 gap-2">
        {card.numbers.map((num, idx) => {
          const isMarked = card.marked.includes(idx);
          const isMatch = gameState.calledNumbers.includes(num);
          const isFreeSpace = idx === 12;

          return (
            <button
              key={idx}
              disabled={!isMatch && !isFreeSpace}
              onClick={() => markNumber(card.id, num)}
              className={cn(
                "relative aspect-square flex items-center justify-center rounded-full text-lg font-bold transition-all",
                isMarked 
                  ? "text-white scale-95" 
                  : isMatch 
                    ? "bg-primary/20 text-primary animate-pulse cursor-pointer"
                    : "bg-muted/10 text-muted-foreground opacity-50"
              )}
            >
              {/* The "Dabber" Ink Effect */}
              {isMarked && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.8 }}
                  className="absolute inset-0 bg-primary rounded-full -z-10 shadow-inner" 
                />
              )}
              {isFreeSpace ? "★" : num}
            </button>
          );
        })}
      </div>
    </div>
  );
};