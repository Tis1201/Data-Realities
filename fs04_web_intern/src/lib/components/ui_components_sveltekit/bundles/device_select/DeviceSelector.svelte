<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  // Remove URL-coupled stores; keep selector state internal
  import { Button } from '$lib/components/ui/button';
  import { X } from 'lucide-svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { writable } from 'svelte/store';
  import { browser } from '$app/environment';
  // No navigation side-effects for internal pagination
  import { toast } from 'svelte-sonner';
  import DeviceTable from "./table.svelte";
  // Remove URL-mutating utilities; handle sort/pagination locally
  import { Skeleton } from '$lib/components/ui/skeleton';
  import Pagination from "$lib/components/ui_components_sveltekit/table/pagination/Pagination.svelte";
  import type { DeviceTag } from '@prisma/client';

  interface TableMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  }
  
  interface TableData {
    records: Device[];
    availableTags: DeviceTag[];
    pagination: {
      page: number;
      per_page: number;
      total_records: number;
      total_pages: number;
    };
    sort: {
      field: string;
      order: 'asc' | 'desc';
    };
    loading: boolean;
  }
  
  interface ApiResponse {
    devices: Device[];
    meta: TableMeta;
  }

  interface Device {
    id: string;
    name: string;
    status: string;
    model?: string;
    description?: string;
    createdAt?: string;
    lastUsedAt?: string;
    connected?: boolean;
    macAddress?: string;
    wifiMac?: string;
    lanMac?: string;
  }

export let bundleId: string;
export let apiPrefix: string = '/api/admin'; // Configurable API prefix
export let devicesEndpoint: string | null = null; // Standalone endpoint for non-bundle context
export let excludeDeviceIds: string[] = [];
  
  // Table data
  let tableData: TableData = {
    records: [],
    availableTags: [],
    pagination: {
      page: 1,
      per_page: 5,
      total_records: 0,
      total_pages: 1
    },
    sort: {
      field: 'name',
      order: 'asc'
    },
    loading: false
  };
  
  // Local table state (decoupled from URL)
  let currentPage = 1;
  let perPage = 5;
  let sortField: keyof Device | 'lastUsedAt' | 'name' | 'status' = 'name';
  let sortOrder: 'asc' | 'desc' = 'asc';
  let filterSearch: string = '';
  let filterStatus: string | null = null;
  let filterTag: string | null = null;
  let controller: AbortController | null = null;
  let deviceTableRef: any; // Reference to the DeviceTable component

  // Track if we've already loaded for this modal session
  let hasLoadedForSession = false;

  // Load when dialog opens
  $: if (browser && open && !hasLoadedForSession) {
    // Reset filters when opening modal
    filterSearch = '';
    filterStatus = null;
    filterTag = null;
    
    // Ensure valid page; do not reset perPage so user choice persists
    if (currentPage < 1) currentPage = 1;
    console.log('[DeviceSelector] Modal opened, currentPage:', currentPage, 'perPage:', perPage);
    
    // Reset the table's internal filter state if available
    if (deviceTableRef && deviceTableRef.resetFilters) {
      deviceTableRef.resetFilters();
    }
    
    console.log('[DeviceSelector] Device status updates handled automatically via MQTT');
    
    hasLoadedForSession = true;
    loadDevices();
  }
  
  // Reset session flag when modal closes
  $: if (!open) {
    hasLoadedForSession = false;
  }
  
// Initialize data loading when component mounts
    onMount(() => {
        // Only load bundle tags when in bundle mode
        if (!devicesEndpoint) {
            loadAvailableTags();
        }
    });

  async function loadAvailableTags() {
    try {
        const apiUrl = `${apiPrefix}/iot/bundles/${bundleId}/device_tags`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        tableData.availableTags = data.availableTags;
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return;
      console.error('[DeviceSelector] Failed to load device tags:', error);
      toast.error('Failed to load device tags. Please try again.');
    }
  }
  
  async function loadDevices() {
    try {
      console.log('[DeviceSelector] Loading devices...', { currentPage, perPage, sortField, sortOrder, filterSearch, filterStatus, filterTag });
      
      // Set loading state
      tableData = {
        ...tableData,
        loading: true
      };
      
      // Build params from local state only
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('per_page', String(perPage));
      params.append('sort', sortField);
      params.append('order', sortOrder);
      if (filterSearch) params.append('search', filterSearch);
      if (filterStatus) params.append('status', filterStatus);
      if (filterTag) params.append('tag', filterTag);
      if (excludeDeviceIds && excludeDeviceIds.length) params.append('excludeDeviceIds', excludeDeviceIds.join(','));
      
      // Make the API request
      const apiUrl = devicesEndpoint
        ? `${devicesEndpoint}?${params}`
        : `${apiPrefix}/iot/bundles/${bundleId}/components/device_select?${params}`;
      console.log('[DeviceSelector] Fetching from:', apiUrl);
      // Abort previous in-flight request to keep UI responsive
      if (controller) controller.abort();
      controller = new AbortController();
      const response = await fetch(apiUrl, { signal: controller.signal });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const raw = await response.json();
      console.log('[DeviceSelector] API response:', raw);
      
      // Parse response - handle both v2 API structure and old structure
      let devices: Device[] = [];
      let responsePage = currentPage;
      let responsePerPage = perPage;
      let responseTotal = 0;
      let responseLastPage = 1;
      
      if (devicesEndpoint) {
        // V2 API structure: { success, data: { devices, meta }, meta }
        devices = raw?.data?.devices || raw?.devices || [];
        const meta = raw?.data?.meta || raw?.meta;
        responsePage = meta?.current_page || meta?.page || currentPage;
        responsePerPage = meta?.per_page || meta?.pageSize || perPage;
        responseTotal = meta?.total || meta?.totalItems || 0;
        responseLastPage = meta?.last_page || meta?.totalPages || 1;
      } else {
        // Old API structure: { devices, meta }
        devices = raw?.devices || [];
        responsePage = raw.meta?.current_page || currentPage;
        responsePerPage = raw.meta?.per_page || perPage;
        responseTotal = raw.meta?.total || 0;
        responseLastPage = raw.meta?.last_page || 1;
      }
      
      console.log('[DeviceSelector] Pagination response:', {
        requestedPage: currentPage,
        responsePage,
        responsePerPage,
        responseTotal,
        responseLastPage,
        recordsCount: devices?.length || 0
      });
      
      // Update table data with the response following standard pattern
      tableData = {
        ...tableData,
        loading: false,
        records: devices,
        pagination: {
          page: responsePage,
          per_page: responsePerPage,
          total_records: responseTotal,
          total_pages: responseLastPage
        },
        sort: {
          field: sortField,
          order: sortOrder
        }
      };
      
      console.log('[DeviceSelector] Final table data:', {
        recordsCount: tableData.records.length,
        pagination: tableData.pagination,
        loading: tableData.loading
      });
      
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return;
      console.error('[DeviceSelector] Failed to load devices:', error);
      toast.error('Failed to load devices. Please try again.');
      tableData = {
        ...tableData,
        loading: false
      };
    }
  }
  
  export let open = false;
  
  let loading = false;
  let selectedDevices: Device[] = [];
  
  // Define events
  const dispatch = createEventDispatcher<{
    select: { id: string; name: string }[];
    close: void;
  }>();
  
  // Handle row click - toggle selection
  function handleRowClick(device: Device) {
    console.log('[DeviceSelector] row clicked', device?.id, device?.name);
    const existingIndex = selectedDevices.findIndex(d => d.id === device.id);
    if (existingIndex >= 0) {
      console.log('[DeviceSelector] unselect device', device?.id);
      selectedDevices = selectedDevices.filter(d => d.id !== device.id);
    } else {
      console.log('[DeviceSelector] select device', device?.id);
      selectedDevices = [...selectedDevices, device];
    }
    console.log('[DeviceSelector] selected count:', selectedDevices.length);
  }

  function handleToggleSelectAllClick() {
    console.log('[DeviceSelector] toggle select all clicked');
    const allCurrentPageSelected = tableData.records.length > 0 && tableData.records.every((d) => selectedDevices.some(selected => selected.id === d.id));
    
    if (allCurrentPageSelected) {
      // If all current page items are selected, deselect only current page items
      const currentPageIds = tableData.records.map(d => d.id);
      selectedDevices = selectedDevices.filter(d => !currentPageIds.includes(d.id));
    } else {
      // If not all current page items are selected, add all current page items to selection
      const currentPageIds = tableData.records.map(d => d.id);
      const newSelections = tableData.records.filter(d => !selectedDevices.some(selected => selected.id === d.id));
      selectedDevices = [...selectedDevices, ...newSelections];
    }
  }
  
  // Use standard table sort handler
  function handleTableSort(event: CustomEvent<{ field: string; order: 'asc'|'desc' }>) {
    console.log('[DeviceSelector] sort event', event.detail);
    sortField = event.detail.field as any;
    sortOrder = event.detail.order;
    currentPage = 1;
    loadDevices();
  }
  
  // Use standard table pagination handler
  function handleTablePagination(event: CustomEvent<{ page: number; per_page: number }>) {
    console.log('[DeviceSelector] pagination event', event.detail);
    currentPage = event.detail.page;
    perPage = event.detail.per_page;
    console.log('[DeviceSelector] Updated pagination state:', { currentPage, perPage });
    loadDevices();
  }

  function handleTableFilter(event: CustomEvent<{ search?: string; status?: string | null, tag?: string | null }>) {
    console.log('[DeviceSelector] filter event', event.detail);
    filterSearch = event.detail.search ?? '';
    filterStatus = event.detail.status ?? null;
    filterTag = event.detail.tag ?? null;
    currentPage = 1;
    loadDevices();
  }
  
  // Handle confirm button click
  function handleConfirm() {
    console.log('[DeviceSelector] confirm clicked, selected:', selectedDevices.map(d => d.id));
    if (selectedDevices.length > 0) {
      // Store the count before clearing
      const selectedCount = selectedDevices.length;
      
      // Dispatch select event with the selected devices
      dispatch('select', selectedDevices.map(device => ({ 
        id: device.id,
        name: device.name
      })));
      
      // Check if we need to adjust pagination after removing items
      const currentTotalRecords = tableData.pagination.total_records;
      const remainingRecords = currentTotalRecords - selectedCount;
      
      console.log('[DeviceSelector] Pagination adjustment:', {
        currentTotalRecords,
        selectedCount,
        remainingRecords,
        currentPage,
        perPage: 5, // DeviceSelector uses fixed perPage
        maxPage: Math.ceil(remainingRecords / 5)
      });
      
      // Calculate if current page is still valid
      const maxPage = Math.ceil(remainingRecords / 5);
      if (currentPage > maxPage && maxPage > 0) {
        // If current page is beyond the new max page, go to the last valid page
        console.log('[DeviceSelector] Adjusted currentPage to maxPage:', maxPage);
        currentPage = maxPage;
      } else if (currentPage < 1) {
        // Ensure we don't go below page 1
        currentPage = 1;
        console.log('[DeviceSelector] Adjusted currentPage to 1:', currentPage);
      }
      
      // Clear local selection AFTER pagination adjustment
      selectedDevices = [];
      
      // Reload the list with adjusted pagination
      loadDevices();
      
      // Close the dialog
      handleClose();
    }
  }
  
  // Handle cancel button click
  function handleCancel() {
    open = false;
    selectedDevices = [];
    dispatch('close');
  }
  
  // Handle dialog close
  function handleClose() {
    // Reset filters when closing modal
    filterSearch = '';
    filterStatus = null;
    filterTag = null;
    currentPage = 1;
    hasLoadedForSession = false;
    
    // Reset the table's internal filter state
    if (deviceTableRef && deviceTableRef.resetFilters) {
      deviceTableRef.resetFilters();
    }
    
    open = false;
    selectedDevices = [];
    dispatch('close');
  }
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && handleClose()}>
  <Dialog.Content class="sm:max-w-4xl">
    <Dialog.Header>
      <Dialog.Title>Select Devices</Dialog.Title>
      <Dialog.Description>
        Choose devices to add to the bundle (click to select/deselect)
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      <!-- Selected Devices Review Section - Fixed height to prevent UI jumping -->
      <div class="border rounded-md bg-muted/30 h-[160px] overflow-hidden">
        <div class="p-4 border-b bg-background/50">
          <h4 class="font-medium text-sm">
            Selected Devices 
            <span class="text-muted-foreground">({selectedDevices.length})</span>
          </h4>
        </div>
        <div class="p-4 h-[120px] overflow-y-auto">
          {#if selectedDevices.length === 0}
            <p class="text-sm text-muted-foreground">No devices selected</p>
          {:else}
            <div class="flex flex-wrap gap-2">
              {#each selectedDevices as device}
                <div class="flex items-center gap-2 bg-background border rounded-md px-3 py-1 text-sm">
                  <span>{device.name}</span>
                  <button 
                    type="button"
                    class="text-muted-foreground hover:text-destructive"
                    on:click={() => handleRowClick(device)}
                  >
                    ✕
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Available Devices Section -->
      <div>
        <h4 class="font-medium mb-3">Available Devices</h4>
        <div class="border rounded-md overflow-hidden">
            <DeviceTable
              bind:this={deviceTableRef}
              props={{
                records: tableData.records,
                pagination: tableData.pagination,
                sort: tableData.sort,
                loading: tableData.loading,
                availableTags: tableData.availableTags,
                selectedDeviceIds: selectedDevices.map(d => d.id)
              }}
              on:rowClick={({ detail }) => {
                if (detail) {
                  handleRowClick(detail);
                }
              }}
              on:toggleSelectAllClick={() => {
                handleToggleSelectAllClick();
              }}
              on:sort={handleTableSort}
              on:pagination={handleTablePagination}
              on:filter={handleTableFilter}
            />
            
            <!-- Pagination Controls - Always visible outside of scrollable area -->
            <div class="p-4 border-t bg-background">
                <Pagination pagination={tableData.pagination} emitOnly={true} on:change={handleTablePagination} />
            </div>
        </div>
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" on:click={handleClose}>
        Cancel
      </Button>
      <Button 
        on:click={handleConfirm} 
        disabled={selectedDevices.length === 0}
        class="ml-2"
      >
        Select
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
