/**
 * Anti-cheat detection for "This Page Is Lying" game.
 *
 * Provides timing analysis, score bounds checking, and rate limiting
 * to prevent abuse and ensure fair gameplay.
 */

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum number of seconds a legitimate solve can take. */
export const MIN_SOLVE_TIME_SECONDS = 3;

/** Absolute maximum score any single puzzle can award. */
export const MAX_SCORE_PER_PUZZLE = 200;

/** Maximum number of puzzle submissions allowed per minute per user. */
export const MAX_PUZZLES_PER_MINUTE = 10;

/** Scoring constants */
export const BASE_EASY = 50;
export const BASE_MEDIUM = 80;
export const BASE_HARD = 120;
export const HINT_PENALTY = 10;
export const ATTEMPT_PENALTY = 5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PuzzleCategory =
  | "console"
  | "navigation"
  | "audio"
  | "visual"
  | "meta";
export type PuzzleDifficulty = 1 | 2 | 3 | 4 | 5;

export interface PuzzleResult {
  puzzleId: string;
  solved: boolean;
  timeSpent: number;
  attempts: number;
  hintsUsed: number;
  score: number;
  metadata?: Record<string, unknown>;
}

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

export interface AntiCheatReport {
  passed: boolean;
  flags: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the base score for a given difficulty tier.
 *
 * Difficulties 1-2 map to EASY, 3 to MEDIUM, 4-5 to HARD.
 */
export function baseScoreForDifficulty(difficulty: PuzzleDifficulty): number {
  if (difficulty <= 2) return BASE_EASY;
  if (difficulty === 3) return BASE_MEDIUM;
  return BASE_HARD;
}

/**
 * Server-authoritative score calculation.
 *
 * score = baseScore - (hintsUsed * HINT_PENALTY) - ((attempts - 1) * ATTEMPT_PENALTY) + timeBonus
 * Result is clamped to [0, MAX_SCORE_PER_PUZZLE].
 */
export function calculateScore(
  difficulty: PuzzleDifficulty,
  timeSpent: number,
  attempts: number,
  hintsUsed: number,
): number {
  const base = baseScoreForDifficulty(difficulty);

  // Time bonus: faster solves earn more, capped at 50 bonus points.
  // Diminishes linearly: full bonus under 10 s, zero bonus at 120 s+.
  const timeBonusMax = 50;
  const timeBonus = Math.max(0, timeBonusMax - Math.floor(timeSpent / 2));

  const raw =
    base -
    hintsUsed * HINT_PENALTY -
    (Math.max(attempts, 1) - 1) * ATTEMPT_PENALTY +
    timeBonus;

  return Math.min(MAX_SCORE_PER_PUZZLE, Math.max(0, raw));
}

// ---------------------------------------------------------------------------
// Core anti-cheat checks
// ---------------------------------------------------------------------------

/**
 * Run all anti-cheat heuristics against a puzzle submission.
 *
 * Returns an `AntiCheatReport` with a `passed` boolean and an array of
 * human-readable flag descriptions.
 */
export function runAntiCheatChecks(result: PuzzleResult): AntiCheatReport {
  const flags: string[] = [];

  // 1. Timing analysis -- impossibly fast solve
  if (result.timeSpent < MIN_SOLVE_TIME_SECONDS) {
    flags.push(
      `Solve time ${result.timeSpent}s is below minimum threshold of ${MIN_SOLVE_TIME_SECONDS}s`,
    );
  }

  // 2. Score bounds -- score exceeds server maximum
  if (result.score > MAX_SCORE_PER_PUZZLE) {
    flags.push(
      `Reported score ${result.score} exceeds maximum allowed score of ${MAX_SCORE_PER_PUZZLE}`,
    );
  }

  // 3. Negative values that should never appear
  if (result.score < 0) {
    flags.push(`Reported score ${result.score} is negative`);
  }
  if (result.timeSpent < 0) {
    flags.push(`Reported timeSpent ${result.timeSpent} is negative`);
  }
  if (result.attempts < 1) {
    flags.push(`Reported attempts ${result.attempts} is below 1`);
  }
  if (result.hintsUsed < 0) {
    flags.push(`Reported hintsUsed ${result.hintsUsed} is negative`);
  }

  return {
    passed: flags.length === 0,
    flags,
  };
}

// ---------------------------------------------------------------------------
// Rate limiting (Firestore-backed)
// ---------------------------------------------------------------------------

/**
 * Enforce a per-user rate limit on puzzle submissions.
 *
 * Uses a `rate_limits/{uid}` document in Firestore to track timestamps of
 * recent submissions. Returns `true` if the user is within limits, `false`
 * if they should be throttled.
 */
export async function checkRateLimit(uid: string): Promise<boolean> {
  const db = getFirestore();
  const rateLimitRef = db.collection("rate_limits").doc(uid);

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(rateLimitRef);
    const now = Date.now();
    const oneMinuteAgo = now - 60_000;

    let timestamps: number[] = [];
    if (doc.exists) {
      const data = doc.data();
      timestamps = (data?.timestamps as number[] | undefined) ?? [];
    }

    // Prune timestamps older than one minute
    timestamps = timestamps.filter((t) => t > oneMinuteAgo);

    if (timestamps.length >= MAX_PUZZLES_PER_MINUTE) {
      logger.warn(`Rate limit exceeded for user ${uid}`, {
        uid,
        recentSubmissions: timestamps.length,
      });
      return false;
    }

    timestamps.push(now);
    tx.set(rateLimitRef, {
      timestamps,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });
}

// ---------------------------------------------------------------------------
// Score verification
// ---------------------------------------------------------------------------

/**
 * Verify that the client-reported score matches what the server would
 * calculate given the same inputs.
 *
 * `difficulty` must be provided so the server can derive its own base score.
 */
export function verifyScore(
  reportedScore: number,
  difficulty: PuzzleDifficulty,
  timeSpent: number,
  attempts: number,
  hintsUsed: number,
): boolean {
  const expected = calculateScore(difficulty, timeSpent, attempts, hintsUsed);
  return reportedScore === expected;
}

// ---------------------------------------------------------------------------
// Suspicious-activity logger
// ---------------------------------------------------------------------------

/**
 * Persist a suspicious-activity record to the `suspicious_activity`
 * Firestore collection for later review.
 */
export async function logSuspiciousActivity(
  uid: string,
  reason: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  const db = getFirestore();
  await db.collection("suspicious_activity").add({
    uid,
    reason,
    details,
    timestamp: FieldValue.serverTimestamp(),
    reviewed: false,
  });
  logger.warn(`Suspicious activity logged for user ${uid}: ${reason}`, {
    uid,
    details,
  });
}
