import { BasePuzzle } from '../../core/BasePuzzle.js';
import { puzzleRegistry } from '../../core/PuzzleRegistry.js';
import type { PuzzleTemplate } from '../../core/PuzzleRegistry.js';

/**
 * Glitch Pattern Puzzle
 *
 * A numeric or symbolic pattern (e.g. "3-7-1-4") flashes briefly during
 * simulated screen-glitch effects. The player must observe the pattern
 * during its fleeting appearances and submit the exact sequence.
 *
 * Difficulty scaling:
 *   - Longer patterns at higher difficulty levels
 *   - Shorter display durations (less time to read)
 *   - Faster glitch intervals (more disorienting)
 */

class GlitchPatternPuzzle extends BasePuzzle {
  private pattern = '';
  private glitchInterval = 3000;
  private displayDuration = 800;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  protected setup(): void {
    const params = this.config.parameters;

    this.pattern = (params.pattern as string) ?? '';
    this.glitchInterval = (params.glitchInterval as number) ?? 3000;
    this.displayDuration = (params.displayDuration as number) ?? 800;

    // Initialise custom state for the rendering layer
    this.setCustomState('patternVisible', false);
    this.setCustomState('glitchActive', false);
    this.setCustomState('glitchCount', 0);
    this.setCustomState('patternLength', this.pattern.length);
  }

  protected onStart(): void {
    this.setCustomState('patternVisible', false);
    this.setCustomState('glitchActive', false);
    this.setCustomState('glitchCount', 0);

    // Begin the periodic glitch cycle
    this.scheduleGlitchCycle();
  }

  protected verifySolution(answer: unknown): boolean {
    if (typeof answer !== 'string') {
      return false;
    }

    return answer.trim() === this.pattern.trim();
  }

  protected onCleanup(): void {
    this.clearScheduledTimers();
    this.setCustomState('patternVisible', false);
    this.setCustomState('glitchActive', false);
  }

  // ── Private helpers ──────────────────────────────────────────────

  /**
   * Creates an interval that triggers a "glitch" at regular intervals.
   * Each glitch briefly shows the hidden pattern, then hides it again.
   */
  private scheduleGlitchCycle(): void {
    // Clear any previous cycle
    this.clearScheduledTimers();

    // Fire the first glitch immediately, then repeat
    this.triggerGlitch();

    this.intervalHandle = setInterval(() => {
      this.triggerGlitch();
    }, this.glitchInterval);
  }

  /** Show the pattern for `displayDuration` ms, then hide it. */
  private triggerGlitch(): void {
    const currentCount =
      (this.state.customState.glitchCount as number | undefined) ?? 0;

    this.setCustomState('glitchActive', true);
    this.setCustomState('patternVisible', true);
    this.setCustomState('glitchCount', currentCount + 1);

    this.timeoutHandle = setTimeout(() => {
      this.setCustomState('patternVisible', false);
      this.setCustomState('glitchActive', false);
      this.timeoutHandle = null;
    }, this.displayDuration);
  }

  /** Clean up all outstanding timers. */
  private clearScheduledTimers(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    if (this.timeoutHandle !== null) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }
}

// ── Template Registration ────────────────────────────────────────────

const template: PuzzleTemplate = {
  id: 'glitch-pattern',
  category: 'visual',
  name: 'Glitch Pattern',
  description:
    'A secret pattern flashes during glitch effects. Observe carefully and reproduce the sequence.',
  minDifficulty: 2,
  maxDifficulty: 5,
  requiredFeatures: [],
  create: () => new GlitchPatternPuzzle(),
};

puzzleRegistry.register(template);

export { GlitchPatternPuzzle };
export default template;
