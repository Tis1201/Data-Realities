<script lang="ts">
  import { cn } from '$lib/utils/ui-utils';
  
  export let className = '';
</script>

<ul class={cn('sidebar-menu', className)}>
  <slot />
</ul>

<style>
  .sidebar-menu {
    display: flex;
    flex-direction: column;
    gap: 0;
    list-style: none;
    padding: 0;
    margin: 0;
  }
</style>
