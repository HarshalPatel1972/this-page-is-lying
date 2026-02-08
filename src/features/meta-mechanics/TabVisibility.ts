import { writable, get } from "svelte/store";
import { TAB_SWITCH_MIN_DURATION_MS } from "$shared/constants/index.js";

export interface TabVisibilityState {
  isVisible: boolean;
  lastHiddenAt: number | null;
  lastVisibleAt: number | null;
  totalHiddenTime: number;
  switchCount: number;
}

const initialState: TabVisibilityState = {
  isVisible: true,
  lastHiddenAt: null,
  lastVisibleAt: null,
  totalHiddenTime: 0,
  switchCount: 0,
};

type TabEventCallback = (event: {
  type: "hidden" | "visible";
  hiddenDuration?: number;
}) => void;

class TabVisibilityTracker {
  private state = writable<TabVisibilityState>(initialState);
  private callbacks: TabEventCallback[] = [];
  private boundHandler: (() => void) | null = null;
  private active = false;

  get store() {
    return { subscribe: this.state.subscribe };
  }

  start(): void {
    if (this.active || typeof document === "undefined") return;

    this.boundHandler = this.handleVisibilityChange.bind(this);
    document.addEventListener("visibilitychange", this.boundHandler);
    this.active = true;
  }

  stop(): void {
    if (!this.active || !this.boundHandler) return;

    document.removeEventListener("visibilitychange", this.boundHandler);
    this.boundHandler = null;
    this.active = false;
  }

  onEvent(callback: TabEventCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      const idx = this.callbacks.indexOf(callback);
      if (idx > -1) this.callbacks.splice(idx, 1);
    };
  }

  private handleVisibilityChange(): void {
    const isVisible = document.visibilityState === "visible";

    if (!isVisible) {
      // Tab was hidden
      this.state.update((s) => ({
        ...s,
        isVisible: false,
        lastHiddenAt: Date.now(),
      }));
      this.emit({ type: "hidden" });
    } else {
      // Tab became visible again
      const current = get(this.state);
      const hiddenDuration = current.lastHiddenAt
        ? Date.now() - current.lastHiddenAt
        : 0;

      this.state.update((s) => ({
        ...s,
        isVisible: true,
        lastVisibleAt: Date.now(),
        totalHiddenTime: s.totalHiddenTime + hiddenDuration,
        switchCount: s.switchCount + 1,
      }));

      if (hiddenDuration >= TAB_SWITCH_MIN_DURATION_MS) {
        this.emit({ type: "visible", hiddenDuration });
      }
    }
  }

  private emit(event: {
    type: "hidden" | "visible";
    hiddenDuration?: number;
  }): void {
    this.callbacks.forEach((cb) => cb(event));
  }

  destroy(): void {
    this.stop();
    this.callbacks = [];
  }
}

export const tabVisibility = new TabVisibilityTracker();
