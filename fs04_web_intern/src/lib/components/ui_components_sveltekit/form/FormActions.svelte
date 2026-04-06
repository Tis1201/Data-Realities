<script lang="ts">
    /**
     * A standardized form actions component that provides consistent layout
     * for form action buttons (submit, cancel, etc.)
     */
    
    // Props
    export let justify: "start" | "end" | "center" | "between" = "end";
    export let gap: number = 3; // Gap between buttons (tailwind spacing)
</script>

<div class="flex justify-{justify} gap-{gap}">
    <slot />
</div>
