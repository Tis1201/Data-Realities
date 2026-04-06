<script lang="ts">
    import { toast } from 'svelte-sonner';
    import { api_post, api_delete } from '$lib/utils/ApiUtils';
    import { invalidate , goto } from '$app/navigation';
    
    import { Button } from "$lib/components/ui/button";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { Trash, Plus, Tag, Wifi, WifiOff, Info, ArrowUpDown, Filter, Check, X } from 'lucide-svelte';
    import RelativeDate from "$lib/components/ui_components_sveltekit/date/RelativeDate.svelte";
    import RecordDeleteDialog from "$lib/components/ui_components_sveltekit/dialog/RecordDeleteDialog.svelte";
    import { Skeleton } from "$lib/components/ui/skeleton";
    import { Input } from "$lib/components/ui/input";
    import { Search } from "lucide-svelte";
    
    import type { DeviceTag, Device } from "@prisma/client";
    import DeviceTagSelector from "../device_tag_select/DeviceTagSelector.svelte";
    
    export let deviceId: string;
    export let deviceTags: DeviceTag[] = [];
    export let loading = false;
    export let apiPrefix: string = '/api/admin'; // Configurable API prefix
    export let deviceTagLinkPrefix: string = '/admin/iot/device_tags'; // Configurable device link prefix
    
    // Use real data from API
    $: displayDeviceTags = deviceTags;
    
    // Filter state
    let searchTerm = '';

    // Apply search
    $: filteredDeviceTags = displayDeviceTags.filter(d =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sorting functionality
    let sortField = 'name';
    let sortOrder: 'asc' | 'desc' = 'asc';
    
    function toggleSort(field: string) {
        if (sortField === field) {
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            sortField = field;
            sortOrder = 'asc';
        }
    }
    
    $: sortedDeviceTags = [...filteredDeviceTags].sort((a, b) => {
        let valA, valB;
        
        if (sortField === 'name') {
            valA = a.name;
            valB = b.name;
        } else if (sortField === 'createdAt') {
            valA = a.createdAt;
            valB = b.createdAt;
            // For dates, we need to compare timestamps
            return sortOrder === 'asc' ? 
                new Date(valA).getTime() - new Date(valB).getTime() : 
                new Date(valB).getTime() - new Date(valA).getTime();
        } else if (sortField === 'updatedAt') {
            valA = a.updatedAt;
            valB = b.updatedAt;
            // For dates, we need to compare timestamps
            return sortOrder === 'asc' ? 
                new Date(valA).getTime() - new Date(valB).getTime() : 
                new Date(valB).getTime() - new Date(valA).getTime();
        }
        
        // For strings, use localeCompare
        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortOrder === 'asc' ? 
                valA.localeCompare(valB) : 
                valB.localeCompare(valA);
        }
        
        return 0;
    });
    // Pagination state
    let pageNumber = 1;
    let pageSize: 5 | 10 | 20 | 50 = 10;
    $: totalItems = sortedDeviceTags.length;
    $: totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    $: pageNumber = Math.min(Math.max(1, pageNumber), totalPages);
    $: pageStartIndex = (pageNumber - 1) * pageSize;
    $: pageEndIndex = Math.min(pageStartIndex + pageSize, totalItems);
    $: pagedDeviceTags = sortedDeviceTags.slice(pageStartIndex, pageEndIndex);
    function goPrevPage() { if (pageNumber > 1) pageNumber -= 1; }
    function goNextPage() { if (pageNumber < totalPages) pageNumber += 1; }
    function onPageSizeChange(e: Event) {
        const v = Number((e.target as HTMLSelectElement).value) as 5 | 10 | 20 | 50;
        pageSize = v;
        pageNumber = 1;
    }
    
    // State for add device dialog
    let addDialogOpen = false;
    let addingDeviceTag = false;

  // Selection state for batch actions
  let selectedIds: string[] = [];
  $: allSelected = sortedDeviceTags.length > 0 && sortedDeviceTags.every((d) => selectedIds.includes(d.id));

  function toggleSelectAll() {
    if (allSelected) {
      selectedIds = [];
    } else {
      selectedIds = sortedDeviceTags.map((d) => d.id);
    }
  }

  function toggleRowSelection(deviceTagId: string) {
    if (selectedIds.includes(deviceTagId)) {
      selectedIds = selectedIds.filter((id) => id !== deviceTagId);
    } else {
      selectedIds = [...selectedIds, deviceTagId];
    }
  }

  function confirmBatchDelete() {
    if (selectedIds.length === 0) return;
    batchDeleteDialogState.confirmationOpen = true;
  }
  
  async function handleBatchDeleteConfirm() {
    if (selectedIds.length === 0) return;
    
    // Close dialog before async to avoid UI lag
    batchDeleteDialogState.confirmationOpen = false;
    
    try {
      const promises = selectedIds.map((deviceTagId) =>
        api_delete(`${apiPrefix}/iot/devices/${deviceId}/deviceTags/${deviceTagId}`, deviceTagId)
      );
      await Promise.all(promises);
      toast.success(`Removed ${selectedIds.length} device tag(s) from device`);
      selectedIds = [];
      await invalidate('app:device');
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove selected device tags');
    }
  }
    
    // State for delete confirmation dialog
    let deleteDialogState = {
        selectedRecord: null as DeviceTag | null,
        confirmationOpen: false,
        title: "Remove Device Tag",
        message: "Are you sure you want to remove this device tag from the device? This action cannot be undone.",
        confirmButtonText: "Remove",
        cancelButtonText: "Cancel"
    };
    
    // State for batch delete confirmation dialog
    let batchDeleteDialogState = {
        selectedRecord: null as DeviceTag | null,
        confirmationOpen: false,
        title: "Remove Selected Device Tags",
        message: "Are you sure you want to remove the selected device tags from this device? This action cannot be undone.",
        confirmButtonText: "Remove All",
        cancelButtonText: "Cancel"
    };
    
    // Function to open delete confirmation dialog
    function confirmDelete(deviceTag: DeviceTag) {
        deleteDialogState.selectedRecord = deviceTag;
        deleteDialogState.confirmationOpen = true;
    }
    
    // Handle delete confirmation
    async function handleDeleteConfirm() {
        if (!deleteDialogState.selectedRecord) return;
        
        try {
            await api_delete(`${apiPrefix}/iot/devices/${deviceId}/deviceTags/${deleteDialogState.selectedRecord.id}`,
                deleteDialogState.selectedRecord.id);
            toast.success("Device tag removed from device successfully");
            await invalidate('app:device');
        } catch (error) {
            toast.error("Failed to remove device tag from device");
            console.error(error);
        } finally {
            deleteDialogState.confirmationOpen = false;
            deleteDialogState.selectedRecord = null;
        }
    }
    
    // Handle device tag selection from DeviceTagSelector
    async function handleDeviceTagSelect(event: CustomEvent<{ id: string; name: string }[]>) {
        const deviceTags = event.detail;
        if (!deviceTags || deviceTags.length === 0) return;
        
        addingDeviceTag = true;
        
        try {
            // Add multiple device tags
            const promises = deviceTags.map(deviceTag => 
                api_post(`${apiPrefix}/iot/devices/${deviceId}/deviceTags`, {
                    deviceTagId: deviceTag.id
                })
            );
            
            await Promise.all(promises);
            
            toast.success(`Added ${deviceTags.length} device tag${deviceTags.length !== 1 ? 's' : ''} to device`);
            await invalidate('app:device');
            
            // Reset form and close dialog
            addDialogOpen = false;
            
        } catch (error) {
            toast.error("Failed to add device tags to device");
            console.error(error);
        } finally {
            addingDeviceTag = false;
        }
    }
</script>

<!-- Device Tags Controls (count + add) -->
<div class="flex justify-between items-center mb-2">
    <div>
        <p class="text-sm text-muted-foreground">{filteredDeviceTags.length} device tag{filteredDeviceTags.length !== 1 ? 's' : ''} in this device</p>
    </div>
</div>

  {#if selectedIds.length > 0}
    <div class="flex items-center justify-between mb-3 p-2 border rounded-md bg-muted/40">
      <div class="text-sm">{selectedIds.length} selected</div>
      <div class="flex items-center gap-2">
        <Button variant="destructive" size="sm" on:click={confirmBatchDelete}>Remove Selected</Button>
      </div>
    </div>
  {/if}

<!-- Device Tag Selector Dialog -->
<DeviceTagSelector 
    bind:open={addDialogOpen}
    {deviceId}
    apiPrefix={apiPrefix}
    on:select={handleDeviceTagSelect}
    on:close={() => addDialogOpen = false}
/>

<!-- Delete Confirmation Dialog -->
<RecordDeleteDialog
    state={deleteDialogState}
    onConfirm={handleDeleteConfirm}
    useFormSubmission={false}
    getDescription={(record) => `Are you sure you want to remove ${record?.name || 'this device tag'} from the device? This action cannot be undone.`}
/>

<!-- Batch Delete Confirmation Dialog -->
<RecordDeleteDialog
    state={batchDeleteDialogState}
    onConfirm={handleBatchDeleteConfirm}
    useFormSubmission={false}
    getDescription={() => `Are you sure you want to remove ${selectedIds.length} selected device tag${selectedIds.length !== 1 ? 's' : ''} from the device? This action cannot be undone.`}
/>

<!-- Device Tag List Table -->
<!-- <div class="w-full mt-1 border rounded-md overflow-hidden"> -->
    {#if loading}
        <div class="space-y-2 p-4">
            <Skeleton class="h-8 w-full" />
            <Skeleton class="h-8 w-full" />
            <Skeleton class="h-8 w-full" />
        </div>
    {:else}
        <div class="flex justify-between items-center mb-4">
            <div class="relative w-72">
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    type="search" 
                    placeholder="Search tags..." 
                    class="pl-8 w-full" 
                    bind:value={searchTerm}
                />
            </div>
            <div class="flex items-center gap-2">
                <div class="flex items-center gap-2">
                    <label for="page-size" class="text-sm text-muted-foreground">Rows</label>
                    <select id="page-size" class="h-8 border rounded-md px-2 text-sm" on:change={onPageSizeChange} bind:value={pageSize}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                <Button on:click={() => addDialogOpen = true} variant="outline" class="flex items-center gap-1">
                    <Plus class="h-4 w-4 mr-2" />
                    Add Device Tag
                </Button>
            </div>
        </div>

        <table class="w-full border-collapse">
            <thead>
                <tr class="border-b bg-muted/50">
                <th class="text-left py-2 px-4 font-medium text-sm w-10">
                <button type="button" class="inline-flex" on:click|stopPropagation={toggleSelectAll} aria-label="Select all">
                  <Checkbox checked={allSelected} aria-label="Select all" />
                </button>
              </th>
                    <th class="text-left py-2 px-4 font-medium text-sm">
                        <button 
                            class="flex items-center space-x-1 hover:text-primary" 
                            on:click={() => toggleSort('name')}
                        >
                            <span>Device Tag</span>
                            <ArrowUpDown class="h-3.5 w-3.5" />
                        </button>
                    </th>
                    <th class="text-left py-2 px-4 font-medium text-sm">
                        <button 
                            class="flex items-center space-x-1 hover:text-primary" 
                            on:click={() => toggleSort('createdAt')}
                        >
                            <span>Added</span>
                            <ArrowUpDown class="h-3.5 w-3.5" />
                        </button>
                    </th>
                    <th class="text-right py-2 px-4 font-medium text-sm">Actions</th>
                </tr>
            </thead>
            <tbody>
                {#if sortedDeviceTags.length === 0}
                    <tr>
                        <td colspan="6" class="py-8 text-center text-muted-foreground">
                            {#if searchTerm}
                                <div class="flex flex-col items-center">
                                    <Search class="h-8 w-8 mb-2 opacity-50" />
                                    <p class="text-sm">No device tags match your search</p>
                                </div>
                            {:else}
                                <div class="flex flex-col items-center">
                                    <Tag class="h-8 w-8 mb-2 opacity-50" />
                                    <p class="text-sm font-medium mb-1">No device tags added yet</p>
                                    <p class="text-xs text-muted-foreground">Add device tags to this device</p>
                                </div>
                            {/if}
                        </td>
                    </tr>
                {:else}
                    {#each pagedDeviceTags as deviceTag}
                        <tr class="border-b hover:bg-muted/50">
                            <td class="py-3 px-4 w-10">
                                <button type="button" class="inline-flex" on:click|stopPropagation={() => toggleRowSelection(deviceTag.id)} aria-label={`Select ${deviceTag.name}`}>
                                    <Checkbox checked={selectedIds.includes(deviceTag.id)} />
                                </button>
                            </td>
                            <td class="py-3 px-4">
                                <div class="flex items-center">
                                    <Tag class="h-4 w-4 mr-2 text-muted-foreground" />
                                    <a href={`${deviceTagLinkPrefix}/${deviceTag.id}`} class="hover:underline">{deviceTag.name}</a>
                                </div>
                            </td>
                            <td class="py-3 px-4">
                                <RelativeDate date={deviceTag.createdAt} />
                            </td>
                            <td class="py-3 px-4 text-right">
                                <div class="flex justify-end space-x-1">
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        title="View Details"
                                        on:click={() => goto(`${deviceTagLinkPrefix}/${deviceTag.id}`)}
                                    >
                                        <Info class="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        title="Remove Device"
                                        on:click={() => confirmDelete(deviceTag)}
                                    >
                                        <Trash class="h-4 w-4" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                {/if}
            </tbody>
        </table>
        <div class="flex items-center justify-between mt-2">
            <div class="text-sm text-muted-foreground">
                {totalItems === 0
                    ? '0 of 0'
                    : `${pageStartIndex + 1}\t-\t${pageEndIndex} of ${totalItems}`}
            </div>
            <div class="flex items-center gap-2">
                <Button variant="outline" size="sm" on:click={goPrevPage} disabled={pageNumber <= 1}>Prev</Button>
                <div class="text-sm text-muted-foreground">Page {pageNumber} / {totalPages}</div>
                <Button variant="outline" size="sm" on:click={goNextPage} disabled={pageNumber >= totalPages}>Next</Button>
            </div>
        </div>
    {/if}
<!-- </div> -->
