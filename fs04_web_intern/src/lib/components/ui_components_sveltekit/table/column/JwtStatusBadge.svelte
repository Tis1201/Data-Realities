<script lang="ts">
    import { Badge } from "$lib/components/ui/badge";
    
    export let isPrimary: boolean = false;
    export let isActive: boolean = false;
</script>

{#if isPrimary}
    <Badge 
        variant="outline" 
        class="bg-green-50 text-green-700 border-green-200"
    >
        Primary
    </Badge>
{:else if isActive}
    <Badge 
        variant="outline" 
        class="bg-blue-50 text-blue-700 border-blue-200"
    >
        Active
    </Badge>
{:else}
    <Badge 
        variant="outline" 
        class="bg-gray-50 text-gray-700 border-gray-200"
    >
        Inactive
    </Badge>
{/if}
