<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import AdminCard from '$lib/components/admin/layout/AdminCard.svelte';
    import RelationshipManager from './RelationshipManager.svelte';
    import { goto, invalidateAll } from '$app/navigation';
    import { toast } from 'svelte-sonner';
    import { ExternalLink } from 'lucide-svelte';
    import CompanyCreateDialog from '$lib/components/ui_components_sveltekit/dialog/CompanyCreateDialog.svelte';

    export let title: string;
    export let description: string;
    export let icon: any;
    export let relationships: any[] = [];
    export let availableItems: any[] = [];
    export let relationshipType: 'companies' | 'members' | 'groups' | 'devices';
    export let canAdd: boolean = true;
    export let canRemove: boolean = true;
    export let canCreate: boolean = false;
    export let viewUrl: string = '';
    export let addAction: string = '';
    export let removeAction: string = '';
    export let loading: boolean = false;
    export let compact: boolean = true;
    export let multiSelect: boolean = false;
    export let destructiveRemoval: boolean = false;
    export let removalWarningMessage: string = '';
    export let dispatchToParent: boolean = false;
    
    // New props for create dialog functionality
    export let createAction: string = '';
    export let enableCreateDialog: boolean = false;
    export let createDialogTitle: string = 'Create New Item';
    export let createDialogDescription: string = 'Create a new item';

    const dispatch = createEventDispatcher();

    // Track loading states for individual operations
    let addingItems: Set<string> = new Set();
    let removingItems: Set<string> = new Set();
    
    // Create dialog state
    let createDialogOpen = false;

    // Default warning messages based on relationship type
    function getDefaultWarningMessage(): string {
        if (removalWarningMessage) return removalWarningMessage;
        
        switch (relationshipType) {
            case 'companies':
                return 'This will permanently delete the company record and all associated data. This action cannot be undone.';
            case 'members':
                return 'This will remove the user from the account but will not delete the user record.';
            case 'groups':
                return 'This will permanently delete the group and all its permissions. This action cannot be undone.';
            case 'devices':
                return 'This will permanently delete the device record and all associated data. This action cannot be undone.';
            default:
                return 'This action cannot be undone.';
        }
    }

    // Handle item addition
    async function handleAdd(event: any) {
        if (loading) return;
        
        const { detail } = event;
        
        if (dispatchToParent) {
            // Dispatch to parent (old behavior)
            dispatch('add', detail);
            return;
        }

        // Handle directly (new default behavior)
        const itemIds = Array.isArray(detail.itemIds) ? detail.itemIds : [detail.itemId];
        const role = detail.role; // Get role from event detail
        
        // Mark items as being added
        itemIds.forEach((id: string) => {
            addingItems = new Set([...addingItems, id]);
        });
        
        try {
            const formData = new FormData();
            formData.append('itemId', JSON.stringify(itemIds));
            
            // Add role parameter for members
            if (relationshipType === 'members' && role) {
                formData.append('role', role);
            }
            
            const response = await fetch(addAction, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.type === 'success' || (result.success && response.ok)) {
                const roleText = (relationshipType === 'members' && role) ? ` as ${role}` : '';
                toast.success(`Successfully added ${itemIds.length} ${relationshipType.slice(0, -1)}${itemIds.length > 1 ? 's' : ''}${roleText}`);
                // Clear loading states before invalidating
                clearLoadingStates();
                await invalidateAll();
                // Ensure loading states are cleared after data refresh
                setTimeout(() => clearLoadingStates(), 100);
            } else {
                toast.error(result.error || `Failed to add ${relationshipType.slice(0, -1)}(s)`);
                clearLoadingStates();
            }
        } catch (error) {
            console.error(`Error adding ${relationshipType}:`, error);
            toast.error(`Failed to add ${relationshipType.slice(0, -1)}(s)`);
            clearLoadingStates();
        }
    }

    // Handle item removal
    async function handleRemove(event: any) {
        if (loading) return;
        
        const { detail } = event;
        
        if (dispatchToParent) {
            // Dispatch to parent (old behavior)
            dispatch('remove', detail);
            return;
        }

        // Handle directly (new default behavior)
        removingItems = new Set([...removingItems, detail.itemId]);
        
        try {
            const formData = new FormData();
            formData.append('itemId', detail.itemId);
            
            const response = await fetch(removeAction, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.type === 'success' || (result.success && response.ok)) {
                toast.success(`${relationshipType.slice(0, -1).charAt(0).toUpperCase() + relationshipType.slice(1, -1)} removed successfully`);
                // Clear loading states before invalidating
                clearLoadingStates();
                await invalidateAll();
                // Ensure loading states are cleared after data refresh
                setTimeout(() => clearLoadingStates(), 100);
            } else {
                toast.error(result.error || `Failed to remove ${relationshipType.slice(0, -1)}`);
                clearLoadingStates();
            }
        } catch (error) {
            console.error(`Error removing ${relationshipType.slice(0, -1)}:`, error);
            toast.error(`Failed to remove ${relationshipType.slice(0, -1)}`);
            clearLoadingStates();
        }
    }

    // Clear loading states when operations complete
    export function clearLoadingStates() {
        addingItems = new Set();
        removingItems = new Set();
        // Force a reactive update
        addingItems = addingItems;
        removingItems = removingItems;
    }

    // Handle navigation to view all items
    function handleViewAll() {
        if (viewUrl) {
            goto(viewUrl);
        }
    }

    // Check if an item is currently being added or removed
    $: isItemLoading = (itemId: string) => {
        return addingItems.has(itemId) || removingItems.has(itemId);
    };

    // Overall loading state
    $: isLoading = loading || addingItems.size > 0 || removingItems.size > 0;
    
    // Handle create button click
    function handleCreate() {
        createDialogOpen = true;
    }
    
    // Handle successful creation
    async function handleCreateSuccess() {
        createDialogOpen = false;
        toast.success(`${relationshipType.slice(0, -1).charAt(0).toUpperCase() + relationshipType.slice(1, -1)} created and added successfully!`);
        clearLoadingStates();
        await invalidateAll();
    }
</script>

<AdminCard
    {title}
    {description}
    {icon}
    {compact}
    class="relative"
    actions={viewUrl ? [{
        label: "View All",
        icon: ExternalLink,
        onClick: handleViewAll
    }] : []}
>
    <!-- Loading State Overlay -->
    {#if isLoading}
        <div class="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div class="flex items-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span class="text-sm text-muted-foreground">
                    {addingItems.size > 0 ? `Adding ${title.toLowerCase()}...` : 
                     removingItems.size > 0 ? `Removing ${title.toLowerCase()}...` : 
                     'Processing...'}
                </span>
            </div>
        </div>
    {/if}

    <RelationshipManager
        {title}
        {description}
        {icon}
        {relationships}
        {availableItems}
        {relationshipType}
        {canAdd}
        {canRemove}
        {canCreate}
        {viewUrl}
        {addAction}
        {removeAction}
        {loading}
        {multiSelect}
        {addingItems}
        {removingItems}
        {destructiveRemoval}
        warningMessage={getDefaultWarningMessage()}
        on:add={handleAdd}
        on:remove={handleRemove}
        on:create={handleCreate}
        on:complete={clearLoadingStates}
    />
</AdminCard>

<!-- Create Dialog for Companies -->
{#if enableCreateDialog && canCreate && relationshipType === 'companies'}
    <CompanyCreateDialog
        bind:open={createDialogOpen}
        title={createDialogTitle}
        description={createDialogDescription}
        action={createAction}
        on:success={handleCreateSuccess}
    />
{/if} 