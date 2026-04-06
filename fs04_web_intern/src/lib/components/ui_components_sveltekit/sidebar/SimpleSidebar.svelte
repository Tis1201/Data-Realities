<script lang="ts">
  import { cn } from '$lib/utils/ui-utils';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { onMount, onDestroy, afterUpdate } from 'svelte';
  import SidebarHeader from './SidebarHeader.svelte';
  import SidebarContent from './SidebarContent.svelte';
  import SidebarToggleButton from './SidebarToggleButton.svelte';
  import SidebarMenuItems from './SidebarMenuItems.svelte';
  import { writable } from 'svelte/store';
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let title = "";
  export let items = [];
  export let initialCollapsed = false;
  export let className = "";
  export let customIsActive = null; // Optional custom isActive function
  
  // Create a local store for collapsed state
  const collapsed = writable(initialCollapsed);
  
  // Set up event dispatcher
  const dispatch = createEventDispatcher();
  
  // Default isActive function that checks if the current URL matches the href
  function defaultIsActive(href) {
    if (!href) return false;
    
    const currentPath = $page.url.pathname;
    
    // Exact match
    if (currentPath === href) return true;
    
    // Special cases for different sections
    if (href.includes('/admin/settings/')) {
      // For settings pages, only match exact paths
      return currentPath === href;
    }
    
    // For API keys page
    if (href === '/admin/settings/api_keys' && currentPath === '/admin/settings/api_keys') {
      return true;
    }
    
    // For users page
    if (href === '/admin/users' && currentPath === '/admin/users') {
      return true;
    }
    
    // For other paths with children, check if current path starts with href + '/'
    if (href !== '/' && currentPath.startsWith(href)) {
      // If href doesn't end with slash, ensure the next character in pathname is a slash
      if (!href.endsWith('/')) {
        return currentPath === href || currentPath.substring(href.length, href.length + 1) === '/';
      }
      return true;
    }
    
    return false;
  }
  
  // Use custom isActive if provided, otherwise use default
  $: isActive = customIsActive || defaultIsActive;
  
  // Handle toggle events
  function handleToggle(event) {
    collapsed.set(event.detail);
    dispatch('toggle', event.detail);
  }
  
  // Scroll position persistence
  let sidebarContentEl;
  let scrollPosition = 0;
  const SCROLL_POSITION_KEY = 'sidebarScrollPosition';
  
  // Store the collapsed state separately to ensure proper styling
  $: sidebarClass = cn(
    'sidebar',
    $collapsed ? 'sidebar-collapsed' : 'sidebar-expanded',
    className
  );
  
  // Save scroll position to localStorage
  function saveScrollPosition() {
    if (browser && sidebarContentEl) {
      scrollPosition = sidebarContentEl.scrollTop;
      localStorage.setItem(SCROLL_POSITION_KEY, scrollPosition.toString());
    }
  }
  
  // Restore scroll position from localStorage
  function restoreScrollPosition() {
    if (browser && sidebarContentEl) {
      const savedPosition = localStorage.getItem(SCROLL_POSITION_KEY);
      if (savedPosition) {
        sidebarContentEl.scrollTop = parseInt(savedPosition, 10);
      }
    }
  }
  
  // Set up event listeners for scroll position
  onMount(() => {
    if (browser && sidebarContentEl) {
      // Restore scroll position on mount
      restoreScrollPosition();
      
      // Add scroll event listener to save position
      sidebarContentEl.addEventListener('scroll', saveScrollPosition);
    }
  });
  
  // Clean up event listeners
  onDestroy(() => {
    if (browser && sidebarContentEl) {
      sidebarContentEl.removeEventListener('scroll', saveScrollPosition);
    }
  });
  
  // Restore scroll position after page navigation
  $: if ($page.url.pathname) {
    // Use afterUpdate to ensure DOM is ready
    afterUpdate(() => {
      restoreScrollPosition();
    });
  }
</script>

<div class={sidebarClass}>
  <div class="sidebar-header border-none">
    <SidebarToggleButton 
      initialCollapsed={$collapsed} 
      on:toggle={handleToggle} 
      {title} 
    />
  </div>
  
  <div class="sidebar-content" bind:this={sidebarContentEl}>
    <SidebarMenuItems 
      {items} 
      collapsed={$collapsed} 
      {isActive}
      key={$page.url.pathname} 
    />
  </div>
</div>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-right: 1px solid hsl(var(--border));
    transition: width 150ms ease-in-out;
    background-color: #4A4494;
    color: white;
  }
  
  .sidebar-header {
    display: flex;
    flex-direction: column;
    padding: 0.75rem 0.5rem;
    min-height: 3rem;
  }
  
  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0.5rem;
  }
  
  .sidebar-expanded {
    width: 240px;
  }
  
  .sidebar-collapsed {
    width: 64px;
  }
  
  /* Ensure icons are centered in collapsed mode */
  :global(.sidebar-collapsed .sidebar-menu-items .menu-item a),
  :global(.sidebar-collapsed .sidebar-collapsible-group button) {
    justify-content: center;
  }
  
  /* Adjust padding in collapsed mode */
  :global(.sidebar-collapsed .sidebar-content) {
    padding: 0.75rem 0.5rem;
  }
</style>
