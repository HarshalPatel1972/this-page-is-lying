<script lang="ts">
	import { accessibilitySettings } from '$shared/stores/accessibility.js';
	import type { AccessibilitySettings } from '$shared/types/index.js';

	interface Props {
		opacity?: number;
		animated?: boolean;
	}

	let { opacity = 0.1, animated = true }: Props = $props();

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

	let shouldAnimate = $derived(animated && !settings.reducedMotion);
</script>

<div
	class="fixed inset-0 pointer-events-none z-40"
	class:static-animated={shouldAnimate}
	style="opacity: {opacity};"
	aria-hidden="true"
>
	<svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
		<filter id="static-noise">
			<feTurbulence
				type="fractalNoise"
				baseFrequency="0.9"
				numOctaves="3"
				stitchTiles="stitch"
			/>
		</filter>
		<rect width="100%" height="100%" filter="url(#static-noise)" />
	</svg>
</div>

<style>
	.static-animated {
		animation: static-shift 0.5s steps(10) infinite;
	}

	@keyframes static-shift {
		0% { transform: translate(0, 0); }
		100% { transform: translate(3%, 3%); }
	}
</style>
