<script lang="ts">
  import { onMount } from 'svelte';
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

  $effect(() => {
    const unsub = accessibilitySettings.subscribe((v: AccessibilitySettings) => {
      settings = v;
    });
    return unsub;
  });

  $effect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.classList.toggle('reduced-motion', settings.reducedMotion);
    html.classList.toggle('high-contrast', settings.highContrast);
    html.classList.toggle('screen-reader-mode', settings.screenReaderMode);
  });

  onMount(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');

    if (motionQuery.matches) {
      accessibilitySettings.setSetting('reducedMotion', true);
    }
    if (contrastQuery.matches) {
      accessibilitySettings.setSetting('highContrast', true);
    }

    const handleMotion = (e: MediaQueryListEvent) => {
      accessibilitySettings.setSetting('reducedMotion', e.matches);
    };
    const handleContrast = (e: MediaQueryListEvent) => {
      accessibilitySettings.setSetting('highContrast', e.matches);
    };

    motionQuery.addEventListener('change', handleMotion);
    contrastQuery.addEventListener('change', handleContrast);

    return () => {
      motionQuery.removeEventListener('change', handleMotion);
      contrastQuery.removeEventListener('change', handleContrast);
    };
  });
</script>

{#if children}
  {@render children()}
{/if}
