import type { IPuzzle } from "./PuzzleInterface.js";
import type { PuzzleCategory } from "$shared/types/index.js";

export interface PuzzleTemplate {
  id: string;
  category: PuzzleCategory;
  name: string;
  description: string;
  minDifficulty: number;
  maxDifficulty: number;
  requiredFeatures: string[];
  create: () => IPuzzle;
}

class PuzzleRegistry {
  private templates: Map<string, PuzzleTemplate> = new Map();

  /** Register a puzzle template. Throws if a template with the same id already exists. */
  register(template: PuzzleTemplate): void {
    if (this.templates.has(template.id)) {
      throw new Error(
        `PuzzleRegistry: template with id "${template.id}" is already registered.`,
      );
    }
    this.templates.set(template.id, template);
  }

  /** Remove a template by id. Returns true if it existed. */
  unregister(id: string): boolean {
    return this.templates.delete(id);
  }

  /** Retrieve a single template by id, or undefined if not found. */
  get(id: string): PuzzleTemplate | undefined {
    return this.templates.get(id);
  }

  /** Return all templates belonging to a given category. */
  getByCategory(category: PuzzleCategory): PuzzleTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.category === category,
    );
  }

  /** Return every registered template. */
  getAll(): PuzzleTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Instantiate a puzzle from a registered template.
   * Throws if the template id is not found.
   */
  createInstance(templateId: string): IPuzzle {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(
        `PuzzleRegistry: no template found with id "${templateId}".`,
      );
    }
    return template.create();
  }

  /**
   * Return templates whose requiredFeatures are all present in the
   * supplied feature list.
   */
  getCompatible(features: string[]): PuzzleTemplate[] {
    const featureSet = new Set(features);
    return Array.from(this.templates.values()).filter((t) =>
      t.requiredFeatures.every((f) => featureSet.has(f)),
    );
  }

  /**
   * Return templates whose difficulty range overlaps with the given
   * [min, max] range (inclusive).
   */
  getByDifficulty(min: number, max: number): PuzzleTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.maxDifficulty >= min && t.minDifficulty <= max,
    );
  }
}

export const puzzleRegistry = new PuzzleRegistry();
