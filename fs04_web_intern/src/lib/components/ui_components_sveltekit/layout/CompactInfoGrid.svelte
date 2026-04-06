<script lang="ts">
    // A component for displaying information in a compact grid layout
    export let columns = 2; // Number of columns in the grid
    export let gap = "gap-4"; // Gap between grid items
    export let class_name = ""; // Additional classes
</script>

<div class="grid grid-cols-1 {columns === 2 ? 'md:grid-cols-2' : columns === 3 ? 'md:grid-cols-2 lg:grid-cols-3' : columns === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : ''} {gap} {class_name}">
    <slot />
</div>
