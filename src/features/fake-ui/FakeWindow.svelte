<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { FakeWindowConfig } from './types.js';

	interface Props {
		config: FakeWindowConfig;
		children: Snippet;
		onclose?: () => void;
		onminimize?: () => void;
		onmaximize?: () => void;
	}

	let { config, children, onclose, onminimize, onmaximize }: Props = $props();

	let isDragging = $state(false);
	let dragOffsetX = $state(0);
	let dragOffsetY = $state(0);
	let posX = $state(config.x);
	let posY = $state(config.y);

	$effect(() => {
		posX = config.x;
		posY = config.y;
	});

	function handleTitleBarMouseDown(event: MouseEvent) {
		if (config.isMaximized) return;
		isDragging = true;
		dragOffsetX = event.clientX - posX;
		dragOffsetY = event.clientY - posY;

		function handleMouseMove(e: MouseEvent) {
			if (!isDragging) return;
			posX = e.clientX - dragOffsetX;
			posY = e.clientY - dragOffsetY;
		}

		function handleMouseUp() {
			isDragging = false;
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		}

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	let isCorruptedType = $derived(config.type === 'error' || config.type === 'warning');

	let windowStyle = $derived(
		config.isMaximized
			? 'top: 0; left: 0; width: 100%; height: calc(100% - 2.5rem);'
			: `top: ${posY}px; left: ${posX}px; width: ${config.width}px; height: ${config.height}px;`
	);
</script>

{#if !config.isMinimized}
	<div
		class="fake-window absolute flex flex-col border-2 border-gray-400 bg-gray-200 shadow-[2px_2px_8px_rgba(0,0,0,0.5),inset_1px_1px_0_rgba(255,255,255,0.8),inset_-1px_-1px_0_rgba(128,128,128,0.5)]"
		class:animate-glitch={isCorruptedType}
		class:z-50={config.isActive}
		class:z-40={!config.isActive}
		style={windowStyle}
		role="dialog"
		aria-label={config.title}
	>
		<!-- Title Bar -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="title-bar flex h-7 shrink-0 cursor-default select-none items-center justify-between px-1"
			class:bg-gradient-to-r={true}
			class:from-blue-800={config.isActive}
			class:to-blue-600={config.isActive}
			class:from-gray-500={!config.isActive}
			class:to-gray-400={!config.isActive}
			onmousedown={handleTitleBarMouseDown}
		>
			<span class="truncate px-1 text-xs font-bold text-white" style="font-family: var(--font-system);">
				{config.title}
			</span>

			<div class="flex gap-px">
				<button
					class="flex h-[18px] w-[18px] items-center justify-center border border-gray-400 bg-gray-200 text-[10px] leading-none text-gray-800 shadow-[inset_1px_1px_0_white,inset_-1px_-1px_0_#808080] hover:bg-gray-300 active:shadow-[inset_1px_1px_0_#808080,inset_-1px_-1px_0_white]"
					onclick={onminimize}
					aria-label="Minimize"
				>
					&#x2500;
				</button>
				<button
					class="flex h-[18px] w-[18px] items-center justify-center border border-gray-400 bg-gray-200 text-[10px] leading-none text-gray-800 shadow-[inset_1px_1px_0_white,inset_-1px_-1px_0_#808080] hover:bg-gray-300 active:shadow-[inset_1px_1px_0_#808080,inset_-1px_-1px_0_white]"
					onclick={onmaximize}
					aria-label="Maximize"
				>
					{config.isMaximized ? '❐' : '☐'}
				</button>
				<button
					class="flex h-[18px] w-[18px] items-center justify-center border border-gray-400 bg-gray-200 text-[10px] leading-none text-gray-800 shadow-[inset_1px_1px_0_white,inset_-1px_-1px_0_#808080] hover:bg-gray-300 active:shadow-[inset_1px_1px_0_#808080,inset_-1px_-1px_0_white]"
					onclick={onclose}
					aria-label="Close"
				>
					&#x2715;
				</button>
			</div>
		</div>

		<!-- Window Body -->
		<div class="flex-1 overflow-auto bg-gray-200 p-1">
			{@render children()}
		</div>
	</div>
{/if}

<style>
	.animate-glitch {
		animation: window-shake 0.4s infinite;
	}

	@keyframes window-shake {
		0%, 100% { transform: translate(0, 0); }
		10% { transform: translate(-1px, 0); }
		20% { transform: translate(1px, -1px); }
		30% { transform: translate(-1px, 1px); }
		40% { transform: translate(1px, 0); }
		50% { transform: translate(-1px, -1px); }
		60% { transform: translate(0, 1px); }
		70% { transform: translate(1px, -1px); }
		80% { transform: translate(-1px, 0); }
		90% { transform: translate(1px, 1px); }
	}
</style>
