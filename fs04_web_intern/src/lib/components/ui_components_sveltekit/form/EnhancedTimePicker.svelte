<script lang="ts">
    /**
     * A simple time picker component that works with sveltekit-superforms
     * Allows both picker and direct text input
     */
    import { Clock, X } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import * as Popover from '$lib/components/ui/popover';
    import { cn } from '$lib/utils/ui-utils';
    import { onMount, createEventDispatcher } from 'svelte';
    
    // Props
    export let form: any; // The form data
    export let field: string; // The field name in the form
    export let placeholder: string = 'Select time';
    export let disabled: boolean = false;
    export let id: string = '';
    export let name: string = field;
    export let error: string | null = null;
    export let clearable: boolean = true;
    export let buttonClass: string = '';
    
    // State
    let isOpen = false;
    
    // Get the current value from the form
    $: value = form[field] || '';
    
    // Create a dispatcher for events
    const dispatch = createEventDispatcher<{
        change: { time: string };
        clear: void;
    }>();
    
    // Default to current time if empty
    onMount(() => {
        if (!value) {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            form[field] = `${hours}:${minutes}`;
        }
    });
    
    function handleChange(event: Event) {
        const timeValue = (event.target as HTMLInputElement).value;
        form[field] = timeValue;
        dispatch('change', { time: timeValue });
    }
    
    function clearTime(event: Event) {
        event.stopPropagation();
        form[field] = '';
        dispatch('clear');
    }
    
    function formatDisplayTime(time: string) {
        if (!time) return placeholder;
        
        try {
            // Convert 24h to 12h format for display if needed
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        } catch (e) {
            return time;
        }
    }
</script>

<div class="w-full">
    <Popover.Root bind:open={isOpen}>
        <Popover.Trigger class="w-full">
            <Button
                variant="outline"
                {disabled}
                class={cn(
                    "w-full justify-start text-left font-normal h-10",
                    !value && "text-muted-foreground",
                    error && "border-destructive",
                    buttonClass
                )}
                id={id || field}
            >
                <Clock class="mr-2 h-4 w-4" />
                <span>{formatDisplayTime(value)}</span>
                
                {#if value && clearable}
                    <span 
                        class="ml-auto pl-2"
                        on:click|stopPropagation={clearTime}
                        aria-label="Clear time"
                    >
                        <X class="h-4 w-4" />
                    </span>
                {/if}
            </Button>
        </Popover.Trigger>
        <Popover.Content class="w-auto p-4 z-50" side="bottom" align="start" sideOffset={4}>
            <div class="space-y-2">
                <Label for={`${id}-time-input`}>Select time</Label>
                <Input
                    id={`${id}-time-input`}
                    type="time"
                    value={value}
                    on:change={handleChange}
                    class="w-full"
                />
            </div>
        </Popover.Content>
    </Popover.Root>
    
    <!-- Hidden input for form submission -->
    <input type="hidden" {name} value={value || ''} />
    
    {#if error}
        <p class="text-sm text-destructive mt-2">{error}</p>
    {/if}
</div>
