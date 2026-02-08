import { audioEngine } from "../engine/AudioEngine.js";

export interface SpatialConfig {
  url: string;
  position: { x: number; y: number; z: number };
  maxDistance: number;
  refDistance: number;
  rolloffFactor: number;
  loop: boolean;
  volume: number;
}

export class SpatialSource {
  private source: AudioBufferSourceNode | null = null;
  private panner: PannerNode | null = null;
  private gainNode: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private config: SpatialConfig;
  private isPlaying = false;
  private animationFrame: number | null = null;

  constructor(config: SpatialConfig) {
    this.config = config;
  }

  async load(): Promise<void> {
    this.buffer = await audioEngine.loadBuffer(this.config.url);
  }

  start(): void {
    const ctx = audioEngine.getContext();
    const master = audioEngine.getMasterGain();
    if (!ctx || !master || !this.buffer || this.isPlaying) return;

    // Create panner for 3D positioning
    this.panner = ctx.createPanner();
    this.panner.panningModel = "HRTF";
    this.panner.distanceModel = "inverse";
    this.panner.maxDistance = this.config.maxDistance;
    this.panner.refDistance = this.config.refDistance;
    this.panner.rolloffFactor = this.config.rolloffFactor;
    this.panner.positionX.value = this.config.position.x;
    this.panner.positionY.value = this.config.position.y;
    this.panner.positionZ.value = this.config.position.z;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = this.config.volume;

    this.source = ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.loop = this.config.loop;
    this.source.connect(this.gainNode);
    this.gainNode.connect(this.panner);
    this.panner.connect(master);
    this.source.start();

    this.isPlaying = true;
  }

  stop(): void {
    if (!this.isPlaying) return;
    try {
      this.source?.stop();
    } catch {
      /* already stopped */
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.isPlaying = false;
  }

  /** Move the sound source to a new position */
  setPosition(x: number, y: number, z: number): void {
    const ctx = audioEngine.getContext();
    if (!this.panner || !ctx) return;
    this.panner.positionX.setTargetAtTime(x, ctx.currentTime, 0.1);
    this.panner.positionY.setTargetAtTime(y, ctx.currentTime, 0.1);
    this.panner.positionZ.setTargetAtTime(z, ctx.currentTime, 0.1);
  }

  /** Animate the source in a circle (orbit) */
  orbit(radius: number, speed: number): void {
    if (!this.isPlaying) return;
    const startTime = Date.now();

    const animate = () => {
      if (!this.isPlaying) return;
      const elapsed = (Date.now() - startTime) / 1000;
      const angle = elapsed * speed;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      this.setPosition(x, this.config.position.y, z);
      this.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  /** Animate the source approaching the listener */
  approach(fromZ: number, toZ: number, duration: number): void {
    const ctx = audioEngine.getContext();
    if (!this.panner || !ctx) return;
    this.panner.positionZ.setValueAtTime(fromZ, ctx.currentTime);
    this.panner.positionZ.linearRampToValueAtTime(
      toZ,
      ctx.currentTime + duration,
    );
  }

  setVolume(volume: number): void {
    const ctx = audioEngine.getContext();
    if (this.gainNode && ctx) {
      this.gainNode.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
    }
  }

  destroy(): void {
    this.stop();
    this.buffer = null;
  }
}
