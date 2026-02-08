import { BasePuzzle } from '../../core/BasePuzzle.js';
import { puzzleRegistry } from '../../core/PuzzleRegistry.js';
import type { PuzzleTemplate } from '../../core/PuzzleRegistry.js';

/**
 * Spot-the-Difference Puzzle
 *
 * Two nearly identical screens are presented with subtle visual differences.
 * The player must identify all differences by submitting their IDs.
 * Difficulty scales the number of hidden differences from 2 (level 1) to 6 (level 5).
 */

interface Difference {
  id: string;
  description: string;
}

/** Maps difficulty level (1-5) to the number of differences required. */
const DIFFICULTY_DIFFERENCE_COUNT: Record<number, number> = {
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
};

class SpotTheDifferencePuzzle extends BasePuzzle {
  private requiredDifferenceIds: Set<string> = new Set();

  protected setup(): void {
    const params = this.config.parameters;
    const difficulty = this.config.metadata.difficulty;

    // Parse configured differences or fall back to difficulty-based count
    const differences = (params.differences ?? []) as Difference[];
    const totalDifferences =
      differences.length > 0
        ? differences.length
        : DIFFICULTY_DIFFERENCE_COUNT[difficulty] ?? 3;

    // Store computed total back into parameters for external consumers
    params.totalDifferences = totalDifferences;

    // Build the set of IDs that must all be found
    this.requiredDifferenceIds = new Set(differences.map((d) => d.id));

    // Initialise tracking in custom state
    this.setCustomState('foundDifferences', [] as string[]);
    this.setCustomState('totalDifferences', totalDifferences);
    this.setCustomState('remainingDifferences', totalDifferences);
  }

  protected onStart(): void {
    // Reset found tracking on each start / resume
    this.setCustomState('foundDifferences', [] as string[]);
    this.setCustomState('remainingDifferences', this.requiredDifferenceIds.size);
  }

  protected verifySolution(answer: unknown): boolean {
    if (!Array.isArray(answer)) {
      return false;
    }

    const submittedIds: string[] = answer.filter(
      (entry): entry is string => typeof entry === 'string',
    );

    const submittedSet = new Set(submittedIds);

    // Record which new differences the player found this attempt
    const previouslyFound = new Set(
      (this.state.customState.foundDifferences as string[] | undefined) ?? [],
    );

    for (const id of submittedIds) {
      if (this.requiredDifferenceIds.has(id)) {
        previouslyFound.add(id);
      }
    }

    this.setCustomState('foundDifferences', Array.from(previouslyFound));
    this.setCustomState(
      'remainingDifferences',
      this.requiredDifferenceIds.size - previouslyFound.size,
    );

    // All required IDs must be present (order-independent)
    if (submittedSet.size < this.requiredDifferenceIds.size) {
      return false;
    }

    for (const requiredId of this.requiredDifferenceIds) {
      if (!submittedSet.has(requiredId)) {
        return false;
      }
    }

    return true;
  }

  protected onCleanup(): void {
    this.requiredDifferenceIds.clear();
  }
}

// ── Template Registration ────────────────────────────────────────────

const template: PuzzleTemplate = {
  id: 'spot-difference',
  category: 'visual',
  name: 'Spot the Difference',
  description:
    'Two similar screens hide subtle differences. Find them all before time runs out.',
  minDifficulty: 1,
  maxDifficulty: 5,
  requiredFeatures: [],
  create: () => new SpotTheDifferencePuzzle(),
};

puzzleRegistry.register(template);

export { SpotTheDifferencePuzzle };
export default template;
