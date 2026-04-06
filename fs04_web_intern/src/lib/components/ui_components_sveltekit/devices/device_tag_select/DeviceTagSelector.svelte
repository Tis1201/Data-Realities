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
  import DeviceTagTable from "./table.svelte";
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
    records: ConvertedDeviceTag[];
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
    deviceTags: DeviceTag[];
    meta: TableMeta;
  }

  interface ConvertedDeviceTag {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  }


  export let deviceId: string;
  export let apiPrefix: string = '/api/admin'; // Configurable API prefix
  
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
  let sortField: keyof DeviceTag | 'name' = 'name';
  let sortOrder: 'asc' | 'desc' = 'asc';
  let filterSearch: string = '';
  let controller: AbortController | null = null;
  let deviceTagTableRef: any; // Reference to the DeviceTagTable component

  // Track if modal was just opened to avoid resetting during pagination
  let modalJustOpened = false;
  
  // Load when dialog opens
  $: if (browser && open && !modalJustOpened) {
    modalJustOpened = true;
    // Reset filters when opening modal
    filterSearch = '';
    
    // Ensure valid page; do not reset perPage so user choice persists
    if (currentPage < 1) currentPage = 1;
    console.log('[DeviceTagSelector] Modal opened, currentPage:', currentPage, 'perPage:', perPage);
    
    // Reset the table's internal filter state if available
    if (deviceTagTableRef && deviceTagTableRef.resetFilters) {
      deviceTagTableRef.resetFilters();
    }
    
    loadDeviceTags();
  }
  
  // Reset modalJustOpened when modal closes
  $: if (!open) {
    modalJustOpened = false;
  }
  
// Initialize data loading when component mounts
    onMount(() => {
        if (browser && open) {
            loadDeviceTags();
        }
    });
  
  async function loadDeviceTags() {
    try {
      console.log('[DeviceTagSelector] Loading device tags...', { currentPage, perPage, sortField, sortOrder, filterSearch });
      
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
      
      // Make the API request
      const apiUrl = `${apiPrefix}/iot/devices/${deviceId}/components/device_tag_select?${params}`;
      console.log('[DeviceTagSelector] Fetching from:', apiUrl);
      // Abort previous in-flight request to keep UI responsive
      if (controller) controller.abort();
      controller = new AbortController();
      const response = await fetch(apiUrl, { signal: controller.signal });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      console.log('[DeviceTagSelector] API response meta:', data?.meta, 'count:', data?.deviceTags?.length);
      
      // Normalize pagination like other selectors
      const responsePage = data.meta?.current_page || currentPage;
      const responsePerPage = data.meta?.per_page || perPage;
      const responseTotal = data.meta?.total || 0;
      const responseLastPage = data.meta?.last_page || 1;
      console.log('[DeviceTagSelector] Pagination response:', {
        requestedPage: currentPage,
        responsePage,
        responsePerPage,
        responseTotal,
        responseLastPage,
        recordsCount: data.deviceTags?.length || 0
      });
      
      // Update table data with the response following standard pattern
      // Convert Prisma DeviceTag to our interface format
      let convertedRecords: ConvertedDeviceTag[] = [];
      try {
        convertedRecords = (data.deviceTags || []).map(tag => ({
          id: tag.id,
          name: tag.name,
          description: tag.description || undefined,
          createdAt: typeof tag.createdAt === 'string' ? tag.createdAt : tag.createdAt.toISOString(),
          updatedAt: typeof tag.updatedAt === 'string' ? tag.updatedAt : tag.updatedAt.toISOString()
        }));
        console.log('[DeviceTagSelector] Converted records:', convertedRecords.length);
      } catch (conversionError) {
        console.error('[DeviceTagSelector] Error converting records:', conversionError);
        convertedRecords = [];
      }

      tableData = {
        ...tableData,
        loading: false,
        records: convertedRecords,
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
      
      console.log('[DeviceTagSelector] Final table data:', {
        recordsCount: tableData.records.length,
        pagination: tableData.pagination,
        loading: tableData.loading
      });
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return;
      console.error('[DeviceTagSelector] Failed to load device tags:', error);
      toast.error('Failed to load device tags. Please try again.');
      tableData = {
        ...tableData,
        loading: false
      };
    }
  }
  
  export let open = false;
  
  let loading = false;
  let selectedDeviceTags: ConvertedDeviceTag[] = [];
  
  // Define events
  const dispatch = createEventDispatcher<{
    select: { id: string; name: string }[];
    close: void;
  }>();
  
  // Handle row click - toggle selection
  function handleRowClick(deviceTag: ConvertedDeviceTag) {
    console.log('[DeviceTagSelector] row clicked', deviceTag?.id, deviceTag?.name);
    const existingIndex = selectedDeviceTags.findIndex(d => d.id === deviceTag.id);
    if (existingIndex >= 0) {
      console.log('[DeviceTagSelector] unselect device tag', deviceTag?.id);
      selectedDeviceTags = selectedDeviceTags.filter(d => d.id !== deviceTag.id);
    } else {
      console.log('[DeviceTagSelector] select device tag', deviceTag?.id);
      selectedDeviceTags = [...selectedDeviceTags, deviceTag];
    }
    console.log('[DeviceTagSelector] selected count:', selectedDeviceTags.length);
  }

  function handleToggleSelectAllClick() {
    console.log('[DeviceTagSelector] toggle select all clicked');
    const allCurrentPageSelected = tableData.records.length > 0 && tableData.records.every((d) => selectedDeviceTags.some(selected => selected.id === d.id));
    
    if (allCurrentPageSelected) {
      // If all current page items are selected, deselect only current page items
      const currentPageIds = tableData.records.map(d => d.id);
      selectedDeviceTags = selectedDeviceTags.filter(d => !currentPageIds.includes(d.id));
    } else {
      // If not all current page items are selected, add all current page items to selection
      const currentPageIds = tableData.records.map(d => d.id);
      const newSelections = tableData.records.filter(d => !selectedDeviceTags.some(selected => selected.id === d.id));
      selectedDeviceTags = [...selectedDeviceTags, ...newSelections];
    }
  }
  
  // Use standard table sort handler
  function handleTableSort(event: CustomEvent<{ field: string; order: 'asc'|'desc' }>) {
    console.log('[DeviceTagSelector] sort event', event.detail);
    sortField = event.detail.field as any;
    sortOrder = event.detail.order;
    currentPage = 1;
    loadDeviceTags();
  }
  
  // Use standard table pagination handler
  function handleTablePagination(event: CustomEvent<{ page: number; per_page: number }>) {
    console.log('[DeviceTagSelector] pagination event', event.detail);
    currentPage = event.detail.page;
    perPage = event.detail.per_page;
    loadDeviceTags();
  }

  function handleTableFilter(event: CustomEvent<{ search?: string; }>) {
    console.log('[DeviceTagSelector] filter event', event.detail);
    filterSearch = event.detail.search ?? '';
    currentPage = 1;
    loadDeviceTags();
  }
  
  // Handle confirm button click
  function handleConfirm() {
    console.log('[DeviceTagSelector] confirm clicked, selected:', selectedDeviceTags.map(d => d.id));
    if (selectedDeviceTags.length > 0) {
      // Store the count before clearing
      const selectedCount = selectedDeviceTags.length;
      
      // Dispatch select event with the selected device tags
      dispatch('select', selectedDeviceTags.map(deviceTag => ({ 
        id: deviceTag.id,
        name: deviceTag.name
      })));
      
      // Check if we need to adjust pagination after removing items
      const currentTotalRecords = tableData.pagination.total_records;
      const remainingRecords = currentTotalRecords - selectedCount;
      
      console.log('[DeviceTagSelector] Pagination adjustment:', {
        currentTotalRecords,
        selectedCount,
        remainingRecords,
        currentPage,
        perPage,
        maxPage: Math.ceil(remainingRecords / perPage)
      });
      
      // Calculate if current page is still valid
      const maxPage = Math.ceil(remainingRecords / perPage);
      if (currentPage > maxPage && maxPage > 0) {
        // If current page is beyond the new max page, go to the last valid page
        console.log('[DeviceTagSelector] Adjusted currentPage to maxPage:', maxPage);
        currentPage = maxPage;
      } else if (currentPage < 1) {
        // Ensure we don't go below page 1
        currentPage = 1;
        console.log('[DeviceTagSelector] Adjusted currentPage to 1:', currentPage);
      }
      
      // Clear local selection AFTER pagination adjustment
      selectedDeviceTags = [];
      
      // Reload the list with adjusted pagination
      loadDeviceTags();
      
      // Close the dialog
      handleClose();
    }
  }
  
  // Handle cancel button click
  function handleCancel() {
    open = false;
    selectedDeviceTags = [];
    dispatch('close');
  }
  
  // Handle dialog close
  function handleClose() {
    // Reset filters when closing modal
    filterSearch = '';
    currentPage = 1;
    
    // Reset the table's internal filter state
    if (deviceTagTableRef && deviceTagTableRef.resetFilters) {
      deviceTagTableRef.resetFilters();
    }
    
    open = false;
    selectedDeviceTags = [];
    dispatch('close');
  }
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && handleClose()}>
  <Dialog.Content class="sm:max-w-4xl w-full max-w-[95vw] max-h-[65vh] sm:max-h-[90vh] !flex !flex-col overflow-hidden p-0">
    <Dialog.Header class="flex-shrink-0 px-6 pt-6 pb-3">
      <Dialog.Title>Select Device Tags</Dialog.Title>
      <Dialog.Description class="text-sm">
        Choose device tags to add to the device (click to select/deselect)
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-3 flex-1 overflow-y-auto min-h-0 px-6">
      <!-- Selected Device Tags Review Section - Fixed height to prevent UI jumping -->
      <div class="border rounded-md bg-muted/30 h-[100px] sm:h-[140px] md:h-[160px] overflow-hidden flex flex-col flex-shrink-0">
        <div class="p-4 border-b bg-background/50 flex-shrink-0">
          <h4 class="font-medium text-sm">
            Selected Device Tags 
            <span class="text-muted-foreground">({selectedDeviceTags.length})</span>
          </h4>
        </div>
        <div class="p-4 flex-1 overflow-y-auto min-h-0">
          {#if selectedDeviceTags.length === 0}
            <p class="text-sm text-muted-foreground">No device tags selected</p>
          {:else}
            <div class="flex flex-wrap gap-2">
              {#each selectedDeviceTags as deviceTag}
                <div class="flex items-center gap-2 bg-background border rounded-md px-3 py-1 text-sm">
                  <span>{deviceTag.name}</span>
                  <button 
                    type="button"
                    class="text-muted-foreground hover:text-destructive"
                    on:click={() => handleRowClick(deviceTag)}
                  >
                    ✕
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Available Device Tags Section -->
      <div>
        <h4 class="font-medium mb-3">Available Device Tags</h4>
        <div class="border rounded-md overflow-hidden">
            <DeviceTagTable
              bind:this={deviceTagTableRef}
              props={{
                records: tableData.records,
                pagination: tableData.pagination,
                sort: tableData.sort,
                loading: tableData.loading,
                selectedDeviceTagIds: selectedDeviceTags.map(d => d.id)
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
                <Pagination 
                  pagination={tableData.pagination} 
                  emitOnly={true} 
                  on:change={handleTablePagination}
                />
            </div>
        </div>
      </div>
    </div>

    <Dialog.Footer class="flex-shrink-0 border-t pt-3 px-6 pb-4 sm:pb-6 mt-3 sm:mt-4 bg-background">
      <Button variant="outline" on:click={handleClose}>
        Cancel
      </Button>
      <Button 
        on:click={handleConfirm} 
        disabled={selectedDeviceTags.length === 0}
        class="ml-2"
      >
        Select
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
