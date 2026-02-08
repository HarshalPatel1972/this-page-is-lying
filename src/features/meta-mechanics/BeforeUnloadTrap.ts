/**
 * BeforeUnloadTrap — Prevents the player from leaving with a narrative-flavored dialog.
 * Requires sticky activation (prior user interaction).
 */

class BeforeUnloadTrap {
  private active = false;
  private message = "";
  private boundHandler: ((e: BeforeUnloadEvent) => void) | null = null;

  start(message: string = "The page doesn't want you to leave."): void {
    if (this.active || typeof window === "undefined") return;

    this.message = message;
    this.boundHandler = this.handleBeforeUnload.bind(this);
    window.addEventListener("beforeunload", this.boundHandler);
    this.active = true;
  }

  stop(): void {
    if (!this.active || !this.boundHandler) return;

    window.removeEventListener("beforeunload", this.boundHandler);
    this.boundHandler = null;
    this.active = false;
  }

  /** Update the message (browsers show a generic message, but we set returnValue anyway) */
  setMessage(message: string): void {
    this.message = message;
  }

  private handleBeforeUnload(e: BeforeUnloadEvent): void {
    e.preventDefault();
    // Most modern browsers ignore custom messages, but we set it anyway
    e.returnValue = this.message;
  }

  destroy(): void {
    this.stop();
  }
}

export const beforeUnloadTrap = new BeforeUnloadTrap();
