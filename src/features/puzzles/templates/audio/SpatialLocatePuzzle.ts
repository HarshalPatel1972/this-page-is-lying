import { BasePuzzle } from '../../core/BasePuzzle.js';
import { puzzleRegistry } from '../../core/PuzzleRegistry.js';
import type { PuzzleTemplate } from '../../core/PuzzleRegistry.js';

/**
 * SpatialLocatePuzzle
 *
 * A sound source is placed somewhere in 3D space. The player must listen
 * and identify which spatial quadrant the sound originates from.
 *
 * Valid quadrants: front-left, front-right, back-left, back-right, above, below.
 */
export class SpatialLocatePuzzle extends BasePuzzle {
  protected setup(): void {
    const position = this.config.parameters.position as { x: number; y: number; z: number };
    const quadrant = this.config.parameters.quadrant as string;

    this.setCustomState('position', position);
    this.setCustomState('quadrant', quadrant);
  }

  protected verifySolution(answer: unknown): boolean {
    const expected = this.config.parameters.quadrant as string;
    if (typeof answer !== 'string') return false;
    return answer.toLowerCase() === expected.toLowerCase();
  }

  protected onStart(): void {
    const position = this.state.customState?.position as {
      x: number;
      y: number;
      z: number;
    };

    this.setCustomState('audioActive', true);
    this.setCustomState('sourcePosition', position);
  }

  protected onCleanup(): void {
    this.setCustomState('audioActive', false);
  }
}

// ── Template & Registration ──────────────────────────────────────────────

export const spatialLocateTemplate: PuzzleTemplate = {
  id: 'spatial-locate',
  category: 'audio',
  name: 'Spatial Locate',
  description: 'Identify the spatial quadrant of a 3D sound source',
  minDifficulty: 1,
  maxDifficulty: 4,
  requiredFeatures: ['audio'],
  create: () => new SpatialLocatePuzzle(),
};

export default spatialLocateTemplate;

puzzleRegistry.register(spatialLocateTemplate);
