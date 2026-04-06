<script lang="ts">
  import { cn } from '$lib/utils/ui-utils';
  
  export let className = '';
  export const collapsed = false;
</script>

<div class={cn('sidebar-group-content', className)}>
  <slot />
</div>

<style>
  .sidebar-group-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
</style>
