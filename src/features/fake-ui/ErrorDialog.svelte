<script lang="ts">
	import type { DialogConfig } from './types.js';

	interface Props {
		config: DialogConfig;
		onaction?: (action: string) => void;
	}

	let { config, onaction }: Props = $props();

	const iconMap: Record<DialogConfig['icon'], string> = {
		error: '❌',
		warning: '⚠️',
		info: 'ℹ️',
		question: '❓'
	};

	let dialogIcon = $derived(iconMap[config.icon]);

	const titleId = `dialog-title-${crypto.randomUUID().slice(0, 8)}`;

	function handleButtonClick(action: string) {
		onaction?.(action);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			const dismissAction = config.buttons.at(-1)?.action;
			if (dismissAction) {
				onaction?.(dismissAction);
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Modal Overlay -->
<div
	class="fixed inset-0 z-100 flex items-center justify-center bg-black/50"
	role="dialog"
	aria-modal="true"
	aria-labelledby={titleId}
>
	<div
		class="error-dialog min-w-[320px] max-w-[480px] border-2 border-gray-400 bg-gray-200 shadow-[2px_2px_10px_rgba(0,0,0,0.6),inset_1px_1px_0_rgba(255,255,255,0.8),inset_-1px_-1px_0_rgba(128,128,128,0.5)]"
		class:dialog-glitch={config.isCorrupted}
	>
		<!-- Title Bar -->
		<div class="flex h-7 items-center justify-between bg-gradient-to-r from-blue-800 to-blue-600 px-2">
			<span
				id={titleId}
				class="truncate text-xs font-bold text-white"
				style="font-family: var(--font-system);"
			>
				{config.title}
			</span>
			<button
				class="flex h-[18px] w-[18px] items-center justify-center border border-gray-400 bg-gray-200 text-[10px] leading-none text-gray-800 shadow-[inset_1px_1px_0_white,inset_-1px_-1px_0_#808080] hover:bg-gray-300 active:shadow-[inset_1px_1px_0_#808080,inset_-1px_-1px_0_white]"
				onclick={() => handleButtonClick(config.buttons.at(-1)?.action ?? 'close')}
				aria-label="Close dialog"
			>
				&#x2715;
			</button>
		</div>

		<!-- Dialog Body -->
		<div class="flex gap-4 p-4" style="font-family: var(--font-system);">
			<!-- Icon -->
			<div class="shrink-0 text-4xl" aria-hidden="true">
				{dialogIcon}
			</div>

			<!-- Message Content -->
			<div class="flex flex-col gap-2">
				<p class="text-sm text-gray-900">{config.message}</p>
				{#if config.errorCode}
					<p class="font-mono text-xs text-gray-600">
						Error code: <span class="font-bold text-red-700">{config.errorCode}</span>
					</p>
				{/if}
			</div>
		</div>

		<!-- Buttons -->
		<div class="flex justify-center gap-2 border-t border-gray-300 px-4 py-3">
			{#each config.buttons as button}
				<button
					class="min-w-[80px] border border-gray-500 bg-gray-200 px-4 py-1 text-xs text-gray-900 shadow-[inset_1px_1px_0_white,inset_-1px_-1px_0_#808080] hover:bg-gray-300 active:shadow-[inset_1px_1px_0_#808080,inset_-1px_-1px_0_white] focus:outline-1 focus:outline-dotted focus:outline-offset-[-3px] focus:outline-gray-900"
					style="font-family: var(--font-system);"
					onclick={() => handleButtonClick(button.action)}
				>
					{button.label}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.dialog-glitch {
		animation: dialog-glitch-effect 0.3s infinite;
	}

	@keyframes dialog-glitch-effect {
		0%, 100% {
			transform: translate(0, 0);
			filter: none;
		}
		15% {
			transform: translate(-2px, 1px);
			filter: hue-rotate(30deg);
		}
		30% {
			transform: translate(2px, -1px) skewX(0.5deg);
			filter: saturate(1.5);
		}
		45% {
			transform: translate(-1px, 2px);
			filter: hue-rotate(-20deg) brightness(1.1);
		}
		60% {
			transform: translate(1px, -2px) skewX(-0.5deg);
			filter: contrast(1.2);
		}
		75% {
			transform: translate(-2px, 0);
			filter: hue-rotate(15deg) saturate(0.8);
		}
		90% {
			transform: translate(1px, 1px);
			filter: brightness(0.9);
		}
	}
</style>
