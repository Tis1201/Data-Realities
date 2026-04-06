<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Check, ChevronsUpDown, Search, AlertCircle, Loader2 } from "lucide-svelte";
    import { cn } from "$lib/utils/ui-utils";
    import { debounce } from "lodash-es";
    import { fade } from "svelte/transition";
    import RelativeDate from "$lib/components/ui_components_sveltekit/date/RelativeDate.svelte";
    import { Badge } from "$lib/components/ui/badge";

    /**
     * A specialized resource selection component for selecting APK resources
     * Provides rich information about each resource to help users make informed decisions
     */

    // Props
    export let value = ""; // For two-way binding
    export let name = undefined;
    export let id = undefined;
    export let placeholder = "Select a resource";
    export let labelText = undefined;
    export let disabled = false;
    export let required = false;
    export let resources = [];
    export let triggerClass = "w-full";
    export let contentClass = "";
    export let className = "";
    
    // Additional props
    export let searchPlaceholder = "Search resources...";
    export let debounceMs = 300;
    export let noResultsText = "No resources found";
    export let maxHeight = "20rem";
    export let error = undefined;
    export let validateOnInput = false;
    export let onSearch = undefined; // Function to call for server-side search
    export let loading = false; // Loading state for server-side search
    export let resourceType = "APK"; // Default resource type
    
    // Event dispatcher
    const dispatch = createEventDispatcher();

    // Internal state
    let searchInput = "";
    let filteredResources = [...resources];
    let open = false;
    let touched = false;
    let displayResource = undefined;
    let displayLabel = placeholder;
    let searchInputEl;
    
    // Get display label for the selected value
    $: {
        // Find the matching resource for the current value
        displayResource = resources.find(resource => resource.id === value);
        displayLabel = displayResource ? displayResource.name : placeholder;
    }
    
    // Filter resources based on search input (client-side fallback)
    $: {
        if (!onSearch) {
            if (searchInput) {
                filteredResources = resources.filter(resource => 
                    resource.name.toLowerCase().includes(searchInput.toLowerCase()) ||
                    (resource.description && resource.description.toLowerCase().includes(searchInput.toLowerCase())) ||
                    (resource.packageName && resource.packageName.toLowerCase().includes(searchInput.toLowerCase()))
                );
            } else {
                filteredResources = [...resources];
            }
        } else {
            // When using server-side search, use the resources as is
            filteredResources = resources;
        }
    }
    
    // Debounced search function
    const debouncedSearch = debounce((value) => {
        searchInput = value;
        
        // If server-side search is provided, call it
        if (onSearch) {
            onSearch(value, resourceType);
        }
        
        // Dispatch search event
        dispatch('search', { query: value, type: resourceType });
    }, debounceMs);
    
    // Handle search input
    function handleSearchInput(event) {
        debouncedSearch(event.target.value);
    }
    
    // Handle option selection
    function selectOption(resourceId) {
        // Update the value
        value = resourceId;
        touched = true;
        
        // Reset search and close dropdown
        searchInput = "";
        if (searchInputEl) searchInputEl.value = "";
        open = false;
        
        // Dispatch change event
        dispatch('change', resourceId);
        
        // Validate if needed
        if (validateOnInput) {
            if (required && !value) {
                // Validation failed
                dispatch('invalid', { field: name, message: 'This field is required' });
            } else {
                // Validation passed
                dispatch('valid', { field: name });
            }
        }
    }
    
    // Handle open/close of the popover
    function handleOpenChange(isOpen) {
        open = isOpen;
        
        if (!isOpen) {
            // Reset search when closing
            searchInput = "";
            if (searchInputEl) searchInputEl.value = "";
        } else {
            // Focus search input when opening
            setTimeout(() => {
                if (searchInputEl) searchInputEl.focus();
            }, 0);
            
            // Trigger initial search if server-side search is provided
            if (onSearch) {
                onSearch("", resourceType);
            }
        }
    }
    
    // Format file size to human-readable format
    function formatFileSize(bytes) {
        if (!bytes) return 'N/A';
        
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
</script>

<div class="relative {className}">
    <Popover bind:open on:openChange={e => handleOpenChange(e.detail)}>
        <PopoverTrigger asChild let:builder>            
            <Button 
                variant="outline" 
                role="combobox" 
                aria-expanded={open}
                class={cn(
                    "justify-between",
                    error && "border-destructive",
                    triggerClass
                )}
                disabled={disabled}
                builders={[builder]}
                data-testid={name ? `${name}-trigger` : undefined}
            >
                <span class="truncate">{displayLabel}</span>
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </PopoverTrigger>
        <PopoverContent 
            class={cn("p-0", contentClass)} 
            align="start"
            sideOffset={4}
        >
            <div class="flex flex-col">
                <!-- Search input -->
                <div class="flex items-center border-b px-3 py-2">
                    {#if loading}
                        <Loader2 class="mr-2 h-4 w-4 shrink-0 animate-spin" />
                    {:else}
                        <Search class="mr-2 h-4 w-4 shrink-0 opacity-70" />
                    {/if}
                    <input
                        bind:this={searchInputEl}
                        class="flex h-9 w-full rounded-md bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={searchPlaceholder}
                        on:input={handleSearchInput}
                        disabled={loading}
                    />
                </div>
                
                <!-- Resource list -->
                <div 
                    class="overflow-y-auto" 
                    style="max-height: {maxHeight};"
                    data-testid={name ? `${name}-options` : undefined}
                >
                    {#if filteredResources.length === 0}
                        <div class="p-4 text-center text-sm text-muted-foreground">
                            {noResultsText}
                        </div>
                    {:else}
                        {#each filteredResources as resource (resource.id)}
                            <div
                                class="relative flex cursor-pointer select-none flex-col items-start rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                                role="option"
                                aria-selected={value === resource.id}
                                data-highlighted={value === resource.id}
                                on:click={() => selectOption(resource.id)}
                                data-testid={name ? `${name}-option-${resource.id}` : undefined}
                            >
                                <div class="flex w-full justify-between">
                                    <div class="font-medium">{resource.name}</div>
                                    {#if value === resource.id}
                                        <Check class="h-4 w-4" />
                                    {/if}
                                </div>
                                
                                {#if resource.description}
                                    <div class="text-xs text-muted-foreground truncate max-w-full">
                                        {resource.description}
                                    </div>
                                {/if}
                                
                                <div class="flex flex-wrap gap-2 mt-1">
                                    {#if resource.version}
                                        <Badge variant="outline" class="text-xs">v{resource.version}</Badge>
                                    {/if}
                                    
                                    {#if resource.format}
                                        <Badge variant="outline" class="text-xs">{resource.format}</Badge>
                                    {/if}
                                    
                                    {#if resource.size}
                                        <Badge variant="outline" class="text-xs">{formatFileSize(resource.size)}</Badge>
                                    {/if}
                                    
                                    {#if resource.packageName}
                                        <Badge variant="outline" class="text-xs">{resource.packageName}</Badge>
                                    {/if}
                                </div>
                                
                                <div class="flex justify-between w-full mt-1 text-xs text-muted-foreground">
                                    <span>Updated: <RelativeDate date={resource.updatedAt} /></span>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </PopoverContent>
    </Popover>
    
    {#if error}
        <div class="flex items-center mt-1 text-destructive text-xs" transition:fade={{ duration: 200 }}>
            <AlertCircle class="h-3 w-3 mr-1" />
            <span>{error}</span>
        </div>
    {/if}
    
    {#if name}
        <input type="hidden" {name} {id} bind:value />
    {/if}
</div>
