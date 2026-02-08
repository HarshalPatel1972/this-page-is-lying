/**
 * AudioEngine — Singleton managing the Web Audio API AudioContext.
 * Handles initialization, context resumption, master volume, and buffer caching.
 */

class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private initialized = false;
  private muted = false;
  private masterVolume = 0.7;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      console.warn("[AudioEngine] Web Audio API not supported");
      return;
    }

    this.context = new AudioCtx();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.masterVolume;
    this.masterGain.connect(this.context.destination);
    this.initialized = true;
  }

  /** Resume context (required after user gesture) */
  async resume(): Promise<void> {
    if (this.context?.state === "suspended") {
      await this.context.resume();
    }
  }

  getContext(): AudioContext | null {
    return this.context;
  }

  getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  /** Set master volume (0-1) */
  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.masterVolume,
        this.context!.currentTime,
        0.1,
      );
    }
  }

  mute(): void {
    this.muted = true;
    if (this.masterGain && this.context) {
      this.masterGain.gain.setTargetAtTime(0, this.context.currentTime, 0.1);
    }
  }

  unmute(): void {
    this.muted = false;
    if (this.masterGain && this.context) {
      this.masterGain.gain.setTargetAtTime(
        this.masterVolume,
        this.context.currentTime,
        0.1,
      );
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** Load and decode an audio buffer, with caching */
  async loadBuffer(url: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }

    if (!this.context) return null;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.bufferCache.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`[AudioEngine] Failed to load buffer: ${url}`, error);
      return null;
    }
  }

  /** Create a buffer source node */
  createSource(buffer: AudioBuffer): AudioBufferSourceNode | null {
    if (!this.context) return null;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  /** Get current audio time */
  getCurrentTime(): number {
    return this.context?.currentTime || 0;
  }

  /** Check if engine is ready */
  isReady(): boolean {
    return this.initialized && this.context?.state === "running";
  }

  /** Clear the buffer cache */
  clearCache(): void {
    this.bufferCache.clear();
  }

  destroy(): void {
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    this.masterGain = null;
    this.bufferCache.clear();
    this.initialized = false;
  }
}

export const audioEngine = new AudioEngine();
