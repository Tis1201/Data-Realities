<script lang="ts">
    import type { ComponentType, SvelteComponent } from "svelte";
    
    export let label: string;
    export let icon: ComponentType<SvelteComponent> | null = null;
    export let class_name = "";
    export let separated: boolean = false;
</script>

<div class="py-2 {class_name} {separated ? 'border-b border-border/50 last:border-b-0' : ''}">
    <div class="text-sm font-medium text-muted-foreground mb-1 flex items-center">
        {#if icon}
            <svelte:component this={icon} class="mr-1.5 h-3.5 w-3.5" />
        {/if}
        {label}
    </div>
    <div class="text-sm">
        <slot />
    </div>
</div>
