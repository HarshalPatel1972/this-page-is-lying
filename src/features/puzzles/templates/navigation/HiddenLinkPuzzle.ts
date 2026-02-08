import { BasePuzzle } from '../../core/BasePuzzle.js';
import { puzzleRegistry } from '../../core/PuzzleRegistry.js';
import type { PuzzleTemplate } from '../../core/PuzzleRegistry.js';

/**
 * HiddenLinkPuzzle
 *
 * An invisible link is concealed somewhere on the page using a CSS hiding
 * technique. The player must locate the link and submit its URL.
 *
 * Supported hide methods: opacity, overflow, tiny-font, same-color.
 */
export class HiddenLinkPuzzle extends BasePuzzle {
  protected setup(): void {
    const hiddenUrl = this.config.parameters.hiddenUrl as string;
    const hideMethod = (this.config.parameters.hideMethod as string | undefined) ?? 'opacity';

    this.setCustomState('hiddenUrl', hiddenUrl);
    this.setCustomState('hideMethod', hideMethod);
  }

  protected verifySolution(answer: unknown): boolean {
    const expected = this.config.parameters.hiddenUrl as string;
    if (typeof answer !== 'string') return false;
    return answer.trim().toLowerCase() === expected.trim().toLowerCase();
  }

  protected onStart(): void {
    const url = this.state.customState?.hiddenUrl as string;
    const method = this.state.customState?.hideMethod as string;

    this.setCustomState('rendered', true);
    this.setCustomState('activeCssMethod', method);
    this.setCustomState('targetUrl', url);
  }

  protected onCleanup(): void {
    this.setCustomState('rendered', false);
  }
}

// ── Template & Registration ──────────────────────────────────────────────

export const hiddenLinkTemplate: PuzzleTemplate = {
  id: 'hidden-link',
  category: 'navigation',
  name: 'Hidden Link',
  description: 'Find an invisible link concealed with CSS tricks',
  minDifficulty: 1,
  maxDifficulty: 4,
  requiredFeatures: [],
  create: () => new HiddenLinkPuzzle(),
};

export default hiddenLinkTemplate;

puzzleRegistry.register(hiddenLinkTemplate);
