<script lang="ts">
  import { onMount } from 'svelte';
  import { CONSENT_VERSION } from '$shared/constants/index.js';
  import type { ConsentState } from '$shared/types/index.js';

  interface Props {
    onaccept?: () => void;
    onreject?: () => void;
  }

  let { onaccept, onreject }: Props = $props();

  let isVisible = $state(false);
  let showCustomize = $state(false);

  let analyticsEnabled = $state(true);
  let preferencesEnabled = $state(true);

  const STORAGE_KEY = 'cookie-consent';

  function loadConsent(): ConsentState | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as ConsentState & { version?: string };
      if (parsed.version !== CONSENT_VERSION) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveConsent(consent: ConsentState) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...consent, version: CONSENT_VERSION })
      );
    } catch {
      // Storage unavailable
    }
  }

  function handleAcceptAll() {
    const consent: ConsentState = {
      essential: true,
      analytics: true,
      preferences: true,
      timestamp: Date.now(),
      version: CONSENT_VERSION
    };
    saveConsent(consent);
    isVisible = false;
    onaccept?.();
  }

  function handleRejectAll() {
    const consent: ConsentState = {
      essential: true,
      analytics: false,
      preferences: false,
      timestamp: Date.now(),
      version: CONSENT_VERSION
    };
    saveConsent(consent);
    isVisible = false;
    onreject?.();
  }

  function handleSaveCustom() {
    const consent: ConsentState = {
      essential: true,
      analytics: analyticsEnabled,
      preferences: preferencesEnabled,
      timestamp: Date.now(),
      version: CONSENT_VERSION
    };
    saveConsent(consent);
    isVisible = false;
    if (analyticsEnabled || preferencesEnabled) {
      onaccept?.();
    } else {
      onreject?.();
    }
  }

  function handleCustomize() {
    showCustomize = !showCustomize;
  }

  onMount(() => {
    const existing = loadConsent();
    if (!existing) {
      isVisible = true;
    }
  });
</script>

{#if isVisible}
  <div class="cookie-consent" role="dialog" aria-label="Cookie consent">
    <div class="cookie-consent__inner">
      <p class="cookie-consent__text">
        This site uses cookies for analytics and preferences.
      </p>

      {#if showCustomize}
        <div class="cookie-consent__options">
          <label class="cookie-consent__option cookie-consent__option--disabled">
            <span class="cookie-consent__option-label">Essential</span>
            <input
              type="checkbox"
              checked={true}
              disabled
              class="cookie-consent__option-input"
            />
            <span class="cookie-consent__option-switch cookie-consent__option-switch--always-on"></span>
          </label>

          <label class="cookie-consent__option">
            <span class="cookie-consent__option-label">Analytics</span>
            <input
              type="checkbox"
              class="cookie-consent__option-input"
              checked={analyticsEnabled}
              onchange={(e) => { analyticsEnabled = e.currentTarget.checked; }}
            />
            <span class="cookie-consent__option-switch"></span>
          </label>

          <label class="cookie-consent__option">
            <span class="cookie-consent__option-label">Preferences</span>
            <input
              type="checkbox"
              class="cookie-consent__option-input"
              checked={preferencesEnabled}
              onchange={(e) => { preferencesEnabled = e.currentTarget.checked; }}
            />
            <span class="cookie-consent__option-switch"></span>
          </label>

          <button class="cookie-consent__btn cookie-consent__btn--save" onclick={handleSaveCustom}>
            Save Preferences
          </button>
        </div>
      {/if}

      <div class="cookie-consent__actions">
        <button class="cookie-consent__btn" onclick={handleAcceptAll}>
          Accept All
        </button>
        <button class="cookie-consent__btn" onclick={handleRejectAll}>
          Reject All
        </button>
        <button class="cookie-consent__btn" onclick={handleCustomize}>
          {showCustomize ? 'Hide Options' : 'Customize'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .cookie-consent {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 9998;
    background-color: var(--color-abyss, #0a0a0a);
    border-top: 1px solid var(--color-terminal, #00ff41);
    font-family: 'Courier New', Courier, monospace;
    padding: 1.25rem 1.5rem;
  }

  .cookie-consent__inner {
    max-width: 960px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .cookie-consent__text {
    color: var(--color-bone, #b0b0b0);
    font-size: 0.875rem;
    margin: 0;
    line-height: 1.5;
  }

  .cookie-consent__actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .cookie-consent__btn {
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.8125rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.625rem 1.25rem;
    cursor: pointer;
    border: 1px solid var(--color-terminal, #00ff41);
    background-color: transparent;
    color: var(--color-terminal, #00ff41);
    transition: background-color 0.15s, color 0.15s;
    flex: 1;
    min-width: 120px;
    text-align: center;
  }

  .cookie-consent__btn:hover {
    background-color: var(--color-terminal, #00ff41);
    color: var(--color-void, #000000);
  }

  .cookie-consent__btn:focus-visible {
    outline: 2px solid var(--color-bone, #b0b0b0);
    outline-offset: 2px;
  }

  .cookie-consent__btn--save {
    border-color: var(--color-bone, #b0b0b0);
    color: var(--color-bone, #b0b0b0);
  }

  .cookie-consent__btn--save:hover {
    background-color: var(--color-bone, #b0b0b0);
    color: var(--color-void, #000000);
  }

  .cookie-consent__options {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .cookie-consent__option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
  }

  .cookie-consent__option--disabled {
    cursor: default;
    opacity: 0.5;
  }

  .cookie-consent__option-label {
    color: var(--color-bone, #b0b0b0);
    font-size: 0.8125rem;
  }

  .cookie-consent__option-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  .cookie-consent__option-switch {
    position: relative;
    width: 36px;
    height: 18px;
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 9px;
    transition: background-color 0.2s, border-color 0.2s;
    flex-shrink: 0;
  }

  .cookie-consent__option-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    background-color: var(--color-bone, #b0b0b0);
    border-radius: 50%;
    transition: transform 0.2s, background-color 0.2s;
  }

  .cookie-consent__option-input:checked + .cookie-consent__option-switch {
    background-color: rgba(0, 255, 65, 0.2);
    border-color: var(--color-terminal, #00ff41);
  }

  .cookie-consent__option-input:checked + .cookie-consent__option-switch::after {
    transform: translateX(18px);
    background-color: var(--color-terminal, #00ff41);
  }

  .cookie-consent__option-switch--always-on {
    background-color: rgba(0, 255, 65, 0.15);
    border-color: rgba(0, 255, 65, 0.3);
  }

  .cookie-consent__option-switch--always-on::after {
    transform: translateX(18px);
    background-color: rgba(0, 255, 65, 0.5);
  }

  .cookie-consent__option-input:focus-visible + .cookie-consent__option-switch {
    outline: 2px solid var(--color-terminal, #00ff41);
    outline-offset: 2px;
  }
</style>
