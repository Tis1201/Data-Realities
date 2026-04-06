<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  export let items = [];
  
  const dispatch = createEventDispatcher();
  let activeMenu = null;
  
  function toggleMenu(menuId) {
    if (activeMenu === menuId) {
      activeMenu = null;
    } else {
      activeMenu = menuId;
    }
  }
  
  function closeAllMenus() {
    activeMenu = null;
  }
  
  function handleItemClick(item) {
    dispatch('select', item);
    closeAllMenus();
    
    if (item.action) {
      item.action();
    }
  }
  
  function handleClickOutside(event) {
    const menubarElement = document.getElementById('simple-menubar');
    if (menubarElement && !menubarElement.contains(event.target)) {
      closeAllMenus();
    }
  }
  
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      closeAllMenus();
    };
  });
</script>

<nav class="border-b border-transparent" id="simple-menubar">
  <div class="flex items-center h-full">
    {#each items as menu, i}
      <div class="relative">
        <button 
          class="px-2 py-1 text-sm font-medium hover:bg-primary/5 hover:border-b-2 hover:border-primary focus:outline-none transition-all {activeMenu === i ? 'bg-primary/10 border-b-2 border-primary' : 'border-b-2 border-transparent'}"
          on:click|stopPropagation={() => toggleMenu(i)}
          aria-haspopup="true"
          aria-expanded={activeMenu === i}
        >
          {#if menu.icon}
            <div class="flex items-center gap-1">
              <svelte:component this={menu.icon} class="h-4 w-4 {activeMenu === i ? 'text-primary' : 'text-muted-foreground'}" />
              <span class={activeMenu === i ? 'text-primary' : ''}>{menu.label}</span>
            </div>
          {:else}
            <span class={activeMenu === i ? 'text-primary' : ''}>{menu.label}</span>
          {/if}
        </button>
        
        {#if activeMenu === i && menu.items && menu.items.length > 0}
          <div 
            class="absolute left-0 top-full mt-0.5 w-60 rounded-md border border-border bg-card shadow-lg z-50 overflow-hidden"
            transition:fade={{ duration: 100 }}
          >
            <div class="py-1">
              {#each menu.items as item}
                {#if item.separator}
                  <div class="h-px my-1 bg-muted"></div>
                {:else}
                  <button
                    class="flex w-full items-center px-2 py-1.5 text-sm hover:bg-muted/50 hover:underline transition-colors"
                    on:click|stopPropagation={() => handleItemClick(item)}
                  >
                    {#if item.icon}
                      <div class="w-4 h-4 mr-1.5 flex items-center justify-center text-primary">
                        <svelte:component this={item.icon} class="h-4 w-4" />
                      </div>
                    {:else}
                      <div class="w-4 h-4 mr-1.5"></div>
                    {/if}
                    <span>{item.label}</span>
                  </button>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</nav>
