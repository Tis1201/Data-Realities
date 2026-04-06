<script lang="ts">
    /**
     * A standardized form field component that provides consistent spacing and layout
     * for individual form fields with label, input, and error message.
     */
    import { Label } from "$lib/components/ui/label";
    
    // Props
    export let id: string;
    export let label: string;
    export let error: string | string[] | null = null;
    export let description: string | null = null;
    export let helpText: string | null = null; // Alias for description
    export let required: boolean = false;
    
    // Convert array errors to string, use helpText as fallback for description
    $: errorMessage = Array.isArray(error) ? error[0] : error;
    $: displayDescription = helpText ?? description ?? null;
</script>

<div class="space-y-2">
    <Label for={id}>
        {label}{#if required}<span class="text-destructive ml-1">*</span>{/if}
    </Label>
    {#if displayDescription}
        <p class="text-sm text-muted-foreground">{displayDescription}</p>
    {/if}
    <slot {id} />
    {#if errorMessage}
        <span class="text-sm text-destructive">{errorMessage}</span>
    {/if}
</div>
