<script lang="ts">
  import { CompactInfoGrid, CompactInfoItem } from "$lib/components/ui_components_sveltekit/layout";
  import DeviceStatusBadge from "$lib/components/ui_components_sveltekit/devices/DeviceStatusBadge.svelte";

  export let device: any;
</script>

<h3 class="text-sm font-medium text-foreground mb-2">Basic details</h3>
<CompactInfoGrid columns={2} gap="gap-4" class_name="items-start">
  <CompactInfoItem label="Device Name" separated={true}>
    <div class="font-medium">{device.name}</div>
  </CompactInfoItem>

  <CompactInfoItem label="Status" separated={true}>
    <DeviceStatusBadge status={device.status} />
  </CompactInfoItem>

  <CompactInfoItem label="Description" class_name="col-span-2" separated={true}>
    <div class="text-sm text-foreground">{device.description || ''}</div>
    {#if !device.description}
      <div class="text-xs text-muted-foreground">—</div>
    {/if}
  </CompactInfoItem>
</CompactInfoGrid>


