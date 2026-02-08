/**
 * ConsoleNarrative — Uses the browser console as a secondary narrative channel.
 * Displays styled messages, ASCII art, mutable objects, and puzzle clues.
 */

interface ConsoleMessage {
  text: string;
  style?: string;
  type?: "log" | "warn" | "error" | "info";
}

interface MutableClue {
  label: string;
  object: Record<string, unknown>;
}

class ConsoleNarrative {
  private messageQueue: ConsoleMessage[] = [];
  private mutableClues: Map<string, MutableClue> = new Map();
  private isActive = false;

  /** Start the console narrative system */
  start(): void {
    if (typeof console === "undefined") return;
    this.isActive = true;
    this.printWelcome();
  }

  /** Stop the narrative */
  stop(): void {
    this.isActive = false;
    this.messageQueue = [];
  }

  private printWelcome(): void {
    console.log(
      "%c T H I S   P A G E   I S   L Y I N G ",
      "background: #8b0000; color: #ffffff; font-size: 20px; font-weight: bold; padding: 10px 20px; font-family: monospace;",
    );
    console.log(
      "%c👁 You found the console. But can you trust what you see here? 👁",
      "color: #00ff41; font-size: 14px; font-family: monospace;",
    );
    console.log("%c─────────────────────────────────────────", "color: #333;");
  }

  /** Display a styled message in the console */
  print(
    text: string,
    style?: string,
    type: "log" | "warn" | "error" | "info" = "log",
  ): void {
    if (!this.isActive) return;

    const defaultStyle =
      "color: #00ff41; font-family: monospace; font-size: 12px;";
    const appliedStyle = style || defaultStyle;

    switch (type) {
      case "warn":
        console.warn(`%c${text}`, appliedStyle);
        break;
      case "error":
        console.error(`%c${text}`, appliedStyle);
        break;
      case "info":
        console.info(`%c${text}`, appliedStyle);
        break;
      default:
        console.log(`%c${text}`, appliedStyle);
    }
  }

  /** Print horror-themed ASCII art */
  printAsciiArt(art: string): void {
    if (!this.isActive) return;
    console.log(
      `%c${art}`,
      "color: #8b0000; font-family: monospace; font-size: 10px; line-height: 1.2;",
    );
  }

  /** Create a mutable clue object that changes after being logged */
  createMutableClue(id: string, initialValue: Record<string, unknown>): void {
    if (!this.isActive) return;

    const clueObject = { ...initialValue };
    this.mutableClues.set(id, { label: id, object: clueObject });

    console.log(
      `%c[EVIDENCE #${id}]`,
      "color: #ffaa00; font-weight: bold; font-family: monospace;",
      clueObject,
    );
  }

  /** Mutate a previously logged clue (changes appear retroactively in DevTools) */
  mutateCue(id: string, updates: Record<string, unknown>): void {
    const clue = this.mutableClues.get(id);
    if (!clue) return;

    Object.assign(clue.object, updates);
  }

  /** Print a puzzle hint in the console */
  printHint(hint: string, puzzleId: string): void {
    if (!this.isActive) return;

    console.log(
      `%c[HINT — Puzzle ${puzzleId}]%c ${hint}`,
      "color: #00ffff; font-weight: bold; font-family: monospace;",
      "color: #aaaaaa; font-family: monospace;",
    );
  }

  /** Print a fake error that's actually a clue */
  printFakeError(message: string, clueText: string): void {
    if (!this.isActive) return;

    console.error(`%c${message}`, "font-family: monospace;");
    // The "stack trace" contains the actual clue
    console.log(
      `%c    at ${clueText}`,
      "color: #666; font-family: monospace; font-size: 11px;",
    );
  }

  /** Print a divider */
  printDivider(): void {
    if (!this.isActive) return;
    console.log("%c" + "▓".repeat(50), "color: #333; font-family: monospace;");
  }

  /** Print corrupted text (text that gradually degrades) */
  printCorrupted(text: string): void {
    if (!this.isActive) return;

    const corrupted = text
      .split("")
      .map((char, i) => {
        if (Math.random() < (i / text.length) * 0.3) {
          const glitchChars = "░▒▓█▄▀■□▪▫";
          return glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }
        return char;
      })
      .join("");

    console.log(
      `%c${corrupted}`,
      "color: #8b0000; font-family: monospace; font-size: 12px;",
    );
  }

  destroy(): void {
    this.stop();
    this.mutableClues.clear();
  }
}

export const consoleNarrative = new ConsoleNarrative();
