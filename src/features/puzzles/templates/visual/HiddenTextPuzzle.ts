import { BasePuzzle } from '../../core/BasePuzzle.js';
import { puzzleRegistry } from '../../core/PuzzleRegistry.js';
import type { PuzzleTemplate } from '../../core/PuzzleRegistry.js';

/**
 * Hidden Text Puzzle
 *
 * A word or phrase is concealed within the page using CSS tricks such as
 * color-matching the background, micro-sized text, invisible Unicode
 * characters, or overflow clipping. The player must discover and submit
 * the hidden text.
 */

type HidingTechnique =
  | 'color-match'
  | 'micro-text'
  | 'unicode-invisible'
  | 'overflow-hidden';

class HiddenTextPuzzle extends BasePuzzle {
  private hiddenWord = '';
  private technique: HidingTechnique = 'color-match';

  protected setup(): void {
    const params = this.config.parameters;

    this.hiddenWord = (params.hiddenWord as string) ?? '';
    this.technique =
      (params.technique as HidingTechnique | undefined) ?? 'color-match';

    // Persist technique metadata so the renderer can apply the right concealment
    this.setCustomState('technique', this.technique);
    this.setCustomState('wordLength', this.hiddenWord.length);
    this.setCustomState('found', false);
  }

  protected onStart(): void {
    // Expose technique type and a location hint so the rendering layer
    // can decide how to present clues to the player.
    this.setCustomState('technique', this.technique);
    this.setCustomState('found', false);

    const locationHints: Record<HidingTechnique, string> = {
      'color-match':
        'The text is hiding in plain sight -- try selecting everything on the page.',
      'micro-text':
        'Look very closely. Some text might be smaller than you think.',
      'unicode-invisible':
        'Not all characters are visible. Try copying and pasting suspicious areas.',
      'overflow-hidden':
        'Some content has been clipped. Try resizing or inspecting containers.',
    };

    this.setCustomState(
      'locationHint',
      locationHints[this.technique] ?? 'Look carefully.',
    );
  }

  protected verifySolution(answer: unknown): boolean {
    if (typeof answer !== 'string') {
      return false;
    }

    const normalised = answer.trim().toLowerCase();
    const target = this.hiddenWord.trim().toLowerCase();

    const isCorrect = normalised === target;

    if (isCorrect) {
      this.setCustomState('found', true);
    }

    return isCorrect;
  }

  protected onCleanup(): void {
    // No external resources to tear down
  }
}

// ── Template Registration ────────────────────────────────────────────

const template: PuzzleTemplate = {
  id: 'hidden-text',
  category: 'visual',
  name: 'Hidden Text',
  description:
    'Text is concealed via CSS trickery. Uncover and type the hidden word to solve the puzzle.',
  minDifficulty: 1,
  maxDifficulty: 4,
  requiredFeatures: [],
  create: () => new HiddenTextPuzzle(),
};

puzzleRegistry.register(template);

export { HiddenTextPuzzle };
export default template;
