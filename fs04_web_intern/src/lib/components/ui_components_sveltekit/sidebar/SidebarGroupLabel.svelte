<script lang="ts">
  import { cn } from '$lib/utils/ui-utils';
  import { getContext } from 'svelte';
  
  export let className = '';
  export let collapsed = false;

  // Try to get sidebar store from context, but make it optional
  const sidebar = getContext(Symbol('sidebar')) || { subscribe: () => ({ state: 'expanded', isMobile: false }) };
</script>

<div class={cn('sidebar-group-label', className)}>
  {#if !collapsed}
    <slot />
  {/if}
</div>

<style>
  .sidebar-group-label {
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.125rem 0.375rem;
    color: hsl(var(--sidebar-foreground));
    margin-bottom: 0.125rem;
    user-select: none;
  }
</style>
