import type { IPuzzle } from "./PuzzleInterface.js";
import type {
  PuzzleConfig,
  PuzzleCategory,
  PuzzleDifficulty,
} from "$shared/types/index.js";
import { puzzleRegistry } from "./PuzzleRegistry.js";
import type { PuzzleTemplate } from "./PuzzleRegistry.js";

export interface GenerateOptions {
  category?: PuzzleCategory;
  difficulty?: PuzzleDifficulty;
  excludeTemplates?: string[];
  excludeCategories?: PuzzleCategory[];
  preferredTemplates?: string[];
}

export interface GeneratedPuzzle {
  puzzle: IPuzzle;
  config: PuzzleConfig;
}

class PuzzleGenerator {
  /** Ids of recently used templates, most-recent last. */
  private recentlyUsed: string[] = [];

  /** Maximum number of recently-used entries tracked for de-duplication. */
  private readonly recentHistorySize = 10;

  /**
   * Generate a puzzle instance with a difficulty-scaled PuzzleConfig.
   *
   * 1. Filters templates by category, difficulty, and exclusion lists.
   * 2. Weights preferred templates and penalises recently-used ones.
   * 3. Builds a PuzzleConfig whose numeric parameters are scaled by difficulty.
   */
  generate(options: GenerateOptions = {}): GeneratedPuzzle {
    const template = this.selectTemplate(options);
    const difficulty = options.difficulty ?? 3;
    const config = this.buildConfig(template, difficulty);
    const puzzle = template.create();

    this.trackUsage(template.id);

    return { puzzle, config };
  }

  /** Reset recently-used tracking. */
  resetHistory(): void {
    this.recentlyUsed = [];
  }

  // ── Private helpers ──────────────────────────────────────────────

  private selectTemplate(options: GenerateOptions): PuzzleTemplate {
    const {
      category,
      difficulty = 3,
      excludeTemplates = [],
      excludeCategories = [],
      preferredTemplates = [],
    } = options;

    const excludeTemplateSet = new Set(excludeTemplates);
    const excludeCategorySet = new Set(excludeCategories);
    const preferredSet = new Set(preferredTemplates);

    let candidates = puzzleRegistry.getAll();

    // Filter by category
    if (category) {
      candidates = candidates.filter((t) => t.category === category);
    }

    // Exclude specific templates
    candidates = candidates.filter((t) => !excludeTemplateSet.has(t.id));

    // Exclude categories
    candidates = candidates.filter((t) => !excludeCategorySet.has(t.category));

    // Filter by difficulty range
    candidates = candidates.filter(
      (t) => difficulty >= t.minDifficulty && difficulty <= t.maxDifficulty,
    );

    if (candidates.length === 0) {
      throw new Error("PuzzleGenerator: no templates match the given options.");
    }

    // Score each candidate: preferred bonus, recently-used penalty
    const scored = candidates.map((t) => {
      let score = 1;

      if (preferredSet.has(t.id)) {
        score += 3;
      }

      const recentIndex = this.recentlyUsed.indexOf(t.id);
      if (recentIndex !== -1) {
        // More recent = larger penalty
        score -= (recentIndex + 1) / this.recentlyUsed.length;
      }

      return { template: t, score: Math.max(score, 0.1) };
    });

    // Weighted random selection
    const totalScore = scored.reduce((sum, s) => sum + s.score, 0);
    let roll = Math.random() * totalScore;

    for (const entry of scored) {
      roll -= entry.score;
      if (roll <= 0) {
        return entry.template;
      }
    }

    // Fallback (should not reach here due to float precision)
    return scored[scored.length - 1].template;
  }

  /**
   * Build a PuzzleConfig for the selected template, scaling numeric
   * parameters by the requested difficulty.
   *
   * Difficulty scaling:
   *   - baseScore increases with difficulty (100 * difficulty)
   *   - maxAttempts decreases with difficulty (6 - difficulty, min 1; 0 keeps unlimited)
   *   - timeLimit decreases with difficulty (base 120s, -15s per difficulty step above 1)
   *   - hints count decreases at higher difficulties
   *   - estimatedTime scales up slightly with difficulty
   */
  private buildConfig(
    template: PuzzleTemplate,
    difficulty: PuzzleDifficulty,
  ): PuzzleConfig {
    const puzzleId = `${template.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const baseScore = 100 * difficulty;
    const maxAttempts = Math.max(1, 6 - difficulty);
    const timeLimit = Math.max(30, 120 - (difficulty - 1) * 15);
    const estimatedTime = Math.round(30 + difficulty * 15);

    // Provide fewer hints at higher difficulties
    const hintCount = Math.max(1, 4 - Math.floor(difficulty / 2));
    const hints = Array.from({ length: hintCount }, (_, i) => ({
      text: `Hint ${i + 1}`,
      cost: 10 * (i + 1),
      revealAfterSeconds: 30 * (i + 1),
    }));

    return {
      metadata: {
        id: puzzleId,
        templateId: template.id,
        category: template.category,
        difficulty,
        title: template.name,
        description: template.description,
        estimatedTime,
        tags: [],
        requiresFeatures: template.requiredFeatures,
      },
      hints,
      maxAttempts,
      timeLimit,
      baseScore,
      parameters: {},
    };
  }

  private trackUsage(templateId: string): void {
    // Remove if already tracked, then push to end
    this.recentlyUsed = this.recentlyUsed.filter((id) => id !== templateId);
    this.recentlyUsed.push(templateId);

    if (this.recentlyUsed.length > this.recentHistorySize) {
      this.recentlyUsed.shift();
    }
  }
}

export const puzzleGenerator = new PuzzleGenerator();
