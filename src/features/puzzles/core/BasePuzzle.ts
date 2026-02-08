import type {
  PuzzleConfig,
  PuzzleState,
  PuzzleResult,
  PuzzleHint,
} from "$shared/types/index.js";
import type { IPuzzle } from "./PuzzleInterface.js";

export abstract class BasePuzzle implements IPuzzle {
  protected config!: PuzzleConfig;
  protected state: PuzzleState;
  protected result: PuzzleResult | null = null;

  private stateChangeCallbacks: Array<(state: PuzzleState) => void> = [];
  private completeCallbacks: Array<(result: PuzzleResult) => void> = [];
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private elapsedSeconds = 0;

  constructor() {
    this.state = {
      status: "loading",
      startTime: null,
      endTime: null,
      attempts: 0,
      hintsUsed: 0,
      currentHintIndex: -1,
      customState: {},
    };
  }

  // ── Abstract methods for subclasses ──────────────────────────────

  /** Perform puzzle-specific setup after config is assigned. */
  protected abstract setup(): Promise<void> | void;

  /** Return true if the provided answer is correct. */
  protected abstract verifySolution(answer: unknown): boolean;

  /** Called when the puzzle transitions to the active state. */
  protected abstract onStart(): void;

  /** Called during cleanup for puzzle-specific teardown. */
  protected abstract onCleanup(): void;

  // ── IPuzzle implementation ───────────────────────────────────────

  async init(config: PuzzleConfig): Promise<void> {
    this.config = config;
    this.updateState({ status: "loading" });
    await this.setup();
    this.updateState({ status: "ready" });
  }

  start(): void {
    if (this.state.status !== "ready" && this.state.status !== "paused") {
      return;
    }

    const now = Date.now();

    if (this.state.status === "ready") {
      this.updateState({
        status: "active",
        startTime: now,
      });
      this.elapsedSeconds = 0;
    } else {
      // Resuming from pause – handled by resume(), but start() also works
      this.updateState({ status: "active" });
    }

    this.startTimer();
    this.onStart();
  }

  pause(): void {
    if (this.state.status !== "active") {
      return;
    }

    this.stopTimer();
    this.updateState({ status: "paused" });
  }

  resume(): void {
    if (this.state.status !== "paused") {
      return;
    }

    this.updateState({ status: "active" });
    this.startTimer();
    this.onStart();
  }

  cleanup(): void {
    this.stopTimer();
    this.onCleanup();
    this.stateChangeCallbacks = [];
    this.completeCallbacks = [];
  }

  async checkSolution(answer: unknown): Promise<boolean> {
    if (this.state.status !== "active") {
      return false;
    }

    const attempts = this.state.attempts + 1;
    this.updateState({ attempts });

    const correct = this.verifySolution(answer);

    if (correct) {
      this.completePuzzle(true);
      return true;
    }

    // Check if max attempts exhausted (0 = unlimited)
    if (this.config.maxAttempts > 0 && attempts >= this.config.maxAttempts) {
      this.completePuzzle(false);
    }

    return false;
  }

  getHint(index: number): PuzzleHint | null {
    if (index < 0 || index >= this.config.hints.length) {
      return null;
    }

    // Only allow sequential hint reveals
    if (index > this.state.currentHintIndex + 1) {
      return null;
    }

    if (index > this.state.currentHintIndex) {
      this.updateState({
        hintsUsed: this.state.hintsUsed + 1,
        currentHintIndex: index,
      });
    }

    return this.config.hints[index];
  }

  getState(): PuzzleState {
    return { ...this.state };
  }

  getConfig(): PuzzleConfig {
    return { ...this.config };
  }

  getResult(): PuzzleResult | null {
    return this.result ? { ...this.result } : null;
  }

  onStateChange(callback: (state: PuzzleState) => void): () => void {
    this.stateChangeCallbacks.push(callback);

    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  onComplete(callback: (result: PuzzleResult) => void): () => void {
    this.completeCallbacks.push(callback);

    return () => {
      this.completeCallbacks = this.completeCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  // ── Protected helpers ────────────────────────────────────────────

  /** Merge partial state updates and notify listeners. */
  protected updateState(partial: Partial<PuzzleState>): void {
    this.state = { ...this.state, ...partial };
    const snapshot = this.getState();
    for (const cb of this.stateChangeCallbacks) {
      cb(snapshot);
    }
  }

  /** Update arbitrary custom state values used by subclasses. */
  protected setCustomState(key: string, value: unknown): void {
    this.updateState({
      customState: { ...this.state.customState, [key]: value },
    });
  }

  // ── Private helpers ──────────────────────────────────────────────

  private startTimer(): void {
    this.stopTimer();

    this.timerInterval = setInterval(() => {
      this.elapsedSeconds += 1;

      // Check time limit (0 = unlimited)
      if (
        this.config.timeLimit > 0 &&
        this.elapsedSeconds >= this.config.timeLimit
      ) {
        this.completePuzzle(false);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Calculate the final score.
   *
   * score = baseScore
   *       - (hintsUsed * 10)
   *       - ((attempts - 1) * 5)
   *       + timeBonus
   *
   * Time bonus: if a time limit is set, remaining seconds are added as bonus
   * (1 point per remaining second). Score is clamped to a minimum of 0.
   */
  private calculateScore(solved: boolean): number {
    if (!solved) {
      return 0;
    }

    const { baseScore, timeLimit } = this.config;
    const { hintsUsed, attempts } = this.state;

    const hintPenalty = hintsUsed * 10;
    const attemptPenalty = Math.max(0, (attempts - 1) * 5);
    const timeBonus =
      timeLimit > 0 ? Math.max(0, timeLimit - this.elapsedSeconds) : 0;

    return Math.max(0, baseScore - hintPenalty - attemptPenalty + timeBonus);
  }

  private completePuzzle(solved: boolean): void {
    this.stopTimer();

    const now = Date.now();

    this.updateState({
      status: solved ? "completed" : "failed",
      endTime: now,
    });

    this.result = {
      puzzleId: this.config.metadata.id,
      solved,
      timeSpent: this.elapsedSeconds,
      attempts: this.state.attempts,
      hintsUsed: this.state.hintsUsed,
      score: this.calculateScore(solved),
    };

    const resultSnapshot = { ...this.result };
    for (const cb of this.completeCallbacks) {
      cb(resultSnapshot);
    }
  }
}
