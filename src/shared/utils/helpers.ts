/**
 * Seeded random number generator for reproducible puzzle generation.
 * Uses a simple mulberry32 algorithm.
 */
export function createSeededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a random element from an array */
export function randomChoice<T>(arr: T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Shuffle an array in place using Fisher-Yates */
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Generate a random integer between min (inclusive) and max (exclusive) */
export function randomInt(
  min: number,
  max: number,
  rng: () => number = Math.random,
): number {
  return Math.floor(rng() * (max - min)) + min;
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/** Wait for a specified number of milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Detect basic browser capabilities */
export function detectFeatures(): string[] {
  if (typeof window === "undefined") return ["basic"];

  const features: string[] = ["basic"];

  if ("AudioContext" in window || "webkitAudioContext" in window) {
    features.push("web-audio", "audio");
  }
  if ("clipboard" in navigator) {
    features.push("clipboard");
  }
  if ("share" in navigator) {
    features.push("web-share");
  }
  if (document.visibilityState !== undefined) {
    features.push("tab-visibility");
  }

  features.push("devtools", "console", "animation", "visual-effects");

  return features;
}
