<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Terminal, Monitor, Camera, RotateCcw, Upload, FileText, Loader2, Package, Download, Upload as UploadIcon, Power } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import type { Writable } from 'svelte/store';

  export let device: any;
  export let isLoading: Writable<boolean>;
  export let actionStatus: Writable<{ action: string; status: string; message: string }>;
  export let onSnapshot: () => void;
  export let onRestart: () => void;
  export let onReboot: () => void;
  export let onOpenFirmwareModal: () => void;
  export let onOpenInstallAppModal: () => void;
  export let onOpenPullFileModal: () => void;
  export let onOpenPushFileModal: () => void;
  export let onViewLogs: () => void;
  export let onTerminal: (() => void) | undefined = undefined;
  export let onRemoteDesktop: (() => void) | undefined = undefined;
</script>

<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 place-items-center">
  <Button variant="outline" class="flex flex-col items-center justify-center h-16 w-full space-y-1 p-2" on:click={() => (onTerminal ? onTerminal() : goto(`/admin/iot/devices/${device.id}/terminal`))}>
    <Terminal class="h-5 w-5" />
    <span class="text-xs">Terminal</span>
  </Button>

  <Button variant="outline" class="flex flex-col items-center justify-center h-16 w-full space-y-1 p-2" on:click={() => (onRemoteDesktop ? onRemoteDesktop() : goto(`/admin/iot/devices/${device.id}/rdp`))}>
    <Monitor class="h-5 w-5" />
    <span class="text-xs">Remote Desktop</span>
  </Button>

  <Button variant="outline" class="flex flex-col items-center justify-center h-16 w-full space-y-1 p-2" on:click={onSnapshot} disabled={$isLoading && $actionStatus.action === 'snapshot'}>
    {#if $isLoading && $actionStatus.action === 'snapshot'}
      <Loader2 class="h-5 w-5 animate-spin" />
    {:else}
      <Camera class="h-5 w-5" />
    {/if}
    <span class="text-xs">Snapshot</span>
  </Button>

  <Button variant="outline" class="flex flex-col items-center justify-center h-16 w-full space-y-1 p-2" on:click={onRestart} disabled={$isLoading && $actionStatus.action === 'refresh'}>
    {#if $isLoading && $actionStatus.action === 'refresh'}
      <Loader2 class="h-5 w-5 animate-spin" />
    {:else}
      <RotateCcw class="h-5 w-5" />
    {/if}
    <span class="text-xs">Refresh</span>
  </Button>

  <Button variant="outline" class="flex flex-col items-center justify-center h-16 w-full space-y-1 p-2" on:click={onReboot} disabled={$isLoading && $actionStatus.action === 'reboot'}>
    {#if $isLoading && $actionStatus.action === 'reboot'}
      <Loader2 class="h-5 w-5 animate-spin" />
    {:else}
      <Power class="h-5 w-5" />
    {/if}
    <span class="text-xs">Reboot</span>
  </Button>

  <Button variant="outline" class="flex flex-col items-center justify-center h-16 w-full space-y-1 p-2" on:click={onOpenInstallAppModal} disabled={$isLoading && $actionStatus.action === 'installApp'}>
    {#if $isLoading && $actionStatus.action === 'installApp'}
      <Loader2 class="h-5 w-5 animate-spin" />
    {:else}
      <Package class="h-5 w-5" />
    {/if}
    <span class="text-xs">Install App</span>
  </Button>

  <Button variant="outline" class="flex flex-col items-center justify-center h-16 w-full space-y-1 p-2" on:click={onOpenPullFileModal} disabled={$isLoading && $actionStatus.action === 'pushFile'}>
    {#if $isLoading && $actionStatus.action === 'pushFile'}
      <Loader2 class="h-5 w-5 animate-spin" />
    {:else}
      <UploadIcon class="h-5 w-5" />
    {/if}
    <span class="text-xs">Push File</span>
  </Button>

  <Button variant="outline" class="flex flex-col items-center justify-center h-16 w-full space-y-1 p-2" on:click={onOpenPushFileModal} disabled={$isLoading && $actionStatus.action === 'pullFile'}>
    {#if $isLoading && $actionStatus.action === 'pullFile'}
      <Loader2 class="h-5 w-5 animate-spin" />
    {:else}
      <Download class="h-5 w-5" />
    {/if}
    <span class="text-xs">Pull File</span>
  </Button>

  <Button variant="outline" class="flex flex-col items-center justify-center h-16 w-full space-y-1 p-2" on:click={onOpenFirmwareModal} disabled={$isLoading && $actionStatus.action === 'firmware'}>
    {#if $isLoading && $actionStatus.action === 'firmware'}
      <Loader2 class="h-5 w-5 animate-spin" />
    {:else}
      <Upload class="h-5 w-5" />
    {/if}
    <span class="text-xs">Update Firmware</span>
  </Button>

  <Button variant="outline" class="flex flex-col items-center justify-center h-16 w-full space-y-1 p-2" on:click={onViewLogs} disabled={$isLoading && $actionStatus.action === 'logs'}>
    {#if $isLoading && $actionStatus.action === 'logs'}
      <Loader2 class="h-5 w-5 animate-spin" />
    {:else}
      <FileText class="h-5 w-5" />
    {/if}
    <span class="text-xs">View Logs</span>
  </Button>
</div>


