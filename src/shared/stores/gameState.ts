import { writable, derived, get } from "svelte/store";
import type { GameState, GamePhase } from "$shared/types/index.js";
import { v4 as uuidv4 } from "uuid";

const initialState: GameState = {
  phase: "idle",
  tensionLevel: 0,
  puzzlesSolved: 0,
  currentPuzzleId: null,
  sessionId: null,
  currentStreak: 0,
  totalScore: 0,
  hasInteracted: false,
};

function createGameStore() {
  const { subscribe, set, update } = writable<GameState>(initialState);

  return {
    subscribe,

    /** Transition to a new game phase */
    setPhase(phase: GamePhase) {
      update((state) => ({ ...state, phase }));
    },

    /** Start a new session */
    startSession() {
      update((state) => ({
        ...state,
        phase: "initializing",
        sessionId: uuidv4(),
      }));
    },

    /** Enter the main game loop */
    enterGame() {
      update((state) => ({ ...state, phase: "playing" }));
    },

    /** Begin a puzzle */
    startPuzzle(puzzleId: string) {
      update((state) => ({
        ...state,
        phase: "puzzle-active",
        currentPuzzleId: puzzleId,
      }));
    },

    /** Complete current puzzle */
    completePuzzle(score: number) {
      update((state) => ({
        ...state,
        phase: "puzzle-transition",
        puzzlesSolved: state.puzzlesSolved + 1,
        currentStreak: state.currentStreak + 1,
        totalScore: state.totalScore + score,
        currentPuzzleId: null,
      }));
    },

    /** Fail current puzzle */
    failPuzzle() {
      update((state) => ({
        ...state,
        phase: "puzzle-transition",
        currentStreak: 0,
        currentPuzzleId: null,
      }));
    },

    /** Set tension level (clamped 0-10) */
    setTension(level: number) {
      update((state) => ({
        ...state,
        tensionLevel: Math.max(0, Math.min(10, level)),
      }));
    },

    /** Increase tension by amount */
    increaseTension(amount: number) {
      update((state) => ({
        ...state,
        tensionLevel: Math.min(10, state.tensionLevel + amount),
      }));
    },

    /** Decrease tension by amount */
    decreaseTension(amount: number) {
      update((state) => ({
        ...state,
        tensionLevel: Math.max(0, state.tensionLevel - amount),
      }));
    },

    /** Mark that user has interacted (for sticky activation) */
    markInteracted() {
      update((state) => ({ ...state, hasInteracted: true }));
    },

    /** Reset to initial state */
    reset() {
      set(initialState);
    },
  };
}

export const gameState = createGameStore();

// Derived stores for convenience
export const tensionLevel = derived(gameState, ($state) => $state.tensionLevel);
export const gamePhase = derived(gameState, ($state) => $state.phase);
export const isPlaying = derived(gameState, ($state) =>
  ["playing", "puzzle-active", "puzzle-transition"].includes($state.phase),
);
export const currentPuzzleId = derived(
  gameState,
  ($state) => $state.currentPuzzleId,
);
