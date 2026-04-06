<script lang="ts">
	/** Reusable character count display for form fields with max length. */
	export let current: number;
	export let max: number;
	export let showMaxMessage = true;
</script>

<p class="char-count" class:char-count-limit={current === max}>
	{current}/{max} characters
	{#if showMaxMessage && current === max}
		— Maximum length reached
	{/if}
</p>

<style>
	.char-count {
		margin: 4px 0 0;
		font-size: var(--ds-text-xs, 0.75rem);
		color: var(--ds-color-neutral-true-500, #6b7280);
	}
	.char-count.char-count-limit {
		color: var(--ds-color-amber-600, #d97706);
	}
</style>
