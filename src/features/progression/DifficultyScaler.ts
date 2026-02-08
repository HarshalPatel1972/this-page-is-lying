import type { PuzzleDifficulty, PuzzleResult } from '$shared/types/index.js';

const INCREASE_STREAK = 3;
const DECREASE_STREAK = 2;

export class DifficultyScaler {
  private currentDifficulty: PuzzleDifficulty = 1;
  private consecutiveSolves: number = 0;
  private consecutiveFailures: number = 0;

  recordResult(result: PuzzleResult): void {
    if (result.solved) {
      this.consecutiveSolves++;
      this.consecutiveFailures = 0;
      if (this.consecutiveSolves >= INCREASE_STREAK && this.currentDifficulty < 5) {
        this.currentDifficulty = Math.min(5, this.currentDifficulty + 1) as PuzzleDifficulty;
        this.consecutiveSolves = 0;
      }
    } else {
      this.consecutiveFailures++;
      this.consecutiveSolves = 0;
      if (this.consecutiveFailures >= DECREASE_STREAK && this.currentDifficulty > 1) {
        this.currentDifficulty = Math.max(1, this.currentDifficulty - 1) as PuzzleDifficulty;
        this.consecutiveFailures = 0;
      }
    }
  }

  getCurrentDifficulty(): PuzzleDifficulty {
    return this.currentDifficulty;
  }

  setDifficulty(d: PuzzleDifficulty): void {
    this.currentDifficulty = d;
    this.consecutiveSolves = 0;
    this.consecutiveFailures = 0;
  }

  getScaledTimeLimit(base: number): number {
    // Higher difficulty = less time. Multipliers: 1=1.5, 2=1.25, 3=1.0, 4=0.8, 5=0.6
    const multipliers: Record<PuzzleDifficulty, number> = { 1: 1.5, 2: 1.25, 3: 1.0, 4: 0.8, 5: 0.6 };
    return Math.round(base * multipliers[this.currentDifficulty]);
  }

  getScaledMaxAttempts(base: number): number {
    // Higher difficulty = fewer attempts
    const multipliers: Record<PuzzleDifficulty, number> = { 1: 2.0, 2: 1.5, 3: 1.0, 4: 0.75, 5: 0.5 };
    return Math.max(1, Math.round(base * multipliers[this.currentDifficulty]));
  }

  reset(): void {
    this.currentDifficulty = 1;
    this.consecutiveSolves = 0;
    this.consecutiveFailures = 0;
  }
}
