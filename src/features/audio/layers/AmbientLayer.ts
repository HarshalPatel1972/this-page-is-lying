import { audioEngine } from "../engine/AudioEngine.js";

export interface AmbientLayerConfig {
  url: string;
  baseVolume: number;
  loop: boolean;
  fadeInDuration: number;
  fadeOutDuration: number;
  pitchVariation: number; // ±cents of random pitch drift
}

export class AmbientLayer {
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private config: AmbientLayerConfig;
  private isPlaying = false;
  private pitchInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: AmbientLayerConfig) {
    this.config = config;
  }

  async load(): Promise<void> {
    this.buffer = await audioEngine.loadBuffer(this.config.url);
  }

  start(): void {
    const ctx = audioEngine.getContext();
    const master = audioEngine.getMasterGain();
    if (!ctx || !master || !this.buffer || this.isPlaying) return;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(master);

    this.source = ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.loop = this.config.loop;
    this.source.connect(this.gainNode);
    this.source.start();

    // Fade in
    this.gainNode.gain.setTargetAtTime(
      this.config.baseVolume,
      ctx.currentTime,
      this.config.fadeInDuration / 3,
    );

    // Subtle pitch drift for organic feel
    if (this.config.pitchVariation > 0) {
      this.pitchInterval = setInterval(() => {
        if (this.source) {
          const drift = (Math.random() - 0.5) * 2 * this.config.pitchVariation;
          this.source.detune.setTargetAtTime(drift, ctx.currentTime, 2);
        }
      }, 3000);
    }

    this.isPlaying = true;
  }

  stop(): void {
    const ctx = audioEngine.getContext();
    if (!ctx || !this.gainNode || !this.isPlaying) return;

    // Fade out
    this.gainNode.gain.setTargetAtTime(
      0,
      ctx.currentTime,
      this.config.fadeOutDuration / 3,
    );

    // Stop source after fade
    const source = this.source;
    setTimeout(() => {
      try {
        source?.stop();
      } catch {
        // already stopped
      }
    }, this.config.fadeOutDuration);

    if (this.pitchInterval) {
      clearInterval(this.pitchInterval);
      this.pitchInterval = null;
    }

    this.isPlaying = false;
  }

  setVolume(volume: number): void {
    const ctx = audioEngine.getContext();
    if (this.gainNode && ctx) {
      this.gainNode.gain.setTargetAtTime(volume, ctx.currentTime, 0.3);
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  destroy(): void {
    this.stop();
    this.buffer = null;
  }
}
