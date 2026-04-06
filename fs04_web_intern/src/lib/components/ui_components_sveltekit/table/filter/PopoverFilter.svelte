<script lang="ts">
    import { writable } from 'svelte/store';
    import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
    import { Button } from "$lib/components/ui/button";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { Label } from "$lib/components/ui/label";
    import { Separator } from "$lib/components/ui/separator";
    import { Input } from "$lib/components/ui/input";
    import { goto } from "$app/navigation";
    import { X, Filter, Search } from "lucide-svelte";
  
    export let label: string;
    export let options: { label: string; value: string }[];
    export let selectedValues: string[] = [];
    export let onChange: ((values: string[]) => void) | undefined = undefined; // Made optional with a default value
    export let key: string | null = null; // Optional key for auto URL updates
    export let singleSelect: boolean = false; // Whether only one option can be selected at a time
    export let searchable: boolean = false; // Whether to show search input
  
    // Internal state for selected values that syncs with the external store
    const selected = writable<string[]>([]);
    
    // Search state
    let searchQuery = '';
    
    // Update internal state when selectedValues changes
    $: {
      if (Array.isArray(selectedValues)) {
        selected.set([...selectedValues]);
      }
    }
    
    // Filter options based on search query
    $: filteredOptions = searchable && searchQuery 
      ? options.filter(option => 
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;
  
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
        let updated;
        
        if (checked) {
          // If singleSelect is true, replace the current selection
          // Otherwise, add to the current selection
          updated = singleSelect ? [value] : [...current, value];
        } else {
          // Remove the value if unchecked
          updated = current.filter((v) => v !== value);
        }
  
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
        size="sm"
        class="h-9 flex items-center gap-2 relative pr-2"
        builders={[builder]}
      >
        <Filter class="h-4 w-4" />
        <span class="text-sm">{label}</span>
        {#if $selected.length > 0}
          <div class="absolute -top-1.5 -right-1.5 rounded-full bg-primary min-w-[1.25rem] h-5 flex items-center justify-center text-xs text-primary-foreground">
            {$selected.length}
          </div>
        {/if}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[220px] p-0">
      <div class="p-4 pb-2">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-medium text-sm">{label}</h4>
          <!-- {#if $selected.length > 0}
            <Button 
              variant="ghost" 
              size="icon" 
              class="h-6 w-6" 
              on:click={clearSelections}
              aria-label="Clear all selections"
            >
              <X class="h-3.5 w-3.5" />
            </Button>
          {/if} -->
        </div>
        <Separator class="my-2" />
        
        <!-- Search input for searchable filters -->
        {#if searchable}
          <div class="relative mb-3">
            <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search {label.toLowerCase()}..."
              bind:value={searchQuery}
              class="pl-8 h-8 text-sm"
            />
          </div>
        {/if}
        
        <div class="max-h-[250px] overflow-y-auto space-y-2 pt-1">
          {#if filteredOptions.length === 0 && searchQuery}
            <div class="text-center py-4 text-sm text-muted-foreground">
              No {label.toLowerCase()} found matching "{searchQuery}"
            </div>
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
                  {option.label}
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