import type { PuzzleCategory, PuzzleResult } from '$shared/types/index.js';

interface HistoryEntry {
  templateId: string;
  category: PuzzleCategory;
  result: PuzzleResult;
  timestamp: number;
}

const ALL_CATEGORIES: PuzzleCategory[] = ['console', 'navigation', 'audio', 'visual', 'meta'];

export class PuzzleHistory {
  private history: HistoryEntry[] = [];
  private maxHistory: number = 50;

  record(templateId: string, category: PuzzleCategory, result: PuzzleResult): void {
    this.history.push({ templateId, category, result, timestamp: Date.now() });
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  getRecentTemplateIds(count: number): string[] {
    return this.history.slice(-count).map(e => e.templateId);
  }

  getCategoryStats(): Map<PuzzleCategory, { attempted: number; solved: number; avgScore: number }> {
    const stats = new Map<PuzzleCategory, { attempted: number; solved: number; totalScore: number }>();
    for (const cat of ALL_CATEGORIES) {
      stats.set(cat, { attempted: 0, solved: 0, totalScore: 0 });
    }
    for (const entry of this.history) {
      const s = stats.get(entry.category)!;
      s.attempted++;
      if (entry.result.solved) {
        s.solved++;
        s.totalScore += entry.result.score;
      }
    }
    const result = new Map<PuzzleCategory, { attempted: number; solved: number; avgScore: number }>();
    for (const [cat, s] of stats) {
      result.set(cat, { attempted: s.attempted, solved: s.solved, avgScore: s.attempted > 0 ? s.totalScore / s.attempted : 0 });
    }
    return result;
  }

  getLeastPlayedCategory(): PuzzleCategory {
    const stats = this.getCategoryStats();
    let min = Infinity;
    let result: PuzzleCategory = 'console';
    for (const [cat, s] of stats) {
      if (s.attempted < min) { min = s.attempted; result = cat; }
    }
    return result;
  }

  getWeakestCategory(): PuzzleCategory {
    const stats = this.getCategoryStats();
    let lowestRate = Infinity;
    let result: PuzzleCategory = 'console';
    for (const [cat, s] of stats) {
      const rate = s.attempted > 0 ? s.solved / s.attempted : 0.5;
      if (rate < lowestRate) { lowestRate = rate; result = cat; }
    }
    return result;
  }

  hasPlayedRecently(templateId: string, withinLast: number = 10): boolean {
    const recent = this.history.slice(-withinLast);
    return recent.some(e => e.templateId === templateId);
  }

  clear(): void {
    this.history = [];
  }
}
