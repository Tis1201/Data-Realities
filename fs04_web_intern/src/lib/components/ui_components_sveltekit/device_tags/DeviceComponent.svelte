<script lang="ts">
    import { onMount } from 'svelte';
    import { toast } from 'svelte-sonner';
    import { api_post, api_delete } from '$lib/utils/ApiUtils';
    import { invalidate } from '$app/navigation';
    
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Skeleton } from "$lib/components/ui/skeleton";
    import { Input } from "$lib/components/ui/input";
    import { Search, Smartphone } from "lucide-svelte";
    import RelativeDate from "$lib/components/ui_components_sveltekit/date/RelativeDate.svelte";
    
    // ✅ Import DataTable
    import DataTable from "$lib/components/ui_components_sveltekit/table/DataTable.svelte";
    
    import type { Device } from "@prisma/client";
    import { page } from "$app/stores";
    
    export let devices: Device[] = [];
    export let loading = false;
    export let deviceLinkPrefix: string = '/admin/iot/devices';
    
    // Normalize data
    $: displayDevices = devices.map((d) => ({
        ...d,
        displayStatus: d.connected ? 'ONLINE' : 'OFFLINE'
    }));
    
    // ✅ Filter state
    let searchTerm = '';
    $: filteredDevices = displayDevices.filter(d =>
        d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.displayStatus.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.macAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // ✅ Sorting state với null support
    let sortField: string | null = null;
    let sortOrder: 'asc' | 'desc' | null = null;
    
    // ✅ Sort event handler
    function handleSort(event: CustomEvent<{ field: string | null; order: 'asc' | 'desc' | null }>) {
        console.log('[DeviceComponent] Sort event:', event.detail);
        sortField = event.detail.field;
        sortOrder = event.detail.order;
    }
    
    // ✅ Sorting logic với neutral state
    $: sortedDevices = sortField === null 
        ? [...filteredDevices]
        : [...filteredDevices].sort((a, b) => {
            let valA, valB;
            
            if (sortField === 'name') {
                valA = a.name;
                valB = b.name;
            } else if (sortField === 'model') {
                valA = a.model || '';
                valB = b.model || '';
            } else if (sortField === 'macAddress') {
                valA = a.macAddress || '';
                valB = b.macAddress || '';
            } else if (sortField === 'status') {
                valA = a.displayStatus;
                valB = b.displayStatus;
            } else if (sortField === 'createdAt') {
                valA = a.createdAt;
                valB = b.createdAt;
                return sortOrder === 'asc' ? 
                    new Date(valA).getTime() - new Date(valB).getTime() : 
                    new Date(valB).getTime() - new Date(valA).getTime();
            }
            
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortOrder === 'asc' ? 
                    valA.localeCompare(valB) : 
                    valB.localeCompare(valA);
            }
            
            return 0;
        });
    
    // ✅ Pagination state
    let pageNumber = 1;
    let pageSize: 5 | 10 | 20 | 50 = 10;
    $: totalItems = sortedDevices.length;
    $: totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    $: pageNumber = Math.min(Math.max(1, pageNumber), totalPages);
    $: pageStartIndex = (pageNumber - 1) * pageSize;
    $: pageEndIndex = Math.min(pageStartIndex + pageSize, totalItems);
    $: pagedDevices = sortedDevices.slice(pageStartIndex, pageEndIndex);
    
    function handlePagination(event: CustomEvent<{ page: number; per_page: number }>) {
        console.log('[DeviceComponent] Pagination event:', event.detail);
        pageNumber = event.detail.page;
        pageSize = event.detail.per_page as 5 | 10 | 20 | 50;
    }
    
    type DeviceBadgeVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'success';
    function getDeviceStatusVariant(status: string): DeviceBadgeVariant {
        const statusMap: Record<string, DeviceBadgeVariant> = {
            ONLINE: 'success',
            OFFLINE: 'secondary'
        };
        return statusMap[status] || 'secondary';
    }
    
    // ✅ Column definitions
    const columns = [
        {
            id: "name",
            label: "Device",
            sortable: true,
            sortKey: "name",
            width: "25%",
            render: (device: any) => `
                <div class="flex items-center">
                    <svg class="h-4 w-4 mr-2 text-muted-foreground lucide lucide-smartphone" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                        <path d="M12 18h.01"/>
                    </svg>
                    <a href="${deviceLinkPrefix}/${device.id}" class="hover:underline">${device.name}</a>
                </div>
            `
        },
        {
            id: "displayStatus",
            label: "Status",
            sortable: true,
            sortKey: "status",
            width: "15%",
            render: (device: any) => {
                const isOnline = device.displayStatus === 'ONLINE';
                const bgColor = isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
                return `
                    <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${bgColor}">
                        ${device.displayStatus}
                    </span>
                `;
            }
        },
        {
            id: "model",
            label: "Model",
            sortable: true,
            sortKey: "model",
            width: "20%",
            render: (device: Device) => device.model || 'Unknown'
        },
        {
            id: "macAddress",
            label: "Mac address",
            sortable: true,
            sortKey: "macAddress",
            width: "20%",
            render: (device: Device) => device.macAddress || 'Unknown'
        },
        {
            id: "createdAt",
            label: "Added to system",
            sortable: true,
            sortKey: "createdAt",
            width: "20%",
            render: (device: Device) => ({
                component: RelativeDate,
                props: {
                    date: device.createdAt
                }
            })
        }
    ];
</script>

<!-- Devices Controls -->
<div class="flex justify-between items-center mb-2">
    <div>
        <p class="text-sm text-muted-foreground">
            {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''} attached to this tag
        </p>
    </div>
</div>

{#if loading}
    <div class="space-y-2 p-4">
        <Skeleton class="h-8 w-full" />
        <Skeleton class="h-8 w-full" />
        <Skeleton class="h-8 w-full" />
    </div>
{:else}
    <!-- Search bar -->
    <div class="flex justify-between items-center mb-4">
        <div class="relative w-72">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                type="search" 
                placeholder="Search devices..." 
                class="pl-8 w-full" 
                bind:value={searchTerm}
            />
        </div>
    </div>

    <!-- ✅ DataTable component -->
    <DataTable
        props={{
            records: pagedDevices,
            pagination: {
                page: pageNumber,
                per_page: pageSize,
                total_records: totalItems,
                total_pages: totalPages
            },
            sort: {
                field: sortField || '',
                order: sortOrder || 'asc'
            },
            loading: false
        }}
        {columns}
        on:sort={handleSort}
        on:pagination={handlePagination}
    />
{/if}