<script lang="ts">
  import { setContext } from 'svelte';
  import { sidebarStore } from './sidebar-store';
  import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_MOBILE } from './constants';

  // Props
  export let open: boolean | undefined = undefined;
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;
  export let style: string = '';

  // Context key
  const SIDEBAR_CONTEXT_KEY = Symbol('sidebar');

  // Set up context for child components
  setContext(SIDEBAR_CONTEXT_KEY, sidebarStore);

  // Handle controlled state if provided
  $: if (open !== undefined) {
    sidebarStore.setOpen(open);
  }

  // Handle open change callback
  $: if (onOpenChange && $sidebarStore.open !== open) {
    onOpenChange($sidebarStore.open);
  }

  // Combine styles
  const baseStyle = `--sidebar-width: ${SIDEBAR_WIDTH}; --sidebar-width-mobile: ${SIDEBAR_WIDTH_MOBILE};`;
  $: combinedStyle = style ? `${baseStyle} ${style}` : baseStyle;
</script>

<div class="sidebar-provider" style={combinedStyle}>
  <slot />
</div>

<style>
  .sidebar-provider {
    display: contents;
  }
</style>
