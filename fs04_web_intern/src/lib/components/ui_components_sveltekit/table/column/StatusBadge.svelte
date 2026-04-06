<script lang="ts">
    import { Badge } from "$lib/components/ui/badge";
    
    export let status: string = '';
    export let value: string = status;
    
    // Status label mappings
    const statusLabels: Record<string, string> = {
        'ACTIVE': 'Active',
        'INACTIVE': 'Inactive',
        'PENDING': 'Pending',
        'SUSPENDED': 'Suspended',
        'DRAFT': 'Draft'
    };
    
    // Status color mappings
    const statusColors: Record<string, string> = {
        'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        'INACTIVE': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        'SUSPENDED': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        'DEFAULT': 'border border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
    };
    
    // Get display text and class based on status
    $: displayText = statusLabels[status] || 
        (value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : 'N/A');
        
    $: variantClass = statusColors[status] || statusColors['DEFAULT'];
</script>

<Badge 
    variant="outline" 
    class="whitespace-nowrap px-2.5 py-0.5 text-xs font-medium {variantClass}"
>
    {displayText}
</Badge>
