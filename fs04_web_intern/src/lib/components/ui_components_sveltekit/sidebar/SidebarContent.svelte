<script lang="ts">
  import { cn } from '$lib/utils/ui-utils';
  
  export let className = '';
</script>

<div class={cn('sidebar-content', className)}>
  <slot />
</div>

<style>
  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    scrollbar-width: thin;
  }

  .sidebar-content::-webkit-scrollbar {
    width: 4px;
  }

  .sidebar-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .sidebar-content::-webkit-scrollbar-thumb {
    background: hsl(var(--sidebar-border));
    border-radius: 2px;
  }
</style>
