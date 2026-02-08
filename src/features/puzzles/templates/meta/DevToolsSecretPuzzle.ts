import { BasePuzzle } from '../../core/BasePuzzle.js';
import { puzzleRegistry } from '../../core/PuzzleRegistry.js';
import type { PuzzleTemplate } from '../../core/PuzzleRegistry.js';

/**
 * DevTools Secret Puzzle
 *
 * A secret code is only revealed when the player opens their browser's
 * Developer Tools. Detection uses the outer-vs-inner window dimension
 * delta heuristic: a significant difference between `window.outerWidth`
 * and `window.innerWidth` (or the height equivalents) strongly suggests
 * that a docked DevTools panel is open.
 *
 * Once DevTools are detected the secret code is "revealed" in custom
 * state, allowing the rendering layer to display it (e.g. in the
 * console, in an element visible only in the inspector, etc.).
 */

/** Pixel threshold for the outer-minus-inner delta to count as DevTools open. */
const DEVTOOLS_THRESHOLD = 160;

/** How often (ms) to sample the window dimensions. */
const POLL_INTERVAL = 500;

class DevToolsSecretPuzzle extends BasePuzzle {
  private secretCode = '';
  private pollHandle: ReturnType<typeof setInterval> | null = null;
  private boundResizeHandler: (() => void) | null = null;

  protected setup(): void {
    const params = this.config.parameters;

    this.secretCode = (params.secretCode as string) ?? '';

    this.setCustomState('devtoolsDetected', false);
    this.setCustomState('revealed', false);
    this.setCustomState('revealedCode', null);
  }

  protected onStart(): void {
    this.setCustomState('devtoolsDetected', false);
    this.setCustomState('revealed', false);
    this.setCustomState('revealedCode', null);

    // Start detection via resize listener + polling fallback
    this.boundResizeHandler = this.checkDevTools.bind(this);
    window.addEventListener('resize', this.boundResizeHandler);

    this.pollHandle = setInterval(() => {
      this.checkDevTools();
    }, POLL_INTERVAL);

    // Run an immediate check in case DevTools are already open
    this.checkDevTools();
  }

  protected verifySolution(answer: unknown): boolean {
    if (typeof answer !== 'string') {
      return false;
    }

    return answer.trim() === this.secretCode.trim();
  }

  protected onCleanup(): void {
    if (this.boundResizeHandler) {
      window.removeEventListener('resize', this.boundResizeHandler);
      this.boundResizeHandler = null;
    }

    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  // ── Private helpers ──────────────────────────────────────────────

  /**
   * Heuristic: if the difference between outerWidth and innerWidth (or
   * outerHeight and innerHeight) exceeds a threshold, DevTools is
   * likely docked to the side or bottom.
   */
  private checkDevTools(): void {
    // Skip if already revealed -- no need to keep polling
    if (this.state.customState.revealed === true) {
      return;
    }

    const widthDelta = window.outerWidth - window.innerWidth;
    const heightDelta = window.outerHeight - window.innerHeight;

    const devtoolsOpen =
      widthDelta > DEVTOOLS_THRESHOLD || heightDelta > DEVTOOLS_THRESHOLD;

    if (devtoolsOpen) {
      this.setCustomState('devtoolsDetected', true);
      this.setCustomState('revealed', true);
      this.setCustomState('revealedCode', this.secretCode);
    }
  }
}

// ── Template Registration ────────────────────────────────────────────

const template: PuzzleTemplate = {
  id: 'devtools-secret',
  category: 'meta',
  name: 'DevTools Secret',
  description:
    'A hidden code can only be found by opening the browser Developer Tools. Inspect to reveal.',
  minDifficulty: 2,
  maxDifficulty: 5,
  requiredFeatures: [],
  create: () => new DevToolsSecretPuzzle(),
};

puzzleRegistry.register(template);

export { DevToolsSecretPuzzle };
export default template;
