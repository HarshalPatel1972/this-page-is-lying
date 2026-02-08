<script lang="ts">
	interface Props {
		errorCode?: string;
		message?: string;
		percentage?: number;
	}

	let {
		errorCode = 'CRITICAL_PAGE_DECEPTION',
		message = "We're just collecting some error info, and then we'll restart for you.",
		percentage = 0
	}: Props = $props();

	let displayPercentage = $state(percentage);

	$effect(() => {
		displayPercentage = percentage;
	});
</script>

<div
	class="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
	style="background-color: var(--color-bsod, #0078d7); font-family: var(--font-mono);"
	role="alert"
	aria-live="assertive"
	aria-label="System error screen"
>
	<div class="flex max-w-[700px] flex-col px-12">
		<!-- Sad Face -->
		<div class="mb-6 text-[120px] leading-none text-white" aria-hidden="true">
			:(
		</div>

		<!-- Main Error Text -->
		<h1 class="mb-4 text-2xl font-normal leading-snug text-white">
			Your PC ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.
		</h1>

		<!-- Percentage -->
		<p class="mb-8 text-2xl text-white">
			<span class="tabular-nums">{displayPercentage}</span>% complete
		</p>

		<!-- Additional Info -->
		<div class="flex items-start gap-5">
			<!-- QR Code Placeholder -->
			<div
				class="grid h-[80px] w-[80px] shrink-0 grid-cols-5 grid-rows-5 gap-px bg-white p-1.5"
				aria-hidden="true"
			>
				{#each Array(25) as _, i}
					<div
						class={((i % 3 === 0 || i % 7 === 0) && i < 20) || i === 6 || i === 12 || i === 18 || i === 24
							? 'bg-black'
							: 'bg-white'}
					></div>
				{/each}
			</div>

			<!-- Error Details -->
			<div class="flex flex-col gap-2">
				<p class="text-sm leading-relaxed text-white/90">
					For more information about this issue and possible fixes, visit
					<span class="text-white underline">https://www.windows.com/stopcode</span>
				</p>
				<p class="text-sm text-white/90">
					{message}
				</p>
				<p class="mt-2 text-sm text-white/70">
					If you call a support person, give them this info:
				</p>
				<p class="text-sm font-semibold text-white">
					Stop code: {errorCode}
				</p>
			</div>
		</div>
	</div>
</div>
