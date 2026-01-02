export const NumberBoard = () => {
  const { gameState, stageNumber, role } = useGame();
  
  // Visual Polish: Highlight the very last called number differently
  const lastNumber = gameState.calledNumbers[gameState.calledNumbers.length - 1];

  return (
    <div className="grid grid-cols-15 gap-1 p-2 bg-black/20 rounded-lg">
      {Array.from({ length: 75 }, (_, i) => i + 1).map((num) => {
        const isCalled = gameState.calledNumbers.includes(num);
        const isLatest = num === lastNumber;

        return (
          <motion.div
            key={num}
            animate={isLatest ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
            className={cn(
              "text-xs flex items-center justify-center aspect-square rounded-sm border transition-all",
              isCalled 
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                : "bg-muted/30 text-muted-foreground border-transparent"
            )}
          >
            {num}
          </motion.div>
        );
      })}
    </div>
  );
};