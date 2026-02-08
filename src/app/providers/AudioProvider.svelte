<script lang="ts">
  import { onMount, onDestroy, setContext } from 'svelte';
  import { audioEngine } from '$features/audio/engine/AudioEngine.js';
  import { dynamicSoundtrack } from '$features/audio/soundtrack/DynamicSoundtrack.js';
  import { accessibilitySettings } from '$shared/stores/accessibility.js';
  import type { Snippet } from 'svelte';
  import type { AccessibilitySettings } from '$shared/types/index.js';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  let settings: AccessibilitySettings = $state({
    reducedMotion: false,
    noAudio: false,
    noJumpscares: false,
    noStrobes: false,
    highContrast: false,
    screenReaderMode: false
  });

  let isInitialized = $state(false);

  setContext('audio', {
    audioEngine,
    dynamicSoundtrack
  });

  $effect(() => {
    const unsub = accessibilitySettings.subscribe((v: AccessibilitySettings) => {
      settings = v;
    });
    return unsub;
  });

  $effect(() => {
    if (!isInitialized) return;
    if (settings.noAudio) {
      audioEngine.mute();
    } else {
      audioEngine.unmute();
    }
  });

  onMount(async () => {
    if (settings.noAudio) return;
    await audioEngine.initialize();
    isInitialized = true;
  });

  onDestroy(() => {
    dynamicSoundtrack.destroy();
    audioEngine.destroy();
  });
</script>

{#if children}
  {@render children()}
{/if}
