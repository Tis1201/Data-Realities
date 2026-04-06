<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Check, ChevronsUpDown, Search, AlertCircle } from "lucide-svelte";
    import { cn } from "$lib/utils/ui-utils";
    import { debounce } from "lodash-es";
    import { fade } from "svelte/transition";

    /**
     * A searchable form select component using shadcn-svelte select components
     * Designed for better UX with search functionality while maintaining
     * consistency with the shadcn-svelte design system
     */

    // Props - Match EnhancedSelect API
    export let value = ""; // For two-way binding
    export let name = undefined;
    export let id = undefined;
    export let placeholder = "Select an option";
    export let labelText = undefined; // Match EnhancedSelect API
    export let disabled = false;
    export let required = false;
    export let options = [];
    export let triggerClass = "w-full"; // Match EnhancedSelect API
    export let contentClass = ""; // Match EnhancedSelect API
    export let className = ""; // For container styling
    
    // Additional props for SearchableFormSelect
    export let searchPlaceholder = "Search...";
    export let debounceMs = 300;
    export let noResultsText = "No results found";
    export let maxHeight = "15rem";
    export let error = undefined; // For Superforms error handling
    export let validateOnInput = false;
    
    // Event dispatcher
    const dispatch = createEventDispatcher();

    // Internal state
    let searchInput = "";
    let filteredOptions = [...options];
    let open = false;
    let touched = false;
    let displayOption = undefined;
    let displayLabel = placeholder;
    
    // Get display label for the selected value
    $: {
        // Find the matching option for the current value
        displayOption = options.find(opt => opt.value === value);
        
        // Set the display label based on available information
        if (displayOption) {
            // If we have a matching option, use its label
            displayLabel = displayOption.label;
        } else if (value) {
            // If we have a value but no matching option, format it nicely
            // This handles cases where options aren't loaded yet
            if (typeof value === 'string') {
                // Format string values (like ACTIVE) to Title Case (like Active)
                displayLabel = value.charAt(0) + value.slice(1).toLowerCase();
            } else {
                // Handle non-string values
                displayLabel = String(value);
            }
        } else {
            // Fall back to placeholder if no value
            displayLabel = placeholder;
        }
    }
    
    // Filter options when search input changes
    $: {
        if (!searchInput) {
            filteredOptions = [...options];
        } else {
            const lowerCaseSearch = searchInput.toLowerCase();
            filteredOptions = options.filter(option => 
                option.label.toString().toLowerCase().includes(lowerCaseSearch)
            );
        }
    }
    
    // Create debounced search function
    const debouncedSearch = debounce((searchTerm) => {
        searchInput = searchTerm;
        dispatch('search', searchTerm);
    }, debounceMs);
    
    // Handle search input
    function handleSearchInput(event) {
        debouncedSearch(event.target.value);
    }
    
    // Handle option selection
    function selectOption(optionValue) {
        // Update the value
        value = optionValue;
        touched = true;
        
        // Reset search and close dropdown
        searchInput = "";
        open = false;
        
        // Dispatch change event
        dispatch('change', optionValue);
        
        // Validate if needed
        if (validateOnInput) {
            // This would typically trigger validation in Superforms
            // The parent component should handle this via the change event
            if (required && !value) {
                // Handle required validation
                dispatch('validate');
            }
        }
    }
    
    // Handle open state changes
    function handleOpenChange(isOpen) {
        open = isOpen;
        if (!open) {
            searchInput = "";
            if (validateOnInput && !touched) {
                touched = true;
            }
        }
    }
</script>

<div class="relative {className}">
    <Popover bind:open on:openChange={e => handleOpenChange(e.detail)}>
        <PopoverTrigger asChild let:builder>            
            <Button 
                variant="outline" 
                role="combobox" 
                aria-expanded={open} 
                disabled={disabled}
                class={cn(
                    "justify-between", 
                    error ? "border-destructive" : "",
                    triggerClass
                )}
                builders={[builder]}
            >
                <span class="truncate">{displayLabel}</span>
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </PopoverTrigger>
        <PopoverContent 
            class={cn("p-0", contentClass)}
            style="width: calc(var(--radix-popover-trigger-width) + 2rem);"
            sideOffset={8}
            align="start"
        >
            {#if labelText}
                <div class="px-2 pt-1.5 pb-0">
                    <p class="text-sm font-medium">{labelText}</p>
                </div>
            {/if}
            <div class="p-1.5 border-b">
                <div class="flex items-center px-2 py-1 border rounded-md">
                    <Search class="mr-1 h-3.5 w-3.5 shrink-0 opacity-70" />
                    <Input 
                        type="text" 
                        placeholder={searchPlaceholder} 
                        class="search-input h-7 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                        on:input={handleSearchInput}
                        value={searchInput}
                    />
                </div>
            </div>
            <div 
                class="overflow-y-auto" 
                style="max-height: {maxHeight};"
            >
                {#if filteredOptions.length === 0}
                    <div class="py-2 text-center text-xs text-muted-foreground" transition:fade>{noResultsText}</div>
                {:else}
                    <div class="grid gap-0 py-1">
                        {#each filteredOptions as option (option.value)}
                            <button
                                type="button"
                                class="relative flex cursor-pointer select-none items-center px-2 py-1.5 text-sm outline-none hover:text-accent-foreground data-[highlighted]:text-accent-foreground border-b border-border/10 last:border-b-0"
                                role="option"
                                aria-selected={value === option.value}
                                data-highlighted={value === option.value}
                                on:click={() => selectOption(option.value)}
                            >
                                <span class="flex-1 text-left">
                                    {#if option.html}
                                        {@html option.html}
                                    {:else}
                                        {option.label}
                                    {/if}
                                </span>
                                {#if value === option.value}
                                    <Check class="ml-1 h-4 w-4 text-primary" />
                                {/if}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </PopoverContent>
    </Popover>
    
    {#if name}
        <input type="hidden" {name} {id} bind:value {required} />
    {/if}
    
    {#if error}
        <div class="flex items-center gap-1 mt-1 text-destructive text-sm">
            <AlertCircle class="h-3 w-3" />
            <p>{error}</p>
        </div>
    {/if}
</div>
