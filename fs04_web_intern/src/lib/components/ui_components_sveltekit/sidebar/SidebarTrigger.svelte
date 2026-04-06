<script lang="ts">
  import { cn } from '$lib/utils/ui-utils';
  import { getContext } from 'svelte';
  import { Menu } from 'lucide-svelte';
  
  export let className = '';

  // Get sidebar store from context
  const sidebar = getContext(Symbol('sidebar'));

  // Handle toggle
  function handleToggle() {
    sidebar.toggle();
  }
</script>

<button
  type="button"
  class={cn('sidebar-trigger', className)}
  on:click={handleToggle}
  aria-label={$sidebar.openMobile || $sidebar.state === 'expanded' ? 'Close sidebar' : 'Open sidebar'}
>
  <Menu size={20} />
  <slot />
</button>

<style>
  .sidebar-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background-color: transparent;
    border: none;
    border-radius: 0.375rem;
    color: hsl(var(--sidebar-foreground));
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .sidebar-trigger:hover {
    background-color: hsl(var(--sidebar-accent));
  }
</style>
