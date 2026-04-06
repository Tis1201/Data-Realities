<script lang="ts">
    import RelativeDate from "$lib/components/ui_components_sveltekit/date/RelativeDate.svelte";
    
    export let date: Date | string | null = null;
    export let format: "relative" | "calendar" | "full" = "relative";
    export let emptyText: string = "Never";
    export let showTooltip: boolean = true;
    export let useHoverCard: boolean = false;
    export let iconSize: number = 14;
</script>

{#if date}
    <RelativeDate 
        {date}
        {format}
        {showTooltip}
        {useHoverCard}
        {iconSize}
    />
{:else}
    <span class="text-muted-foreground text-sm">{emptyText}</span>
{/if}
