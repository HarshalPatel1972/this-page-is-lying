<script lang="ts">
  import { goto } from '$app/navigation';
  import { accessibilitySettings } from '$shared/stores/accessibility.js';
  import { audioEngine } from '$features/audio/engine/AudioEngine.js';
  import type { AccessibilitySettings } from '$shared/types/index.js';
  import { GAME_VERSION } from '$shared/constants/index.js';

  let settings: AccessibilitySettings = $state({
    reducedMotion: false, noAudio: false, noJumpscares: false,
    noStrobes: false, highContrast: false, screenReaderMode: false
  });
  let volume = $state(70);

  $effect(() => {
    const unsub = accessibilitySettings.subscribe(v => settings = v);
    return unsub;
  });

  function toggleSetting(key: keyof AccessibilitySettings) {
    accessibilitySettings.setSetting(key, !settings[key]);
  }

  function setVolume(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value);
    volume = val;
    audioEngine.setVolume(val / 100);
  }
</script>

<svelte:head>
  <title>Settings — This Page Is Lying</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-void)] text-[var(--color-bone)] p-8 font-mono">
  <div class="max-w-xl mx-auto">
    <button
      class="text-[var(--color-terminal)] hover:underline mb-8 text-sm"
      onclick={() => history.back()}
    >&lt; BACK</button>

    <h1 class="text-2xl text-[var(--color-terminal)] mb-8">SETTINGS</h1>

    <!-- Accessibility -->
    <section class="mb-8">
      <h2 class="text-lg text-[var(--color-warning)] mb-4 border-b border-[var(--color-smoke)] pb-2">ACCESSIBILITY</h2>
      {#each [
        { key: 'reducedMotion' as const, label: 'Disable animations' },
        { key: 'noAudio' as const, label: 'Disable audio' },
        { key: 'noJumpscares' as const, label: 'Disable jumpscares' },
        { key: 'noStrobes' as const, label: 'Disable strobe effects' },
        { key: 'highContrast' as const, label: 'High contrast mode' },
        { key: 'screenReaderMode' as const, label: 'Screen reader mode' }
      ] as item}
        <label class="flex items-center justify-between py-2 cursor-pointer hover:bg-[var(--color-abyss)] px-2">
          <span class="text-sm">{item.label}</span>
          <input
            type="checkbox"
            checked={settings[item.key]}
            onchange={() => toggleSetting(item.key)}
            class="w-5 h-5 accent-[var(--color-terminal)]"
          />
        </label>
      {/each}
    </section>

    <!-- Audio -->
    <section class="mb-8">
      <h2 class="text-lg text-[var(--color-warning)] mb-4 border-b border-[var(--color-smoke)] pb-2">AUDIO</h2>
      <label class="flex items-center justify-between py-2 px-2">
        <span class="text-sm">Master Volume</span>
        <input
          type="range" min="0" max="100" value={volume}
          oninput={setVolume}
          class="w-48 accent-[var(--color-terminal)]"
        />
      </label>
    </section>

    <p class="text-xs text-[var(--color-smoke)] mt-12">v{GAME_VERSION}</p>
  </div>
</div>
