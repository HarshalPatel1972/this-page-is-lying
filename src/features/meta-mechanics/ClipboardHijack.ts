/**
 * ClipboardHijack — Intercepts copy events to modify clipboard content.
 * Used for horror atmosphere and as a puzzle mechanic.
 */

type ClipboardCallback = (event: {
  type: "copy";
  originalText: string;
  modifiedText: string;
}) => void;

class ClipboardHijack {
  private callbacks: ClipboardCallback[] = [];
  private active = false;
  private modifier: ((text: string) => string) | null = null;
  private boundHandler: ((e: ClipboardEvent) => void) | null = null;

  start(): void {
    if (this.active || typeof document === "undefined") return;

    this.boundHandler = this.handleCopy.bind(this);
    document.addEventListener("copy", this.boundHandler);
    this.active = true;
  }

  stop(): void {
    if (!this.active || !this.boundHandler) return;

    document.removeEventListener("copy", this.boundHandler);
    this.boundHandler = null;
    this.active = false;
  }

  /** Set the function that modifies copied text */
  setModifier(fn: ((text: string) => string) | null): void {
    this.modifier = fn;
  }

  onEvent(callback: ClipboardCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      const idx = this.callbacks.indexOf(callback);
      if (idx > -1) this.callbacks.splice(idx, 1);
    };
  }

  private handleCopy(e: ClipboardEvent): void {
    if (!this.modifier) return;

    const selection = window.getSelection();
    if (!selection) return;

    const originalText = selection.toString();
    const modifiedText = this.modifier(originalText);

    if (modifiedText !== originalText) {
      e.preventDefault();
      e.clipboardData?.setData("text/plain", modifiedText);

      this.emit({
        type: "copy",
        originalText,
        modifiedText,
      });
    }
  }

  private emit(event: {
    type: "copy";
    originalText: string;
    modifiedText: string;
  }): void {
    this.callbacks.forEach((cb) => cb(event));
  }

  destroy(): void {
    this.stop();
    this.modifier = null;
    this.callbacks = [];
  }
}

export const clipboardHijack = new ClipboardHijack();

// Preset modifiers
export const clipboardModifiers = {
  /** Inject horror text between words */
  horrorInject: (text: string): string => {
    const injections = [
      "it sees you",
      "don't look behind",
      "help me",
      "not real",
      "wake up",
    ];
    const words = text.split(" ");
    if (words.length < 3) return text;

    const insertAt = Math.floor(Math.random() * (words.length - 1)) + 1;
    const injection = injections[Math.floor(Math.random() * injections.length)];
    words.splice(insertAt, 0, `[${injection}]`);
    return words.join(" ");
  },

  /** Corrupt random characters */
  corrupt: (text: string): string => {
    const glitchChars = "░▒▓█▄▀";
    return text
      .split("")
      .map((char) =>
        Math.random() < 0.1
          ? glitchChars[Math.floor(Math.random() * glitchChars.length)]
          : char,
      )
      .join("");
  },

  /** Reverse the text */
  reverse: (text: string): string => {
    return text.split("").reverse().join("");
  },

  /** Replace with a hidden message */
  hiddenMessage:
    (message: string) =>
    (_text: string): string => {
      return message;
    },
};
