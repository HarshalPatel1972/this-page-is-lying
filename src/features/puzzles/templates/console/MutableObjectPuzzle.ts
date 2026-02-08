import { BasePuzzle } from '../../core/BasePuzzle.js';
import { puzzleRegistry } from '../../core/PuzzleRegistry.js';
import type { PuzzleTemplate } from '../../core/PuzzleRegistry.js';

/**
 * MutableObjectPuzzle
 *
 * An object mutates over time through a scheduled series of property changes.
 * The player must observe the object and report the final value of the
 * target property after all mutations have completed.
 */
export class MutableObjectPuzzle extends BasePuzzle {
  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

  protected setup(): void {
    const mutations = (this.config.parameters.mutations as Array<{ property: string; value: unknown; delayMs: number }> | undefined) ?? [];
    const targetProperty = this.config.parameters.targetProperty as string;

    this.setCustomState('mutations', mutations);
    this.setCustomState('targetProperty', targetProperty);
    this.setCustomState('mutableObject', {});
  }

  protected verifySolution(answer: unknown): boolean {
    const targetProperty = this.config.parameters.targetProperty as string;
    const mutations = (this.config.parameters.mutations as Array<{ property: string; value: unknown; delayMs: number }> | undefined) ?? [];

    // Compute the definitive final value by replaying mutations in delay order
    const sorted = [...mutations].sort((a, b) => a.delayMs - b.delayMs);
    let finalValue: unknown;
    for (const mutation of sorted) {
      if (mutation.property === targetProperty) {
        finalValue = mutation.value;
      }
    }

    if (typeof answer !== 'string') return false;
    return answer === String(finalValue);
  }

  protected onStart(): void {
    const mutations: Array<{ property: string; value: unknown; delayMs: number }> =
      (this.state.customState?.mutations as Array<{ property: string; value: unknown; delayMs: number }>) ?? [];

    this.pendingTimeouts = [];

    for (const mutation of mutations) {
      const timeoutId = setTimeout(() => {
        const current =
          (this.state.customState?.mutableObject as Record<string, unknown>) ?? {};
        const updated = { ...current, [mutation.property]: mutation.value };
        this.setCustomState('mutableObject', updated);
      }, mutation.delayMs);

      this.pendingTimeouts.push(timeoutId);
    }
  }

  protected onCleanup(): void {
    for (const timeoutId of this.pendingTimeouts) {
      clearTimeout(timeoutId);
    }
    this.pendingTimeouts = [];
  }
}

// ── Template & Registration ──────────────────────────────────────────────

export const mutableObjectTemplate: PuzzleTemplate = {
  id: 'mutable-object',
  category: 'console',
  name: 'Mutable Object',
  description: 'Observe a mutating object and report the final value',
  minDifficulty: 3,
  maxDifficulty: 5,
  requiredFeatures: [],
  create: () => new MutableObjectPuzzle(),
};

export default mutableObjectTemplate;

puzzleRegistry.register(mutableObjectTemplate);
