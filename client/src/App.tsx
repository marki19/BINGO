import React from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { GameProvider } from "@/lib/game-state";
import Home from "@/pages/home";
import GameRoom from "@/pages/game-room";
import NotFound from "@/pages/not-found";

// Error Boundary with new "Glass" styling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Error Boundary caught:", error);
    setTimeout(() => {
      this.setState({ hasError: false });
    }, 1000);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
          <div className="bg-card p-8 rounded-xl border shadow-sm text-center space-y-6 max-w-sm w-full animate-in zoom-in duration-300">
            <div className="text-6xl animate-bounce">🔄</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold tracking-tight">Reconnecting...</h2>
              <p className="text-muted-foreground text-sm">Restoring your game session...</p>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game/:gameId" component={GameRoom} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <GameProvider>
          <Router />
          <Toaster />
        </GameProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;