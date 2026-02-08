<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { FakeWindowConfig, DesktopIconConfig } from './types.js';
	import Taskbar from './Taskbar.svelte';

	interface Props {
		icons?: DesktopIconConfig[];
		windows?: FakeWindowConfig[];
		wallpaper?: string;
		showTaskbar?: boolean;
		children?: Snippet;
		onwindowclick?: (id: string) => void;
		oniconclick?: (id: string) => void;
		oniconDoubleClick?: (id: string) => void;
		onstartclick?: () => void;
	}

	let {
		icons = [],
		windows = [],
		wallpaper = '',
		showTaskbar = true,
		children,
		onwindowclick,
		oniconclick,
		oniconDoubleClick,
		onstartclick
	}: Props = $props();

	let selectedIconId = $state<string | null>(null);

	function handleIconClick(id: string) {
		selectedIconId = id;
		oniconclick?.(id);
	}

	function handleIconDblClick(id: string) {
		oniconDoubleClick?.(id);
	}

	let wallpaperStyle = $derived(
		wallpaper
			? `background-image: url(${wallpaper}); background-size: cover; background-position: center;`
			: 'background: linear-gradient(135deg, #008080 0%, #005f5f 100%);'
	);
</script>

<div
	class="fixed inset-0 z-30 select-none overflow-hidden"
	style={wallpaperStyle}
	role="application"
	aria-label="Simulated desktop environment"
>
	<!-- Desktop Icons Grid -->
	{#if icons.length > 0}
		<div class="flex flex-col flex-wrap gap-1 p-2" style="max-height: calc(100vh - 3rem);">
			{#each icons as icon (icon.id)}
				<button
					class="flex w-[76px] flex-col items-center gap-0.5 rounded p-1.5 text-center outline-none {selectedIconId === icon.id ? 'bg-blue-600/40 ring-1 ring-blue-400/60' : ''} {icon.isCorrupted ? 'animate-glitch' : ''}"
					onclick={() => handleIconClick(icon.id)}
					ondblclick={() => handleIconDblClick(icon.id)}
					aria-label={icon.label}
				>
					<span class="text-3xl drop-shadow-[1px_1px_2px_rgba(0,0,0,0.8)]" aria-hidden="true">
						{icon.icon}
					</span>
					<span
						class="w-full truncate text-[11px] leading-tight text-white drop-shadow-[1px_1px_1px_rgba(0,0,0,0.9)]"
						style="font-family: var(--font-system);"
					>
						{icon.label}
					</span>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Window Content (children) -->
	{#if children}
		{@render children()}
	{/if}

	<!-- Taskbar -->
	{#if showTaskbar}
		<Taskbar {windows} {onwindowclick} {onstartclick} />
	{/if}
</div>
