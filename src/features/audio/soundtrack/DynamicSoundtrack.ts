import { tensionLevel } from "$shared/stores/gameState.js";
import {
  AmbientLayer,
  type AmbientLayerConfig,
} from "../layers/AmbientLayer.js";

interface TensionLayer {
  layer: AmbientLayer;
  minTension: number;
  maxTension: number;
  isActive: boolean;
}

class DynamicSoundtrack {
  private tensionLayers: TensionLayer[] = [];
  private unsubscribe: (() => void) | null = null;
  private isPlaying = false;

  /** Register ambient layers for different tension ranges */
  registerLayer(
    config: AmbientLayerConfig,
    minTension: number,
    maxTension: number,
  ): void {
    this.tensionLayers.push({
      layer: new AmbientLayer(config),
      minTension,
      maxTension,
      isActive: false,
    });
  }

  /** Load all registered layers */
  async initialize(): Promise<void> {
    await Promise.all(this.tensionLayers.map((tl) => tl.layer.load()));
  }

  /** Start the dynamic soundtrack, reacting to tension */
  start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;

    this.unsubscribe = tensionLevel.subscribe((level) => {
      this.updateLayersForTension(level);
    });
  }

  stop(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    this.tensionLayers.forEach((tl) => {
      if (tl.isActive) {
        tl.layer.stop();
        tl.isActive = false;
      }
    });

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  private updateLayersForTension(tension: number): void {
    if (!this.isPlaying) return;

    for (const tensionLayer of this.tensionLayers) {
      const shouldBeActive =
        tension >= tensionLayer.minTension &&
        tension <= tensionLayer.maxTension;

      if (shouldBeActive && !tensionLayer.isActive) {
        tensionLayer.layer.start();
        tensionLayer.isActive = true;
      } else if (!shouldBeActive && tensionLayer.isActive) {
        tensionLayer.layer.stop();
        tensionLayer.isActive = false;
      }

      // Adjust volume based on tension position within range
      if (tensionLayer.isActive) {
        const range = tensionLayer.maxTension - tensionLayer.minTension;
        const position =
          range > 0 ? (tension - tensionLayer.minTension) / range : 0.5;
        tensionLayer.layer.setVolume(0.1 + position * 0.3);
      }
    }
  }

  destroy(): void {
    this.stop();
    this.tensionLayers.forEach((tl) => tl.layer.destroy());
    this.tensionLayers = [];
  }
}

export const dynamicSoundtrack = new DynamicSoundtrack();
