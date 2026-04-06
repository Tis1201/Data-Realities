<script lang="ts">
    /**
     * A standardized component for displaying metadata information in a footer,
     * such as creation and update timestamps.
     */
    
    import RelativeDate from "$lib/components/ui_components_sveltekit/date/RelativeDate.svelte";
    import { Clock, Calendar, User, Clock as ClockIcon, Hash } from "lucide-svelte";
    
    // Props
    export let items: Array<{
        label: string;
        date?: Date | string;
        value?: string | number;
        icon?: 'id' | 'clock' | 'calendar' | 'user' | string;
    }> = [];
    export let layout: "horizontal" | "compact" | "grid" = "compact";
    export let columns: number = 2;
    export let showBorder: boolean = false;
    export let spacing: number = 4;
    export let subtle: boolean = true;
    
    // Helper function to check if a value is a valid date
    function isValidDate(value: any): boolean {
        if (!value) return false;
        if (value instanceof Date) return !isNaN(value.getTime());
        if (typeof value === 'string') {
            const date = new Date(value);
            return !isNaN(date.getTime());
        }
        return false;
    }
    
    // Compute grid columns class based on number of columns and layout
    $: gridColumnsClass = layout === "grid" ? getGridColumnsClass(columns) : "";
    $: gapClass = `gap-${spacing}`;
    
    function getGridColumnsClass(cols: number): string {
        switch(cols) {
            case 1: return 'grid-cols-1';
            case 2: return 'grid-cols-2';
            case 3: return 'grid-cols-3';
            case 4: return 'grid-cols-4';
            default: return 'grid-cols-2';
        }
    }
</script>

{#if items.length > 0}
    <div class="text-xs text-muted-foreground {showBorder ? 'border-t border-muted pt-3 mt-4' : ''}">
        {#if layout === "horizontal"}
            <div class="flex items-center gap-4">
                {#each items as item, i}
                    <div class="flex items-center gap-1.5">
                        {#if item.icon === 'id'}
                            <Hash size={12} class="text-muted-foreground/50" />
                        {:else if item.icon === 'calendar'}
                            <Calendar size={12} class="text-muted-foreground/50" />
                        {:else if item.icon === 'clock'}
                            <ClockIcon size={12} class="text-muted-foreground/50" />
                        {:else if item.icon === 'user'}
                            <User size={12} class="text-muted-foreground/50" />
                        {/if}
                        <span class="font-medium text-foreground/80">{item.label}</span>
                        <span class="text-muted-foreground/70">
                            {#if isValidDate(item.date)}
                                <RelativeDate 
                                    date={item.date} 
                                    format="relative" 
                                    showTooltip={true}
                                    useHoverCard={false}
                                    iconSize={0}
                                    className="text-inherit hover:underline"
                                />
                            {:else if item.value !== undefined}
                                <span class="font-mono">{item.value}</span>
                            {:else}
                                <span>-</span>
                            {/if}
                        </span>
                    </div>
                {/each}
            </div>
        {:else if layout === "compact"}
            <div class="flex flex-wrap items-center gap-4">
                {#each items as item, i}
                    <div class="flex items-center gap-1.5">
                        {#if item.icon === 'id'}
                            <Hash size={12} class="text-muted-foreground/50" />
                        {:else if item.icon === 'calendar'}
                            <Calendar size={12} class="text-muted-foreground/50" />
                        {:else if item.icon === 'clock'}
                            <ClockIcon size={12} class="text-muted-foreground/50" />
                        {:else if item.icon === 'user'}
                            <User size={12} class="text-muted-foreground/50" />
                        {/if}
                        <span class="font-medium text-foreground/80">{item.label}</span>
                        <span class="text-muted-foreground/70">
                            {#if isValidDate(item.date)}
                                <RelativeDate 
                                    date={item.date} 
                                    format="relative" 
                                    showTooltip={true}
                                    useHoverCard={false}
                                    iconSize={0}
                                    className="text-inherit hover:underline"
                                />
                            {:else if item.value !== undefined}
                                <span class="font-mono">{item.value}</span>
                            {:else}
                                <span>-</span>
                            {/if}
                        </span>
                    </div>
                {/each}
            </div>
        {:else if layout === "grid"}
            <div class="flex flex-wrap items-center gap-4">
                {#each items as item}
                    <div class="flex items-center gap-1.5">
                        {#if item.icon === 'id'}
                            <Hash size={12} class="text-muted-foreground/50" />
                        {:else if item.icon === 'calendar'}
                            <Calendar size={12} class="text-muted-foreground/50" />
                        {:else if item.icon === 'clock'}
                            <ClockIcon size={12} class="text-muted-foreground/50" />
                        {:else if item.icon === 'user'}
                            <User size={12} class="text-muted-foreground/50" />
                        {/if}
                        <span class="text-foreground/70">{item.label}</span>
                        <span class="text-muted-foreground/70">
                            {#if isValidDate(item.date)}
                                <RelativeDate 
                                    date={item.date} 
                                    format="relative" 
                                    showTooltip={true}
                                    useHoverCard={false}
                                    iconSize={0}
                                    className="text-inherit hover:underline"
                                />
                            {:else if item.value !== undefined}
                                <span class="font-mono">{item.value}</span>
                            {:else}
                                <span>-</span>
                            {/if}
                        </span>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/if}
