import { BasePuzzle } from '../../core/BasePuzzle.js';
import { puzzleRegistry } from '../../core/PuzzleRegistry.js';
import type { PuzzleTemplate } from '../../core/PuzzleRegistry.js';

/**
 * HiddenVariablePuzzle
 *
 * A variable is exposed on the global `window` object. The player must find
 * it (e.g. via the browser console) and report its value exactly.
 */
export class HiddenVariablePuzzle extends BasePuzzle {
  protected setup(): void {
    const variableName = this.config.parameters.variableName as string;
    const variableValue = this.config.parameters.variableValue;

    this.setCustomState('variableName', variableName);
    this.setCustomState('variableValue', variableValue);
  }

  protected verifySolution(answer: unknown): boolean {
    const expected = String(this.config.parameters.variableValue);
    if (typeof answer !== 'string') return false;
    return answer === expected;
  }

  protected onStart(): void {
    const name = this.state.customState?.variableName as string;
    const value = this.state.customState?.variableValue;

    if (typeof globalThis !== 'undefined') {
      (globalThis as Record<string, unknown>)[name] = value;
    }
  }

  protected onCleanup(): void {
    const name = this.state.customState?.variableName as string;

    if (typeof globalThis !== 'undefined' && name) {
      delete (globalThis as Record<string, unknown>)[name];
    }
  }
}

// ── Template & Registration ──────────────────────────────────────────────

export const hiddenVariableTemplate: PuzzleTemplate = {
  id: 'hidden-variable',
  category: 'console',
  name: 'Hidden Variable',
  description: 'Find a secret variable exposed on the global window object',
  minDifficulty: 2,
  maxDifficulty: 5,
  requiredFeatures: [],
  create: () => new HiddenVariablePuzzle(),
};

export default hiddenVariableTemplate;

puzzleRegistry.register(hiddenVariableTemplate);
