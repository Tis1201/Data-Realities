<script lang="ts">
    /**
     * A standardized page content component that provides consistent spacing and layout
     * for page content. It wraps content in a grid with configurable gap.
     */
    
    // Props
    export let gap: number = 6; // Gap between content items (tailwind spacing)
</script>

<div class="grid gap-{gap}">
    <slot />
</div>