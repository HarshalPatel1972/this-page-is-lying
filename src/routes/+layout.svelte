<script lang="ts">
  import '$appDir/styles/app.css';
  import AccessibilityProvider from '$appDir/providers/AccessibilityProvider.svelte';
  import AudioProvider from '$appDir/providers/AudioProvider.svelte';
  import CookieConsent from '$widgets/CookieConsent.svelte';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import favicon from '$lib/assets/favicon.svg';

  interface Props { children: Snippet; }
  let { children }: Props = $props();

  let showConsent = $state(false);

  onMount(() => {
    // Check if consent has been given
    const consent = localStorage.getItem('tpil-consent');
    if (!consent) showConsent = true;
  });

  function handleConsentAccept() {
    showConsent = false;
  }

  function handleConsentReject() {
    showConsent = false;
  }
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <meta name="theme-color" content="#000000" />
  <meta name="description" content="This Page Is Lying — A meta-horror web experience" />
</svelte:head>

<AccessibilityProvider>
  <AudioProvider>
    {@render children()}
  </AudioProvider>
</AccessibilityProvider>

{#if showConsent}
  <CookieConsent onaccept={handleConsentAccept} onreject={handleConsentReject} />
{/if}
