// Game State Types

export type GamePhase =
  | "idle"
  | "trigger-warning"
  | "initializing"
  | "playing"
  | "puzzle-active"
  | "puzzle-transition"
  | "paused"
  | "game-over";

export interface GameState {
  phase: GamePhase;
  tensionLevel: number; // 0-10
  puzzlesSolved: number;
  currentPuzzleId: string | null;
  sessionId: string | null;
  currentStreak: number;
  totalScore: number;
  hasInteracted: boolean; // sticky activation tracking
}

// Accessibility Types
export interface AccessibilitySettings {
  reducedMotion: boolean;
  noAudio: boolean;
  noJumpscares: boolean;
  noStrobes: boolean;
  highContrast: boolean;
  screenReaderMode: boolean;
}

// Puzzle Types
export type PuzzleCategory =
  | "console"
  | "navigation"
  | "audio"
  | "visual"
  | "meta";

export type PuzzleDifficulty = 1 | 2 | 3 | 4 | 5;

export interface PuzzleMetadata {
  id: string;
  templateId: string;
  category: PuzzleCategory;
  difficulty: PuzzleDifficulty;
  title: string;
  description: string;
  estimatedTime: number;
  tags: string[];
  requiresFeatures: string[];
}

export interface PuzzleState {
  status: "loading" | "ready" | "active" | "paused" | "completed" | "failed";
  startTime: number | null;
  endTime: number | null;
  attempts: number;
  hintsUsed: number;
  currentHintIndex: number;
  customState: Record<string, unknown>;
}

export interface PuzzleHint {
  text: string;
  cost: number;
  revealAfterSeconds?: number;
}

export interface PuzzleResult {
  puzzleId: string;
  solved: boolean;
  timeSpent: number;
  attempts: number;
  hintsUsed: number;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface PuzzleConfig {
  metadata: PuzzleMetadata;
  hints: PuzzleHint[];
  maxAttempts: number; // 0 = unlimited
  timeLimit: number; // seconds, 0 = unlimited
  baseScore: number;
  parameters: Record<string, unknown>;
}

// Player Types
export interface PlayerProfile {
  uid: string;
  displayName: string;
  totalScore: number;
  puzzlesSolved: number;
  currentStreak: number;
  bestStreak: number;
  createdAt: number;
  lastSolvedAt: number | null;
}

// Event Types for Meta-Mechanics
export type MetaEvent =
  | { type: "tab-hidden" }
  | { type: "tab-visible"; hiddenDuration: number }
  | { type: "devtools-opened" }
  | { type: "devtools-closed" }
  | { type: "pointer-idle"; duration: number }
  | { type: "pointer-edge"; edge: "top" | "bottom" | "left" | "right" }
  | { type: "clipboard-copy"; text: string }
  | { type: "before-unload" };

// Consent Types
export interface ConsentState {
  essential: boolean; // always true
  analytics: boolean;
  preferences: boolean;
  timestamp: number;
  version: string;
}

// Fake UI Types
export interface FakeWindowConfig {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isActive: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  type: "error" | "warning" | "info" | "application";
}

export interface DesktopIconConfig {
  id: string;
  label: string;
  icon: string;
  isCorrupted?: boolean;
}
