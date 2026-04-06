<script lang="ts">
	export let class_name = '';
</script>

<div class="terminal-container w-full h-[500px] border rounded-md overflow-hidden {class_name}">
	<!--
		Fit target is ~2-3 lines shorter than container. FitAddon measures this wrapper,
		so xterm fits with bottom buffer. Prevents last line/cursor clipping on
		Windows 125% DPI (xterm.js #4959).
	-->
	<div class="terminal-fit-target">
		<slot />
	</div>
</div>

<style>
	.terminal-container {
		background-color: #1e1e1e;
		position: relative;
	}
	.terminal-fit-target {
		/* ~2–3 lines buffer at bottom so last line + cursor never clip at 125% DPI */
		height: calc(100% - 3rem);
		min-height: 0;
		width: 100%;
	}
	:global(.terminal-container .xterm) {
		height: 100%;
		width: 100%;
		/* No vertical padding - FitAddon measures parent; padding would cause overflow/clipping */
		padding: 0 0.75rem;
	}
	:global(.terminal-container .xterm-viewport) {
		overflow-y: auto !important;
	}
	:global(.terminal-container canvas) {
		padding: 0;
	}
</style>
