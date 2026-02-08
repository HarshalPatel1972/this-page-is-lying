/**
 * Leaderboard management for "This Page Is Lying" game.
 *
 * Provides a callable function for clients to fetch the current leaderboard
 * and a Firestore trigger that keeps a denormalized top-100 cache in sync
 * whenever a player profile is updated.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default number of leaderboard entries returned when no limit is given. */
const DEFAULT_LIMIT = 20;

/** Hard cap on the number of entries a single request may retrieve. */
const MAX_LIMIT = 100;

/** Size of the cached leaderboard tier (top N players). */
const CACHE_SIZE = 100;

// ---------------------------------------------------------------------------
// Callable: getLeaderboard
// ---------------------------------------------------------------------------

export const getLeaderboard = onCall(async (request) => {
  const data = (request.data ?? {}) as Record<string, unknown>;

  // ── Parse & clamp limit ──────────────────────────────────────────────
  let limit = DEFAULT_LIMIT;
  if (typeof data.limit === "number" && Number.isInteger(data.limit)) {
    limit = Math.min(Math.max(data.limit, 1), MAX_LIMIT);
  }

  const category =
    typeof data.category === "string" && data.category.length > 0
      ? data.category
      : null;

  const db = getFirestore();

  // ── Query ────────────────────────────────────────────────────────────
  let entries: Array<{
    rank: number;
    uid: string;
    displayName: string;
    totalScore: number;
    puzzlesSolved: number;
  }>;

  if (category) {
    // Category-specific leaderboard stored in a subcollection per player.
    // We use a collection-group query on "category_scores" where the
    // document id matches the requested category.
    const snapshot = await db
      .collectionGroup("category_scores")
      .where("category", "==", category)
      .orderBy("totalScore", "desc")
      .limit(limit)
      .get();

    entries = snapshot.docs.map((doc, index) => {
      const d = doc.data();
      return {
        rank: index + 1,
        uid: (d.uid as string) ?? doc.ref.parent.parent?.id ?? "unknown",
        displayName: (d.displayName as string) ?? "Anonymous",
        totalScore: (d.totalScore as number) ?? 0,
        puzzlesSolved: (d.puzzlesSolved as number) ?? 0,
      };
    });
  } else {
    // Global leaderboard from the top-level players collection.
    const snapshot = await db
      .collection("players")
      .orderBy("totalScore", "desc")
      .limit(limit)
      .get();

    entries = snapshot.docs.map((doc, index) => {
      const d = doc.data();
      return {
        rank: index + 1,
        uid: doc.id,
        displayName: (d.displayName as string) ?? "Anonymous",
        totalScore: (d.totalScore as number) ?? 0,
        puzzlesSolved: (d.puzzlesSolved as number) ?? 0,
      };
    });
  }

  logger.info("Leaderboard fetched", { category, limit, results: entries.length });

  return { entries };
});

// ---------------------------------------------------------------------------
// Firestore trigger: updateLeaderboardCache
// ---------------------------------------------------------------------------

export const updateLeaderboardCache = onDocumentWritten(
  "players/{uid}",
  async (event) => {
    const uid = event.params.uid;
    const db = getFirestore();
    const cacheRef = db.collection("leaderboard_cache").doc(uid);

    // ── Handle deletion ────────────────────────────────────────────────
    if (!event.data?.after.exists) {
      logger.info(`Player ${uid} deleted — removing from leaderboard cache.`);
      await cacheRef.delete();
      return;
    }

    const playerData = event.data.after.data();
    if (!playerData) {
      return;
    }

    const playerScore = (playerData.totalScore as number) ?? 0;
    const displayName = (playerData.displayName as string) ?? "Anonymous";

    // ── Determine the current 100th-place score ────────────────────────
    const bottomSnapshot = await db
      .collection("leaderboard_cache")
      .orderBy("score", "desc")
      .limit(CACHE_SIZE)
      .get();

    const cacheCount = bottomSnapshot.size;

    // Score of the player currently at the bottom of the top-100 cache.
    // If fewer than CACHE_SIZE entries exist the threshold is 0 (anyone qualifies).
    let thresholdScore = 0;
    if (cacheCount >= CACHE_SIZE) {
      const lastDoc = bottomSnapshot.docs[bottomSnapshot.docs.length - 1];
      thresholdScore = (lastDoc.data().score as number) ?? 0;
    }

    // ── Update or prune ────────────────────────────────────────────────
    if (playerScore >= thresholdScore || cacheCount < CACHE_SIZE) {
      // Player qualifies for the top-100 cache.
      await cacheRef.set({
        uid,
        score: playerScore,
        displayName,
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info(`Leaderboard cache updated for ${uid}`, {
        uid,
        score: playerScore,
      });

      // If adding this player pushed the cache over CACHE_SIZE, remove
      // the lowest-scoring entry to keep the cache trimmed.
      if (cacheCount >= CACHE_SIZE) {
        const refreshedSnapshot = await db
          .collection("leaderboard_cache")
          .orderBy("score", "asc")
          .limit(1)
          .get();

        if (!refreshedSnapshot.empty) {
          const lowestDoc = refreshedSnapshot.docs[0];
          // Only prune if it is not the player we just upserted
          if (lowestDoc.id !== uid) {
            await lowestDoc.ref.delete();
            logger.info(
              `Pruned lowest cache entry ${lowestDoc.id} (score: ${lowestDoc.data().score})`,
            );
          }
        }
      }
    } else {
      // Player no longer qualifies — remove from cache if present.
      const existing = await cacheRef.get();
      if (existing.exists) {
        await cacheRef.delete();
        logger.info(`Player ${uid} no longer qualifies for top-100 cache — removed.`);
      }
    }
  },
);
