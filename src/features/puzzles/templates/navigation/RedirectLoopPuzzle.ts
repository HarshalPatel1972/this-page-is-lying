import { BasePuzzle } from '../../core/BasePuzzle.js';
import { puzzleRegistry } from '../../core/PuzzleRegistry.js';
import type { PuzzleTemplate } from '../../core/PuzzleRegistry.js';

/**
 * RedirectLoopPuzzle
 *
 * The player is caught in a redirect loop cycling through a sequence of URLs.
 * They must discover and submit the break code that halts the loop.
 */
export class RedirectLoopPuzzle extends BasePuzzle {
  protected setup(): void {
    const sequence = (this.config.parameters.sequence as string[] | undefined) ?? [];
    const breakCode = this.config.parameters.breakCode as string;

    this.setCustomState('sequence', sequence);
    this.setCustomState('breakCode', breakCode);
    this.setCustomState('currentIndex', 0);
    this.setCustomState('navigationAttempts', 0);
    this.setCustomState('visitedUrls', [] as string[]);
  }

  protected verifySolution(answer: unknown): boolean {
    const expected = this.config.parameters.breakCode as string;
    if (typeof answer !== 'string') return false;
    return answer === expected;
  }

  protected onStart(): void {
    const sequence = this.state.customState?.sequence as string[];

    if (sequence && sequence.length > 0) {
      this.advanceLoop();
    }
  }

  protected onCleanup(): void {
    this.setCustomState('currentIndex', 0);
    this.setCustomState('navigationAttempts', 0);
    this.setCustomState('visitedUrls', []);
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private advanceLoop(): void {
    const sequence = this.state.customState?.sequence as string[];
    const currentIndex = (this.state.customState?.currentIndex as number) ?? 0;
    const attempts = (this.state.customState?.navigationAttempts as number) ?? 0;
    const visited = (this.state.customState?.visitedUrls as string[]) ?? [];

    const nextUrl = sequence[currentIndex % sequence.length];
    const nextIndex = (currentIndex + 1) % sequence.length;

    this.setCustomState('currentIndex', nextIndex);
    this.setCustomState('navigationAttempts', attempts + 1);
    this.setCustomState('visitedUrls', [...visited, nextUrl]);
    this.setCustomState('currentUrl', nextUrl);
  }
}

// ── Template & Registration ──────────────────────────────────────────────

export const redirectLoopTemplate: PuzzleTemplate = {
  id: 'redirect-loop',
  category: 'navigation',
  name: 'Redirect Loop',
  description: 'Break free from a cycling redirect sequence',
  minDifficulty: 3,
  maxDifficulty: 5,
  requiredFeatures: [],
  create: () => new RedirectLoopPuzzle(),
};

export default redirectLoopTemplate;

puzzleRegistry.register(redirectLoopTemplate);
