<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Input } from "$lib/components/ui/input";
    import { Check, Search, X } from "lucide-svelte";
    import { cn } from "$lib/utils/ui-utils";
    import { fade } from "svelte/transition";
    import { onMount } from "svelte";

    export let value = "";
    export let placeholder = "Filter by tag...";
    export let options = [];
    export let disabled = false;
    export let className = "";

    const dispatch = createEventDispatcher();

    let searchInput = "";
    let filteredOptions = [...options];
    let open = false;
    let inputRef: HTMLInputElement;
    let displayValue = "";
    let containerRef: HTMLDivElement;

    // Get display value for the selected tag
    $: {
        if (options && Array.isArray(options)) {
            const selectedOption = options.find(opt => opt && opt.id === value);
            if (selectedOption && selectedOption.name) {
                displayValue = selectedOption.name;
            } else {
                displayValue = "";
            }
        } else {
            displayValue = "";
        }
    }

    // Filter options when search input changes (limit to 20)
    $: {
        console.log('SearchableTagSelect - Reactive update:', { 
            optionsLength: options?.length || 0, 
            searchInput, 
            filteredLength: filteredOptions?.length || 0,
            open
        });
        
        if (!options || !Array.isArray(options)) {
            console.log('SearchableTagSelect - No valid options array');
            filteredOptions = [];
        } else if (!searchInput) {
            console.log('SearchableTagSelect - No search input, showing first 20');
            filteredOptions = options.slice(0, 20); // Show first 20 when no search
        } else {
            console.log('SearchableTagSelect - Filtering with search:', searchInput);
            const lowerCaseSearch = searchInput.toLowerCase();
            filteredOptions = options
                .filter(option => 
                    option && option.name && typeof option.name === 'string' && option.name.toLowerCase().includes(lowerCaseSearch)
                )
                .slice(0, 20); // Limit to 20 suggestions
            console.log('SearchableTagSelect - Filtered results:', filteredOptions.length);
        }
    }

    // Handle option selection
    function selectOption(optionId) {
        value = optionId;
        searchInput = "";
        open = false;
        dispatch('change', optionId);
    }

    // Handle input focus - open dropdown and clear search if showing selected value
    function handleInputFocus() {
        open = true;
        // If we're showing a selected value, clear it to allow searching
        if (displayValue && !searchInput) {
            searchInput = "";
        }
    }

    // Handle input change
    function handleInputChange(event) {
        searchInput = event.target.value;
        console.log('SearchableTagSelect - Input changed, setting open to true');
        open = true;
        // Clear selection if user is typing something different
        if (value && searchInput !== displayValue) {
            value = "";
            dispatch('change', "");
        }
    }

    // Clear selection
    function clearSelection() {
        value = "";
        searchInput = "";
        open = false;
        dispatch('change', "");
    }

    // Handle open state changes
    function handleOpenChange(isOpen) {
        console.log('SearchableTagSelect - Open state changed:', isOpen);
        open = isOpen;
        if (!open) {
            searchInput = "";
        }
    }

    // Handle click outside to close dropdown
    function handleClickOutside(event) {
        if (containerRef && !containerRef.contains(event.target)) {
            open = false;
        }
    }

    onMount(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });
</script>

<div class="relative {className}" bind:this={containerRef}>
    <div class="relative">
        <Input 
            type="text"
            placeholder={placeholder}
            disabled={disabled}
            class={cn("w-full pr-8", className)}
            bind:this={inputRef}
            on:focus={handleInputFocus}
            on:input={handleInputChange}
            value={searchInput || displayValue}
        />
        <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {#if value}
                <button
                    type="button"
                    on:click={clearSelection}
                    class="h-4 w-4 text-muted-foreground hover:text-foreground"
                >
                    <X class="h-3 w-3" />
                </button>
            {/if}
            <Search class="h-4 w-4 text-muted-foreground" />
        </div>
    </div>
    
    {#if open}
        <div class="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md">
            <div class="overflow-y-auto max-h-[30rem]">
                {#if filteredOptions.length === 0}
                    <div class="py-2 text-center text-xs text-muted-foreground" transition:fade>
                        {#if searchInput}
                            No tags found for "{searchInput}"
                        {:else}
                            No tags available
                        {/if}
                    </div>
                {:else}
                    <div class="grid gap-0 py-1">
                        {#each filteredOptions as option (option?.id || option)}
                            {#if option && option.id && option.name}
                                <button
                                    type="button"
                                    class="relative flex cursor-pointer select-none items-center px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground border-b border-border/10 last:border-b-0"
                                    role="option"
                                    aria-selected={value === option.id}
                                    on:click={() => selectOption(option.id)}
                                >
                                    <div class="flex items-center gap-2 flex-1">
                                        <div class="w-3 h-3 rounded-full" style="background-color: {option.color || '#6b7280'}"></div>
                                        <span class="text-left">{option.name}</span>
                                    </div>
                                    {#if value === option.id}
                                        <Check class="ml-1 h-4 w-4 text-primary" />
                                    {/if}
                                </button>
                            {/if}
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>
