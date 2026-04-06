<script lang="ts">
  import { cn } from '$lib/utils/ui-utils';
  
  export let className = '';
</script>

<div class={cn('sidebar-group', className)}>
  <slot />
</div>

<style>
  .sidebar-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.125rem;
  }
</style>
