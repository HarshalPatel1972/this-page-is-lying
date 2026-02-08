import { writable, get } from "svelte/store";
import { IDLE_THRESHOLD_MS } from "$shared/constants/index.js";

export interface PointerState {
  x: number;
  y: number;
  isIdle: boolean;
  idleDuration: number;
  isNearEdge: boolean;
  nearEdge: "top" | "bottom" | "left" | "right" | null;
  totalDistance: number;
}

type PointerCallback = (event: {
  type: "idle" | "active" | "edge-enter" | "edge-leave" | "move";
  data?: Record<string, unknown>;
}) => void;

class PointerTracker {
  private state = writable<PointerState>({
    x: 0,
    y: 0,
    isIdle: false,
    idleDuration: 0,
    isNearEdge: false,
    nearEdge: null,
    totalDistance: 0,
  });
  private callbacks: PointerCallback[] = [];
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private idleStart: number | null = null;
  private lastX = 0;
  private lastY = 0;
  private active = false;
  private edgeThreshold = 50; // px from edge
  private boundMove: ((e: MouseEvent) => void) | null = null;

  get store() {
    return { subscribe: this.state.subscribe };
  }

  start(): void {
    if (this.active || typeof window === "undefined") return;

    this.boundMove = this.handleMouseMove.bind(this);
    window.addEventListener("mousemove", this.boundMove);
    this.resetIdleTimer();
    this.active = true;
  }

  stop(): void {
    if (!this.active || !this.boundMove) return;

    window.removeEventListener("mousemove", this.boundMove);
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.boundMove = null;
    this.active = false;
  }

  onEvent(callback: PointerCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      const idx = this.callbacks.indexOf(callback);
      if (idx > -1) this.callbacks.splice(idx, 1);
    };
  }

  /** Get normalized cursor position (0-1) relative to viewport */
  getNormalized(): { x: number; y: number } {
    const s = get(this.state);
    return {
      x: s.x / (window.innerWidth || 1),
      y: s.y / (window.innerHeight || 1),
    };
  }

  private handleMouseMove(e: MouseEvent): void {
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.lastX = e.clientX;
    this.lastY = e.clientY;

    // Check edge proximity
    const edge = this.checkEdge(e.clientX, e.clientY);
    const current = get(this.state);

    if (edge !== current.nearEdge) {
      if (edge) {
        this.emit({ type: "edge-enter", data: { edge } });
      } else if (current.nearEdge) {
        this.emit({ type: "edge-leave" });
      }
    }

    this.state.update((s) => ({
      ...s,
      x: e.clientX,
      y: e.clientY,
      isIdle: false,
      idleDuration: 0,
      isNearEdge: edge !== null,
      nearEdge: edge,
      totalDistance: s.totalDistance + dist,
    }));

    if (current.isIdle) {
      this.emit({ type: "active" });
    }

    this.resetIdleTimer();
  }

  private checkEdge(
    x: number,
    y: number,
  ): "top" | "bottom" | "left" | "right" | null {
    const t = this.edgeThreshold;
    if (y < t) return "top";
    if (y > window.innerHeight - t) return "bottom";
    if (x < t) return "left";
    if (x > window.innerWidth - t) return "right";
    return null;
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleStart = null;

    this.idleTimer = setTimeout(() => {
      this.idleStart = Date.now();
      this.state.update((s) => ({ ...s, isIdle: true }));
      this.emit({ type: "idle", data: { duration: 0 } });

      // Continue tracking idle duration
      this.trackIdleDuration();
    }, IDLE_THRESHOLD_MS);
  }

  private trackIdleDuration(): void {
    if (!this.idleStart) return;

    const interval = setInterval(() => {
      const current = get(this.state);
      if (!current.isIdle) {
        clearInterval(interval);
        return;
      }

      const duration = Date.now() - (this.idleStart || Date.now());
      this.state.update((s) => ({ ...s, idleDuration: duration }));
    }, 1000);
  }

  private emit(event: { type: string; data?: Record<string, unknown> }): void {
    this.callbacks.forEach((cb) => cb(event as Parameters<PointerCallback>[0]));
  }

  destroy(): void {
    this.stop();
    this.callbacks = [];
  }
}

export const pointerTracker = new PointerTracker();
