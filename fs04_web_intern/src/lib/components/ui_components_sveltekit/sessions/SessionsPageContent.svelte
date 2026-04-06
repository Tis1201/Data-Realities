<script lang="ts">
    import { initPagination, getDefaultPagination, getDefaultSort } from '$lib/components/ui_components_sveltekit/table/pagination/pagination-utils';
    import SessionsTable from './SessionsTable.svelte';
    
    // Props
    export let data: any; // PageData type varies between admin/user
    export let isAdminView: boolean = false; // Determines which columns to show
    export let backButtonUrl: string; // Where the back button should navigate (unused but kept for API compatibility)
    export let userDisplayName: string = 'User'; // For display purposes (unused but kept for API compatibility)
    
    // Destructure data
    $: ({ sessions: records, meta, user } = data);
    $: pagination = getDefaultPagination(meta, 10);
    $: sort = getDefaultSort(meta, "createdAt", "desc");
    
    let loading = false;
    
    // Initialize pagination with stored preferences
    initPagination('preferredPageSize', true);
</script>

<SessionsTable
    {records}
    {pagination}
    {sort}
    {loading}
    {isAdminView}
/> 