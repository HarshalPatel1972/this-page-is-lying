<script lang="ts">
	import { accessibilitySettings } from '$shared/stores/accessibility.js';
	import { tensionLevel } from '$shared/stores/gameState.js';
	import type { AccessibilitySettings } from '$shared/types/index.js';

	interface Props {
		intensity?: number;
		flickerEnabled?: boolean;
		scanlineOpacity?: number;
	}

	let { intensity = 1, flickerEnabled = true, scanlineOpacity = 0.1 }: Props = $props();

	let settings: AccessibilitySettings = $state({
		reducedMotion: false,
		noAudio: false,
		noJumpscares: false,
		noStrobes: false,
		highContrast: false,
		screenReaderMode: false
	});

	let tension: number = $state(0);

	$effect(() => {
		const unsub1 = accessibilitySettings.subscribe((v) => (settings = v));
		const unsub2 = tensionLevel.subscribe((v) => (tension = v));
		return () => {
			unsub1();
			unsub2();
		};
	});

	let effectiveIntensity = $derived(settings.reducedMotion ? 0 : intensity);
	let flickerClass = $derived(flickerEnabled && !settings.reducedMotion ? 'crt-flicker-active' : '');
	let tensionGlitch = $derived(tension > 7 ? 'crt-glitch' : '');
</script>

{#if effectiveIntensity > 0}
	<div
		class="fixed inset-0 pointer-events-none z-50 {flickerClass} {tensionGlitch}"
		style="--crt-intensity: {effectiveIntensity}; --scanline-opacity: {scanlineOpacity};"
		aria-hidden="true"
	>
		<div class="absolute inset-0 crt-scanlines"></div>
		<div class="absolute inset-0 crt-vignette"></div>
		<div class="absolute inset-0 crt-aberration"></div>
		{#if flickerEnabled}
			<div class="absolute inset-0 crt-flicker"></div>
		{/if}
	</div>
{/if}

<style>
	.crt-scanlines {
		background: repeating-linear-gradient(
			0deg,
			rgba(0, 0, 0, calc(var(--scanline-opacity) * var(--crt-intensity))),
			rgba(0, 0, 0, calc(var(--scanline-opacity) * var(--crt-intensity))) 1px,
			transparent 1px,
			transparent 2px
		);
	}

	.crt-vignette {
		background: radial-gradient(
			ellipse at center,
			transparent 0%,
			transparent 60%,
			rgba(0, 0, 0, calc(0.4 * var(--crt-intensity))) 100%
		);
	}

	.crt-aberration {
		background: linear-gradient(
			90deg,
			rgba(255, 0, 0, 0.03),
			transparent 10%,
			transparent 90%,
			rgba(0, 0, 255, 0.03)
		);
	}

	.crt-flicker {
		animation: crt-flicker 0.15s infinite;
		background: rgba(18, 16, 16, 0);
	}

	@keyframes crt-flicker {
		0% { opacity: 0.27; }
		10% { opacity: 0.23; }
		20% { opacity: 0.9; }
		30% { opacity: 0.65; }
		40% { opacity: 0.26; }
		50% { opacity: 0.96; }
		60% { opacity: 0.2; }
		70% { opacity: 0.53; }
		80% { opacity: 0.71; }
		90% { opacity: 0.7; }
		100% { opacity: 0.24; }
	}

	.crt-glitch {
		animation: crt-glitch 0.3s infinite;
	}

	@keyframes crt-glitch {
		0%,
		100% { transform: translate(0); filter: none; }
		20% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
		40% { transform: translate(2px, -1px); filter: hue-rotate(-90deg); }
		60% { transform: translate(-1px, 2px); }
		80% { transform: translate(1px, -2px); filter: saturate(2); }
	}
</style>
