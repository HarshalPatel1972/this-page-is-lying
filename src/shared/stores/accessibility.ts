import { writable, get } from "svelte/store";
import type { AccessibilitySettings } from "$shared/types/index.js";

const STORAGE_KEY = "tpil-accessibility";

function getInitialSettings(): AccessibilitySettings {
  const defaults: AccessibilitySettings = {
    reducedMotion: false,
    noAudio: false,
    noJumpscares: false,
    noStrobes: false,
    highContrast: false,
    screenReaderMode: false,
  };

  // Check system preferences
  if (typeof window !== "undefined") {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      defaults.reducedMotion = true;
      defaults.noStrobes = true;
    }
    if (window.matchMedia("(prefers-contrast: more)").matches) {
      defaults.highContrast = true;
    }

    // Load saved preferences
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch {
      // localStorage unavailable
    }
  }

  return defaults;
}

function createAccessibilityStore() {
  const { subscribe, set, update } =
    writable<AccessibilitySettings>(getInitialSettings());

  // Persist changes to localStorage
  function persist(settings: AccessibilitySettings) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // localStorage unavailable
      }
    }
  }

  return {
    subscribe,

    /** Update a single setting */
    setSetting<K extends keyof AccessibilitySettings>(
      key: K,
      value: AccessibilitySettings[K],
    ) {
      update((settings) => {
        const updated = { ...settings, [key]: value };
        persist(updated);
        return updated;
      });
    },

    /** Update multiple settings at once */
    updateSettings(partial: Partial<AccessibilitySettings>) {
      update((settings) => {
        const updated = { ...settings, ...partial };
        persist(updated);
        return updated;
      });
    },

    /** Reset to defaults (respecting system preferences) */
    reset() {
      const defaults = getInitialSettings();
      set(defaults);
      persist(defaults);
    },

    /** Apply CSS classes to document based on current settings */
    applyToDocument() {
      const settings = get({ subscribe });
      if (typeof document === "undefined") return;

      const html = document.documentElement;
      html.classList.toggle("reduced-motion", settings.reducedMotion);
      html.classList.toggle("no-audio", settings.noAudio);
      html.classList.toggle("high-contrast", settings.highContrast);
      html.classList.toggle("screen-reader-mode", settings.screenReaderMode);
    },
  };
}

export const accessibilitySettings = createAccessibilityStore();
