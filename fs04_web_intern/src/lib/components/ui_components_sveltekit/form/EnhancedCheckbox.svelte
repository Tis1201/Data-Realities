<script lang="ts">
    /**
     * A reusable enhanced checkbox component that works well with sveltekit-superforms
     * and follows the shadcn-svelte pattern.
     */
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { createEventDispatcher, onMount } from "svelte";
    import { browser } from "$app/environment";
    
    // Props
    export let name: string;
    export let checked: boolean = false;
    export let label: string = "";
    export let description: string = "";
    export let disabled: boolean = false;
    export let error: string | null = null;
    
    // Create a dispatcher for the change event
    const dispatch = createEventDispatcher<{
        change: boolean;
    }>();
    
    // Handle checkbox changes
    function handleChange() {
        console.log('EnhancedCheckbox change:', checked);
        dispatch("change", checked);
    }
    
    // Use onMount to ensure we're in the browser
    onMount(() => {
        if (browser) {
            console.log('EnhancedCheckbox mounted with checked:', checked);
        }
    });
</script>

<div class="flex items-start space-x-3 space-y-0">
    <div class="flex h-5 items-center">
        <Checkbox 
            id={name}
            bind:checked
            {disabled}
            on:click={handleChange}
        />
    </div>
    <div class="space-y-1 leading-none">
        <label 
            for={name} 
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
            {label}
        </label>
        {#if description}
            <p class="text-xs text-muted-foreground">
                {description}
            </p>
        {/if}
    </div>
</div>
<!-- Hidden input to ensure the value is submitted with the form -->
<input type="hidden" {name} value={checked ? "true" : "false"} />
