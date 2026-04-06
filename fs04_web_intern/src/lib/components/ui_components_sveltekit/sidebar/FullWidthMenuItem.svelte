<script lang="ts">
  import { cn } from '$lib/utils/ui-utils';
  
  export let href: string;
  export let isActive: boolean = false;
  export let icon: any = null;
  export let label: string = '';
  export let collapsed: boolean = false;
  export let isSubmenu: boolean = false;
  
  // For debugging
  const bgColor = isSubmenu ? 'bg-blue-500/20 hover:bg-blue-500/30' : 'bg-red-500/20 hover:bg-red-500/30';
</script>

<li class="w-full px-0 mx-0 my-0.5">
  <a 
    {href} 
    class={cn(
      'block w-full py-1 px-3', 
      bgColor,
      isActive ? 'font-medium bg-opacity-30' : ''
    )}
  >
    <div class="flex items-center gap-1.5">
      {#if icon}
        <svelte:component this={icon} class={isSubmenu ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {/if}
      {#if !collapsed || isSubmenu}
        <span>{label}</span>
      {/if}
    </div>
  </a>
</li>

<style>
  a {
    text-decoration: none;
    color: inherit;
    transition: background-color 0.2s;
  }
</style>
