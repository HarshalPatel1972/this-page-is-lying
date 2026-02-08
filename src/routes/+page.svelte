<script lang="ts">
  import { goto } from '$app/navigation';
  import TriggerWarning from '$widgets/TriggerWarning.svelte';
  import { gameState, gamePhase } from '$shared/stores/gameState.js';
  import type { GamePhase } from '$shared/types/index.js';

  let phase: GamePhase = $state('idle');

  $effect(() => {
    const unsub = gamePhase.subscribe(v => phase = v);
    return unsub;
  });

  function handleEnter() {
    goto('/game');
  }

  // If already in a session, redirect to game
  $effect(() => {
    if (phase === 'playing' || phase === 'puzzle-active') {
      goto('/game');
    }
  });
</script>

<svelte:head>
  <title>This Page Is Lying</title>
</svelte:head>

<TriggerWarning onenter={handleEnter} />
