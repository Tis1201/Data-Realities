<script lang="ts">
    import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '$lib/components/ui/breadcrumb';
    import { type BreadcrumbItem } from './types';
    
    /**
     * Crumbs can be provided in two formats:
     * 1. Legacy format: Flat array of alternating labels and links
     *    Example: ["Label1", "Link1", "Label2", "Link2", ..., "LastLabel"]
     * 
     * 2. New structured format: Array of items where each item is either:
     *    - A string (label with no link)
     *    - A tuple [label, link] where link can be a string or null
     *    Example: [["Label1", "/link1"], ["Label2", null], "CurrentPage"]
     */
    export let crumbs: BreadcrumbItem[] = [];
    
    // Process the array into breadcrumb items
    $: items = processCrumbs(crumbs);
    
    /**
     * Process crumbs into a consistent format
     */
    function processCrumbs(crumbs: BreadcrumbItem[]) {
        // Check if using legacy format (flat array of alternating labels and links)
        if (crumbs.length > 0 && typeof crumbs[0] === 'string' && 
            crumbs.length > 1 && typeof crumbs[1] === 'string') {
            
            // Process legacy format
            const result = [];
            for (let i = 0; i < crumbs.length; i += 2) {
                const label = crumbs[i] as string;
                const href = i + 1 < crumbs.length ? crumbs[i + 1] as string : null;
                const active = i === crumbs.length - 1;
                
                result.push({ label, href, active });
            }
            return result;
        }
        
        // Process new structured format
        return crumbs.map((item, index, array) => {
            const isLast = index === array.length - 1;
            
            if (typeof item === 'string') {
                return { label: item, href: null, active: isLast };
            } else {
                const [label, href] = item;
                return { label, href, active: isLast };
            }
        });
    }
</script>

<Breadcrumb>
    <BreadcrumbList>
        {#each items as item, i}
            <BreadcrumbItem>
                {#if item.href && !item.active}
                    <a href={item.href} class="text-sm font-medium underline-offset-4 hover:underline">{item.label}</a>
                {:else}
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                {/if}
            </BreadcrumbItem>
            
            {#if i < items.length - 1}
                <BreadcrumbSeparator />
            {/if}
        {/each}
    </BreadcrumbList>
</Breadcrumb>
