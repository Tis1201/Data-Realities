<script lang="ts">
    import * as Select from "$lib/components/ui/select/index.js";
    import { createEventDispatcher } from "svelte";
    import StatusBadge from "$lib/components/ui_components_sveltekit/display/StatusBadge.svelte";

    /**
     * Enhanced Select component that handles value binding correctly
     * and provides a simpler API for working with shadcn-svelte selects
     */

    // Props
    export let value: string | undefined = undefined;
    export let name: string | undefined = undefined;
    export let id: string | undefined = undefined;
    export let placeholder: string = "Select an option";
    export let portal: boolean | null = null;
    export let disabled: boolean = false;
    export let triggerClass: string = "w-full";
    export let contentClass: string = "";
    export let labelText: string | undefined = undefined;
    export let options: Array<{value: string, label: string}> = [];
    export let required: boolean = false;
    export let showStatusIndicators: boolean = false; // New prop to enable status styling
    
    // Event dispatcher
    const dispatch = createEventDispatcher<{
        change: string | undefined;
    }>();

    // Internal state
    $: selected = value ? 
        (typeof value === 'object' && value !== null && 'value' in value) ? 
            value : 
            { value, label: getLabel(value) } 
        : undefined;

    // Function to get label from value
    function getLabel(val: string): string {
        const option = options.find(opt => opt.value === val);
        if (option?.label) return option.label;
        
        // For slot-based items, map common values to their display labels
        // This handles the most common cases without requiring extra configuration
        const commonMappings: Record<string, string> = {
            'ACTIVE': 'Active',
            'INACTIVE': 'Inactive',
            'SUSPENDED': 'Suspended',
            'ADMIN': 'Admin',
            'USER': 'User',
            'PENDING': 'Pending',
            'COMPLETED': 'Completed',
            'CANCELLED': 'Cancelled'
        };
        
        return commonMappings[val] || val;
    }
    
    // Function to check if this appears to be a status field
    $: isStatusField = showStatusIndicators || 
        options.some(opt => 
            ['active', 'inactive', 'pending', 'suspended', 'completed', 'cancelled', 'draft', 'published', 'failed', 'maintenance', 'synced'].includes(opt.value.toLowerCase())
        );

    // Handle value change
    // onSelectedChange passes the selected object directly (not wrapped in event.detail)
    function handleChange(selected: any) {
        console.log('Select change event:', selected);
        
        // The selected parameter is the selected object with { value, label } structure
        if (selected && typeof selected === 'object' && 'value' in selected) {
            value = selected.value;
        } else if (selected === null || selected === undefined) {
            value = undefined;
        } else {
            // Fallback for direct value
            value = selected;
        }
        
        // Log the new value for debugging
        console.log('New value:', value);
        
        // Force a reactive update
        value = value;
        
        // Dispatch change event
        dispatch('change', value);
    }

    // Extract specific props we want to handle directly
    const { 
        value: _value, // Avoid passing value directly as it's handled by selected
        name: _name, // Avoid passing name directly as it's handled by Select.Input
        placeholder: _placeholder, // Avoid passing placeholder directly as it's handled by Select.Value
        portal: _portal, // Avoid passing portal directly as it's handled by Select.Root
        disabled: _disabled, // Avoid passing disabled directly as it's handled by Select.Root
        triggerClass: _triggerClass, // Avoid passing triggerClass directly as it's handled by Select.Trigger
        contentClass: _contentClass, // Avoid passing contentClass directly as it's handled by Select.Content
        labelText: _labelText, // Avoid passing labelText directly as it's handled by Select.Label
        options: _options, // Avoid passing options directly as it's handled by Select.Item
        required: _required, // Avoid passing required directly as it's handled by our component
        showStatusIndicators: _showStatusIndicators, // Handle this internally
        ...restProps // All other props will be passed to the input element
    } = $$props;
</script>

<Select.Root {disabled} selected={selected} {portal} onSelectedChange={handleChange}>  
    <Select.Trigger class={triggerClass}>
        {#if value && isStatusField}
            <!-- Show StatusBadge for status fields when a value is selected -->
            <div class="flex items-center gap-2 w-full">
                <StatusBadge status={value} className="text-xs" />
            </div>
        {:else}
            <Select.Value {placeholder} />
        {/if}
    </Select.Trigger>
    <Select.Content class={contentClass}>
        <Select.Group>
            {#if labelText}
                <Select.Label>{labelText}</Select.Label>
            {/if}
            {#if $$slots.default}
                <slot />
            {:else}
                {#each options as option}
                    <Select.Item value={option.value}>
                        {#if isStatusField}
                            <div class="flex items-center gap-2">
                                <StatusBadge status={option.value} className="text-xs px-1 py-0" />
                            </div>
                        {:else}
                            {option.label}
                        {/if}
                    </Select.Item>
                {/each}
            {/if}
        </Select.Group>
    </Select.Content>
    {#if name}
        <Select.Input {name} {id} bind:value {required} {...restProps} />
    {/if}
</Select.Root>
