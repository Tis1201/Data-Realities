<script lang="ts">
  import RelativeDate from "$lib/components/ui_components_sveltekit/date/RelativeDate.svelte";
  
  export let preclaimSet: any;
</script>

{#if preclaimSet?.description}
  <div class="mt-4 pt-4 border-t">
    <p class="text-xs text-muted-foreground mb-1">Description</p>
    <p class="text-sm">{preclaimSet.description}</p>
  </div>
{/if}

