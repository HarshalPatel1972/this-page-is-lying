import type { PuzzleResult } from '$shared/types/index.js';

export class SessionManager {
  private sessionId: string;
  private startTime: number;
  private puzzleResults: PuzzleResult[] = [];
  private totalScore: number = 0;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.startTime = Date.now();
  }

  recordResult(result: PuzzleResult): void {
    this.puzzleResults.push(result);
    if (result.solved) {
      this.totalScore += result.score;
    }
  }

  getSessionDuration(): number {
    return Date.now() - this.startTime;
  }

  getResults(): PuzzleResult[] {
    return [...this.puzzleResults];
  }

  getTotalScore(): number {
    return this.totalScore;
  }

  getAverageTimePerPuzzle(): number {
    if (this.puzzleResults.length === 0) return 0;
    const total = this.puzzleResults.reduce((sum, r) => sum + r.timeSpent, 0);
    return total / this.puzzleResults.length;
  }

  getSuccessRate(): number {
    if (this.puzzleResults.length === 0) return 0;
    const solved = this.puzzleResults.filter(r => r.solved).length;
    return solved / this.puzzleResults.length;
  }

  getSummary(): {
    sessionId: string;
    duration: number;
    puzzlesAttempted: number;
    puzzlesSolved: number;
    totalScore: number;
    averageTime: number;
    successRate: number;
  } {
    return {
      sessionId: this.sessionId,
      duration: this.getSessionDuration(),
      puzzlesAttempted: this.puzzleResults.length,
      puzzlesSolved: this.puzzleResults.filter(r => r.solved).length,
      totalScore: this.totalScore,
      averageTime: this.getAverageTimePerPuzzle(),
      successRate: this.getSuccessRate()
    };
  }

  reset(): void {
    this.puzzleResults = [];
    this.totalScore = 0;
    this.startTime = Date.now();
  }
}
