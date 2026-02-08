import type {
  PuzzleCategory,
  PuzzleDifficulty,
  PuzzleResult,
} from "$shared/types/index.js";

export interface PuzzleHistoryEntry {
  templateId: string;
  category: PuzzleCategory;
  difficulty: PuzzleDifficulty;
  result: PuzzleResult;
  timestamp: number;
}

export interface ProgressionStats {
  totalSolved: number;
  totalAttempted: number;
  avgTime: number;
  bestCategory: PuzzleCategory | null;
  longestStreak: number;
  currentStreak: number;
  categoryBreakdown: Record<
    PuzzleCategory,
    { solved: number; attempted: number }
  >;
}

class ProgressionManager {
  private history: PuzzleHistoryEntry[] = [];
  private currentDifficulty: PuzzleDifficulty = 1;
  private currentStreak = 0;
  private longestStreak = 0;

  /**
   * Number of consecutive solves required before difficulty increases.
   */
  private readonly solveThresholdForIncrease = 3;

  /**
   * Number of consecutive failures required before difficulty decreases.
   */
  private readonly failThresholdForDecrease = 2;

  /** Counter for consecutive solves (resets on failure). */
  private consecutiveSolves = 0;

  /** Counter for consecutive failures (resets on solve). */
  private consecutiveFailures = 0;

  // ── Public API ───────────────────────────────────────────────────

  /** Record the result of a completed puzzle. */
  recordResult(
    templateId: string,
    category: PuzzleCategory,
    difficulty: PuzzleDifficulty,
    result: PuzzleResult,
  ): void {
    this.history.push({
      templateId,
      category,
      difficulty,
      result,
      timestamp: Date.now(),
    });

    if (result.solved) {
      this.currentStreak += 1;
      this.consecutiveSolves += 1;
      this.consecutiveFailures = 0;

      if (this.currentStreak > this.longestStreak) {
        this.longestStreak = this.currentStreak;
      }

      this.adaptDifficultyAfterSolve();
    } else {
      this.currentStreak = 0;
      this.consecutiveFailures += 1;
      this.consecutiveSolves = 0;

      this.adaptDifficultyAfterFailure();
    }
  }

  /** Return the current adaptive difficulty level. */
  getDifficulty(): PuzzleDifficulty {
    return this.currentDifficulty;
  }

  /** Manually override the difficulty (clamped to 1-5). */
  setDifficulty(d: PuzzleDifficulty): void {
    this.currentDifficulty = clampDifficulty(d);
  }

  /** Get the full puzzle history. */
  getHistory(): PuzzleHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Suggest the next category to play for variety.
   * Returns the category with the fewest recent plays, rotating
   * through all categories evenly.
   */
  suggestNextCategory(): PuzzleCategory {
    const allCategories: PuzzleCategory[] = [
      "console",
      "navigation",
      "audio",
      "visual",
      "meta",
    ];

    // Count plays in the recent window (last 10 puzzles)
    const recentWindow = this.history.slice(-10);
    const counts = new Map<PuzzleCategory, number>();

    for (const cat of allCategories) {
      counts.set(cat, 0);
    }

    for (const entry of recentWindow) {
      counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
    }

    // Return category with lowest count (ties broken by order)
    let bestCategory = allCategories[0];
    let bestCount = counts.get(bestCategory) ?? 0;

    for (const cat of allCategories) {
      const count = counts.get(cat) ?? 0;
      if (count < bestCount) {
        bestCategory = cat;
        bestCount = count;
      }
    }

    return bestCategory;
  }

  /** Aggregate statistics across all recorded puzzles. */
  getStats(): ProgressionStats {
    const totalAttempted = this.history.length;
    const solved = this.history.filter((e) => e.result.solved);
    const totalSolved = solved.length;

    const avgTime =
      totalSolved > 0
        ? solved.reduce((sum, e) => sum + e.result.timeSpent, 0) / totalSolved
        : 0;

    // Build category breakdown
    const allCategories: PuzzleCategory[] = [
      "console",
      "navigation",
      "audio",
      "visual",
      "meta",
    ];

    const categoryBreakdown = {} as Record<
      PuzzleCategory,
      { solved: number; attempted: number }
    >;

    for (const cat of allCategories) {
      const catEntries = this.history.filter((e) => e.category === cat);
      categoryBreakdown[cat] = {
        solved: catEntries.filter((e) => e.result.solved).length,
        attempted: catEntries.length,
      };
    }

    // Best category = highest solve count
    let bestCategory: PuzzleCategory | null = null;
    let bestSolveCount = 0;

    for (const cat of allCategories) {
      if (categoryBreakdown[cat].solved > bestSolveCount) {
        bestSolveCount = categoryBreakdown[cat].solved;
        bestCategory = cat;
      }
    }

    return {
      totalSolved,
      totalAttempted,
      avgTime: Math.round(avgTime * 100) / 100,
      bestCategory,
      longestStreak: this.longestStreak,
      currentStreak: this.currentStreak,
      categoryBreakdown,
    };
  }

  /** Reset all progression data. */
  reset(): void {
    this.history = [];
    this.currentDifficulty = 1;
    this.currentStreak = 0;
    this.longestStreak = 0;
    this.consecutiveSolves = 0;
    this.consecutiveFailures = 0;
  }

  // ── Private helpers ──────────────────────────────────────────────

  /** Increase difficulty after N consecutive solves. */
  private adaptDifficultyAfterSolve(): void {
    if (this.consecutiveSolves >= this.solveThresholdForIncrease) {
      this.currentDifficulty = clampDifficulty(
        (this.currentDifficulty + 1) as PuzzleDifficulty,
      );
      this.consecutiveSolves = 0;
    }
  }

  /** Decrease difficulty after N consecutive failures. */
  private adaptDifficultyAfterFailure(): void {
    if (this.consecutiveFailures >= this.failThresholdForDecrease) {
      this.currentDifficulty = clampDifficulty(
        (this.currentDifficulty - 1) as PuzzleDifficulty,
      );
      this.consecutiveFailures = 0;
    }
  }
}

/** Clamp a numeric difficulty value to the valid 1-5 range. */
function clampDifficulty(value: number): PuzzleDifficulty {
  return Math.min(5, Math.max(1, Math.round(value))) as PuzzleDifficulty;
}

export const progressionManager = new ProgressionManager();
