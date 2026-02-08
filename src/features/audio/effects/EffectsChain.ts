import { audioEngine } from "../engine/AudioEngine.js";

export class EffectsChain {
  private nodes: AudioNode[] = [];
  private ctx: AudioContext | null = null;

  constructor() {
    this.ctx = audioEngine.getContext();
  }

  /** Add a low-pass filter */
  lowPass(frequency: number, Q: number = 1): this {
    if (!this.ctx) return this;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    this.nodes.push(filter);
    return this;
  }

  /** Add a high-pass filter */
  highPass(frequency: number, Q: number = 1): this {
    if (!this.ctx) return this;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    this.nodes.push(filter);
    return this;
  }

  /** Add a bandpass filter */
  bandPass(frequency: number, Q: number = 1): this {
    if (!this.ctx) return this;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    this.nodes.push(filter);
    return this;
  }

  /** Add gain control */
  gain(volume: number): this {
    if (!this.ctx) return this;
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = volume;
    this.nodes.push(gainNode);
    return this;
  }

  /** Add distortion via waveshaper */
  distort(amount: number): this {
    if (!this.ctx) return this;
    const shaper = this.ctx.createWaveShaper();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shaper.curve = this.makeDistortionCurve(amount * 400) as any;
    shaper.oversample = "4x";
    this.nodes.push(shaper);
    return this;
  }

  /** Add delay/echo effect */
  delay(time: number, feedback: number = 0.3): this {
    if (!this.ctx) return this;
    const delayNode = this.ctx.createDelay(5.0);
    delayNode.delayTime.value = time;

    // Feedback loop via gain
    const feedbackGain = this.ctx.createGain();
    feedbackGain.gain.value = feedback;
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);

    this.nodes.push(delayNode);
    return this;
  }

  /** Add reverb using a convolver (requires an impulse response buffer URL) */
  async reverb(impulseUrl: string): Promise<this> {
    if (!this.ctx) return this;
    const convolver = this.ctx.createConvolver();
    const buffer = await audioEngine.loadBuffer(impulseUrl);
    if (buffer) {
      convolver.buffer = buffer;
      this.nodes.push(convolver);
    }
    return this;
  }

  /** Connect all nodes in chain and return the first and last nodes */
  build(): { input: AudioNode; output: AudioNode } | null {
    if (this.nodes.length === 0 || !this.ctx) return null;

    for (let i = 0; i < this.nodes.length - 1; i++) {
      this.nodes[i].connect(this.nodes[i + 1]);
    }

    return {
      input: this.nodes[0],
      output: this.nodes[this.nodes.length - 1],
    };
  }

  /** Get all nodes */
  getNodes(): AudioNode[] {
    return this.nodes;
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      curve[i] =
        ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  destroy(): void {
    this.nodes.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        /* ignore */
      }
    });
    this.nodes = [];
  }
}
