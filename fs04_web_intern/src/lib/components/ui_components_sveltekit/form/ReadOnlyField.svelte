<script lang="ts">
    import { cn } from "$lib/utils/ui-utils";
    import { Input } from "$lib/components/ui/input";
    
    export let id: string;
    export let name: string;
    export let value: string = "";
    export let label: string = "";
    export let placeholder: string = "";
    export let className: string = "";
    
    // Hidden input to ensure the value is submitted with the form
    let hiddenInputId = `${id}-hidden`;
</script>

<div class={cn("relative", className)}>
    {#if label}
        <div class="text-sm font-medium text-muted-foreground mb-1">{label}</div>
    {/if}
    
    <div class="bg-muted/40 border border-muted rounded-md px-3 py-2 text-sm">
        {#if value}
            <span>{value}</span>
        {:else}
            <span class="text-muted-foreground">{placeholder}</span>
        {/if}
    </div>
    
    <!-- Hidden input to ensure the value is submitted with the form -->
    <input type="hidden" {id} {name} value={value} />
</div>
