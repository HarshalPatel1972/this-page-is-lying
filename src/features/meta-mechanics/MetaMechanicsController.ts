/**
 * MetaMechanicsController — Orchestrates all meta-mechanics as a unified system.
 * Reacts to tension level and game state to activate/deactivate mechanics.
 */

import { get } from "svelte/store";
import { tabVisibility } from "./TabVisibility.js";
import { devToolsDetector } from "./DevToolsDetector.js";
import { consoleNarrative } from "./ConsoleNarrative.js";
import { pointerTracker } from "./PointerTracker.js";
import { clipboardHijack, clipboardModifiers } from "./ClipboardHijack.js";
import { urlManipulator } from "./URLManipulator.js";
import { beforeUnloadTrap } from "./BeforeUnloadTrap.js";
import { tensionLevel } from "$shared/stores/gameState.js";
import { accessibilitySettings } from "$shared/stores/accessibility.js";
import { FEATURES } from "$shared/constants/index.js";

type MetaEventHandler = (event: {
  source: string;
  type: string;
  data?: Record<string, unknown>;
}) => void;

class MetaMechanicsController {
  private handlers: MetaEventHandler[] = [];
  private unsubscribers: Array<() => void> = [];
  private tensionUnsub: (() => void) | null = null;
  private initialized = false;

  /** Initialize all meta-mechanics */
  initialize(): void {
    if (this.initialized || typeof window === "undefined") return;

    // Start individual mechanics
    if (FEATURES.TAB_VISIBILITY) {
      tabVisibility.start();
      this.unsubscribers.push(
        tabVisibility.onEvent((e) => {
          this.emit({
            source: "tab",
            type: e.type,
            data: { hiddenDuration: e.hiddenDuration },
          });
        }),
      );
    }

    if (FEATURES.DEVTOOLS_DETECTION) {
      devToolsDetector.start();
      this.unsubscribers.push(
        devToolsDetector.onEvent((e) => {
          this.emit({ source: "devtools", type: e.type });
          if (e.type === "opened") {
            consoleNarrative.print(
              "You opened the developer tools. Clever... or foolish.",
              "color: #ff4444; font-weight: bold; font-family: monospace; font-size: 14px;",
            );
          }
        }),
      );
    }

    if (FEATURES.CONSOLE_NARRATIVE) {
      consoleNarrative.start();
    }

    if (FEATURES.POINTER_TRACKING) {
      pointerTracker.start();
      this.unsubscribers.push(
        pointerTracker.onEvent((e) => {
          this.emit({ source: "pointer", type: e.type, data: e.data });
        }),
      );
    }

    if (FEATURES.CLIPBOARD_HIJACK) {
      clipboardHijack.start();
      this.unsubscribers.push(
        clipboardHijack.onEvent((e) => {
          this.emit({ source: "clipboard", type: e.type });
        }),
      );
    }

    if (FEATURES.URL_MANIPULATION) {
      urlManipulator.start();
    }

    // React to tension changes
    this.tensionUnsub = tensionLevel.subscribe((level) => {
      this.onTensionChange(level);
    });

    this.initialized = true;
  }

  /** Listen for events from any meta-mechanic */
  onEvent(handler: MetaEventHandler): () => void {
    this.handlers.push(handler);
    return () => {
      const idx = this.handlers.indexOf(handler);
      if (idx > -1) this.handlers.splice(idx, 1);
    };
  }

  /** Activate a specific mechanic */
  activateMechanic(name: string): void {
    switch (name) {
      case "beforeunload":
        beforeUnloadTrap.start();
        break;
      case "clipboard-horror":
        clipboardHijack.setModifier(clipboardModifiers.horrorInject);
        break;
      case "clipboard-corrupt":
        clipboardHijack.setModifier(clipboardModifiers.corrupt);
        break;
      case "url-degrade":
        urlManipulator.degrade();
        break;
    }
  }

  /** Deactivate a specific mechanic */
  deactivateMechanic(name: string): void {
    switch (name) {
      case "beforeunload":
        beforeUnloadTrap.stop();
        break;
      case "clipboard-horror":
      case "clipboard-corrupt":
        clipboardHijack.setModifier(null);
        break;
      case "url-degrade":
        urlManipulator.restore();
        break;
    }
  }

  /** Respond to tension level changes */
  private onTensionChange(level: number): void {
    // Low tension (0-3): minimal mechanics
    if (level <= 3) {
      clipboardHijack.setModifier(null);
      urlManipulator.restore();
      beforeUnloadTrap.stop();
    }

    // Medium tension (4-6): start clipboard & URL manipulation
    if (level >= 4 && level <= 6) {
      clipboardHijack.setModifier(clipboardModifiers.horrorInject);
    }

    // High tension (7-9): aggressive mechanics
    if (level >= 7) {
      clipboardHijack.setModifier(clipboardModifiers.corrupt);
      urlManipulator.degrade();

      const settings = get(accessibilitySettings);
      if (!settings.screenReaderMode) {
        beforeUnloadTrap.start("Are you sure? It might follow you.");
      }
    }

    // Maximum tension (10): everything
    if (level >= 10) {
      consoleNarrative.printCorrupted("Y O U   C A N N O T   E S C A P E");
    }
  }

  private emit(event: {
    source: string;
    type: string;
    data?: Record<string, unknown>;
  }): void {
    this.handlers.forEach((h) => h(event));
  }

  /** Destroy all mechanics and clean up */
  destroy(): void {
    tabVisibility.destroy();
    devToolsDetector.destroy();
    consoleNarrative.destroy();
    pointerTracker.destroy();
    clipboardHijack.destroy();
    urlManipulator.destroy();
    beforeUnloadTrap.destroy();

    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    if (this.tensionUnsub) {
      this.tensionUnsub();
      this.tensionUnsub = null;
    }

    this.handlers = [];
    this.initialized = false;
  }
}

export const metaMechanics = new MetaMechanicsController();
