<script lang="ts">
	import { accessibilitySettings } from '$shared/stores/accessibility.js';
	import type { AccessibilitySettings } from '$shared/types/index.js';

	interface Props {
		active?: boolean;
		offset?: number;
	}

	let { active = false, offset = 5 }: Props = $props();

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

	let shouldShow = $derived(active && !settings.reducedMotion);
</script>

{#if shouldShow}
	<div
		class="fixed inset-0 pointer-events-none z-[45] screen-tear"
		style="--tear-offset: {offset}px;"
		aria-hidden="true"
	>
		<div class="tear-line"></div>
	</div>
{/if}

<style>
	.tear-line {
		position: absolute;
		width: 100%;
		height: 3px;
		background: rgba(255, 255, 255, 0.1);
		animation: tear-move 0.3s steps(3) infinite;
		box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
	}

	@keyframes tear-move {
		0% { top: 20%; transform: translateX(var(--tear-offset)); }
		25% { top: 45%; transform: translateX(calc(var(--tear-offset) * -1)); }
		50% { top: 70%; transform: translateX(var(--tear-offset)); }
		75% { top: 30%; transform: translateX(calc(var(--tear-offset) * -0.5)); }
		100% { top: 80%; transform: translateX(0); }
	}
</style>
