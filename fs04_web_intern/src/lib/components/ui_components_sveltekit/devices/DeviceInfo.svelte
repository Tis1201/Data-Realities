<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import RelativeDate from "$lib/components/ui_components_sveltekit/date/RelativeDate.svelte";
  import { CompactInfoGrid, CompactInfoItem } from "$lib/components/ui_components_sveltekit/layout";
  import { Clock, Shield, Server } from "lucide-svelte";

  export let device: any;

  function getConnectionStatusBadge(connected: boolean) {
    return connected
      ? { label: 'Connected', variant: 'secondary' as const }
      : { label: 'Disconnected', variant: 'destructive' as const };
  }
  const connectionStatus = getConnectionStatusBadge(!!device?.connected);
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <h3 class="text-sm font-medium mb-2 flex items-center">
      <Server class="mr-1.5 h-4 w-4" />
      Connection Status
    </h3>
    <div class="flex items-center space-x-2 mb-2">
      <Badge variant={connectionStatus.variant} class="px-3 py-1">
        {connectionStatus.label}
      </Badge>
    </div>

    {#if device.connected && device.connectedAt}
      <CompactInfoItem label="Connected since" icon={Clock}>
        <RelativeDate date={device.connectedAt} />
      </CompactInfoItem>
    {:else if device.disconnectedAt}
      <CompactInfoItem label="Last seen" icon={Clock}>
        <RelativeDate date={device.disconnectedAt} />
      </CompactInfoItem>
    {/if}
  </div>

  <div class="border-t md:border-t-0 md:border-l border-muted pt-4 md:pt-0 md:pl-4">
    <h3 class="text-sm font-medium mb-2 flex items-center">
      <Shield class="mr-1.5 h-4 w-4" />
      Security
    </h3>
    <CompactInfoGrid columns={1} gap="gap-1">
      <CompactInfoItem label="Created" icon={Clock}>
        <div class="text-xs">
          <RelativeDate date={device.createdAt} />
        </div>
      </CompactInfoItem>
    </CompactInfoGrid>
  </div>
</div>


