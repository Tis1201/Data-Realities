<script lang="ts">
  import RelativeDate from "$lib/components/ui_components_sveltekit/date/RelativeDate.svelte";
  
  export let preclaimSet: any;
  export let metrics: any = { total: 0, claimed: 0, left: 0 };
</script>

<div class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div class="rounded-lg border bg-muted/20 p-4">
    <p class="text-xs text-muted-foreground">Total Devices</p>
    <p class="text-2xl font-semibold">{metrics.total}</p>
    <p class="text-xs text-muted-foreground">Devices in this pre-claim set</p>
  </div>
  <div class="rounded-lg border bg-muted/20 p-4">
    <p class="text-xs text-muted-foreground">Devices Claimed</p>
    <p class="text-2xl font-semibold">{metrics.claimed}</p>
    <p class="text-xs text-muted-foreground">Claimed or used</p>
  </div>
  <div class="rounded-lg border bg-muted/20 p-4">
    <p class="text-xs text-muted-foreground">Devices Left</p>
    <p class="text-2xl font-semibold">{metrics.left}</p>
    <p class="text-xs text-muted-foreground">Remaining to be claimed</p>
  </div>
  <div class="rounded-lg border bg-muted/20 p-4">
    <p class="text-xs text-muted-foreground">Expires</p>
    <p class="text-sm">
      {#if preclaimSet?.expiresAt}
        <RelativeDate date={preclaimSet.expiresAt} />
      {:else}
        No expiry
      {/if}
    </p>
    <p class="text-xs text-muted-foreground">Validity of this set</p>
  </div>
</div>

