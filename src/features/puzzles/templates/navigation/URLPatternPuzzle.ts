import { BasePuzzle } from '../../core/BasePuzzle.js';
import { puzzleRegistry } from '../../core/PuzzleRegistry.js';
import type { PuzzleTemplate } from '../../core/PuzzleRegistry.js';

/**
 * URLPatternPuzzle
 *
 * The current URL contains encoded clues. The player must decode the URL
 * fragment or query parameter to discover the hidden answer.
 *
 * Supported encoding types: base64, hex, rot13, url-encoded.
 */
export class URLPatternPuzzle extends BasePuzzle {
  protected setup(): void {
    const pattern = this.config.parameters.pattern as string;
    const answer = this.config.parameters.answer as string;
    const encodingType = (this.config.parameters.encodingType as string | undefined) ?? 'base64';

    this.setCustomState('pattern', pattern);
    this.setCustomState('answer', answer);
    this.setCustomState('encodingType', encodingType);
    this.setCustomState('encodedClue', this.encodeClue(answer, encodingType));
  }

  protected verifySolution(answer: unknown): boolean {
    const expected = this.config.parameters.answer as string;
    if (typeof answer !== 'string') return false;
    return answer.toLowerCase() === expected.toLowerCase();
  }

  protected onStart(): void {
    const encodedClue = this.state.customState?.encodedClue as string;
    const encodingType = this.state.customState?.encodingType as string;

    this.setCustomState('active', true);
    this.setCustomState('hint', `The URL contains a ${encodingType}-encoded clue: ${encodedClue}`);
  }

  protected onCleanup(): void {
    this.setCustomState('active', false);
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private encodeClue(value: string, encodingType: string): string {
    switch (encodingType) {
      case 'base64':
        return btoa(value);
      case 'hex':
        return this.toHex(value);
      case 'rot13':
        return this.rot13(value);
      case 'url-encoded':
        return encodeURIComponent(value);
      default:
        return value;
    }
  }

  private toHex(value: string): string {
    return value
      .split('')
      .map((ch) => ch.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  }

  private rot13(value: string): string {
    return value.replace(/[a-zA-Z]/g, (ch) => {
      const base = ch <= 'Z' ? 65 : 97;
      return String.fromCharCode(((ch.charCodeAt(0) - base + 13) % 26) + base);
    });
  }
}

// ── Template & Registration ──────────────────────────────────────────────

export const urlPatternTemplate: PuzzleTemplate = {
  id: 'url-pattern',
  category: 'navigation',
  name: 'URL Pattern',
  description: 'Decode a hidden message from URL path segments',
  minDifficulty: 2,
  maxDifficulty: 5,
  requiredFeatures: [],
  create: () => new URLPatternPuzzle(),
};

export default urlPatternTemplate;

puzzleRegistry.register(urlPatternTemplate);
