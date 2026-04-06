<script lang="ts">
    /**
     * Standardized container for tables with consistent spacing
     */
    
    // Props
    export let spacing: "default" | "compact" | "loose" = "default";
    
    // Compute the spacing class based on the prop
    $: spacingClass = spacing === "compact" 
        ? "space-y-2" 
        : spacing === "loose" 
            ? "space-y-6" 
            : "space-y-4";
</script>

<div class={spacingClass}>
    <slot />
</div>
