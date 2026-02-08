import { BasePuzzle } from '../../core/BasePuzzle.js';
import { puzzleRegistry } from '../../core/PuzzleRegistry.js';
import type { PuzzleTemplate } from '../../core/PuzzleRegistry.js';

/**
 * FrequencyDecodePuzzle
 *
 * A sequence of audio frequencies is played. Each frequency maps to a
 * character via a provided frequency map. The player must decode the
 * sequence and submit the resulting message.
 */
export class FrequencyDecodePuzzle extends BasePuzzle {
  protected setup(): void {
    const frequencyMap = (this.config.parameters.frequencyMap as Record<number, string> | undefined) ?? {};
    const sequence = (this.config.parameters.sequence as number[] | undefined) ?? [];

    this.setCustomState('frequencyMap', frequencyMap);
    this.setCustomState('sequence', sequence);

    // Pre-compute the expected decoded message
    const decodedMessage = sequence
      .map((freq) => frequencyMap[freq] ?? '?')
      .join('');
    this.setCustomState('decodedMessage', decodedMessage);
  }

  protected verifySolution(answer: unknown): boolean {
    const frequencyMap = (this.config.parameters.frequencyMap as Record<number, string> | undefined) ?? {};
    const sequence = (this.config.parameters.sequence as number[] | undefined) ?? [];

    const expected = sequence
      .map((freq) => frequencyMap[freq] ?? '?')
      .join('');

    if (typeof answer !== 'string') return false;
    return answer.toLowerCase() === expected.toLowerCase();
  }

  protected onStart(): void {
    const sequence = this.state.customState?.sequence as number[];

    this.setCustomState('playbackActive', true);
    this.setCustomState('currentFrequencyIndex', 0);
    this.setCustomState('totalFrequencies', sequence?.length ?? 0);
  }

  protected onCleanup(): void {
    this.setCustomState('playbackActive', false);
    this.setCustomState('currentFrequencyIndex', 0);
  }
}

// ── Template & Registration ──────────────────────────────────────────────

export const frequencyDecodeTemplate: PuzzleTemplate = {
  id: 'frequency-decode',
  category: 'audio',
  name: 'Frequency Decode',
  description: 'Decode a message from a sequence of audio frequencies',
  minDifficulty: 2,
  maxDifficulty: 5,
  requiredFeatures: ['audio'],
  create: () => new FrequencyDecodePuzzle(),
};

export default frequencyDecodeTemplate;

puzzleRegistry.register(frequencyDecodeTemplate);
