<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Search, ArrowUpDown } from 'lucide-svelte';
  import DebouncedTextFilter from '$lib/components/ui_components_sveltekit/table/filter/DebouncedTextFilter.svelte';
  import PopoverFilter from '$lib/components/ui_components_sveltekit/table/filter/PopoverFilter.svelte';
  import OnlineDot from "$lib/components/ui_components_sveltekit/devices/OnlineDot.svelte";
  import RelativeDate from "$lib/components/ui_components_sveltekit/date/RelativeDate.svelte";
  import type { DeviceTag } from '@prisma/client';
  
  interface DeviceTag {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    description?: string;
  }
  
  interface TableProps {
    records: DeviceTag[];
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
    selectedDeviceTagIds?: string[];
  }
  
  export let props: TableProps;
  
  // Create event dispatcher
  const dispatch = createEventDispatcher<{
    rowClick: DeviceTag;
    toggleSelectAllClick: any;
    sort: { field: string; order: 'asc' | 'desc' };
    pagination: { page: number; per_page: number };
    filter: { search?: string; };
  }>();
  
  // Handle row click
  function handleRowClick(device: DeviceTag) {
    dispatch('rowClick', device);
  }
  
  // Handle sort click
  function handleSortClick(field: string) {
    const order = props.sort.field === field && props.sort.order === 'asc' ? 'desc' : 'asc';
    dispatch('sort', { field, order });
  }
  
  // Internal filter state; emit to parent
  let localSearch = '';
  
  function emitFilter() {
    dispatch('filter', { search: localSearch });
  }

  function handleSearchChange(e: CustomEvent) {
    const detail: any = (e as any).detail;
    console.log({detail})
    localSearch = typeof detail === 'string' ? detail : '';
    emitFilter();
  }
  
  // Reset filters function for parent component to call
  export function resetFilters() {
    localSearch = '';
    emitFilter();
  }
  
  // Handle toggle select all
  function handleToggleSelectAllClick() {
    dispatch('toggleSelectAllClick');
  }

  $: allSelected = props.records.length > 0 && props.records.every((d) => props.selectedDeviceTagIds?.includes(d.id));
</script>

<div class="w-full">
  <!-- Search/Filter Bar (match AppSelector pattern) -->
  <div class="p-4 border-b flex flex-wrap gap-2">
    <div class="w-1/3 min-w-[240px]">
      <DebouncedTextFilter
        placeholder="Search by tag name..."
        value={localSearch}
        emitOnly={true}
        delay={0}
        on:change={handleSearchChange}
      />
    </div>
  </div>
  
  <!-- Table with scrollable body -->
  <div class="overflow-y-auto max-h-[400px] border-t">
    <table class="w-full">
      <thead class="sticky top-0 bg-background z-10 border-b">
        <tr>
          <th class="text-left py-2 px-4 font-medium text-sm w-10">
            <button type="button" class="inline-flex" on:click|stopPropagation={handleToggleSelectAllClick} aria-label="Select all">
              <Checkbox checked={allSelected} aria-label="Select all" />
            </button>
          </th>
          <th class="text-left p-3">
            <Button 
              variant="ghost" 
              class="p-0 font-medium text-sm flex items-center"
              on:click={() => handleSortClick('name')}
            >
              Name
              <ArrowUpDown class="ml-2 h-4 w-4" />
            </Button>
          </th>
          <th class="text-left p-3">
            <Button 
              variant="ghost" 
              class="p-0 font-medium text-sm flex items-center"
              on:click={() => handleSortClick('createdAt')}
            >
              Created At
              <ArrowUpDown class="ml-2 h-4 w-4" />
            </Button>
          </th>
          <th class="text-left p-3">
            <Button 
              variant="ghost" 
              class="p-0 font-medium text-sm flex items-center"
              on:click={() => handleSortClick('updatedAt')}
            >
              Updated At
              <ArrowUpDown class="ml-2 h-4 w-4" />
            </Button>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        {#if props.records.length === 0}
          <tr>
            <td colspan="4" class="text-center p-4 text-muted-foreground">
              No device tags found
            </td>
          </tr>
        {:else}
          {#each props.records as deviceTag}
            <tr 
              class="hover:bg-muted/50 cursor-pointer"
              on:click={() => dispatch('rowClick', deviceTag)}
            >
              <td class="py-3 px-4 w-10">
                <button type="button" class="inline-flex" on:click|stopPropagation={() => dispatch('rowClick', deviceTag)}>
                  <Checkbox checked={props.selectedDeviceTagIds?.includes(deviceTag.id)} />
                </button>
              </td>
              <td class="p-3 flex items-center gap-2">
                {deviceTag.name}
              </td>
              <td class="p-3">
                <RelativeDate date={deviceTag.createdAt} />
              </td>
              <td class="p-3">
                <RelativeDate date={deviceTag.updatedAt} />
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
