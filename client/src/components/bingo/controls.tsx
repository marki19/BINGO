export const GameControls = () => {
  const { gameState, callNumber, role } = useGame();
  const [isCalling, setIsCalling] = React.useState(false);

  const handleCall = async () => {
    if (isCalling) return;
    setIsCalling(true);
    await callNumber();
    // 1.5s cooldown to prevent double-calls during lag spikes
    setTimeout(() => setIsCalling(false), 1500);
  };

  if (role !== 'host') return null;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Current Pattern</p>
        <Badge variant="outline" className="text-lg px-4 py-1 border-primary/50 text-primary">
          {gameState.winPattern.toUpperCase()}
        </Badge>
      </div>

      <Button 
        size="lg" 
        disabled={gameState.status !== 'playing' || isCalling}
        onClick={handleCall}
        className="w-full h-16 rounded-2xl text-xl shadow-xl hover-elevate transition-transform active:scale-95"
      >
        {isCalling ? <Loader2 className="animate-spin" /> : "CALL NEXT NUMBER"}
      </Button>
    </div>
  );
};