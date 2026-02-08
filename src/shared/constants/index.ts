export const GAME_VERSION = "0.1.0";
export const CONSENT_VERSION = "1.0";

// Tension levels
export const TENSION = {
  CALM: 0,
  UNEASY: 3,
  ANXIOUS: 5,
  FEARFUL: 7,
  TERROR: 9,
  MAXIMUM: 10,
} as const;

// Timing
export const IDLE_THRESHOLD_MS = 5000;
export const DEVTOOLS_CHECK_INTERVAL_MS = 1000;
export const TAB_SWITCH_MIN_DURATION_MS = 500;

// Scoring
export const SCORE = {
  BASE_EASY: 50,
  BASE_MEDIUM: 80,
  BASE_HARD: 120,
  HINT_PENALTY: 10,
  ATTEMPT_PENALTY: 5,
  TIME_BONUS_FACTOR: 1,
} as const;

// Puzzle generation
export const MAX_RECENT_PUZZLES = 5;
export const DIFFICULTY_INCREASE_STREAK = 3;
export const DIFFICULTY_DECREASE_FAILURES = 2;

// Audio
export const AUDIO = {
  MASTER_VOLUME: 0.7,
  AMBIENT_VOLUME: 0.3,
  SFX_VOLUME: 0.5,
  CROSSFADE_DURATION: 2000,
  SPATIAL_MAX_DISTANCE: 100,
} as const;

// Feature flags
export const FEATURES = {
  DEVTOOLS_DETECTION: true,
  CONSOLE_NARRATIVE: true,
  TAB_VISIBILITY: true,
  CLIPBOARD_HIJACK: true,
  URL_MANIPULATION: true,
  BEFORE_UNLOAD: true,
  POINTER_TRACKING: true,
} as const;
