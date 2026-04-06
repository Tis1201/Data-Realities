<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import RelativeDate from "$lib/components/ui_components_sveltekit/date/RelativeDate.svelte";
  import { CompactInfoItem } from "$lib/components/ui_components_sveltekit/layout";
  import { Server, Clock } from "lucide-svelte";

  export let device: any;
  const getConnectionStatusBadge = (connected: boolean) => connected ? { label: 'Connected', variant: 'success' as const } : { label: 'Disconnected', variant: 'destructive' as const };
  $: connectionStatus = getConnectionStatusBadge(!!device?.connected);
  $: console.log('[ConnectionStatusCard] Device updated:', {
    id: device?.id,
    connected: device?.connected,
    connectedAt: device?.connectedAt,
    disconnectedAt: device?.disconnectedAt,
    connectionStatus
  });
</script>

<div class="space-y-3">
  <h3 class="text-sm font-medium text-foreground mb-2 flex items-center">
    <Server class="mr-1.5 h-4 w-4" />
    Connection Status
  </h3>

  <div class="flex items-center space-x-2 mb-1">
    <Badge variant={connectionStatus.variant} class="px-2.5 py-0.5 text-xs">
      {connectionStatus.label}
    </Badge>
  </div>

  {#if device.connected && device.connectedAt}
    <CompactInfoItem label="Connected System since" icon={Clock} separated={true}>
      <div class="text-sm"><RelativeDate date={device.connectedAt} /></div>
    </CompactInfoItem>
  {:else if device.disconnectedAt}
    <CompactInfoItem label="Last seen" icon={Clock} separated={true}>
      <div class="text-sm"><RelativeDate date={device.disconnectedAt} /></div>
    </CompactInfoItem>
  {/if}
</div>


