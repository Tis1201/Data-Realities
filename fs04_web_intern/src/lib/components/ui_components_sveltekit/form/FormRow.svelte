<script lang="ts">
    /**
     * A standardized form row component that provides consistent spacing and layout
     * for form fields. It can be used for both single and multi-column layouts.
     */
    
    // Props
    export let columns: number = 1; // Number of columns (1, 2, 3, etc.)
    export let alignItems: string = "start"; // Can be "start", "center", "end"
    export let gap: number = 4; // Gap between columns (tailwind spacing)
    export let marginBottom: number = 4; // Bottom margin (tailwind spacing) - default to 4

    // Handle class and className props
    let _class: string = "";
    export { _class as class };
    export let className: string = ""; // Additional CSS classes
    
    // We need to handle the grid columns class statically for Tailwind
    $: gridColumnsClass = getGridColumnsClass(columns);
    $: alignItemsClass = getAlignItemsClass(alignItems);
    $: gapClass = `gap-${gap}`;
    $: marginBottomClass = marginBottom > 0 ? `mb-${marginBottom}` : '';
    
    function getGridColumnsClass(cols: number): string {
        switch(cols) {
            case 1: return '';
            case 2: return 'sm:grid-cols-2';
            case 3: return 'sm:grid-cols-3';
            case 4: return 'sm:grid-cols-4';
            case 5: return 'sm:grid-cols-5';
            case 6: return 'sm:grid-cols-6';
            default: return 'sm:grid-cols-2'; // Default to 2 columns if invalid
        }
    }
    
    function getAlignItemsClass(align: string): string {
        switch(align) {
            case 'start': return '';
            case 'center': return 'items-center';
            case 'end': return 'items-end';
            case 'baseline': return 'items-baseline';
            case 'stretch': return 'items-stretch';
            default: return '';
        }
    }
</script>

<div class="grid grid-cols-1 {gapClass} {gridColumnsClass} {alignItemsClass} {marginBottomClass} {className} {_class}">
    <slot />
</div>
