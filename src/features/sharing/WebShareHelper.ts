export interface ShareData {
  title: string;
  text: string;
  url: string;
}

class WebShareHelper {
  isSupported(): boolean {
    return typeof navigator !== "undefined" && "share" in navigator;
  }

  async share(data: ShareData): Promise<boolean> {
    if (this.isSupported()) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        if ((error as Error).name === "AbortError") return false;
        console.error("[WebShare] Share failed:", error);
      }
    }
    // Fallback: copy to clipboard
    return this.copyToClipboard(data.url);
  }

  private async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}

export const webShareHelper = new WebShareHelper();
