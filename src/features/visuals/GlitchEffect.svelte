<script lang="ts">
	import { onMount } from 'svelte';
	import { accessibilitySettings } from '$shared/stores/accessibility.js';
	import type { Snippet } from 'svelte';
	import type { AccessibilitySettings } from '$shared/types/index.js';

	interface Props {
		active?: boolean;
		intensity?: 'low' | 'medium' | 'high';
		duration?: number;
		children?: Snippet;
	}

	let { active = false, intensity = 'medium', duration = 500, children }: Props = $props();

	let glitchClass = $state('');
	let timeoutId: ReturnType<typeof setTimeout>;

	const intensityClasses: Record<string, string> = {
		low: 'glitch-low',
		medium: 'glitch-medium',
		high: 'glitch-high'
	};

	let settings: AccessibilitySettings = $state({
		reducedMotion: false,
		noAudio: false,
		noJumpscares: false,
		noStrobes: false,
		highContrast: false,
		screenReaderMode: false
	});

	$effect(() => {
		const unsub = accessibilitySettings.subscribe((v) => (settings = v));
		return unsub;
	});

	$effect(() => {
		if (active && !settings.reducedMotion) {
			glitchClass = intensityClasses[intensity];
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				glitchClass = '';
			}, duration);
		} else {
			glitchClass = '';
		}
	});

	onMount(() => {
		return () => clearTimeout(timeoutId);
	});
</script>

<div class="glitch-wrapper {glitchClass}">
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.glitch-wrapper {
		position: relative;
	}

	.glitch-low {
		animation: glitch-skew 0.5s infinite linear alternate-reverse;
	}
	.glitch-medium {
		animation:
			glitch-skew 0.3s infinite linear alternate-reverse,
			glitch-color 0.2s infinite;
	}
	.glitch-high {
		animation:
			glitch-skew 0.1s infinite linear alternate-reverse,
			glitch-color 0.1s infinite,
			glitch-clip 0.2s infinite;
	}

	@keyframes glitch-skew {
		0% { transform: skew(0deg); }
		20% { transform: skew(-2deg); }
		40% { transform: skew(3deg); }
		60% { transform: skew(-1deg); }
		80% { transform: skew(2deg); }
		100% { transform: skew(0deg); }
	}

	@keyframes glitch-color {
		0% { filter: none; }
		25% { filter: hue-rotate(90deg); }
		50% { filter: hue-rotate(-90deg) saturate(1.5); }
		75% { filter: invert(0.1); }
		100% { filter: none; }
	}

	@keyframes glitch-clip {
		0% { clip-path: inset(0 0 0 0); }
		20% { clip-path: inset(10% 0 60% 0); }
		40% { clip-path: inset(40% 0 20% 0); }
		60% { clip-path: inset(70% 0 5% 0); }
		80% { clip-path: inset(25% 0 35% 0); }
		100% { clip-path: inset(0 0 0 0); }
	}
</style>
