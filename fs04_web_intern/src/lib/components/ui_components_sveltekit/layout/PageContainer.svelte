<script lang="ts">
    import { type BreadcrumbItem } from './types';
    import PageBreadcrumb from './PageBreadcrumb.svelte';

    /**
     * Standard container for admin pages with consistent spacing and layout
     */
    
    // Props
    export let crumbs: (string | [string, string | null])[] = [];
    export let spacing: 'default' | 'compact' | 'wide' = 'default';
    export let padding: 'default' | 'none' | 'small' | 'large' = 'default';
    export let className: string = "";
    export let class_name: string = "";
    
    // Compute classes based on props
    $: spacingClass = spacing === 'compact' ? 'space-y-2' : 
                      spacing === 'wide' ? 'space-y-6' : 
                      'space-y-4';
                      
    $: paddingClass = padding === 'none' ? 'p-0' : 
                     padding === 'small' ? 'p-1' : 
                     padding === 'large' ? 'p-4' : 
                     'p-2';
</script>

<div class="{spacingClass} {paddingClass} {className || class_name}">
    {#if crumbs.length > 0}
        <PageBreadcrumb {crumbs} />
    {/if}
    
    <slot />
</div>
