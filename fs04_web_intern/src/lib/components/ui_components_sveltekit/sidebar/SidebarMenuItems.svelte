<script lang="ts">
  import { cn } from "$lib/utils/ui-utils";
  import SidebarGroup from "./SidebarGroup.svelte";
  import SidebarGroupContent from "./SidebarGroupContent.svelte";
  import SidebarMenu from "./SidebarMenu.svelte";
  import SidebarMenuItem from "./SidebarMenuItem.svelte";
  import SidebarMenuButton from "./SidebarMenuButton.svelte";
  import SidebarCollapsibleGroup from "./SidebarCollapsibleGroup.svelte";
  
  export let items = [];
  export let collapsed = false;
  export let isActive = (href: string) => false;
  export let key = ''; // Key for forcing reactivity
</script>

<div class="sidebar-menu-items">
  {#each items as item (item.href || item.label + key)}
    {#if item.subItems && item.subItems.length === 0 && item.href}
      <!-- Items with empty subItems array and href - treat like a group header but link directly -->
      <div class="menu-group">
        <SidebarCollapsibleGroup 
          label={item.label} 
          icon={item.icon} 
          expanded={false}
          {collapsed}
          href={item.href}
        >
          <!-- No content since subItems is empty -->
        </SidebarCollapsibleGroup>
      </div>
    {:else if item.href && !item.subItems}
      <!-- Legacy direct link items without subItems property -->
      <div class="menu-item direct-link">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <a 
                  href={item.href} 
                  class="menu-link direct-link-item w-full flex items-center px-3 py-2 rounded-md hover:bg-white/15 text-sm {isActive(item.href) ? 'bg-white/20' : ''}" 
                  title={collapsed ? item.label : undefined}
                >
                  <div class="flex items-center w-full">
                    <svelte:component this={item.icon} class="h-4 w-4" />
                    {#if !collapsed}
                      <span class="font-medium ml-2">{item.label}</span>
                    {/if}
                  </div>
                </a>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    {:else if item.subItems && item.subItems.length > 0}
      <div class="menu-group">
        {#if collapsed}
          <!-- In collapsed mode, show just the group icon with a tooltip -->
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <!-- Use the first subItem's href for navigation when clicking the group icon -->
                  <a href={item.subItems[0]?.href} 
                     class="flex items-center justify-center opacity-85 w-full py-2 px-3 rounded-md hover:bg-white/15 text-sm {item.subItems.some(subItem => isActive(subItem.href)) ? 'bg-white/20' : ''}" 
                     title={item.label}
                  >
                    <div class="flex items-center justify-center w-full">
                      <svelte:component this={item.icon} class="h-4 w-4" />
                    </div>
                  </a>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        {:else}
          <!-- In expanded mode, show the collapsible group -->
          <SidebarCollapsibleGroup 
            label={item.label} 
            icon={item.icon} 
            expanded={item.initialExpanded !== undefined ? item.initialExpanded : true} 
            {collapsed}
          >
            <SidebarMenu>
              {#each item.subItems as subItem}
                <SidebarMenuItem>
                  <a href={subItem.href} 
                     class={cn(
                       "flex items-center text-sm w-full py-2 px-3 rounded-md transition-all duration-150",
                       "font-normal opacity-90 text-white/90",
                       isActive(subItem.href) 
                         ? "bg-white/12 shadow-sm border-l-2 border-white/30" 
                         : "hover:bg-white/8 hover:text-white",
                       collapsed ? "justify-center" : "gap-1.5"
                     )} 
                     title={collapsed ? subItem.label : undefined}
                  >
                    <div class="flex items-center w-full {collapsed ? 'justify-center' : ''}">
                      {#if subItem.icon}
                        <svelte:component this={subItem.icon} class="h-3.5 w-3.5 opacity-80" />
                      {/if}
                      {#if !collapsed}
                        <span class="ml-2 text-sm">{subItem.label}</span>
                      {/if}
                    </div>
                  </a>
                </SidebarMenuItem>
              {/each}
            </SidebarMenu>
          </SidebarCollapsibleGroup>
        {/if}
      </div>
    {/if}
  {/each}
</div>

<style>
  .sidebar-menu-items {
    display: flex;
    flex-direction: column;
  }
  
  .menu-item, .menu-group {
    margin-bottom: 0.125rem;
  }
  
  /* Style direct link items to match group headers */
  :global(.direct-link-item) {
    display: flex;
    width: 100%;
    align-items: center;
    font-weight: 500 !important;
    padding: 0.375rem 0.5rem !important;
  }
  
  /* Match the layout of group headers */
  :global(.direct-link-item) {
    justify-content: space-between !important;
  }
  
  /* Match icon and text spacing */
  :global(.direct-link-item svg) {
    width: 1rem !important;
    height: 1rem !important;
    margin-right: 0.5rem;
  }
  
  /* Match text weight */
  :global(.direct-link-item span) {
    font-weight: 600 !important;
  }
  
  /* Remove any background color differences */
  :global(.direct-link .sidebar-menu-button) {
    background-color: transparent;
  }
  
  /* Match active state */
  :global(.direct-link .sidebar-menu-button.active) {
    background-color: rgba(255, 255, 255, 0.2);
    font-weight: 500;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  /* IMPROVED COLOR HIERARCHY */
  /* Parent group headers - stronger background */
  :global(.sidebar-collapsible-group > div > button),
  :global(.sidebar-collapsible-group > div > a) {
    background-color: transparent;
    font-weight: 600;
  }
  
  :global(.sidebar-collapsible-group > div > button:hover),
  :global(.sidebar-collapsible-group > div > a:hover) {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  :global(.sidebar-collapsible-group > div > button.bg-white\/20),
  :global(.sidebar-collapsible-group > div > a.bg-white\/20) {
    background-color: rgba(255, 255, 255, 0.25) !important;
  }
  
  /* Child/sub-menu items - lighter background and smaller font */
  :global(.sidebar-collapsible-group .sidebar-menu a) {
    background-color: transparent;
    font-weight: 400;
    opacity: 0.9;
    font-size: 0.875rem;
  }
  
  :global(.sidebar-collapsible-group .sidebar-menu a:hover) {
    background-color: rgba(255, 255, 255, 0.1);
    opacity: 1;
  }
  
  :global(.sidebar-collapsible-group .sidebar-menu a.bg-white\/20) {
    background-color: rgba(255, 255, 255, 0.15) !important;
    font-weight: 500;
    opacity: 1;
  }
</style>
