<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  // Remove URL-coupled store usage; internalize state
  import { Button } from '$lib/components/ui/button';
  import { X } from 'lucide-svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { writable } from 'svelte/store';
  import { browser } from '$app/environment';
  // No navigation side-effects for internal pagination
  import { toast } from 'svelte-sonner';
  import AppTable from "./table.svelte";
  import { Switch } from '$lib/components/ui/switch';
  import { Label } from '$lib/components/ui/label';
  import Pagination from "$lib/components/ui_components_sveltekit/table/pagination/Pagination.svelte";
  import type { Resource } from "@prisma/client";
  // Remove URL-mutating utilities; handle sort/pagination locally
  import { Skeleton } from '$lib/components/ui/skeleton';
  
  interface TableMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  }
  
  interface TableData {
    records: Resource[];
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
    resources: Resource[];
    meta: TableMeta;
  }

  export let bundleId: string;
  export let autoOpen = false;
  export let open = false;
  export let apiPrefix: string = '/api/v2'; // Configurable API prefix
  // Resource mode (fetch from resources endpoint with items/meta)
  export let resourceMode: boolean = false;
  export let resourcesEndpoint: string = '/api/v2/resources/apps';
  // Optional resource filtering inputs
  export let resourceExcludePackages: string[] = [];
  export let resourceRuleId: string | undefined = undefined;
  
  // Table data
  let tableData: TableData = {
    records: [],
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
  let sortField: keyof Resource | 'name' = 'name';
  let sortOrder: 'asc' | 'desc' = 'asc';
  let filterSearch: string = '';
  let filterFormats: string[] = [];
  let controller: AbortController | null = null;
  let appTableRef: any; // Reference to the AppTable component

  // Track if we've already loaded for this modal session
  let hasLoadedForSession = false;
  
  // Load when dialog opens
  $: if (browser && open && !hasLoadedForSession) {
    // Reset filters when opening modal
    filterSearch = '';
    filterFormats = [];
    
    // Only reset page if we don't have a valid current page
    // This prevents overriding pagination adjustments from previous selections
    if (currentPage < 1) {
      currentPage = 1;
    }
    
    console.log('[AppSelector] Modal opened, currentPage:', currentPage, 'perPage:', perPage);
    
    // Reset the table's internal filter state if available
    if (appTableRef && appTableRef.resetFilters) {
      appTableRef.resetFilters();
    }
    
    hasLoadedForSession = true;
    loadApps();
  }
  
  // Reset session flag when modal closes
  $: if (!open) {
    hasLoadedForSession = false;
  }
  
  async function loadApps() {
    try {
      // Set loading state
      tableData = {
        ...tableData,
        loading: true
      };
      
      // Build params from local state only (different param names per mode)
      const params = new URLSearchParams();
      if (resourceMode) {
        params.append('page', String(currentPage));
        params.append('pageSize', String(perPage));
        params.append('sort', (sortField as string) || 'createdAt');
        params.append('order', sortOrder);
        if (filterSearch) params.append('search', filterSearch);
        if (resourceRuleId) params.append('ruleId', resourceRuleId);
        if (resourceExcludePackages && resourceExcludePackages.length) {
          params.append('excludePackages', resourceExcludePackages.join(','));
        }
      } else {
        params.append('page', String(currentPage));
        params.append('per_page', String(perPage));
        params.append('sort', sortField);
        params.append('order', sortOrder);
        if (filterSearch) params.append('search', filterSearch);
        if (filterFormats.length > 0) params.append('formats', filterFormats.join(','));
      }
      
      console.log('[AppSelector] API request params:', Object.fromEntries(params.entries()));
      
      // Make the API request
      // Abort previous in-flight request to keep UI responsive
      if (controller) controller.abort();
      controller = new AbortController();
      const url = resourceMode
        ? `${resourcesEndpoint}?${params}`
        : `${apiPrefix}/iot/bundles/${bundleId}/components/app_select?${params}`;
      const response = await fetch(url, { signal: controller.signal });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const raw = await response.json();
      console.log('[AppSelector] API response:', raw);

      // Normalize depending on mode
      let records: Resource[] = [] as any;
      let responsePage = currentPage;
      let responsePerPage = perPage;
      let responseTotal = 0;
      let responseLastPage = 1;

      if (resourceMode) {
        // V2 API response structure: { success, data: { items, total, page, pageSize, totalPages }, meta }
        records = (raw?.data?.items ?? raw?.items ?? []) as Resource[];
        responsePage = raw?.data?.page ?? raw?.meta?.page ?? currentPage;
        responsePerPage = raw?.data?.pageSize ?? raw?.meta?.pageSize ?? perPage;
        responseTotal = raw?.data?.total ?? raw?.meta?.totalItems ?? 0;
        responseLastPage = raw?.data?.totalPages ?? raw?.meta?.totalPages ?? 1;
      } else {
        const data: ApiResponse = raw;
        records = data.resources || [] as any;
        const meta = data.meta;
        responsePage = meta?.current_page || currentPage;
        responsePerPage = meta?.per_page || perPage;
        responseTotal = meta?.total || 0;
        responseLastPage = meta?.last_page || 1;
      }
      
      console.log('[AppSelector] Pagination response:', {
        requestedPage: currentPage,
        responsePage,
        responsePerPage,
        responseTotal,
        responseLastPage,
        recordsCount: records?.length || 0
      });
      
      tableData = {
        ...tableData,
        loading: false,
        records,
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
      
      console.log('[AppSelector] Final table data pagination:', tableData.pagination);
      
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return;
      console.error('Failed to load apps:', error);
      toast.error('Failed to load apps. Please try again.');
      tableData = {
        ...tableData,
        loading: false
      };
    }
  }
  
  let loading = false;
  let selectedResources: Resource[] = [];
  
  // Define events
  const dispatch = createEventDispatcher<{
    select: { id: string; name: string; packageName?: string | null; autoOpen: boolean }[];
    close: void;
    autoOpenChange: boolean;
  }>();
  
  // Close the dialog
  function closeDialog() {
    open = false;
    selectedResources = [];
    dispatch('close');
    // No URL cleanup necessary; state is internal
  }
  
  // Handle row click - toggle selection
  function handleRowClick(resource: Resource) {
    const idx = selectedResources.findIndex(r => r.id === resource.id);
    if (idx >= 0) {
      selectedResources = selectedResources.filter(r => r.id !== resource.id);
    } else {
      selectedResources = [...selectedResources, resource];
    }
  }
  
  // Handle toggle select all
  function handleToggleSelectAllClick() {
    const allCurrentPageSelected = tableData.records.length > 0 && tableData.records.every((r) => selectedResources.some(selected => selected.id === r.id));
    
    if (allCurrentPageSelected) {
      // If all current page items are selected, deselect only current page items
      const currentPageIds = tableData.records.map(r => r.id);
      selectedResources = selectedResources.filter(r => !currentPageIds.includes(r.id));
    } else {
      // If not all current page items are selected, add all current page items to selection
      const currentPageIds = tableData.records.map(r => r.id);
      const newSelections = tableData.records.filter(r => !selectedResources.some(selected => selected.id === r.id));
      selectedResources = [...selectedResources, ...newSelections];
    }
  }
  
  // Use standard table sort handler
  function handleTableSort(event: CustomEvent<{ field: string; order: 'asc'|'desc' }>) {
    sortField = event.detail.field as any;
    sortOrder = event.detail.order;
    currentPage = 1;
    loadApps();
  }
  
  // Use standard table pagination handler
  function handleTablePagination(event: CustomEvent<{ page: number; per_page: number }>) {
    console.log('[AppSelector] pagination event:', event.detail);
    currentPage = event.detail.page;
    perPage = event.detail.per_page;
    console.log('[AppSelector] Updated pagination state:', { currentPage, perPage });
    loadApps();
  }

  function handleTableFilter(event: CustomEvent<{ search?: string; formats?: string[] }>) {
    filterSearch = event.detail.search ?? '';
    filterFormats = event.detail.formats ?? [];
    currentPage = 1;
    loadApps();
  }
  
  // Handle confirm button click
  function handleConfirm() {
    if (selectedResources.length > 0) {
      dispatch('select', selectedResources.map(r => ({ id: r.id, name: r.name, packageName: (r as any).packageName ?? null, autoOpen })));
      
      // Store the count before clearing
      const selectedCount = selectedResources.length;
      
      // Check if we need to adjust pagination after removing items
      const currentTotalRecords = tableData.pagination.total_records;
      const remainingRecords = currentTotalRecords - selectedCount;
      
      console.log('[AppSelector] Pagination adjustment:', {
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
        console.log('[AppSelector] Adjusted currentPage to maxPage:', maxPage);
        currentPage = maxPage;
      } else if (currentPage < 1) {
        // Ensure we don't go below page 1
        currentPage = 1;
        console.log('[AppSelector] Adjusted currentPage to 1:', currentPage);
      }
      
      // Clear local selection AFTER pagination adjustment
      selectedResources = [];
      
      // Reload the list with adjusted pagination
      loadApps();
      closeDialog();
    }
  }
  
  // Handle autoOpen toggle
  function handleAutoOpenChange(e: CustomEvent<boolean>) {
    autoOpen = e.detail;
    dispatch('autoOpenChange', autoOpen);
  }
  
  // Handle cancel button click
  function handleCancel() {
    closeDialog();
  }
  
  // Handle dialog close
  function handleClose() {
    // Reset filters when closing modal
    filterSearch = '';
    filterFormats = [];
    currentPage = 1;
    hasLoadedForSession = false;
    
    // Reset the table's internal filter state
    if (appTableRef && appTableRef.resetFilters) {
      appTableRef.resetFilters();
    }
    
    closeDialog();
  }
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && handleClose()}>
  <Dialog.Content class="sm:max-w-7xl w-full max-w-[95vw]">
    <Dialog.Header>
      <Dialog.Title>Select an App</Dialog.Title>
      <Dialog.Description>
        Choose an app to add to the bundle
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      <!-- Auto Open Toggle -->
      <div class="flex items-center space-x-2 px-4">
        <Switch id="autoOpen" bind:checked={autoOpen} />
        <Label for="autoOpen">Automatically open app after installation</Label>
      </div>

      <!-- Selected Apps Review Section - Fixed height to prevent UI jumping -->
      <div class="border rounded-md bg-muted/30 h-[160px] overflow-hidden flex flex-col">
        <div class="p-4 border-b bg-background/50 flex-shrink-0">
          <h4 class="font-medium text-sm">
            Selected Apps 
            <span class="text-muted-foreground">({selectedResources.length})</span>
          </h4>
        </div>
        <div class="p-4 flex-1 overflow-y-auto min-h-0">
          {#if selectedResources.length === 0}
            <p class="text-sm text-muted-foreground">No apps selected</p>
          {:else}
            <div class="flex flex-wrap gap-2">
              {#each selectedResources as res}
                <div class="flex items-center gap-2 bg-background border rounded-md px-3 py-1 text-sm">
                  <span>{res.name}</span>
                  <button 
                    type="button"
                    class="text-muted-foreground hover:text-destructive"
                    on:click={() => handleRowClick(res)}
                  >
                    ✕
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Table Container - Following standard selector pattern -->
      <div class="mt-4 border rounded-md overflow-hidden">
          <AppTable
            bind:this={appTableRef}
            props={{
              records: tableData.records,
              pagination: tableData.pagination,
              sort: tableData.sort,
              loading: tableData.loading,
              selectedResourceIds: selectedResources.map(r => r.id)
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

    <Dialog.Footer>
      <Button variant="outline" on:click={handleClose}>
        Cancel
      </Button>
      <Button 
        on:click={handleConfirm} 
        disabled={selectedResources.length === 0}
        class="ml-2"
      >
        Select {selectedResources.length > 0 ? `(${selectedResources.length})` : ''}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
