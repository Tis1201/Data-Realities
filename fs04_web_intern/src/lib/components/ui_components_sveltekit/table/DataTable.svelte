<script lang="ts">
    import { browser } from "$app/environment";
    import { goto, invalidate } from "$app/navigation";
    import { page } from "$app/stores";
    import SortableColumnHeader from "$lib/components/ui_components_sveltekit/table/sort/SortableColumnHeader.svelte";
    import DataTablePagination from "$lib/components/ui_components_sveltekit/table/pagination/Pagination.svelte";
    import * as Table from "$lib/components/ui/table";
    import { createEventDispatcher } from "svelte";
    import type { TableProps, TableColumn } from "$lib/components/ui_components_sveltekit/table/types";

    export let props: TableProps<any>;
    export let columns: TableColumn[] = [];

    const dispatch = createEventDispatcher();

    function handleSort(event: CustomEvent<{ field: string; order: "asc" | "desc" }>) {
        dispatch("sort", event.detail);
    }

    function handlePaginationChange(event: CustomEvent<{ page: number; per_page: number }>) {
        dispatch("pagination", event.detail);
    }

    // Handle row click
    function handleRowClick(record: any) {
        dispatch('rowClick', record);
    }
    
    // Handle data refresh - exposed as a public method
    export async function refreshData(specificDependencies?: string[]) {
        // Allow parent components to handle the refresh
        const event = new CustomEvent('refreshData', { 
            cancelable: true,
            detail: { dependencies: specificDependencies }
        });
        const result = dispatch('refreshData', { dependencies: specificDependencies });
        
        // If the parent component didn't handle the refresh (by returning false)
        // then perform the default refresh behavior
        if (result !== false) {
            // Use provided dependencies or fall back to defaults
            const dependencies = specificDependencies || ['app:data', 'data'];
            
            // Invalidate all specified dependencies
            for (const dep of dependencies) {
                await invalidate(dep);
            }
            
            // Reload the current page data without a full page refresh
            await goto($page.url.pathname + $page.url.search, {
                replaceState: true,
                noScroll: true,
                keepFocus: true,
                invalidateAll: true
            });
        }
        
        return result;
    }
</script>

<div class="rounded-md border">
    <!-- Table -->
    <Table.Root>
        <Table.Header>
            <Table.Row>
                {#each columns as column}
                    <Table.Head style={`width: ${column.width ?? "auto"}`}>
                        {#if column.sortable !== false}
                            <SortableColumnHeader
                                label={column.label}
                                sortKey={column.sortKey ?? column.id}
                                currentSortField={props.sort?.field || null}
                                currentSortOrder={props.sort?.order || null}
                                on:sort={handleSort}
                            />
                        {:else}
                            {column.label}
                        {/if}
                    </Table.Head>
                {/each}
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {#if props.records && props.records.length > 0}
                {#each props.records as record, index (record.id ?? `${index}-${JSON.stringify(record)}`)}
                    <Table.Row 
                        on:click={() => dispatch('rowClick', record)}
                        class="cursor-pointer hover:bg-muted/50"
                    >
                        {#each columns as column}
                            <Table.Cell>
                                {#if column.render}
                                    {@const rendered = column.render(record)}
                                    {#if typeof rendered === 'string'}
                                        {@html rendered}
                                    {:else if rendered && rendered.component && typeof rendered.component === 'function'}
                                        {#if browser}
                                            <svelte:component
                                                this={rendered.component}
                                                {...(rendered.props || {})}
                                            />
                                        {:else}
                                            N/A
                                        {/if}
                                    {:else}
                                        N/A
                                    {/if}
                                {:else}
                                    {record[column.id] ?? "N/A"}
                                {/if}
                            </Table.Cell>
                        {/each}
                    </Table.Row>
                {/each}
            {:else}
                <Table.Row>
                    <Table.Cell
                        colspan={columns.length}
                        class="text-center"
                    >
                        No records available
                    </Table.Cell>
                </Table.Row>
            {/if}
        </Table.Body>
    </Table.Root>

    <DataTablePagination
        pagination={props.pagination}
        on:pagination={handlePaginationChange}
    />
</div>
