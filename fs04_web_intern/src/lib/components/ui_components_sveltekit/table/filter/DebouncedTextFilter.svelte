<script lang="ts">
    import { debounce } from "lodash-es";
    import { goto } from "$app/navigation";
    import { onDestroy, createEventDispatcher } from "svelte";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { X, Search } from "lucide-svelte";
    
    const dispatch = createEventDispatcher<{ change: string }>();
  
    export let placeholder: string = "Search...";
    export let value: string = ""; // String value instead of Writable store
    export let paramName: string = "search"; // URL query parameter key
    export let resetPage: boolean = true; // Reset "page" parameter to 1 when filtering
    export let className: string = "";
    export let emitOnly: boolean = false; // If true, emit change event instead of updating URL
    export let delay: number = 300; // Debounce delay in milliseconds


    let inputValue = value;
  
    // Sync inputValue with the value prop
    $: inputValue = value;
  
    // Debounced function to update the URL or emit change event
    const debouncedUpdate = debounce((query: string) => {
      if (emitOnly) {
        // Emit change event for parent components to handle
        dispatch('change', query);
      } else {
        // Update URL query parameters (default behavior)
        const url = new URL(window.location.href);
        url.searchParams.set(paramName, query || "");
        if (resetPage) {
          url.searchParams.set("page", "1");
        }
        goto(url.toString(), { replaceState: true, noScroll: true, keepFocus: true });
      }
  
      console.log(`${paramName} updated to:`, query);
    }, delay);
  
    // Clear search input
    function clearSearch() {
      inputValue = ""; // Reset the input
      debouncedUpdate(""); // Trigger a debounced update with an empty query
    }
  
    // Cleanup the debounce timer on destroy
    onDestroy(() => {
      debouncedUpdate.cancel();
    });
  
    // Handle input changes
    function handleInput(event: Event) {
      const target = event.target as HTMLInputElement;
      inputValue = target.value;
      debouncedUpdate(inputValue);
    }
  </script>
  
  <div class="relative {className}">
    <div class="relative flex items-center">
      <Search class="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
      
      <Input
        type="text"
        {placeholder}
        value={inputValue}
        on:input={handleInput}
        class="pl-9 pr-9 h-9"
      />
      
      {#if inputValue}
        <Button
          variant="ghost"
          size="icon"
          class="absolute right-0 h-9 w-9 p-0 hover:bg-transparent hover:text-muted-foreground/70"
          on:click={clearSearch}
        >
          <X class="h-4 w-4" />
        </Button>
      {/if}
    </div>
  </div>