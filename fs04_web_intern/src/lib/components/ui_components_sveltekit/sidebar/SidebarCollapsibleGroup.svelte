<script lang="ts">
  import { cn } from "$lib/utils/ui-utils";
  import { slide } from "svelte/transition";
  import { ChevronDown } from "lucide-svelte";
  import SidebarGroupLabel from "./SidebarGroupLabel.svelte";
  import SidebarGroupContent from "./SidebarGroupContent.svelte";
  import { expandedGroups } from "$lib/stores/sidebarStore";
  import { page } from "$app/stores";
  
  export let label: string;
  export let icon: any = null;
  export let expanded = true;
  export let collapsed = false;
  export let className = "";
  export let href: string = undefined;
  
  // Create a unique ID for this group based on the label
  const groupId = `sidebar-group-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Initialize the expanded state from the store with the provided default
  $: isExpanded = $expandedGroups[groupId] !== undefined ? $expandedGroups[groupId] : expanded;
  
  function toggleExpanded() {
    if (href) {
      // If href is provided, don't toggle expansion
      return;
    }
    
    if (!collapsed) {
      // Update the store instead of the local variable
      expandedGroups.toggleGroup(groupId);
    }
  }
  
  // Determine if we should show a button or a link
  $: Component = href ? 'a' : 'button';
  
  // Function to check if a link is active
  function isActive(href) {
    if (!href) return false;
    
    const currentPath = $page.url.pathname;
    
    // Exact match
    if (currentPath === href) return true;
    
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
</script>

<div class={cn("sidebar-collapsible-group", className)}>
  <div class="mb-1">
    <svelte:element 
      this={Component}
      class={cn(
        "flex w-full items-center py-2.5 px-3 rounded-md text-sm font-semibold transition-all duration-150",
        collapsed ? "justify-center" : "justify-between",
        // Parent-specific stronger styling
        href ? (isActive(href) 
          ? "bg-white/20 shadow-sm text-white font-semibold" 
          : "hover:bg-white/15 hover:shadow-sm"
        ) : "hover:bg-white/15"
      )}
      on:click={toggleExpanded}
      title={collapsed ? label : undefined}
      href={href}
      role={href ? undefined : "button"}
      aria-current={href ? 'page' : undefined}
      aria-expanded={!href ? isExpanded : undefined}
    >
      <div class={cn("flex items-center", collapsed ? "" : "gap-2")}>
        {#if icon}
          <svelte:component this={icon} class="h-4 w-4" />
        {/if}
        {#if !collapsed}
          <span class="font-medium">{label}</span>
        {/if}
      </div>
      {#if !collapsed && !href}
        <ChevronDown 
          class={cn(
            "h-3.5 w-3.5 transition-transform", 
            isExpanded ? "rotate-0" : "-rotate-90"
          )}
        />
      {/if}
    </svelte:element>
  </div>
  
  {#if href}
    <!-- If href is provided, don't show any content -->
  {:else if collapsed}
    <!-- In collapsed mode, we don't show the expanded content -->
  {:else if isExpanded}
    <div transition:slide|local={{ duration: 200 }}>
      <SidebarGroupContent>
        <div class="pl-1.5 border-l border-white/10 ml-0.5">
          <slot />
        </div>
      </SidebarGroupContent>
    </div>
  {/if}
</div>

<style>
  .sidebar-collapsible-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.25rem;
  }
</style>
