<script lang="ts">
  import { cn } from '$lib/utils/ui-utils';
  
  export let className = '';
</script>

<li class={cn('sidebar-menu-item', className)}>
  <slot />
</li>

<style>
  .sidebar-menu-item {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    margin: 2px 0;
  }
</style>
