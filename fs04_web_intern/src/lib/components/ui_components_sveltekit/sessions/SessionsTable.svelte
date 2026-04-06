<script lang="ts">
    import DataTable from "$lib/components/ui_components_sveltekit/table/DataTable.svelte";
    import RelativeDate from "$lib/components/ui_components_sveltekit/date/RelativeDate.svelte";
    import NameWithIdLink from "$lib/components/ui_components_sveltekit/table/column/NameWithIdLink.svelte";
    import RecordActions from "$lib/components/ui_components_sveltekit/table/column/RecordActions.svelte";
    import RecordDeleteDialog from "$lib/components/ui_components_sveltekit/dialog/RecordDeleteDialog.svelte";
    import { Skeleton } from "$lib/components/ui/skeleton";
    import SessionRecord from "./SessionRecord.svelte";
    import { Info, Lock } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import type { Session } from "@prisma/client";
    import { handleTableSort, handleTablePagination } from "$lib/components/ui_components_sveltekit/table/pagination/pagination-utils";
    import { writable } from "svelte/store";

    // Define a type for Session with included User data
    type SessionWithUser = Session & {
        userAgent?: string;
        ipAddress?: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            status: string;
            systemRole: string;
        };
    };

    // Props - structure similar to other table components
    export let records: SessionWithUser[] = [];
    export let pagination = {
        page: 1,
        per_page: 10,
        total_records: 0,
        total_pages: 0,
    };
    export let sort = {
        field: "createdAt",
        order: "desc" as "asc" | "desc",
    };
    export let loading = false;
    export let isAdminView = false;

    // Create props object for DataTable
    $: props = {
        records,
        pagination,
        sort,
        loading
    };

    // State for session revocation dialog
    let state = {
        selectedRecord: null as SessionWithUser | null,
        confirmationOpen: false,
        title: "Revoke Session",
        message: "Are you sure you want to revoke this session? This will log the user out immediately.",
        confirmButtonText: "Revoke",
        cancelButtonText: "Cancel",
        successMessage: "Session revoked successfully",
        errorMessage: "Failed to revoke session",
        isDeleting: false,
    };

    // State for tracking revocation process
    const isRevoking = writable(false);

    // State for session details sheet - use regular variables instead of stores
    let selectedSession: SessionWithUser | null = null;
    let isDetailsSheetOpen = false;

    // Function to open session details sheet
    function openSessionDetails(session: SessionWithUser) {
        console.log('🔍 Opening session details for:', session.id);
        console.log('🔍 Full session object:', session);
        selectedSession = session;
        isDetailsSheetOpen = true;
        console.log('📊 State after opening:', { 
            selectedSessionId: selectedSession?.id, 
            selectedSessionType: typeof selectedSession,
            isDetailsSheetOpen,
            hasUser: !!selectedSession?.user 
        });
    }

    // Function to close session details sheet
    function closeSessionDetails() {
        console.log('❌ Closing session details');
        isDetailsSheetOpen = false;
        setTimeout(() => {
            selectedSession = null;
        }, 300);
    }

    // Function to open revocation confirmation dialog
    function confirmRevoke(session: SessionWithUser) {
        console.log('🗑️ Confirming revoke for session:', session.id);
        state.selectedRecord = session;
        state.confirmationOpen = true;
    }

    // Parse user agent for better display
    function parseUserAgent(userAgent: string | undefined): string {
        if (!userAgent) return "N/A";
        
        if (userAgent.includes("Chrome")) return "Chrome";
        if (userAgent.includes("Firefox")) return "Firefox";
        if (userAgent.includes("Safari")) return "Safari";
        if (userAgent.includes("Edge")) return "Edge";
        
        return userAgent.length > 30 ? userAgent.substring(0, 30) + "..." : userAgent;
    }

    // Configure columns based on admin vs user view
    $: columns = isAdminView ? [
        // Admin view columns - shows user information
        {
            id: "id",
            label: "User",
            sortable: true,
            width: "15%",
            render: (record: SessionWithUser) => ({
                component: NameWithIdLink,
                props: {
                    record: {
                        id: record.user?.id || record.userId,
                        email: record.user?.email || "N/A",
                    },
                    baseUrl: `/admin/users`,
                    idField: "id",
                    nameField: "email",
                },
            }),
        },
        {
            id: "user",
            label: "User Info",
            sortable: false,
            width: "15%",
            render: (record: SessionWithUser) => {
                const userName = record.user?.name || "N/A";
                const userRole = record.user?.systemRole || "N/A";
                const userStatus = record.user?.status || "N/A";
                return `${userName !== "N/A" ? `${userName}, ` : ""}${userRole} (${userStatus})`;
            },
        },
        {
            id: "createdAt",
            label: "Created At",
            sortable: true,
            width: "15%",
            render: (record: SessionWithUser) => {
                if (!record.createdAt) return "N/A";
                return {
                    component: RelativeDate,
                    props: {
                        date: record.createdAt,
                        format: "relative",
                        showTooltip: true,
                        useHoverCard: true,
                        iconSize: 12,
                    },
                };
            },
        },
        {
            id: "expiresAt",
            label: "Expires",
            sortable: true,
            width: "15%",
            render: (record: SessionWithUser) => {
                if (!record.expiresAt) return "N/A";
                return {
                    component: RelativeDate,
                    props: {
                        date: record.expiresAt,
                        format: "relative",
                        showTooltip: true,
                        useHoverCard: true,
                        iconSize: 12,
                    },
                };
            },
        },
        {
            id: "actions",
            label: "Actions",
            width: "10%",
            render: (record: SessionWithUser) => {
                const actionItems = [
                    {
                        label: "View Details",
                        icon: Info,
                        onClick: () => openSessionDetails(record),
                    },
                    {
                        label: $isRevoking && state.selectedRecord?.id === record.id ? "Revoking..." : "Revoke Session",
                        icon: $isRevoking && state.selectedRecord?.id === record.id ? null : Lock,
                        onClick: () => confirmRevoke(record),
                        disabled: $isRevoking,
                    },
                ];

                return {
                    component: RecordActions,
                    props: {
                        items: actionItems,
                    },
                };
            },
        },
    ] : [
        // User view columns - shows session details
        {
            id: "id",
            label: "Session ID",
            sortable: true,
            width: "20%",
            render: (record: SessionWithUser) => record.id,
        },
        {
            id: "createdAt",
            label: "Created",
            sortable: true,
            width: "20%",
            render: (record: SessionWithUser) => {
                if (!record.createdAt) return "N/A";
                return {
                    component: RelativeDate,
                    props: {
                        date: record.createdAt,
                        format: "relative",
                        showTooltip: true,
                        useHoverCard: true,
                        iconSize: 12,
                    },
                };
            },
        },
        {
            id: "expiresAt",
            label: "Expires",
            sortable: true,
            width: "20%",
            render: (record: SessionWithUser) => {
                if (!record.expiresAt) return "N/A";
                return {
                    component: RelativeDate,
                    props: {
                        date: record.expiresAt,
                        format: "relative",
                        showTooltip: true,
                        useHoverCard: true,
                        iconSize: 12,
                    },
                };
            },
        },
        {
            id: "userAgent",
            label: "Device/Browser",
            width: "25%",
            render: (record: SessionWithUser) => parseUserAgent(record.userAgent),
        },
        {
            id: "actions",
            label: "Actions",
            width: "15%",
            render: (record: SessionWithUser) => {
                const actionItems = [
                    {
                        label: "View Details",
                        icon: Info,
                        onClick: () => openSessionDetails(record),
                    },
                    {
                        label: $isRevoking && state.selectedRecord?.id === record.id ? "Revoking..." : "Revoke Session",
                        icon: $isRevoking && state.selectedRecord?.id === record.id ? null : Lock,
                        onClick: () => confirmRevoke(record),
                        disabled: $isRevoking,
                    },
                ];

                return {
                    component: RecordActions,
                    props: {
                        items: actionItems,
                    },
                };
            },
        },
    ];
</script>

<div class="space-y-4">
    {#if loading}
        <div class="space-y-2">
            {#each Array(5) as _}
                <div class="flex items-center space-x-4">
                    <Skeleton class="h-4 w-[250px]" />
                    <Skeleton class="h-4 w-[200px]" />
                    <Skeleton class="h-4 w-[150px]" />
                    <Skeleton class="h-4 w-[100px]" />
                </div>
            {/each}
        </div>
    {:else}
        <DataTable
            {columns}
            {props}
            on:sort={handleTableSort}
            on:pagination={handleTablePagination}
        />
    {/if}

    <!-- Session Details Sheet -->
    {#if selectedSession}
        <SessionRecord
            bind:open={isDetailsSheetOpen}
            session={selectedSession}
            onClose={closeSessionDetails}
            showUserInfo={isAdminView}
        />
    {/if}

    <!-- Session Revocation Confirmation Dialog -->
    <RecordDeleteDialog
        {state}
        onConfirm={() => {
            // Handle confirm action
            toast.success(state.successMessage);
            state.confirmationOpen = false;
            state.selectedRecord = null;
        }}
    />
</div> 