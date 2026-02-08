/**
 * Puzzle submission validation for "This Page Is Lying" game.
 *
 * Receives client puzzle results, validates inputs, runs anti-cheat
 * heuristics, recalculates the score server-side, and persists the
 * authoritative result to Firestore.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import {
  runAntiCheatChecks,
  checkRateLimit,
  calculateScore,
  verifyScore,
  logSuspiciousActivity,
} from "./antiCheat.js";
import type { PuzzleDifficulty, PuzzleResult } from "./antiCheat.js";

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------

interface PuzzleSubmissionData {
  puzzleId: string;
  solved: boolean;
  timeSpent: number;
  attempts: number;
  hintsUsed: number;
  score: number;
  difficulty: PuzzleDifficulty;
}

/**
 * Validate that all required fields are present and well-typed.
 * Throws an HttpsError if any field is invalid.
 */
function validateInput(data: unknown): PuzzleSubmissionData {
  if (typeof data !== "object" || data === null) {
    throw new HttpsError("invalid-argument", "Request body must be an object.");
  }

  const d = data as Record<string, unknown>;

  // puzzleId
  if (typeof d.puzzleId !== "string" || d.puzzleId.length === 0) {
    throw new HttpsError(
      "invalid-argument",
      "puzzleId must be a non-empty string.",
    );
  }

  // solved
  if (typeof d.solved !== "boolean") {
    throw new HttpsError("invalid-argument", "solved must be a boolean.");
  }

  // timeSpent
  if (typeof d.timeSpent !== "number" || d.timeSpent < 0) {
    throw new HttpsError(
      "invalid-argument",
      "timeSpent must be a number >= 0.",
    );
  }

  // attempts
  if (
    typeof d.attempts !== "number" ||
    !Number.isInteger(d.attempts) ||
    d.attempts < 1
  ) {
    throw new HttpsError(
      "invalid-argument",
      "attempts must be an integer >= 1.",
    );
  }

  // hintsUsed
  if (
    typeof d.hintsUsed !== "number" ||
    !Number.isInteger(d.hintsUsed) ||
    d.hintsUsed < 0
  ) {
    throw new HttpsError(
      "invalid-argument",
      "hintsUsed must be an integer >= 0.",
    );
  }

  // score
  if (typeof d.score !== "number") {
    throw new HttpsError("invalid-argument", "score must be a number.");
  }

  // difficulty (1-5)
  if (
    typeof d.difficulty !== "number" ||
    !Number.isInteger(d.difficulty) ||
    d.difficulty < 1 ||
    d.difficulty > 5
  ) {
    throw new HttpsError(
      "invalid-argument",
      "difficulty must be an integer between 1 and 5.",
    );
  }

  return {
    puzzleId: d.puzzleId as string,
    solved: d.solved as boolean,
    timeSpent: d.timeSpent as number,
    attempts: d.attempts as number,
    hintsUsed: d.hintsUsed as number,
    score: d.score as number,
    difficulty: d.difficulty as PuzzleDifficulty,
  };
}

// ---------------------------------------------------------------------------
// Callable Cloud Function
// ---------------------------------------------------------------------------

export const validatePuzzleSubmission = onCall(async (request) => {
  // ── Authentication gate ──────────────────────────────────────────────
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in to submit puzzle results.",
    );
  }

  const uid = request.auth.uid;

  // ── Input validation ─────────────────────────────────────────────────
  const input = validateInput(request.data);

  logger.info(`Puzzle submission received from ${uid}`, {
    uid,
    puzzleId: input.puzzleId,
  });

  // ── Rate limiting ────────────────────────────────────────────────────
  const withinLimits = await checkRateLimit(uid);
  if (!withinLimits) {
    throw new HttpsError(
      "resource-exhausted",
      "Too many submissions. Please wait before trying again.",
    );
  }

  // ── Anti-cheat checks ───────────────────────────────────────────────
  const puzzleResult: PuzzleResult = {
    puzzleId: input.puzzleId,
    solved: input.solved,
    timeSpent: input.timeSpent,
    attempts: input.attempts,
    hintsUsed: input.hintsUsed,
    score: input.score,
  };

  const antiCheatReport = runAntiCheatChecks(puzzleResult);

  if (!antiCheatReport.passed) {
    await logSuspiciousActivity(uid, "Anti-cheat check failed", {
      puzzleId: input.puzzleId,
      flags: antiCheatReport.flags,
      clientScore: input.score,
      timeSpent: input.timeSpent,
      attempts: input.attempts,
      hintsUsed: input.hintsUsed,
    });

    throw new HttpsError(
      "permission-denied",
      "Submission rejected by anti-cheat system.",
    );
  }

  // ── Server-authoritative score ──────────────────────────────────────
  const serverScore = calculateScore(
    input.difficulty,
    input.timeSpent,
    input.attempts,
    input.hintsUsed,
  );

  // ── Persist to Firestore ────────────────────────────────────────────
  const db = getFirestore();

  // Store the validated puzzle result
  await db.collection("puzzle_results").add({
    uid,
    puzzleId: input.puzzleId,
    solved: input.solved,
    timeSpent: input.timeSpent,
    attempts: input.attempts,
    hintsUsed: input.hintsUsed,
    difficulty: input.difficulty,
    clientScore: input.score,
    serverScore,
    antiCheatPassed: true,
    timestamp: FieldValue.serverTimestamp(),
  });

  // Update the player profile
  const playerRef = db.collection("players").doc(uid);

  await db.runTransaction(async (tx) => {
    const playerDoc = await tx.get(playerRef);

    if (!playerDoc.exists) {
      // First submission ever — bootstrap the profile
      tx.set(playerRef, {
        uid,
        displayName: request.auth!.token.name ?? "Anonymous",
        totalScore: serverScore,
        puzzlesSolved: input.solved ? 1 : 0,
        currentStreak: input.solved ? 1 : 0,
        bestStreak: input.solved ? 1 : 0,
        createdAt: FieldValue.serverTimestamp(),
        lastSolvedAt: input.solved ? FieldValue.serverTimestamp() : null,
      });
    } else {
      const data = playerDoc.data()!;
      const currentStreak = (data.currentStreak as number) ?? 0;
      const bestStreak = (data.bestStreak as number) ?? 0;

      const newStreak = input.solved ? currentStreak + 1 : 0;
      const newBestStreak = newStreak > bestStreak ? newStreak : bestStreak;

      const updates: Record<string, unknown> = {
        totalScore: FieldValue.increment(serverScore),
      };

      if (input.solved) {
        updates.puzzlesSolved = FieldValue.increment(1);
      }

      updates.currentStreak = newStreak;
      updates.bestStreak = newBestStreak;

      if (input.solved) {
        updates.lastSolvedAt = FieldValue.serverTimestamp();
      }

      tx.update(playerRef, updates);
    }
  });

  logger.info(`Puzzle submission validated for ${uid}`, {
    uid,
    puzzleId: input.puzzleId,
    serverScore,
    clientScore: input.score,
  });

  return {
    success: true,
    serverScore,
    antiCheatPassed: true,
  };
});
