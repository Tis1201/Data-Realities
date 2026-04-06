<script lang="ts">
    import { Badge } from "$lib/components/ui/badge";
    
    export let algorithm: string;
</script>

<Badge 
    variant="outline" 
    class="bg-gray-100 text-gray-800"
>
    {algorithm}
</Badge>
