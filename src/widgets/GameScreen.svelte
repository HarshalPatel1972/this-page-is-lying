<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import CRTOverlay from '$features/visuals/CRTOverlay.svelte';
  import StaticNoise from '$features/visuals/StaticNoise.svelte';
  import { tensionLevel } from '$shared/stores/gameState.js';
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  let tension = $state(0);
  let timestamp = $state('00:00:00');
  let intervalId: ReturnType<typeof setInterval> | undefined;

  let crtIntensity = $derived(tension / 10);

  $effect(() => {
    const unsub = tensionLevel.subscribe((v: number) => {
      tension = v;
    });
    return unsub;
  });

  function updateTimestamp() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    timestamp = `${hours}:${minutes}:${seconds}`;
  }

  onMount(() => {
    updateTimestamp();
    intervalId = setInterval(updateTimestamp, 1000);
  });

  onDestroy(() => {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
    }
  });
</script>

<div class="game-screen">
  <CRTOverlay intensity={crtIntensity} />
  <StaticNoise opacity={0.03} />

  <main class="game-screen__content">
    {#if children}
      {@render children()}
    {/if}
  </main>

  <div class="game-screen__surveillance-timestamp" aria-hidden="true">
    {timestamp}
  </div>
</div>

<style>
  .game-screen {
    position: relative;
    min-height: 100vh;
    background-color: var(--color-abyss, #0a0a0a);
    overflow: hidden;
  }

  .game-screen__content {
    position: relative;
    z-index: 1;
    min-height: 100vh;
  }

  .game-screen__surveillance-timestamp {
    position: fixed;
    bottom: 0.75rem;
    right: 0.75rem;
    z-index: 10;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.75rem;
    color: var(--color-terminal, #00ff41);
    opacity: 0.6;
    letter-spacing: 0.15em;
    text-shadow: 0 0 6px var(--color-terminal, #00ff41);
    pointer-events: none;
    user-select: none;
  }
</style>
