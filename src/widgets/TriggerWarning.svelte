<script lang="ts">
  import { onMount } from 'svelte';
  import { accessibilitySettings } from '$shared/stores/accessibility.js';
  import { gameState } from '$shared/stores/gameState.js';
  import { GAME_VERSION } from '$shared/constants/index.js';
  import type { AccessibilitySettings } from '$shared/types/index.js';

  interface Props {
    onenter?: () => void;
  }

  let { onenter }: Props = $props();

  let settings: AccessibilitySettings = $state({
    reducedMotion: false,
    noAudio: false,
    noJumpscares: false,
    noStrobes: false,
    highContrast: false,
    screenReaderMode: false
  });

  let isVisible = $state(true);

  $effect(() => {
    const unsub = accessibilitySettings.subscribe((v: AccessibilitySettings) => {
      settings = v;
    });
    return unsub;
  });

  function toggleSetting(key: keyof AccessibilitySettings, value: boolean) {
    accessibilitySettings.setSetting(key, value);
  }

  function handleEnter() {
    console.log('✓ TriggerWarning handleEnter called');
    try {
      console.log('1. Calling gameState.markInteracted()');
      gameState.markInteracted();
      console.log('2. Calling gameState.startSession()');
      gameState.startSession();
      console.log('3. Setting isVisible = false');
      isVisible = false;
      console.log('4. Calling onenter callback');
      onenter?.();
      console.log('5. All done!');
    } catch (error) {
      console.error('❌ Error in handleEnter:', error);
    }
  }
</script>

{#if isVisible}
  <div class="trigger-warning" role="dialog" aria-modal="true" aria-label="Content warning">
    <div class="trigger-warning__container">
      <h1 class="trigger-warning__title">THIS PAGE IS LYING</h1>
      <p class="trigger-warning__subtitle">A meta-horror web experience</p>

      <div class="trigger-warning__warnings">
        <p class="trigger-warning__warnings-heading">This experience uses:</p>
        <ul class="trigger-warning__warnings-list">
          <li>Flashing and strobe effects</li>
          <li>Spatial audio and disturbing sounds</li>
          <li>Fake error messages and system dialogs</li>
          <li>Browser manipulation and tracking</li>
          <li>Psychological horror elements</li>
        </ul>
      </div>

      <div class="trigger-warning__toggles">
        <label class="trigger-warning__toggle">
          <span class="trigger-warning__toggle-label">Disable animations</span>
          <input
            type="checkbox"
            class="trigger-warning__toggle-input"
            checked={settings.reducedMotion}
            onchange={(e) => toggleSetting('reducedMotion', e.currentTarget.checked)}
          />
          <span class="trigger-warning__toggle-switch"></span>
        </label>

        <label class="trigger-warning__toggle">
          <span class="trigger-warning__toggle-label">Disable audio</span>
          <input
            type="checkbox"
            class="trigger-warning__toggle-input"
            checked={settings.noAudio}
            onchange={(e) => toggleSetting('noAudio', e.currentTarget.checked)}
          />
          <span class="trigger-warning__toggle-switch"></span>
        </label>

        <label class="trigger-warning__toggle">
          <span class="trigger-warning__toggle-label">Disable jumpscares</span>
          <input
            type="checkbox"
            class="trigger-warning__toggle-input"
            checked={settings.noJumpscares}
            onchange={(e) => toggleSetting('noJumpscares', e.currentTarget.checked)}
          />
          <span class="trigger-warning__toggle-switch"></span>
        </label>

        <label class="trigger-warning__toggle">
          <span class="trigger-warning__toggle-label">Disable strobe effects</span>
          <input
            type="checkbox"
            class="trigger-warning__toggle-input"
            checked={settings.noStrobes}
            onchange={(e) => toggleSetting('noStrobes', e.currentTarget.checked)}
          />
          <span class="trigger-warning__toggle-switch"></span>
        </label>

        <label class="trigger-warning__toggle">
          <span class="trigger-warning__toggle-label">High contrast mode</span>
          <input
            type="checkbox"
            class="trigger-warning__toggle-input"
            checked={settings.highContrast}
            onchange={(e) => toggleSetting('highContrast', e.currentTarget.checked)}
          />
          <span class="trigger-warning__toggle-switch"></span>
        </label>
      </div>

      <button class="trigger-warning__enter" onclick={handleEnter}>
        I UNDERSTAND, LET ME IN
      </button>
    </div>

    <span class="trigger-warning__version">v{GAME_VERSION}</span>
  </div>
{/if}

<style>
  .trigger-warning {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-void, #000000);
    font-family: 'Courier New', Courier, monospace;
    overflow-y: auto;
  }

  .trigger-warning__container {
    max-width: 640px;
    width: 100%;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  .trigger-warning__title {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 900;
    color: var(--color-terminal, #00ff41);
    text-align: center;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    line-height: 1.1;
    animation: text-corrupt 4s infinite;
  }

  @keyframes text-corrupt {
    0%, 100% {
      text-shadow:
        0 0 8px var(--color-terminal, #00ff41),
        0 0 20px var(--color-terminal, #00ff41);
      transform: none;
    }
    2% {
      text-shadow:
        -2px 0 var(--color-blood, #ff0033),
        2px 0 var(--color-terminal, #00ff41);
      transform: skewX(-1deg);
    }
    4% {
      text-shadow:
        0 0 8px var(--color-terminal, #00ff41),
        0 0 20px var(--color-terminal, #00ff41);
      transform: none;
    }
    50% {
      text-shadow:
        0 0 8px var(--color-terminal, #00ff41),
        0 0 20px var(--color-terminal, #00ff41);
      transform: none;
    }
    52% {
      text-shadow:
        3px 0 var(--color-blood, #ff0033),
        -3px 0 cyan;
      transform: skewX(2deg) translateX(-2px);
    }
    53% {
      text-shadow:
        0 0 8px var(--color-terminal, #00ff41),
        0 0 20px var(--color-terminal, #00ff41);
      transform: none;
    }
  }

  .trigger-warning__subtitle {
    font-size: 1rem;
    color: var(--color-bone, #b0b0b0);
    opacity: 0.5;
    text-align: center;
    letter-spacing: 0.3em;
    text-transform: uppercase;
  }

  .trigger-warning__warnings {
    width: 100%;
    border: 1px solid var(--color-terminal, #00ff41);
    padding: 1.5rem;
    opacity: 0.85;
  }

  .trigger-warning__warnings-heading {
    color: var(--color-bone, #b0b0b0);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.75rem;
  }

  .trigger-warning__warnings-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .trigger-warning__warnings-list li {
    color: var(--color-blood, #ff0033);
    font-size: 0.875rem;
    padding-left: 1.25rem;
    position: relative;
  }

  .trigger-warning__warnings-list li::before {
    content: '>';
    position: absolute;
    left: 0;
    color: var(--color-terminal, #00ff41);
  }

  .trigger-warning__toggles {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1.5rem;
  }

  .trigger-warning__toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
  }

  .trigger-warning__toggle-label {
    color: var(--color-bone, #b0b0b0);
    font-size: 0.875rem;
  }

  .trigger-warning__toggle-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  .trigger-warning__toggle-switch {
    position: relative;
    width: 44px;
    height: 22px;
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 11px;
    transition: background-color 0.2s, border-color 0.2s;
    flex-shrink: 0;
  }

  .trigger-warning__toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background-color: var(--color-bone, #b0b0b0);
    border-radius: 50%;
    transition: transform 0.2s, background-color 0.2s;
  }

  .trigger-warning__toggle-input:checked + .trigger-warning__toggle-switch {
    background-color: rgba(0, 255, 65, 0.2);
    border-color: var(--color-terminal, #00ff41);
  }

  .trigger-warning__toggle-input:checked + .trigger-warning__toggle-switch::after {
    transform: translateX(22px);
    background-color: var(--color-terminal, #00ff41);
  }

  .trigger-warning__toggle-input:focus-visible + .trigger-warning__toggle-switch {
    outline: 2px solid var(--color-terminal, #00ff41);
    outline-offset: 2px;
  }

  .trigger-warning__enter {
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--color-void, #000000);
    background-color: var(--color-terminal, #00ff41);
    border: none;
    padding: 1rem 2.5rem;
    cursor: pointer;
    transition: background-color 0.15s, box-shadow 0.15s;
  }

  .trigger-warning__enter:hover {
    background-color: #33ff66;
    box-shadow: 0 0 20px var(--color-terminal, #00ff41), 0 0 40px rgba(0, 255, 65, 0.3);
  }

  .trigger-warning__enter:focus-visible {
    outline: 2px solid var(--color-bone, #b0b0b0);
    outline-offset: 4px;
  }

  .trigger-warning__enter:active {
    transform: scale(0.98);
  }

  .trigger-warning__version {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    font-size: 0.75rem;
    color: var(--color-bone, #b0b0b0);
    opacity: 0.3;
    font-family: 'Courier New', Courier, monospace;
  }
</style>
