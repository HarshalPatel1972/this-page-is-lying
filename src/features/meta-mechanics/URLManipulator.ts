/**
 * URLManipulator — Changes the browser URL bar without navigation.
 * Used for atmosphere and as puzzle mechanic.
 */

class URLManipulator {
  private originalUrl: string = "";
  private active = false;
  private degradationLevel = 0;

  start(): void {
    if (this.active || typeof window === "undefined") return;
    this.originalUrl = window.location.href;
    this.active = true;
  }

  stop(): void {
    if (!this.active) return;
    this.restore();
    this.active = false;
  }

  /** Set the URL to any path (without actually navigating) */
  set(path: string, title?: string): void {
    if (!this.active) return;
    try {
      window.history.replaceState({}, title || document.title, path);
    } catch {
      // Some paths may be blocked by the browser
    }
  }

  /** Set the hash portion of the URL (encoded message) */
  setHash(hash: string): void {
    if (!this.active) return;
    window.history.replaceState(
      {},
      document.title,
      `${window.location.pathname}#${hash}`,
    );
  }

  /** Progressively degrade the URL to create uneasiness */
  degrade(): void {
    if (!this.active) return;
    this.degradationLevel++;

    const degradations = [
      // Level 1: subtle change
      () => this.set("/this-page-is-lying"),
      // Level 2: getting weird
      () => this.set("/this-page-is-l̸y̵i̷n̴g̶"),
      // Level 3: alarming
      () => this.set("/y̶o̸u̵-̶s̷h̶o̷u̵l̴d̶-̵n̶o̸t̶-̵b̷e̶-̵h̴e̵r̶e̸"),
      // Level 4: cryptic
      () => this.set("/01001000 01000101 01001100 01010000"),
      // Level 5: full corruption
      () => this.set("/̷̨̛̹̥̻̎▓▓▓̷̖̞̈́░░▓▓░̶̜̈́̚"),
    ];

    const level = Math.min(this.degradationLevel, degradations.length) - 1;
    degradations[level]();
  }

  /** Set URL to contain an encoded puzzle clue */
  setClue(encodedClue: string): void {
    if (!this.active) return;
    this.setHash(btoa(encodedClue));
  }

  /** Restore the original URL */
  restore(): void {
    if (!this.active) return;
    try {
      window.history.replaceState({}, document.title, this.originalUrl);
    } catch {
      // ignore
    }
    this.degradationLevel = 0;
  }

  /** Get current degradation level */
  getDegradationLevel(): number {
    return this.degradationLevel;
  }

  destroy(): void {
    this.stop();
  }
}

export const urlManipulator = new URLManipulator();
