<script lang="ts">
    import { Search, Filter, X, Settings, Users, Check } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
    import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
    import { createEventDispatcher, onMount } from 'svelte';

    export let devices: any[] = [];
    export let selectedDevices: string[] = [];
    export let profileId: string = '';
    export let showSelection: boolean = true;
    export let showPagination: boolean = true;
    export let devicesPerPage: number = 10;
    export let title: string = 'All Devices';
    export let subtitle: string = 'Manage device assignments for this profile';
    export let emptyMessage: string = 'No devices found';
    export let emptySubMessage: string = 'Click "Select Devices" to add devices to this profile';
    export let apiEndpoint: string = '';

    const dispatch = createEventDispatcher();

    // Search and filter state
    let searchQuery = '';
    let selectedTag = '';
    let availableTags: string[] = [];
    let filteredDevices: any[] = [];
    let loading = false;
    let tagPopoverOpen = false;
    let tagSearchQuery = '';

    // Pagination state
    let currentPage = 1;

    // Initialize filtered devices
    $: filteredDevices = devices;

    // Extract unique tags from devices
    $: availableTags = [...new Set(devices.flatMap(device => 
        device.tags ? device.tags.map((tag: any) => tag.name) : []
    ))];

    // Filter tags based on search query
    $: filteredTags = availableTags.filter(tag => 
        tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
    );

    // Fetch devices with search parameters
    async function fetchDevices() {
        if (!apiEndpoint) {
            // Fallback to client-side filtering if no API endpoint
            filteredDevices = devices.filter((device) => {
                const matchesSearch = !searchQuery || (() => {
                    const query = searchQuery.toLowerCase();
                    return (device.name && device.name.toLowerCase().includes(query)) ||
                           (device.macAddress && device.macAddress.toLowerCase().includes(query)) ||
                           (device.deviceType && device.deviceType.toLowerCase().includes(query)) ||
                           (device.status && device.status.toLowerCase().includes(query)) ||
                           (device.tags && device.tags.some((tag: any) => 
                               tag.name && tag.name.toLowerCase().includes(query)
                           ));
                })();
                
                const matchesTag = !selectedTag || 
                    (device.tags && device.tags.some((tag: any) => tag.name === selectedTag));
                
                return matchesSearch && matchesTag;
            });
            return;
        }

        try {
            loading = true;
            const params = new URLSearchParams();
            if (searchQuery) params.set('search', searchQuery);
            if (selectedTag) params.set('tag', selectedTag);
            params.set('limit', '1000'); // Get all devices for client-side pagination
            
            const response = await fetch(`${apiEndpoint}?${params}`);
            if (response.ok) {
                const result = await response.json();
                filteredDevices = result.devices || [];
            }
        } catch (error) {
            console.error('Failed to fetch devices:', error);
            filteredDevices = devices;
        } finally {
            loading = false;
        }
    }

    $: totalPages = Math.ceil(filteredDevices.length / devicesPerPage);
    $: paginatedDevices = filteredDevices.slice(
        (currentPage - 1) * devicesPerPage,
        currentPage * devicesPerPage
    );

    // Initialize on mount
    onMount(() => {
        fetchDevices();
    });

    // Trigger search when search query or tag changes (client-side only)
    $: if (typeof window !== 'undefined' && (searchQuery !== undefined || selectedTag !== undefined)) {
        fetchDevices();
    }

    // Pagination functions
    function goToPage(page: number) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
        }
    }

    function nextPage() {
        if (currentPage < totalPages) {
            currentPage++;
        }
    }

    function prevPage() {
        if (currentPage > 1) {
            currentPage--;
        }
    }

    // Handle device selection
    function toggleDevice(deviceId: string) {
        dispatch('toggleDevice', { deviceId });
    }

    // Clear search
    function clearSearch() {
        searchQuery = '';
    }

    // Clear tag filter
    function clearTagFilter() {
        selectedTag = '';
        tagSearchQuery = '';
    }

    // Reset pagination when filters change
    $: if (searchQuery || selectedTag) {
        currentPage = 1;
    }
</script>

<Card class="shadow-lg">
    <CardHeader class="bg-gradient-to-r from-slate-50 to-white border-b">
        <CardTitle class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="p-2 bg-slate-100 rounded-lg">
                    <Users class="h-5 w-5 text-slate-600" />
                </div>
                <div>
                    <span class="text-lg font-semibold">{title}</span>
                    <p class="text-sm text-muted-foreground font-normal">{subtitle}</p>
                </div>
            </div>
        </CardTitle>
    </CardHeader>
    
    <!-- Search and Filter Controls -->
    <div class="p-4 border-b bg-slate-50/50">
        <div class="flex flex-col sm:flex-row gap-3">
            <!-- Search Input -->
            <div class="flex-1 relative">
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    bind:value={searchQuery}
                    placeholder="Search by name, MAC, type, status, or tags..."
                    class="pl-10 pr-10"
                />
                {#if searchQuery}
                    <Button
                        variant="ghost"
                        size="sm"
                        on:click={clearSearch}
                        class="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-200"
                    >
                        <X class="h-3 w-3" />
                    </Button>
                {/if}
            </div>
            
            <!-- Tag Filter -->
            {#if availableTags.length > 0}
                <div class="flex items-center gap-2">
                    <Filter class="h-4 w-4 text-gray-400" />
                    <Popover bind:open={tagPopoverOpen}>
                        <PopoverTrigger asChild let:builder>
                            <Button
                                builders={[builder]}
                                variant="outline"
                                role="combobox"
                                aria-expanded={tagPopoverOpen}
                                class="w-48 justify-between"
                            >
                                {selectedTag || "Filter by tag..."}
                                <svg
                                    class="ml-2 h-4 w-4 shrink-0 opacity-50"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                </svg>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-64 p-0">
                            <div class="p-3 border-b">
                                <Input 
                                    bind:value={tagSearchQuery}
                                    placeholder="Search tags..."
                                    class="h-8"
                                />
                            </div>
                            <div class="max-h-64 overflow-y-auto">
                                <div class="p-1">
                                    <button
                                        class="w-full flex items-center px-2 py-1.5 text-sm hover:bg-gray-100 rounded-sm {selectedTag === '' ? 'bg-gray-100' : ''}"
                                        on:click={() => {
                                            selectedTag = '';
                                            tagPopoverOpen = false;
                                            tagSearchQuery = '';
                                        }}
                                    >
                                        <Check class="mr-2 h-4 w-4 {selectedTag === '' ? 'opacity-100' : 'opacity-0'}" />
                                        All Tags
                                    </button>
                                    {#each filteredTags as tag}
                                        <button
                                            class="w-full flex items-center px-2 py-1.5 text-sm hover:bg-gray-100 rounded-sm {selectedTag === tag ? 'bg-gray-100' : ''}"
                                            on:click={() => {
                                                selectedTag = tag;
                                                tagPopoverOpen = false;
                                                tagSearchQuery = '';
                                            }}
                                        >
                                            <Check class="mr-2 h-4 w-4 {selectedTag === tag ? 'opacity-100' : 'opacity-0'}" />
                                            {tag}
                                        </button>
                                    {/each}
                                    {#if filteredTags.length === 0 && tagSearchQuery}
                                        <div class="px-2 py-1.5 text-sm text-gray-500">
                                            No tags found for "{tagSearchQuery}"
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    {#if selectedTag}
                        <Button
                            variant="ghost"
                            size="sm"
                            on:click={clearTagFilter}
                            class="h-8 w-8 p-0 hover:bg-gray-200"
                        >
                            <X class="h-3 w-3" />
                        </Button>
                    {/if}
                </div>
            {/if}
        </div>
        
        <!-- Search Help Text -->
        {#if !searchQuery && !selectedTag}
            <div class="mt-2">
                <p class="text-xs text-gray-500">
                    💡 Search by device name, MAC address, type, status, or tag names
                </p>
            </div>
        {/if}
        
        <!-- Active Filters Display -->
        {#if searchQuery || selectedTag}
            <div class="flex items-center gap-2 mt-3">
                <span class="text-sm text-gray-600">Active filters:</span>
                {#if searchQuery}
                    <Badge variant="secondary" class="text-xs">
                        Search: "{searchQuery}"
                        <Button
                            variant="ghost"
                            size="sm"
                            on:click={clearSearch}
                            class="ml-1 h-3 w-3 p-0 hover:bg-gray-300"
                        >
                            <X class="h-2 w-2" />
                        </Button>
                    </Badge>
                {/if}
                {#if selectedTag}
                    <Badge variant="secondary" class="text-xs">
                        Tag: {selectedTag}
                        <Button
                            variant="ghost"
                            size="sm"
                            on:click={clearTagFilter}
                            class="ml-1 h-3 w-3 p-0 hover:bg-gray-300"
                        >
                            <X class="h-2 w-2" />
                        </Button>
                    </Badge>
                {/if}
            </div>
        {/if}
    </div>

    <CardContent class="p-0">
        {#if devices.length === 0}
            <div class="text-center py-12 text-muted-foreground">
                <div class="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users class="h-8 w-8 text-slate-400" />
                </div>
                <p class="text-lg font-medium mb-2">{emptyMessage}</p>
                <p class="text-sm">{emptySubMessage}</p>
            </div>
        {:else if filteredDevices.length === 0}
            <div class="text-center py-12 text-muted-foreground">
                <div class="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Search class="h-8 w-8 text-slate-400" />
                </div>
                <p class="text-lg font-medium mb-2">No devices match your search</p>
                <p class="text-sm">Try adjusting your search terms or filters</p>
            </div>
        {:else}
            <div class="divide-y divide-slate-100">
                {#each paginatedDevices as device}
                    {@const isAssignedToThisProfile = device.profileAssignment?.profile?.id === profileId}
                    {@const isAssignedToOtherProfile = device.profileAssignment && !isAssignedToThisProfile}
                    {@const isSelected = selectedDevices.includes(device.id)}
                    <div class="flex items-center justify-between p-2 transition-all hover:bg-slate-50/50 {isAssignedToThisProfile ? 'bg-green-50/50 border-l-4 border-l-green-500' : isAssignedToOtherProfile ? 'bg-gray-50/50 border-l-4 border-l-gray-400' : isSelected ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''}">
                        <div class="flex items-center gap-2 min-w-0 flex-1">
                            {#if showSelection}
                                <Checkbox 
                                    checked={isSelected}
                                    onCheckedChange={() => toggleDevice(device.id)}
                                    disabled={!!isAssignedToOtherProfile}
                                    class="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 flex-shrink-0"
                                />
                            {/if}
                            <div class="p-1 rounded {isAssignedToThisProfile ? 'bg-green-100' : isAssignedToOtherProfile ? 'bg-gray-100' : 'bg-slate-100'} flex-shrink-0">
                                <Settings class="h-2.5 w-2.5 {isAssignedToThisProfile ? 'text-green-600' : isAssignedToOtherProfile ? 'text-gray-600' : 'text-slate-600'}" />
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="font-medium text-xs text-gray-900 truncate">{device.name}</div>
                                <div class="text-xs text-gray-600 truncate">
                                    {device.deviceType} • {device.status} • MAC: {device.macAddress || 'N/A'}
                                </div>
                                {#if device.tags && device.tags.length > 0}
                                    <div class="flex items-center gap-1 mt-1">
                                        {#each device.tags.slice(0, 3) as tag}
                                            <Badge variant="outline" class="text-xs px-1 py-0.5">
                                                {tag.name}
                                            </Badge>
                                        {/each}
                                        {#if device.tags.length > 3}
                                            <Badge variant="outline" class="text-xs px-1 py-0.5">
                                                +{device.tags.length - 3}
                                            </Badge>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 flex-shrink-0">
                            {#if isAssignedToThisProfile}
                                <Badge variant="default" class="bg-green-600 hover:bg-green-700 text-xs font-medium shadow-sm px-1.5 py-0.5">
                                    ✓ Assigned
                                </Badge>
                            {:else if isAssignedToOtherProfile}
                                <Badge variant="outline" class="text-xs font-medium border-gray-300 text-gray-600 px-1.5 py-0.5">
                                    {device.profileAssignment?.profile?.name || 'Other'}
                                </Badge>
                            {:else}
                                <Badge variant="secondary" class="text-xs font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5">Available</Badge>
                            {/if}
                            {#if device.connected}
                                <div class="w-1.5 h-1.5 bg-green-500 rounded-full shadow-sm" title="Online"></div>
                            {:else}
                                <div class="w-1.5 h-1.5 bg-gray-400 rounded-full shadow-sm" title="Offline"></div>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
            
            <!-- Pagination Controls -->
            {#if showPagination && totalPages > 1}
                <div class="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
                    <div class="flex items-center gap-2 text-sm text-gray-600">
                        <span>Showing {((currentPage - 1) * devicesPerPage) + 1} to {Math.min(currentPage * devicesPerPage, filteredDevices.length)} of {filteredDevices.length} devices</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <Button 
                            variant="outline" 
                            size="sm"
                            on:click={prevPage}
                            disabled={currentPage === 1}
                            class="h-8 w-8 p-0"
                        >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </Button>
                        
                        {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                            const start = Math.max(1, currentPage - 2);
                            return start + i;
                        }) as pageNum}
                            <Button 
                                variant={pageNum === currentPage ? "default" : "outline"}
                                size="sm"
                                on:click={() => goToPage(pageNum)}
                                class="h-8 w-8 p-0"
                            >
                                {pageNum}
                            </Button>
                        {/each}
                        
                        <Button 
                            variant="outline" 
                            size="sm"
                            on:click={nextPage}
                            disabled={currentPage === totalPages}
                            class="h-8 w-8 p-0"
                        >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </Button>
                    </div>
                </div>
            {/if}
        {/if}
    </CardContent>
</Card>
