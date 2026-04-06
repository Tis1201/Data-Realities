<script lang="ts">
  import { cn } from '$lib/utils/ui-utils';
  
  export let className = '';
</script>

<div class={cn('sidebar-footer', className)}>
  <slot />
</div>

<style>
  .sidebar-footer {
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    border-top: 1px solid hsl(var(--sidebar-border));
    min-height: 3.5rem;
  }
</style>
