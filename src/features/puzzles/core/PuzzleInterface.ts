import type {
  PuzzleConfig,
  PuzzleState,
  PuzzleResult,
  PuzzleHint,
} from "$shared/types/index.js";

export interface IPuzzle {
  init(config: PuzzleConfig): Promise<void>;
  start(): void;
  pause(): void;
  resume(): void;
  cleanup(): void;
  checkSolution(answer: unknown): Promise<boolean>;
  getHint(index: number): PuzzleHint | null;
  getState(): PuzzleState;
  getConfig(): PuzzleConfig;
  getResult(): PuzzleResult | null;
  onStateChange(callback: (state: PuzzleState) => void): () => void;
  onComplete(callback: (result: PuzzleResult) => void): () => void;
}
