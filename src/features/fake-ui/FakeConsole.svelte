<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		lines?: string[];
		typingSpeed?: number;
		prompt?: string;
		oninput?: (command: string) => void;
		children?: Snippet;
	}

	let {
		lines = [],
		typingSpeed = 30,
		prompt = 'C:\\SYSTEM>',
		oninput
	}: Props = $props();

	let displayedLines: string[] = $state([]);
	let currentInput = $state('');
	let isTyping = $state(false);
	let inputRef: HTMLInputElement | null = $state(null);

	onMount(() => {
		typeLines();
	});

	async function typeLines() {
		isTyping = true;
		for (const line of lines) {
			let displayed = '';
			for (const char of line) {
				displayed += char;
				displayedLines = [...displayedLines.slice(0, -1), displayed];
				if (displayedLines.length === 0 || displayedLines[displayedLines.length - 1] !== displayed) {
					displayedLines = [...displayedLines, displayed];
				} else {
					displayedLines[displayedLines.length - 1] = displayed;
					displayedLines = [...displayedLines];
				}
				await new Promise((r) => setTimeout(r, typingSpeed));
			}
			displayedLines = [...displayedLines.slice(0, -1), displayed];
			// Add a new empty line for the next iteration if more lines exist
			if (lines.indexOf(line) < lines.length - 1) {
				displayedLines = [...displayedLines, ''];
			}
		}
		isTyping = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && currentInput.trim() && oninput) {
			displayedLines = [...displayedLines, `${prompt} ${currentInput}`];
			oninput(currentInput.trim());
			currentInput = '';
		}
	}

	function focusInput() {
		inputRef?.focus();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="w-full h-full bg-black text-[#00ff41] font-mono text-sm p-4 overflow-y-auto cursor-text"
	onclick={focusInput}
>
	<!-- Header -->
	<div class="mb-2 text-[#00aa2a]">
		<p>Microsoft Windows [Version 10.0.CORRUPTED]</p>
		<p>(c) This Page Corporation. No rights reserved.</p>
		<p></p>
	</div>

	<!-- Output lines -->
	{#each displayedLines as line}
		<p class="whitespace-pre-wrap min-h-[1.2em] leading-tight">{line}</p>
	{/each}

	<!-- Input line -->
	{#if !isTyping}
		<div class="flex items-center">
			<span class="text-[#00aa2a] mr-1 shrink-0">{prompt}</span>
			<input
				bind:this={inputRef}
				bind:value={currentInput}
				onkeydown={handleKeydown}
				class="bg-transparent border-none outline-none text-[#00ff41] font-mono text-sm flex-1 caret-[#00ff41]"
				spellcheck="false"
				autocomplete="off"
				aria-label="Console input"
			/>
			<span class="typewriter-cursor"></span>
		</div>
	{/if}
</div>
