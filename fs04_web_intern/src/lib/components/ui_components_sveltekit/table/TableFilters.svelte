<script lang="ts">
    /**
     * Flexible container for table filters with support for various filter types
     * Uses a slot-based approach for maximum flexibility
     */
    
    // Props
    export let gap: "sm" | "md" | "lg" = "md";
    export let justifyContent: "start" | "end" | "between" | "around" | "evenly" = "start";
    
    // Compute classes based on props
    $: gapClass = gap === "sm" ? "gap-1" : gap === "lg" ? "gap-4" : "gap-2";
    $: justifyClass = 
        justifyContent === "end" ? "justify-end" : 
        justifyContent === "between" ? "justify-between" : 
        justifyContent === "around" ? "justify-around" : 
        justifyContent === "evenly" ? "justify-evenly" : 
        "justify-start";
</script>

<div class={`flex items-center flex-wrap ${gapClass} ${justifyClass} w-full mb-4`}>
    <!-- Default slot for any filter content -->
    <slot />
    
    <!-- Named slots for specific filter types -->
    <slot name="text-filter">
        <!-- Text filter slot -->
    </slot>
    
    <slot name="select-filter">
        <!-- Select filter slot -->
    </slot>
    
    <slot name="date-filter">
        <!-- Date filter slot -->
    </slot>
    
    <slot name="popover-filter">
        <!-- Popover filter slot -->
    </slot>
    
    <slot name="actions">
        <!-- Actions slot (e.g., reset filters) -->
    </slot>
</div>
