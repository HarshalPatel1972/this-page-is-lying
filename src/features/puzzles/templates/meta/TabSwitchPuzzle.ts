import { BasePuzzle } from '../../core/BasePuzzle.js';
import { puzzleRegistry } from '../../core/PuzzleRegistry.js';
import type { PuzzleTemplate } from '../../core/PuzzleRegistry.js';

/**
 * Tab-Switch Puzzle
 *
 * Requires the player to interact with browser tab visibility -- switching
 * away from the tab and returning, staying hidden for a set duration, or
 * rapidly toggling between visible / hidden states.
 *
 * Required actions:
 *   'switch-and-return' - leave the tab and come back at least once
 *   'wait-hidden'       - keep the tab hidden for >= targetDuration ms
 *   'rapid-switch'      - switch tabs >= 3 times within a rolling 5-second window
 */

type RequiredAction = 'switch-and-return' | 'wait-hidden' | 'rapid-switch';

/** Rolling window (ms) in which rapid switches must occur. */
const RAPID_SWITCH_WINDOW = 5000;

/** Minimum number of visibility changes needed for 'rapid-switch'. */
const RAPID_SWITCH_THRESHOLD = 3;

class TabSwitchPuzzle extends BasePuzzle {
  private requiredAction: RequiredAction = 'switch-and-return';
  private targetDuration = 3000;
  private boundVisibilityHandler: (() => void) | null = null;
  /** Timestamps of recent visibility toggles for rapid-switch detection. */
  private switchTimestamps: number[] = [];

  protected setup(): void {
    const params = this.config.parameters;

    this.requiredAction =
      (params.requiredAction as RequiredAction | undefined) ?? 'switch-and-return';
    this.targetDuration = (params.targetDuration as number) ?? 3000;

    this.setCustomState('tabSwitchCount', 0);
    this.setCustomState('totalHiddenTime', 0);
    this.setCustomState('lastHiddenAt', null);
    this.setCustomState('requiredAction', this.requiredAction);
    this.setCustomState('actionCompleted', false);
  }

  protected onStart(): void {
    this.switchTimestamps = [];

    this.setCustomState('tabSwitchCount', 0);
    this.setCustomState('totalHiddenTime', 0);
    this.setCustomState('lastHiddenAt', null);
    this.setCustomState('actionCompleted', false);

    // Attach the visibility-change listener
    this.boundVisibilityHandler = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.boundVisibilityHandler);
  }

  protected verifySolution(_answer: unknown): boolean {
    const tabSwitchCount =
      (this.state.customState.tabSwitchCount as number | undefined) ?? 0;
    const totalHiddenTime =
      (this.state.customState.totalHiddenTime as number | undefined) ?? 0;

    switch (this.requiredAction) {
      case 'switch-and-return':
        return tabSwitchCount >= 1;

      case 'wait-hidden':
        return totalHiddenTime >= this.targetDuration;

      case 'rapid-switch': {
        // Check if there were >= RAPID_SWITCH_THRESHOLD switches within any
        // rolling RAPID_SWITCH_WINDOW-ms window.
        const now = Date.now();
        const recentSwitches = this.switchTimestamps.filter(
          (ts) => now - ts <= RAPID_SWITCH_WINDOW,
        );
        return recentSwitches.length >= RAPID_SWITCH_THRESHOLD;
      }

      default:
        return false;
    }
  }

  protected onCleanup(): void {
    if (this.boundVisibilityHandler) {
      document.removeEventListener(
        'visibilitychange',
        this.boundVisibilityHandler,
      );
      this.boundVisibilityHandler = null;
    }
    this.switchTimestamps = [];
  }

  // ── Private helpers ──────────────────────────────────────────────

  private handleVisibilityChange(): void {
    const now = Date.now();

    if (document.hidden) {
      // Tab just became hidden
      this.setCustomState('lastHiddenAt', now);
    } else {
      // Tab just became visible again
      const lastHiddenAt =
        (this.state.customState.lastHiddenAt as number | null) ?? null;

      if (lastHiddenAt !== null) {
        const hiddenDuration = now - lastHiddenAt;
        const previousTotal =
          (this.state.customState.totalHiddenTime as number | undefined) ?? 0;

        this.setCustomState('totalHiddenTime', previousTotal + hiddenDuration);
        this.setCustomState('lastHiddenAt', null);
      }

      // Increment switch count (a full leave-and-return cycle)
      const previousCount =
        (this.state.customState.tabSwitchCount as number | undefined) ?? 0;
      this.setCustomState('tabSwitchCount', previousCount + 1);

      // Record timestamp for rapid-switch tracking
      this.switchTimestamps.push(now);
      // Prune timestamps outside the rolling window
      this.switchTimestamps = this.switchTimestamps.filter(
        (ts) => now - ts <= RAPID_SWITCH_WINDOW,
      );

      // Check if the required action is now satisfied and flag it
      const satisfied = this.verifySolution(null);
      if (satisfied) {
        this.setCustomState('actionCompleted', true);
      }
    }
  }
}

// ── Template Registration ────────────────────────────────────────────

const template: PuzzleTemplate = {
  id: 'tab-switch',
  category: 'meta',
  name: 'Tab Switch',
  description:
    'The game knows when you leave. Perform the right tab-switching pattern to solve this puzzle.',
  minDifficulty: 1,
  maxDifficulty: 4,
  requiredFeatures: [],
  create: () => new TabSwitchPuzzle(),
};

puzzleRegistry.register(template);

export { TabSwitchPuzzle };
export default template;
