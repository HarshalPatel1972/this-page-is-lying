<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import GameScreen from '$widgets/GameScreen.svelte';
  import { gameState, gamePhase, tensionLevel, isPlaying } from '$shared/stores/gameState.js';
  import { metaMechanics } from '$features/meta-mechanics/MetaMechanicsController.js';
  import type { GamePhase } from '$shared/types/index.js';

  let phase: GamePhase = $state('idle');
  let tension: number = $state(0);
  let playing: boolean = $state(false);
  let puzzleMessage = $state('Initializing...');

  $effect(() => {
    const unsub1 = gamePhase.subscribe(v => phase = v);
    const unsub2 = tensionLevel.subscribe(v => tension = v);
    const unsub3 = isPlaying.subscribe(v => playing = v);
    return () => { unsub1(); unsub2(); unsub3(); };
  });

  onMount(() => {
    // Ensure user came through the trigger warning
    if (phase === 'idle') {
      goto('/');
      return;
    }

    // Initialize meta-mechanics
    metaMechanics.initialize();
    gameState.enterGame();
    gameState.setTension(1);

    // Start with a welcome sequence
    puzzleMessage = 'Welcome. The page is watching.';
    setTimeout(() => {
      puzzleMessage = 'Look around. Something is wrong.';
      gameState.setTension(2);
    }, 3000);
    setTimeout(() => {
      puzzleMessage = 'Can you find what is hidden?';
      gameState.setTension(3);
    }, 6000);
  });

  onDestroy(() => {
    metaMechanics.destroy();
  });
</script>

<svelte:head>
  <title>Playing — This Page Is Lying</title>
</svelte:head>

<GameScreen>
  <div class="flex flex-col items-center justify-center min-h-screen p-8">
    <div class="max-w-2xl w-full text-center">
      <!-- Game status -->
      <div class="mb-8">
        <p class="text-[var(--color-terminal)] font-mono text-sm opacity-70">
          TENSION: {tension}/10 | PHASE: {phase}
        </p>
      </div>

      <!-- Main puzzle area -->
      <div class="border border-[var(--color-smoke)] p-8 bg-[var(--color-abyss)] min-h-[300px] flex items-center justify-center">
        <p class="text-[var(--color-bone)] font-mono text-lg typewriter-cursor">
          {puzzleMessage}
        </p>
      </div>

      <!-- Controls -->
      <div class="mt-8 flex gap-4 justify-center">
        <button
          class="px-4 py-2 border border-[var(--color-smoke)] text-[var(--color-bone)] hover:bg-[var(--color-ash)] transition-colors font-mono text-sm"
          onclick={() => gameState.increaseTension(1)}
        >
          [INVESTIGATE]
        </button>
        <button
          class="px-4 py-2 border border-[var(--color-smoke)] text-[var(--color-bone)] hover:bg-[var(--color-ash)] transition-colors font-mono text-sm"
          onclick={() => goto('/settings')}
        >
          [SETTINGS]
        </button>
      </div>
    </div>
  </div>
</GameScreen>
