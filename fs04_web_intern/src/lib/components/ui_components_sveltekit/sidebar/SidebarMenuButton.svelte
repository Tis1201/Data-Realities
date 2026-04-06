<script lang="ts">
  import { cn } from '$lib/utils/ui-utils';
  import { getContext } from 'svelte';
  import { page } from '$app/stores';
  
  export let href: string | undefined = undefined;
  export let isActive = false;
  export let className = '';

  // Get sidebar store from context
  const sidebar = getContext(Symbol('sidebar'));

  // Only use the isActive prop passed from parent
  $: active = isActive;

  // Handle rendering as a link or button
  let Component = href ? 'a' : 'button';
</script>

<svelte:element 
  this={Component}
  {href}
  role={href ? 'link' : 'button'}
  class={cn(
    'sidebar-menu-button peer/menu-button',
    active ? 'active' : '',
    className
  )}
  data-active={active ? 'true' : 'false'}
  on:click
>
  <slot child={{ props: { class: cn('sidebar-menu-button peer/menu-button', active ? 'active' : '', className), 'data-active': active ? 'true' : 'false' } }} />
</svelte:element>

<style>
  .sidebar-menu-button {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.5rem;
    gap: 0.75rem;
    border-radius: 0.25rem;
    color: hsl(var(--sidebar-foreground));
    background-color: transparent;
    transition: all 150ms ease-in-out;
    text-decoration: none;
    cursor: pointer;
  }

  .sidebar-menu-button:hover {
    background-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05);
  }

  .sidebar-menu-button.active {
    background-color: rgba(255, 255, 255, 0.2);
    font-weight: 500;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  /* Icon styling */
  .sidebar-menu-button :global(svg) {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  /* Text styling - handles truncation */
  .sidebar-menu-button :global(span) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
