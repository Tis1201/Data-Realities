<script lang="ts">
  import { cn } from '$lib/utils/ui-utils';
  
  export let className = '';
</script>

<div class={cn('sidebar-header', className)}>
  <slot />
</div>

<style>
  .sidebar-header {
    display: flex;
    flex-direction: column;
    padding: 1rem 0.75rem;
    border-bottom: 1px solid hsl(var(--sidebar-border));
    min-height: 3.5rem;
  }
</style>
