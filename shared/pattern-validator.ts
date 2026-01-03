/**
 * Shared Pattern Validator for Bingo Win Conditions
 * Used by both client and server to validate wins against selected patterns
 */

export type PatternName =
  | "line"
  | "column"
  | "diagonal"
  | "four-corners"
  | "x-pattern"
  | "plus-pattern"
  | "frame"
  | "blackout"
  | "t-pattern"
  | "l-pattern"
  | "small-diamond";

/**
 * Pattern definitions with winning index combinations
 * Index mapping for 5x5 grid:
 *  0   1   2   3   4  (B column)
 *  5   6   7   8   9  (I column)
 * 10  11  12  13  14  (N column, 12 = FREE)
 * 15  16  17  18  19  (G column)
 * 20  21  22  23  24  (O column)
 */
export const PATTERNS: Record<PatternName, number[] | number[][]> = {
  // Any horizontal row (5 patterns, win if ANY match)
  line: [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24]
  ],

  // Any vertical column (5 patterns, win if ANY match)
  column: [
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24]
  ],

  // Either diagonal (2 patterns, win if ANY match)
  diagonal: [
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20]
  ],

  // All four corner cells
  "four-corners": [0, 4, 20, 24],

  // Both diagonals together
  "x-pattern": [0, 4, 6, 8, 12, 16, 18, 20, 24],

  // Middle row and middle column
  "plus-pattern": [2, 7, 10, 11, 12, 13, 14, 17, 22],

  // Outer border only
  frame: [0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24],

  // All 25 cells
  blackout: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],

  // Letter T shape
  "t-pattern": [0, 1, 2, 3, 4, 7, 12, 17, 22],

  // Letter L shape
  "l-pattern": [0, 5, 10, 15, 20, 21, 22, 23, 24],

  // Diamond shape in center
  "small-diamond": [2, 6, 8, 12, 16, 18, 22]
};

/**
 * Pattern display names for UI
 */
export const PATTERN_NAMES: Record<PatternName, string> = {
  line: "Any Line",
  column: "Any Column",
  diagonal: "Diagonal",
  "four-corners": "Four Corners",
  "x-pattern": "X Pattern",
  "plus-pattern": "Plus Pattern",
  frame: "Frame",
  blackout: "Blackout",
  "t-pattern": "T Pattern",
  "l-pattern": "L Pattern",
  "small-diamond": "Small Diamond"
};

/**
 * Pattern descriptions for UI
 */
export const PATTERN_DESCRIPTIONS: Record<PatternName, string> = {
  line: "Complete any horizontal row",
  column: "Complete any vertical column",
  diagonal: "Complete either diagonal",
  "four-corners": "Mark all four corner cells",
  "x-pattern": "Complete both diagonals",
  "plus-pattern": "Complete middle row and column",
  frame: "Mark the outer border",
  blackout: "Mark all 25 cells",
  "t-pattern": "Complete a T shape",
  "l-pattern": "Complete an L shape",
  "small-diamond": "Complete diamond in center"
};

/**
 * Pattern categories for organized display
 */
export const PATTERN_CATEGORIES = {
  standard: ["line", "column", "diagonal", "four-corners"] as PatternName[],
  advanced: ["x-pattern", "plus-pattern", "frame", "blackout"] as PatternName[],
  fun: ["t-pattern", "l-pattern", "small-diamond"] as PatternName[]
};

export interface Card {
  numbers: number[];
  marked: number[];
}

/**
 * Validates if a card has a winning pattern
 * @param card - Card with numbers and marked indices
 * @param calledNumbers - Array of numbers that have been called
 * @param pattern - Pattern to validate against
 * @returns true if the card has the winning pattern
 */
export function validateWin(
  card: Card,
  calledNumbers: number[],
  pattern: PatternName
): boolean {
  const patternDef = PATTERNS[pattern];

  // Helper: Check if a single pattern (array of indices) is complete
  const checkPattern = (indices: number[]): boolean => {
    return indices.every(idx => {
      // Index 12 is FREE space - always considered marked
      if (idx === 12) return true;

      // Check if the number at this index has been called
      const numberAtIndex = card.numbers[idx];
      return calledNumbers.includes(numberAtIndex);
    });
  };

  // Handle multi-pattern types (line, column, diagonal)
  if (Array.isArray(patternDef[0])) {
    // Multiple winning combinations - check if ANY match
    return (patternDef as number[][]).some(combo => checkPattern(combo));
  } else {
    // Single winning combination
    return checkPattern(patternDef as number[]);
  }
}

/**
 * Check if a card has a winning pattern based on marked indices (client-side)
 * @param markedIndices - Array of marked cell indices (0-24)
 * @param pattern - Pattern to validate against
 * @returns true if the marked indices match the pattern
 */
export function validateMarked(
  markedIndices: number[],
  pattern: PatternName
): boolean {
  const patternDef = PATTERNS[pattern];

  // Helper: Check if a single pattern (array of indices) is marked
  const checkPattern = (indices: number[]): boolean => {
    return indices.every(idx => markedIndices.includes(idx));
  };

  // Handle multi-pattern types (line, column, diagonal)
  if (Array.isArray(patternDef[0])) {
    // Multiple winning combinations - check if ANY match
    return (patternDef as number[][]).some(combo => checkPattern(combo));
  } else {
    // Single winning combination
    return checkPattern(patternDef as number[]);
  }
}
