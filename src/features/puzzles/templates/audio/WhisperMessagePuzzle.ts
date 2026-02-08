import { BasePuzzle } from '../../core/BasePuzzle.js';
import { puzzleRegistry } from '../../core/PuzzleRegistry.js';
import type { PuzzleTemplate } from '../../core/PuzzleRegistry.js';

/**
 * WhisperMessagePuzzle
 *
 * A near-silent whisper plays at an extremely low volume. The player must
 * identify and submit the whispered message. Verification is lenient:
 * case-insensitive with collapsed whitespace.
 */
export class WhisperMessagePuzzle extends BasePuzzle {
  protected setup(): void {
    const message = this.config.parameters.message as string;
    const volume = (this.config.parameters.volume as number | undefined) ?? 0.05;

    this.setCustomState('message', message);
    this.setCustomState('volume', Math.max(0.01, Math.min(0.1, volume)));
  }

  protected verifySolution(answer: unknown): boolean {
    const expected = this.config.parameters.message as string;
    if (typeof answer !== 'string') return false;

    const normalize = (s: string): string =>
      s.trim().replace(/\s+/g, ' ').toLowerCase();

    return normalize(answer) === normalize(expected);
  }

  protected onStart(): void {
    const volume = this.state.customState?.volume as number;

    this.setCustomState('whisperActive', true);
    this.setCustomState('playbackVolume', volume);
  }

  protected onCleanup(): void {
    this.setCustomState('whisperActive', false);
  }
}

// ── Template & Registration ──────────────────────────────────────────────

export const whisperMessageTemplate: PuzzleTemplate = {
  id: 'whisper-message',
  category: 'audio',
  name: 'Whisper Message',
  description: 'Identify a near-silent whispered message',
  minDifficulty: 1,
  maxDifficulty: 3,
  requiredFeatures: ['audio'],
  create: () => new WhisperMessagePuzzle(),
};

export default whisperMessageTemplate;

puzzleRegistry.register(whisperMessageTemplate);
