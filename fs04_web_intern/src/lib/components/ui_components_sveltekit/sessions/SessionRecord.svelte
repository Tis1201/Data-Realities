<script lang="ts">
    import RecordDetailsSheet from "$lib/components/ui_components_sveltekit/sheet/RecordDetailsSheet.svelte";
    import RelativeDate from "$lib/components/ui_components_sveltekit/date/RelativeDate.svelte";
    import { writable } from "svelte/store";
    import { onMount, onDestroy } from "svelte";
    import type { Session } from "@prisma/client";

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

    export let open = false;
    export let session: SessionWithUser | null = null;
    export let onClose: () => void = () => {};
    export let showUserInfo = true; // Hide user info for user view (since they already know it's their session)
    
    // Create writable store for the sheet open state
    const openStore = writable(false);
    let unsubscribe: (() => void) | null = null;
    
    // Keep prop in sync with store when prop changes
    $: openStore.set(open);
    
    onMount(() => {
        // Subscribe to store changes to detect when sheet closes
        unsubscribe = openStore.subscribe((value) => {
            // Only trigger onClose if the store is false but the prop is true (sheet was closed)
            if (!value && open) {
                open = false;
                onClose();
            }
        });
    });
    
    onDestroy(() => {
        if (unsubscribe) {
            unsubscribe();
        }
    });
    
    // Debug logging
    $: console.log('SessionRecord - open:', open, 'session:', session?.id, 'full session:', session);
</script>

{#if session}
<RecordDetailsSheet 
    open={openStore}
    record={session} 
    title="Session Details" 
    description="Detailed information about the selected session"
    size="md"
>
    <svelte:fragment slot="content" let:record>
        <div class="py-4 space-y-6">
            <!-- Session ID Section -->
            <div class="border rounded-md p-4 bg-muted/30">
                <h3 class="text-sm text-muted-foreground mb-1">Session Identifier</h3>
                <div class="font-mono text-xs bg-background p-2 rounded border overflow-x-auto">
                    {record.id}
                </div>
            </div>
            
            <!-- User Information (only show for admin view) -->
            {#if showUserInfo}
                <div class="border rounded-md p-4">
                    <h3 class="text-sm font-medium mb-3">User Information</h3>
                    <div class="grid gap-3">
                        <div class="grid grid-cols-[120px_1fr] items-center gap-2">
                            <div class="text-sm text-muted-foreground">Email</div>
                            <div class="font-medium">{record.user?.email || 'N/A'}</div>
                        </div>
                        
                        <div class="grid grid-cols-[120px_1fr] items-center gap-2">
                            <div class="text-sm text-muted-foreground">Name</div>
                            <div>{record.user?.name || 'N/A'}</div>
                        </div>
                        
                        <div class="grid grid-cols-[120px_1fr] items-center gap-2">
                            <div class="text-sm text-muted-foreground">Role</div>
                            <div>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    {record.user?.systemRole || 'N/A'}
                                </span>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-[120px_1fr] items-center gap-2">
                            <div class="text-sm text-muted-foreground">Status</div>
                            <div>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400">
                                    {record.user?.status || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
            
            <!-- Session Timing -->
            <div class="border rounded-md p-4">
                <h3 class="text-sm font-medium mb-3">Session Timing</h3>
                <div class="grid gap-3">
                    <div class="grid grid-cols-[120px_1fr] items-center gap-2">
                        <div class="text-sm text-muted-foreground">Created</div>
                        <div>
                            <RelativeDate 
                                date={record.createdAt} 
                                format="relative" 
                                showTooltip={true} 
                                useHoverCard={false} 
                            />
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-[120px_1fr] items-center gap-2">
                        <div class="text-sm text-muted-foreground">Expires</div>
                        <div>
                            <RelativeDate 
                                date={record.expiresAt} 
                                format="relative" 
                                showTooltip={true} 
                                useHoverCard={false} 
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Connection Details -->
            {#if record.userAgent || record.ipAddress}
                <div class="border rounded-md p-4">
                    <h3 class="text-sm font-medium mb-3">Connection Details</h3>
                    <div class="grid gap-3">
                        {#if record.ipAddress}
                            <div class="grid grid-cols-[120px_1fr] items-center gap-2">
                                <div class="text-sm text-muted-foreground">IP Address</div>
                                <div class="font-mono text-xs">{record.ipAddress}</div>
                            </div>
                        {/if}
                        
                        {#if record.userAgent}
                            <div class="grid grid-cols-[120px_1fr] gap-2">
                                <div class="text-sm text-muted-foreground">User Agent</div>
                                <div class="text-xs break-all">{record.userAgent}</div>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    </svelte:fragment>
</RecordDetailsSheet>
{/if} 