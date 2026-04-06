<script lang="ts">
  import { Clock, Wifi, Monitor, Globe, Tag } from "lucide-svelte";
  import { Badge } from "$lib/components/ui/badge";
  import RelativeDate from "$lib/components/ui_components_sveltekit/date/RelativeDate.svelte";
  import { getDeviceTypeDisplayName } from '$lib/utils/bundleUtils';
  
  export let device: any;
  export let deviceInformation: any = null;

  // Helper function to format uptime
  function formatUptime(seconds: number | null): string {
    if (!seconds) return '—';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  // Helper function to format signal strength
  function getSignalBadge(dbm: number | null): { variant: 'success' | 'default' | 'secondary' | 'destructive', text: string } {
    if (!dbm) return { variant: 'default', text: 'Unknown' };
    
    if (dbm >= -50) return { variant: 'success', text: 'Excellent' };
    if (dbm >= -60) return { variant: 'success', text: 'Good' };
    if (dbm >= -70) return { variant: 'default', text: 'Fair' };
    return { variant: 'destructive', text: 'Poor' };
  }

  // Helper function to format percentage
  function formatPercentage(value: number | null): string {
    if (value === null || value === undefined) return '—';
    return `${value.toFixed(1)}%`;
  }

  // Helper function to get usage badge variant
  function getUsageBadge(usage: number | null): { variant: 'success' | 'default' | 'secondary' | 'destructive', text: string } {
    if (usage === null || usage === undefined) return { variant: 'default', text: 'Unknown' };
    
    if (usage < 50) return { variant: 'success', text: 'Low' };
    if (usage < 80) return { variant: 'default', text: 'Normal' };
    if (usage < 90) return { variant: 'secondary', text: 'High' };
    return { variant: 'destructive', text: 'Critical' };
  }
</script>

<div class="space-y-6">
  <!-- Device Information -->
  <div class="bg-muted/30 rounded-lg p-4 border border-muted">
    <h3 class="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
      <Clock class="h-4 w-4 text-primary" />
      Device Information
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1.5">
          <Clock class="h-3 w-3" />
          Last Device Status Update
        </div>
        <div class="text-sm font-medium text-foreground">
          {#if deviceInformation?.last_status_at}
            <RelativeDate date={deviceInformation.last_status_at} />
          {:else}
            <span class="text-muted-foreground">—</span>
          {/if}
        </div>
        <p class="text-xs text-muted-foreground mt-1">When device last reported its status</p>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Device System Uptime</div>
        <div class="text-sm font-medium text-foreground">
          {formatUptime(deviceInformation?.system_uptime_seconds ?? null)}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Device System Timezone</div>
        <div class="text-sm font-medium text-foreground">
          {deviceInformation?.timezone || '—'}
        </div>
        <p class="text-xs text-muted-foreground mt-1">Device's configured timezone</p>
      </div>
    </div>
  </div>

  <!-- System Information -->
  <div class="bg-muted/30 rounded-lg p-4 border border-muted">
    <h3 class="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
      <Monitor class="h-4 w-4 text-primary" />
      System Information
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">OS Version</div>
        <div class="text-sm font-medium text-foreground">
          {deviceInformation?.os_version || device.osVersion || '—'}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Firmware</div>
        <div class="text-sm font-medium text-foreground">
          {deviceInformation?.firmware || device.firmwareVersion || '—'}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Model</div>
        <div class="text-sm font-medium text-foreground">
          {deviceInformation?.model || device.model || '—'}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1.5">
          <Tag class="h-3 w-3" />
          Device Type
        </div>
        <div class="text-sm font-medium text-foreground">
          {getDeviceTypeDisplayName(device.deviceType)}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Manufacturer</div>
        <div class="text-sm font-medium text-foreground">
          {device.manufacturer || '—'}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Hardware ID</div>
        <div class="text-sm font-mono text-foreground break-all">
          {device.hardwareId || '—'}
        </div>
      </div>
    </div>
  </div>

  <!-- System Resources -->
  <div class="bg-muted/30 rounded-lg p-4 border border-muted">
    <h3 class="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
      <Monitor class="h-4 w-4 text-primary" />
      System Resources
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">CPU Usage</div>
        <div class="text-sm font-medium text-foreground">
          {#if deviceInformation?.cpu_usage !== null && deviceInformation?.cpu_usage !== undefined}
            {@const usage = getUsageBadge(deviceInformation.cpu_usage)}
            <div class="flex items-center gap-2">
              <span class="font-mono">{formatPercentage(deviceInformation.cpu_usage)}</span>
              <Badge variant={usage.variant} class="text-xs py-0 px-1.5">{usage.text}</Badge>
            </div>
          {:else}
            <span class="text-muted-foreground">—</span>
          {/if}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">RAM Usage</div>
        <div class="text-sm font-medium text-foreground">
          {#if deviceInformation?.ram_usage !== null && deviceInformation?.ram_usage !== undefined}
            {@const usage = getUsageBadge(deviceInformation.ram_usage)}
            <div class="flex items-center gap-2">
              <span class="font-mono">{formatPercentage(deviceInformation.ram_usage)}</span>
              <Badge variant={usage.variant} class="text-xs py-0 px-1.5">{usage.text}</Badge>
            </div>
          {:else}
            <span class="text-muted-foreground">—</span>
          {/if}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Disk Usage</div>
        <div class="text-sm font-medium text-foreground">
          {#if deviceInformation?.disk_usage !== null && deviceInformation?.disk_usage !== undefined}
            {@const usage = getUsageBadge(deviceInformation.disk_usage)}
            <div class="flex items-center gap-2">
              <span class="font-mono">{formatPercentage(deviceInformation.disk_usage)}</span>
              <Badge variant={usage.variant} class="text-xs py-0 px-1.5">{usage.text}</Badge>
            </div>
          {:else}
            <span class="text-muted-foreground">—</span>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Display Information -->
  <div class="bg-muted/30 rounded-lg p-4 border border-muted">
    <h3 class="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
      <Monitor class="h-4 w-4 text-primary" />
      Display
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Resolution</div>
        <div class="text-sm font-medium text-foreground">
          {deviceInformation?.resolution || '—'}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Orientation</div>
        <div class="text-sm font-medium text-foreground">
          {deviceInformation?.orientation || '—'}
        </div>
      </div>
    </div>
  </div>

  <!-- Network Information -->
  <div class="bg-muted/30 rounded-lg p-4 border border-muted">
    <h3 class="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
      <Wifi class="h-4 w-4 text-primary" />
      Network
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Network Interface</div>
        <div class="text-sm font-medium text-foreground">
          {deviceInformation?.network_interface || '—'}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">WiFi SSID</div>
        <div class="text-sm font-medium text-foreground">
          {deviceInformation?.wifi_ssid || '—'}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Signal Strength</div>
        <div class="text-sm font-medium text-foreground">
          {#if deviceInformation?.signal_strength_dbm}
            {@const signal = getSignalBadge(deviceInformation.signal_strength_dbm)}
            <div class="flex items-center gap-2">
              <span class="font-mono">{deviceInformation.signal_strength_dbm} dBm</span>
              <Badge variant={signal.variant} class="text-xs py-0 px-1.5">{signal.text}</Badge>
            </div>
          {:else}
            <span class="text-muted-foreground">—</span>
          {/if}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1.5">
          <Globe class="h-3 w-3" />
          Public IP
        </div>
        <div class="text-sm font-mono text-foreground">
          {deviceInformation?.public_ip || '—'}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Private IP</div>
        <div class="text-sm font-mono text-foreground">
          {deviceInformation?.private_ip || device.ipAddress || '—'}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">WiFi MAC</div>
        <div class="text-sm font-mono text-foreground">
          {deviceInformation?.mac_wifi || device.wifiMac || '—'}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">LAN MAC</div>
        <div class="text-sm font-mono text-foreground">
          {deviceInformation?.mac_lan || device.lanMac || '—'}
        </div>
      </div>
      <div>
        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Primary MAC</div>
        <div class="text-sm font-mono text-foreground">
          {device.macAddress || '—'}
        </div>
      </div>
    </div>
  </div>
</div>


