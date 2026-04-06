<script lang="ts">
    import { writable } from 'svelte/store';
    import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { Label } from "$lib/components/ui/label";
    import { Separator } from "$lib/components/ui/separator";
    import { goto } from "$app/navigation";
    import { X, Filter, Search } from "lucide-svelte";
    import { debounce } from "lodash-es";
  
    /**
     * A searchable popover filter component that combines the functionality
     * of SearchableSelect and PopoverFilter.
     */
  
    export let label: string;
    export let options: { label: string; value: string; html?: string }[];
    export let selectedValues: string[] = [];
    export let onChange: ((values: string[]) => void) | undefined = undefined;
    export let key: string | null = null; // Optional key for auto URL updates
    export let searchPlaceholder: string = "Search...";
    export let debounceMs: number = 300;
    export let noResultsText: string = "No results found";
    export let maxHeight: string = "250px";
  
    // Internal state
    const selected = writable<string[]>([]);
    let searchInput = "";
    let filteredOptions = [...options];
    
    // Update internal state when selectedValues changes
    $: {
      if (Array.isArray(selectedValues)) {
        selected.set([...selectedValues]);
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
    }, debounceMs);
    
    // Handle search input
    function handleSearchInput(event) {
        debouncedSearch(event.target.value);
    }
  
    // Helper function to build a URL
    function buildUrl(params: Record<string, string | null>) {
      const url = new URL(window.location.href);
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          url.searchParams.delete(key);
        } else {
          url.searchParams.set(key, value);
        }
      });
      return url.toString();
    }
  
    // Emit updated values or handle URL updates
    function handleUpdate(value: string, checked: boolean) {
      selected.update((current) => {
        const updated = checked
          ? [...current, value]
          : current.filter((v) => v !== value);
  
        updateSelection(updated);
        return updated;
      });
    }
    
    // Clear all selections
    function clearSelections() {
      selected.set([]);
      updateSelection([]);
    }
    
    // Update URL or call onChange
    function updateSelection(values: string[]) {
      if (key) {
        // If `key` is provided, automatically update the URL
        const newUrl = buildUrl({ [key]: values.length ? values.join(',') : null, page: '1' });
        goto(newUrl, { replaceState: true, noScroll: true, keepFocus: true });
      } else if (onChange) {
        // If no `key` but onChange is provided, invoke the callback
        onChange(values);
      }
    }
</script>
  
<Popover>
    <PopoverTrigger asChild let:builder>
        <Button
            variant="outline"
            class="flex items-center gap-2 relative"
            builders={[builder]}
        >
            <Filter class="h-4 w-4" />
            <span>{label}</span>
            {#if $selected.length > 0}
                <div class="absolute -top-2 -right-2 rounded-full bg-primary min-w-[1.25rem] h-5 flex items-center justify-center text-xs text-primary-foreground">
                    {$selected.length}
                </div>
            {/if}
        </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[250px] p-0">
        <div class="p-4 pb-2">
            <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-sm">{label}</h4>
            </div>
            
            <!-- Search input -->
            <div class="flex items-center px-2 py-1 border rounded-md mb-2">
                <Search class="mr-2 h-4 w-4 shrink-0 opacity-70" />
                <Input 
                    type="text" 
                    placeholder={searchPlaceholder} 
                    class="search-input h-8 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    on:input={handleSearchInput}
                    value={searchInput}
                />
            </div>
            
            <Separator class="my-2" />
            
            <!-- Options list with max height and scrolling -->
            <div class="overflow-y-auto space-y-2 pt-1" style="max-height: {maxHeight};">
                {#if filteredOptions.length === 0}
                    <div class="py-2 text-center text-sm text-muted-foreground">{noResultsText}</div>
                {:else}
                    {#each filteredOptions as option}
                        <div class="flex items-center space-x-2">
                            <Checkbox
                                id={`filter-${option.value}`}
                                checked={$selected.includes(option.value)}
                                onCheckedChange={(checked) => handleUpdate(option.value, checked)}
                            />
                            <Label 
                                for={`filter-${option.value}`} 
                                class="text-sm cursor-pointer select-none"
                            >
                                {#if option.html}
                                    {@html option.html}
                                {:else}
                                    {option.label}
                                {/if}
                            </Label>
                        </div>
                    {/each}
                {/if}
            </div>
            
            {#if $selected.length > 0}
                <div class="flex justify-between items-center mt-4 pt-2 border-t border-border">
                    <span class="text-xs text-muted-foreground">{$selected.length} selected</span>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        class="h-7 text-xs" 
                        on:click={clearSelections}
                    >
                        Clear all
                    </Button>
                </div>
            {/if}
        </div>
    </PopoverContent>
</Popover>
