<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Button } from '$lib/components/ui/button';
    import { X } from 'lucide-svelte';
    import * as Dialog from '$lib/components/ui/dialog';
    
    // Import directly from text-utils to avoid crypto module issues
    import { truncateText, truncateEmail } from '$lib/utils/text-utils';
    
    import { 
        getStatusBadge, 
        getDisplayName, 
        getSingularForm,
        type RelationshipType 
    } from './relationship-utils';

    export let open: boolean = false;
    export let item: any = null;
    export let relationshipType: RelationshipType;
    export let destructiveRemoval: boolean = false;
    export let warningMessage: string = 'This action cannot be undone.';

    const dispatch = createEventDispatcher();

    function handleConfirm() {
        if (item) {
            dispatch('confirm', { item });
            open = false;
        }
    }

    function handleCancel() {
        open = false;
        dispatch('cancel');
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <Dialog.Title>
                {destructiveRemoval ? 'Permanently Delete' : 'Confirm Removal'}
            </Dialog.Title>
            <Dialog.Description>
                {destructiveRemoval 
                    ? `Are you sure you want to permanently delete this ${getSingularForm(relationshipType)}?`
                    : `Are you sure you want to remove this ${getSingularForm(relationshipType)} from the account?`
                }
            </Dialog.Description>
        </Dialog.Header>
        
        {#if item}
            <div class="py-4">
                <!-- FIX: Add proper overflow handling -->
                <div class="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 min-w-0">
                    <div class="flex-1 min-w-0">
                        <!-- FIX: Truncate name -->
                        <div class="font-medium truncate max-w-full" title={getDisplayName(item, relationshipType)}>
                            {truncateText(getDisplayName(item, relationshipType), 35)}
                        </div>
                        
                        <!-- FIX: Truncate email -->
                        {#if (relationshipType === 'members' && item.user?.email) || item.email}
                            {@const email = relationshipType === 'members' && item.user ? item.user.email : item.email}
                            <div class="text-sm text-muted-foreground truncate max-w-full" title={email}>
                                {truncateEmail(email, 35)}
                            </div>
                        {/if}
                        
                        <!-- FIX: Truncate description -->
                        {#if item.description}
                            <div class="text-sm text-muted-foreground truncate max-w-full" title={item.description}>
                                {truncateText(item.description, 50)}
                            </div>
                        {/if}
                    </div>
                    
                    <!-- Status badge -->
                    <div class="flex-shrink-0">
                        {#if (relationshipType === 'members' && item.user?.status) || item.status}
                            {@const statusBadge = getStatusBadge(relationshipType === 'members' && item.user ? item.user.status : item.status)}
                            {#if statusBadge}
                                <svelte:component this={statusBadge.component} {...statusBadge.props}>
                                    {statusBadge.children}
                                </svelte:component>
                            {/if}
                        {/if}
                    </div>
                </div>
                
                <!-- Warning section stays the same -->
                <div class="mt-3 p-3 {destructiveRemoval ? 'bg-red-50 border border-red-200' : 'bg-destructive/10 border border-destructive/20'} rounded-lg">
                    <!-- ... warning content ... -->
                </div>
            </div>
        {/if}

        <Dialog.Footer>
            <Button variant="outline" on:click={handleCancel}>
                Cancel
            </Button>
            <Button variant="destructive" on:click={handleConfirm}>
                {#if destructiveRemoval}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                        <line x1="10" x2="10" y1="11" y2="17"/>
                        <line x1="14" x2="14" y1="11" y2="17"/>
                    </svg>
                    Delete {getSingularForm(relationshipType)}
                {:else}
                    <X class="h-4 w-4 mr-1" />
                    Remove {getSingularForm(relationshipType)}
                {/if}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root> 