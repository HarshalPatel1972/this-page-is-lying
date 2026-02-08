<script lang="ts">
	import { fly } from 'svelte/transition';

	interface Props {
		title: string;
		message: string;
		icon?: string;
		duration?: number;
		position?: 'top-right' | 'bottom-right';
		ondismiss?: () => void;
	}

	let {
		title,
		message,
		icon = '🔔',
		duration = 5000,
		position = 'top-right',
		ondismiss
	}: Props = $props();

	let visible = $state(true);
	let progressWidth = $state(100);
	let animationFrame: number | null = null;
	let startTime: number | null = null;

	$effect(() => {
		if (duration <= 0 || !visible) return;

		startTime = performance.now();

		function tick() {
			if (!startTime || !visible) return;
			const elapsed = performance.now() - startTime;
			const remaining = Math.max(0, 1 - elapsed / duration);
			progressWidth = remaining * 100;

			if (remaining <= 0) {
				dismiss();
				return;
			}

			animationFrame = requestAnimationFrame(tick);
		}

		animationFrame = requestAnimationFrame(tick);

		return () => {
			if (animationFrame !== null) {
				cancelAnimationFrame(animationFrame);
				animationFrame = null;
			}
		};
	});

	function dismiss() {
		visible = false;
		ondismiss?.();
	}

	let positionClasses = $derived(
		position === 'top-right' ? 'top-4 right-4' : 'bottom-14 right-4'
	);
</script>

{#if visible}
	<div
		class="fixed z-80 {positionClasses}"
		role="alert"
		transition:fly={{ x: 320, duration: 300 }}
	>
		<div
			class="w-[300px] overflow-hidden rounded border border-white/10 bg-gray-900/90 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md"
		>
			<!-- Content -->
			<div class="flex items-start gap-3 p-3">
				<!-- Icon -->
				<div class="shrink-0 text-xl" aria-hidden="true">
					{icon}
				</div>

				<!-- Text -->
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-semibold text-white" style="font-family: var(--font-system);">
						{title}
					</p>
					<p class="mt-0.5 text-xs text-gray-300" style="font-family: var(--font-system);">
						{message}
					</p>
				</div>

				<!-- Close Button -->
				<button
					class="shrink-0 text-gray-400 transition-colors hover:text-white"
					onclick={dismiss}
					aria-label="Dismiss notification"
				>
					<svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
						<path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
					</svg>
				</button>
			</div>

			<!-- Progress Bar -->
			{#if duration > 0}
				<div class="h-[3px] w-full bg-gray-700/50">
					<div
						class="h-full bg-blue-400 transition-none"
						style="width: {progressWidth}%;"
					></div>
				</div>
			{/if}
		</div>
	</div>
{/if}
