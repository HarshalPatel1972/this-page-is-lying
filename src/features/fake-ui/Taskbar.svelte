<script lang="ts">
	import type { FakeWindowConfig } from './types.js';

	interface Props {
		windows: FakeWindowConfig[];
		onwindowclick?: (id: string) => void;
		onstartclick?: () => void;
	}

	let { windows, onwindowclick, onstartclick }: Props = $props();

	let currentTime = $state('');
	let currentDate = $state('');

	function updateClock() {
		const now = new Date();
		currentTime = now.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
		currentDate = now.toLocaleDateString('en-US', {
			month: 'numeric',
			day: 'numeric',
			year: 'numeric'
		});
	}

	$effect(() => {
		updateClock();
		const interval = setInterval(updateClock, 1000);
		return () => clearInterval(interval);
	});

	let visibleWindows = $derived(windows.filter((w) => !w.isMinimized));
</script>

<div
	class="fixed right-0 bottom-0 left-0 z-60 flex h-10 items-center border-t border-white/10 bg-gray-900/95 backdrop-blur-sm"
	role="toolbar"
	aria-label="Taskbar"
	style="font-family: var(--font-system);"
>
	<!-- Start Button -->
	<button
		class="flex h-full items-center gap-1.5 border-r border-white/10 px-3 text-white transition-colors hover:bg-white/10"
		onclick={onstartclick}
		aria-label="Start menu"
	>
		<!-- Windows logo - 4 colored squares -->
		<svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
			<rect x="1" y="1" width="6" height="6" fill="#f25022" />
			<rect x="9" y="1" width="6" height="6" fill="#7fba00" />
			<rect x="1" y="9" width="6" height="6" fill="#00a4ef" />
			<rect x="9" y="9" width="6" height="6" fill="#ffb900" />
		</svg>
		<span class="text-xs font-semibold">Start</span>
	</button>

	<!-- Window Buttons -->
	<div class="flex flex-1 items-center gap-px overflow-x-auto px-1">
		{#each visibleWindows as window (window.id)}
			<button
				class="flex h-7 max-w-[160px] items-center gap-1 truncate rounded-sm px-2 text-xs transition-colors {window.isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}"
				onclick={() => onwindowclick?.(window.id)}
				title={window.title}
			>
				<span class="truncate">{window.title}</span>
			</button>
		{/each}
	</div>

	<!-- System Tray -->
	<div class="flex h-full items-center gap-1 border-l border-white/10 px-2">
		<!-- Hidden icons indicator -->
		<button
			class="flex h-6 w-5 items-center justify-center text-gray-400 hover:text-white"
			aria-label="Show hidden icons"
		>
			<svg class="h-3 w-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
				<path d="M2 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" />
			</svg>
		</button>

		<!-- Volume -->
		<button
			class="flex h-6 w-6 items-center justify-center text-gray-400 hover:text-white"
			aria-label="Volume"
		>
			<svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
				<path d="M8 2L4 6H1v4h3l4 4V2zm2.5 3.5a3 3 0 0 1 0 5M12.5 3.5a6 6 0 0 1 0 9" stroke="currentColor" stroke-width="1.2" fill="none" />
			</svg>
		</button>

		<!-- Network -->
		<button
			class="flex h-6 w-6 items-center justify-center text-gray-400 hover:text-white"
			aria-label="Network"
		>
			<svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
				<path d="M1 12h2v2H1zm4-3h2v5H5zm4-3h2v8H9zm4-4h2v12h-2z" />
			</svg>
		</button>

		<!-- Separator -->
		<div class="mx-1 h-5 w-px bg-white/10" aria-hidden="true"></div>

		<!-- Clock -->
		<div class="flex flex-col items-end justify-center text-right">
			<span class="text-[11px] leading-tight text-white">{currentTime}</span>
			<span class="text-[10px] leading-tight text-gray-400">{currentDate}</span>
		</div>
	</div>
</div>
