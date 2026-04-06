<script lang="ts">
  import { getContext } from 'svelte';
  import { cn } from '$lib/utils/ui-utils';
  import type { SidebarSide, SidebarVariant, SidebarCollapsible } from './sidebar-store';
  
  // Props
  export let side: SidebarSide = 'left';
  export let variant: SidebarVariant = 'sidebar';
  export let collapsible: SidebarCollapsible = 'icon';
  export let className = '';

  // Get sidebar store from context
  const sidebar = getContext(Symbol('sidebar'));

  // Reactive classes
  $: sidebarClasses = cn(
    'sidebar',
    `sidebar-${side}`,
    `sidebar-${variant}`,
    {
      'sidebar-expanded': $sidebar.state === 'expanded' && !$sidebar.isMobile,
      'sidebar-collapsed': $sidebar.state === 'collapsed' && !$sidebar.isMobile,
      'sidebar-mobile': $sidebar.isMobile,
      'sidebar-mobile-open': $sidebar.openMobile && $sidebar.isMobile,
      'sidebar-mobile-closed': !$sidebar.openMobile && $sidebar.isMobile,
    },
    className
  );
</script>

<aside 
  class={sidebarClasses}
  data-side={side}
  data-variant={variant}
  data-collapsible={collapsible}
  data-state={$sidebar.state}
  data-mobile={$sidebar.isMobile ? 'true' : 'false'}
  data-mobile-open={$sidebar.openMobile ? 'true' : 'false'}
>
  <div class="sidebar-inner">
    <slot />
  </div>
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: hsl(var(--sidebar-background));
    color: hsl(var(--sidebar-foreground));
    border-right: 1px solid hsl(var(--sidebar-border));
    position: fixed;
    top: 0;
    z-index: 40;
    transition: width 0.2s ease, transform 0.2s ease;
  }

  .sidebar-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  /* Side variants */
  .sidebar-left {
    left: 0;
  }

  .sidebar-right {
    right: 0;
    border-right: none;
    border-left: 1px solid hsl(var(--sidebar-border));
  }

  /* State variants */
  .sidebar-expanded {
    width: var(--sidebar-width, 16rem);
  }

  .sidebar-collapsed {
    width: 4rem;
  }

  /* Mobile variants */
  .sidebar-mobile {
    width: var(--sidebar-width-mobile, 18rem);
    transform: translateX(-100%);
  }

  .sidebar-mobile-open {
    transform: translateX(0);
  }

  .sidebar-right.sidebar-mobile {
    transform: translateX(100%);
  }

  .sidebar-right.sidebar-mobile-open {
    transform: translateX(0);
  }

  /* Variant styles */
  .sidebar-floating {
    border-radius: 0.5rem;
    margin: 1rem;
    height: calc(100vh - 2rem);
    border: 1px solid hsl(var(--sidebar-border));
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  }

  .sidebar-inset {
    position: relative;
    z-index: 30;
    height: 100%;
    border: none;
  }
</style>
