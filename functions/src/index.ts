/**
 * Entry point for "This Page Is Lying" Firebase Cloud Functions.
 *
 * Initializes the Firebase Admin SDK and re-exports all callable /
 * triggered functions so the Firebase runtime can discover them.
 */

import { initializeApp } from "firebase-admin/app";

initializeApp();

export { validatePuzzleSubmission } from "./puzzleValidator.js";
export { getLeaderboard, updateLeaderboardCache } from "./leaderboard.js";
