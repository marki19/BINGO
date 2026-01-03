import React, { useState } from "react";
import { PATTERNS, PATTERN_NAMES, PATTERN_DESCRIPTIONS, PATTERN_CATEGORIES, type PatternName } from "@shared/pattern-validator";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/api-utils";
import { useGame } from "@/lib/game-state";
import { Check } from "lucide-react";

export const PatternSelector = () => {
  const { gameState } = useGame();
  const [selectedPattern, setSelectedPattern] = useState<PatternName>(gameState.winPattern as PatternName);
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePatternSelect = async (pattern: PatternName) => {
    if (gameState.status !== "waiting") return;

    setIsUpdating(true);
    try {
      await apiRequest("PATCH", `${getApiUrl()}/api/games/${gameState.gameId}/pattern`, {
        pattern
      });
      setSelectedPattern(pattern);
    } catch (error) {
      console.error("Failed to update pattern:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Generate visual representation of pattern
  const renderPatternGrid = (pattern: PatternName) => {
    const patternDef = PATTERNS[pattern];
    let activeIndices: number[] = [];

    if (Array.isArray(patternDef[0])) {
      // Use first combination for multi-pattern types
      activeIndices = patternDef[0] as number[];
    } else {
      activeIndices = patternDef as number[];
    }

    return (
      <div className="grid grid-cols-5 gap-0.5 w-16 h-16 mx-auto">
        {Array.from({ length: 25 }).map((_, idx) => {
          const isActive = activeIndices.includes(idx);
          const isFree = idx === 12;

          return (
            <div
              key={idx}
              className={`aspect-square rounded-sm flex items-center justify-center text-[8px] ${
                isActive
                  ? "bg-primary/80 text-primary-foreground"
                  : "bg-muted/30"
              }`}
            >
              {isFree && "F"}
            </div>
          );
        })}
      </div>
    );
  };

  const renderPatternCategory = (categoryName: string, patterns: PatternName[]) => (
    <div key={categoryName} className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {categoryName}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {patterns.map((pattern) => {
          const isSelected = selectedPattern === pattern;
          const isDisabled = gameState.status !== "waiting" || isUpdating;

          return (
            <Card
              key={pattern}
              onClick={() => !isDisabled && handlePatternSelect(pattern)}
              className={`p-3 cursor-pointer transition-all duration-200 relative ${
                isSelected
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:ring-2 hover:ring-primary/50 hover:scale-105"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              )}

              {renderPatternGrid(pattern)}

              <div className="mt-2 text-center">
                <p className="text-xs font-semibold">{PATTERN_NAMES[pattern]}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {PATTERN_DESCRIPTIONS[pattern]}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6 p-4 bg-card rounded-lg border">
      <div className="text-center">
        <h2 className="text-lg font-bold">Select Win Pattern</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {gameState.status === "waiting"
            ? "Choose the pattern players need to complete"
            : "Pattern locked after game starts"}
        </p>
      </div>

      {renderPatternCategory("Standard", PATTERN_CATEGORIES.standard)}
      {renderPatternCategory("Advanced", PATTERN_CATEGORIES.advanced)}
      {renderPatternCategory("Fun Patterns", PATTERN_CATEGORIES.fun)}
    </div>
  );
};
