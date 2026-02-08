import { writable, get } from "svelte/store";
import { DEVTOOLS_CHECK_INTERVAL_MS } from "$shared/constants/index.js";

export interface DevToolsState {
  isOpen: boolean;
  openCount: number;
  lastOpenedAt: number | null;
}

type DevToolsCallback = (event: { type: "opened" | "closed" }) => void;

class DevToolsDetector {
  private state = writable<DevToolsState>({
    isOpen: false,
    openCount: 0,
    lastOpenedAt: null,
  });
  private callbacks: DevToolsCallback[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private active = false;
  private threshold = 160; // px difference for window size heuristic

  get store() {
    return { subscribe: this.state.subscribe };
  }

  start(): void {
    if (this.active || typeof window === "undefined") return;

    // Strategy 1: Window size heuristic (works when devtools is docked)
    this.intervalId = setInterval(
      () => this.checkWindowSize(),
      DEVTOOLS_CHECK_INTERVAL_MS,
    );

    // Strategy 2: Console getter trap
    this.setupConsoleDetection();

    this.active = true;
  }

  stop(): void {
    if (!this.active) return;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.active = false;
  }

  onEvent(callback: DevToolsCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      const idx = this.callbacks.indexOf(callback);
      if (idx > -1) this.callbacks.splice(idx, 1);
    };
  }

  private checkWindowSize(): void {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    const isLikelyOpen =
      widthDiff > this.threshold || heightDiff > this.threshold;
    const current = get(this.state);

    if (isLikelyOpen && !current.isOpen) {
      this.setOpen(true);
    } else if (!isLikelyOpen && current.isOpen) {
      this.setOpen(false);
    }
  }

  private setupConsoleDetection(): void {
    // Create a special object that detects when it gets inspected
    const detector = {
      get id() {
        // This getter is called when the object is expanded in DevTools
        devToolsDetector.handleConsoleAccess();
        return "trap";
      },
    };

    // Log it (DevTools will auto-expand, triggering the getter)
    // We re-log periodically in ConsoleNarrative
    console.debug("%c", "font-size:0", detector);
  }

  handleConsoleAccess(): void {
    const current = get(this.state);
    if (!current.isOpen) {
      this.setOpen(true);
    }
  }

  private setOpen(isOpen: boolean): void {
    const current = get(this.state);

    if (isOpen && !current.isOpen) {
      this.state.update((s) => ({
        ...s,
        isOpen: true,
        openCount: s.openCount + 1,
        lastOpenedAt: Date.now(),
      }));
      this.emit({ type: "opened" });
    } else if (!isOpen && current.isOpen) {
      this.state.update((s) => ({
        ...s,
        isOpen: false,
      }));
      this.emit({ type: "closed" });
    }
  }

  private emit(event: { type: "opened" | "closed" }): void {
    this.callbacks.forEach((cb) => cb(event));
  }

  destroy(): void {
    this.stop();
    this.callbacks = [];
  }
}

export const devToolsDetector = new DevToolsDetector();
