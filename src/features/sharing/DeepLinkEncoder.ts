interface ShareableState {
  puzzleTemplate?: string;
  seed?: number;
  difficulty?: number;
  score?: number;
  puzzlesSolved?: number;
}

class DeepLinkEncoder {
  encode(state: ShareableState): string {
    const json = JSON.stringify(state);
    const encoded = btoa(json);
    return encoded;
  }

  decode(hash: string): ShareableState | null {
    try {
      const json = atob(hash);
      return JSON.parse(json) as ShareableState;
    } catch {
      return null;
    }
  }

  createShareUrl(state: ShareableState): string {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const hash = this.encode(state);
    return `${base}/game#s=${hash}`;
  }

  readFromUrl(): ShareableState | null {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash;
    const match = hash.match(/#s=(.+)/);
    if (!match) return null;
    return this.decode(match[1]);
  }
}

export const deepLinkEncoder = new DeepLinkEncoder();
