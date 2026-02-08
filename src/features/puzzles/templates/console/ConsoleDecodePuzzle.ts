import { BasePuzzle } from '../../core/BasePuzzle.js';
import { puzzleRegistry } from '../../core/PuzzleRegistry.js';
import type { PuzzleTemplate } from '../../core/PuzzleRegistry.js';

/**
 * ConsoleDecodePuzzle
 *
 * A coded message appears in the browser console. The player must decode it
 * using the specified encoding scheme and submit the original plaintext.
 *
 * Supported encodings: caesar, reverse, base64, binary.
 */
export class ConsoleDecodePuzzle extends BasePuzzle {
  protected setup(): void {
    const message = this.config.parameters.message as string;
    const encoding = (this.config.parameters.encoding as string | undefined) ?? 'caesar';

    const encoded = this.encode(message, encoding);

    this.setCustomState('encodedMessage', encoded);
    this.setCustomState('encoding', encoding);
    this.setCustomState('originalMessage', message);
  }

  protected verifySolution(answer: unknown): boolean {
    const expected = this.config.parameters.message as string;
    if (typeof answer !== 'string') return false;
    return answer.toLowerCase() === expected.toLowerCase();
  }

  protected onStart(): void {
    const encoded = this.state.customState?.encodedMessage;
    const encoding = this.state.customState?.encoding;
    console.log(`[PUZZLE] Encoded message (${encoding}): ${encoded}`);
  }

  protected onCleanup(): void {
    // No persistent resources to clean up
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private encode(message: string, encoding: string): string {
    switch (encoding) {
      case 'caesar':
        return this.caesarEncode(message);
      case 'reverse':
        return this.reverseEncode(message);
      case 'base64':
        return this.base64Encode(message);
      case 'binary':
        return this.binaryEncode(message);
      default:
        return message;
    }
  }

  private caesarEncode(message: string): string {
    const shift = (this.config.parameters.shift as number | undefined) ?? 3;
    return message
      .split('')
      .map((ch) => {
        if (/[a-z]/.test(ch)) {
          return String.fromCharCode(((ch.charCodeAt(0) - 97 + shift) % 26) + 97);
        }
        if (/[A-Z]/.test(ch)) {
          return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65);
        }
        return ch;
      })
      .join('');
  }

  private reverseEncode(message: string): string {
    return message.split('').reverse().join('');
  }

  private base64Encode(message: string): string {
    return btoa(message);
  }

  private binaryEncode(message: string): string {
    return message
      .split('')
      .map((ch) => ch.charCodeAt(0).toString(2).padStart(8, '0'))
      .join(' ');
  }
}

// ── Template & Registration ──────────────────────────────────────────────

export const consoleDecodeTemplate: PuzzleTemplate = {
  id: 'console-decode',
  category: 'console',
  name: 'Console Decode',
  description: 'Decode a CSS-styled message from the browser console',
  minDifficulty: 1,
  maxDifficulty: 5,
  requiredFeatures: [],
  create: () => new ConsoleDecodePuzzle(),
};

export default consoleDecodeTemplate;

puzzleRegistry.register(consoleDecodeTemplate);
