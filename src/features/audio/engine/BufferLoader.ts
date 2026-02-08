import { audioEngine } from "./AudioEngine.js";

interface LoadTask {
  url: string;
  priority: number;
  resolve: (buffer: AudioBuffer | null) => void;
  reject: (error: Error) => void;
}

class BufferLoader {
  private queue: LoadTask[] = [];
  private loading = false;
  private concurrency = 3;
  private activeLoads = 0;
  private onProgressCallbacks: Array<(loaded: number, total: number) => void> =
    [];
  private totalQueued = 0;
  private totalLoaded = 0;

  /** Load a single audio file */
  async load(url: string, priority: number = 0): Promise<AudioBuffer | null> {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, priority, resolve, reject });
      this.totalQueued++;
      this.queue.sort((a, b) => b.priority - a.priority);
      this.processQueue();
    });
  }

  /** Load multiple audio files */
  async loadAll(urls: string[]): Promise<Map<string, AudioBuffer | null>> {
    const results = new Map<string, AudioBuffer | null>();
    const promises = urls.map(async (url) => {
      const buffer = await this.load(url);
      results.set(url, buffer);
    });
    await Promise.all(promises);
    return results;
  }

  /** Register a progress callback */
  onProgress(callback: (loaded: number, total: number) => void): () => void {
    this.onProgressCallbacks.push(callback);
    return () => {
      const idx = this.onProgressCallbacks.indexOf(callback);
      if (idx > -1) this.onProgressCallbacks.splice(idx, 1);
    };
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.activeLoads < this.concurrency) {
      const task = this.queue.shift();
      if (!task) break;

      this.activeLoads++;
      try {
        const buffer = await audioEngine.loadBuffer(task.url);
        task.resolve(buffer);
      } catch (error) {
        task.reject(error as Error);
      } finally {
        this.activeLoads--;
        this.totalLoaded++;
        this.emitProgress();
        this.processQueue();
      }
    }
  }

  private emitProgress(): void {
    this.onProgressCallbacks.forEach((cb) =>
      cb(this.totalLoaded, this.totalQueued),
    );
  }

  /** Reset counters */
  reset(): void {
    this.totalQueued = 0;
    this.totalLoaded = 0;
  }
}

export const bufferLoader = new BufferLoader();
