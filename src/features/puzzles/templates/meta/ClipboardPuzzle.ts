import { BasePuzzle } from '../../core/BasePuzzle.js';
import { puzzleRegistry } from '../../core/PuzzleRegistry.js';
import type { PuzzleTemplate } from '../../core/PuzzleRegistry.js';

/**
 * Clipboard Puzzle
 *
 * The player is shown corrupted text on screen (the `displayText`). The
 * original, uncorrupted text is the answer they must deduce and submit.
 *
 * Corruption types:
 *   'reverse'  - the original text reversed character-by-character
 *   'shift'    - each character shifted by a fixed offset in char-code space
 *   'replace'  - specific characters systematically swapped for others
 *
 * For example, if the original is "HELLO" and the corruption type is
 * 'reverse', the displayed text would be "OLLEH". The player must work
 * backwards from the corrupted form to recover the original.
 */

type CorruptionType = 'reverse' | 'shift' | 'replace';

class ClipboardPuzzle extends BasePuzzle {
  private originalText = '';
  private corruptionType: CorruptionType = 'reverse';
  private displayText = '';

  protected setup(): void {
    const params = this.config.parameters;

    this.originalText = (params.originalText as string) ?? '';
    this.corruptionType =
      (params.corruptionType as CorruptionType | undefined) ?? 'reverse';
    this.displayText = (params.displayText as string) ?? '';

    // If no explicit displayText was provided, generate it deterministically
    if (!this.displayText && this.originalText) {
      this.displayText = ClipboardPuzzle.corrupt(
        this.originalText,
        this.corruptionType,
      );
      // Persist the computed display text so external systems can render it
      this.config.parameters.displayText = this.displayText;
    }

    this.setCustomState('displayText', this.displayText);
    this.setCustomState('corruptionType', this.corruptionType);
    this.setCustomState('solved', false);
  }

  protected onStart(): void {
    this.setCustomState('displayText', this.displayText);
    this.setCustomState('corruptionType', this.corruptionType);
    this.setCustomState('solved', false);
  }

  protected verifySolution(answer: unknown): boolean {
    if (typeof answer !== 'string') {
      return false;
    }

    const normalised = answer.trim().toLowerCase();
    const target = this.originalText.trim().toLowerCase();

    const isCorrect = normalised === target;

    if (isCorrect) {
      this.setCustomState('solved', true);
    }

    return isCorrect;
  }

  protected onCleanup(): void {
    // No external resources to tear down
  }

  // ── Static corruption helpers ────────────────────────────────────

  /**
   * Produce a corrupted version of `text` using the given corruption
   * algorithm. This is used both for generating displayText at setup
   * time and can be reused by rendering code.
   */
  static corrupt(text: string, type: CorruptionType): string {
    switch (type) {
      case 'reverse':
        return ClipboardPuzzle.corruptReverse(text);
      case 'shift':
        return ClipboardPuzzle.corruptShift(text);
      case 'replace':
        return ClipboardPuzzle.corruptReplace(text);
      default:
        return text;
    }
  }

  /** Reverse the entire string character-by-character. */
  private static corruptReverse(text: string): string {
    return [...text].reverse().join('');
  }

  /**
   * Shift each alphabetic character forward by 3 positions (Caesar cipher),
   * wrapping around Z->A / z->a. Non-alpha characters are untouched.
   */
  private static corruptShift(text: string, offset = 3): string {
    return [...text]
      .map((ch) => {
        const code = ch.charCodeAt(0);

        // Uppercase A-Z
        if (code >= 65 && code <= 90) {
          return String.fromCharCode(((code - 65 + offset) % 26) + 65);
        }
        // Lowercase a-z
        if (code >= 97 && code <= 122) {
          return String.fromCharCode(((code - 97 + offset) % 26) + 97);
        }

        return ch;
      })
      .join('');
  }

  /**
   * Replace common characters with visually similar substitutes:
   *   a -> @, e -> 3, i -> 1, o -> 0, s -> $, t -> 7
   */
  private static corruptReplace(text: string): string {
    const replacements: Record<string, string> = {
      a: '@',
      e: '3',
      i: '1',
      o: '0',
      s: '$',
      t: '7',
      A: '@',
      E: '3',
      I: '1',
      O: '0',
      S: '$',
      T: '7',
    };

    return [...text].map((ch) => replacements[ch] ?? ch).join('');
  }
}

// ── Template Registration ────────────────────────────────────────────

const template: PuzzleTemplate = {
  id: 'clipboard-puzzle',
  category: 'meta',
  name: 'Clipboard Corruption',
  description:
    'The text on screen has been corrupted. Decode the original message and type it to break the curse.',
  minDifficulty: 2,
  maxDifficulty: 5,
  requiredFeatures: [],
  create: () => new ClipboardPuzzle(),
};

puzzleRegistry.register(template);

export { ClipboardPuzzle };
export default template;
