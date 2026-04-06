<script lang="ts">
  import { ChevronLeft, ChevronRight } from "lucide-svelte";
  import { createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  
  // Props with defaults
  export let title = "";
  export let initialCollapsed = false;
  
  // Create a local store for collapsed state
  const collapsed = writable(initialCollapsed);
  
  // Set up event dispatcher
  const dispatch = createEventDispatcher();
  
  // Toggle collapsed state
  function toggleCollapsed() {
    collapsed.update(value => {
      const newValue = !value;
      dispatch('toggle', newValue);
      return newValue;
    });
  }
</script>

<div class="flex items-center justify-between w-full">
  {#if !$collapsed && title}
    <span class="text-base font-medium">{title}</span>
  {/if}
  <button
    class="flex items-center justify-center rounded {$collapsed ? 'h-7 w-7 text-white/60 hover:text-white' : 'h-6 w-6 bg-white/10 hover:bg-white/20 group'} transition-colors"
    on:click={toggleCollapsed}
    title={$collapsed ? "Expand sidebar" : "Collapse sidebar"}
  >
    <svelte:component 
      this={$collapsed ? ChevronRight : ChevronLeft} 
      class="{$collapsed ? 'h-4 w-4' : 'h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5'}"
    />
  </button>
</div>
