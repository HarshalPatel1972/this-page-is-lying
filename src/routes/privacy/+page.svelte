<script lang="ts">
  import { GAME_VERSION } from '$shared/constants/index.js';
</script>

<svelte:head>
  <title>Privacy Policy — This Page Is Lying</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-void)] text-[var(--color-bone)] p-8 font-mono">
  <div class="max-w-2xl mx-auto">
    <button
      class="text-[var(--color-terminal)] hover:underline mb-8 text-sm"
      onclick={() => history.back()}
    >&lt; BACK</button>

    <h1 class="text-2xl text-[var(--color-terminal)] mb-8">PRIVACY POLICY</h1>

    <div class="space-y-6 text-sm leading-relaxed text-[var(--color-fog)]">
      <section>
        <h2 class="text-[var(--color-warning)] text-lg mb-2">What We Collect</h2>
        <p>This game collects minimal data necessary for gameplay:</p>
        <ul class="list-disc list-inside ml-4 mt-2 space-y-1">
          <li>Anonymous player ID (no personal information)</li>
          <li>Game progress and scores</li>
          <li>Accessibility preferences (stored locally)</li>
        </ul>
      </section>

      <section>
        <h2 class="text-[var(--color-warning)] text-lg mb-2">Analytics</h2>
        <p>If you consent, we use privacy-first analytics (no third-party trackers) to understand how players interact with the game. You can withdraw consent at any time.</p>
      </section>

      <section>
        <h2 class="text-[var(--color-warning)] text-lg mb-2">Cookies</h2>
        <p>Essential cookies store your consent choice and accessibility preferences. Analytics cookies are only set with your explicit permission.</p>
      </section>

      <section>
        <h2 class="text-[var(--color-warning)] text-lg mb-2">Your Rights</h2>
        <p>You can request deletion of all your data at any time. Contact us or use the in-game settings to clear your data.</p>
      </section>

      <section>
        <h2 class="text-[var(--color-warning)] text-lg mb-2">Meta-Mechanics Disclosure</h2>
        <p>This game intentionally monitors browser behavior (tab switching, developer tools, mouse movement) as part of the gameplay experience. This monitoring is disclosed in the trigger warning and can be disabled via accessibility settings. No data from these mechanics is sent to any server.</p>
      </section>
    </div>

    <p class="text-xs text-[var(--color-smoke)] mt-12">v{GAME_VERSION} | Last updated: 2025</p>
  </div>
</div>
