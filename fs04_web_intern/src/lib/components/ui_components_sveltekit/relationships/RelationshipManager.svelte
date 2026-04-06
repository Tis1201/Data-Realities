<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Button } from '$lib/components/ui/button';
    import { Badge } from '$lib/components/ui/badge';
    import { Plus, X, ExternalLink, Loader2 } from 'lucide-svelte';
    import RelativeDate from '$lib/components/ui_components_sveltekit/date/RelativeDate.svelte';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    
    // Import directly from text-utils to avoid crypto module issues
    import { truncateText, truncateEmail } from "$lib/utils/text-utils";
    
    import RelationshipAddDialog from './RelationshipAddDialog.svelte';
    import RelationshipDeleteDialog from './RelationshipDeleteDialog.svelte';
    
    import { 
        getStatusBadge, 
        getRoleBadge, 
        getDisplayName, 
        getSingularForm,
        getItemId,
        getItemUrl,
        type RelationshipType 
    } from './relationship-utils';

    export let title: string;
    export let description: string;
    export let icon: any;
    export let relationships: Array<{
        id: string;
        name: string;
        status?: string;
        role?: string;
        email?: string;
        description?: string;
        createdAt: Date;
        _count?: Record<string, number>;
        [key: string]: any;
    }> = [];
    export let availableItems: Array<{
        id: string;
        name: string;
        status?: string;
        description?: string;
        [key: string]: any;
    }> = [];
    export let relationshipType: RelationshipType = 'companies';
    export let canAdd: boolean = true;
    export let canRemove: boolean = true;
    export let canCreate: boolean = false;
    export let viewUrl: string = '';
    export let loading: boolean = false;
    export let multiSelect: boolean = false;
    export let destructiveRemoval: boolean = false;
    export let warningMessage: string = 'This action cannot be undone.';
    
    // Loading state props
    export let addingItems: Set<string> = new Set();
    export let removingItems: Set<string> = new Set();

    const dispatch = createEventDispatcher();

    // Dialog states
    let addDialogOpen = false;
    let deleteDialogOpen = false;
    let itemToDelete: any = null;

    // Debug when component lifecycle
    onMount(() => {
        console.log('RelationshipManager mounted');
    });

    // Event handlers
    function handleAdd(event: CustomEvent) {
        dispatch('add', event.detail);
    }

    function handleRemove(itemId: string) {
        const item = relationships.find(rel => {
            if (relationshipType === 'members' && rel.user) {
                return rel.user.id === itemId;
            }
            return rel.id === itemId;
        });
        if (item) {
            itemToDelete = item;
            deleteDialogOpen = true;
        }
    }

    function handleDeleteConfirm(event: CustomEvent) {
        const { item } = event.detail;
        if (item) {
            const idToRemove = getItemId(item, relationshipType);
            dispatch('remove', { itemId: idToRemove });
            deleteDialogOpen = false;
            itemToDelete = null;
        }
    }

    function handleDeleteCancel() {
        deleteDialogOpen = false;
        itemToDelete = null;
    }

    function handleView(itemId: string) {
        if (viewUrl) {
            const url = `${viewUrl}/${itemId}`;
            goto(url);
        }
    }

    function navigateToItem(item: any) {
        if (!viewUrl) return;
        const url = getItemUrl(item, relationshipType, viewUrl);
        goto(url);
    }

    function handleCreate() {
        dispatch('create');
    }

    function isItemLoading(itemId: string): boolean {
        return addingItems.has(itemId) || removingItems.has(itemId);
    }
</script>

<div class="space-y-3">
    {#if relationships.length > 0}
        {#each relationships as item}
            {@const itemId = getItemId(item, relationshipType)}
            {@const itemLoading = isItemLoading(itemId)}
            
            <div 
                class="flex items-center justify-between p-3 border rounded-lg"
                class:opacity-50={itemLoading}
                class:pointer-events-none={itemLoading}
            >
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        {#if viewUrl}
                            <button 
                                class="font-medium text-left hover:text-primary hover:underline transition-colors cursor-pointer truncate"
                                on:click={() => navigateToItem(item)}
                                disabled={itemLoading}
                                title={getDisplayName(item, relationshipType)}
                            >
                                {truncateText(getDisplayName(item, relationshipType), 30)}
                            </button>
                        {:else}
                            <h4 class="font-medium truncate" title={getDisplayName(item, relationshipType)}>
                                {truncateText(getDisplayName(item, relationshipType), 30)}
                            </h4>
                        {/if}
                        
                        {#if (relationshipType === 'members' && item.user?.status) || item.status}
                            {@const statusBadge = getStatusBadge(relationshipType === 'members' && item.user ? item.user.status : item.status)}
                            {#if statusBadge}
                                <svelte:component this={statusBadge.component} {...statusBadge.props}>
                                    {statusBadge.children}
                                </svelte:component>
                            {/if}
                        {/if}
                        
                        {#if item.role}
                            {@const roleBadge = getRoleBadge(item.role)}
                            {#if roleBadge}
                                <svelte:component this={roleBadge.component} {...roleBadge.props}>
                                    {roleBadge.children}
                                </svelte:component>
                            {/if}
                        {/if}
                        
                        {#if itemLoading}
                            <Badge variant="outline" class="animate-pulse">
                                <Loader2 class="h-3 w-3 mr-1 animate-spin" />
                                {removingItems.has(itemId) ? 'Removing...' : 'Processing...'}
                            </Badge>
                        {/if}
                    </div>
                    
                    <div class="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-1">
                        {#if (relationshipType === 'members' && item.user?.email) || item.email}
                            {@const email = relationshipType === 'members' && item.user ? item.user.email : item.email}
                            <span class="truncate max-w-[200px]" title={email}>
                                {truncateText(email, 25)}
                            </span>
                            <span>•</span>
                        {/if}
                        {#if item._count}
                            {Object.entries(item._count).map(([key, count]) => `${count} ${key}`).join(', ')} • 
                        {/if}
                        {#if relationshipType === 'members'}
                            Joined
                        {:else}
                            Added
                        {/if}
                        <RelativeDate date={item.createdAt} format="relative" />
                    </div>
                    
                    {#if item.description}
                        <p class="text-sm text-muted-foreground mt-1">{item.description}</p>
                    {/if}
                </div>
                
                <div class="flex items-center gap-2">
                    {#if viewUrl}
                        <Button variant="ghost" size="sm" on:click={() => handleView(itemId)} disabled={itemLoading}>
                            <ExternalLink class="h-4 w-4" />
                        </Button>
                    {/if}
                    {#if canRemove}
                        <Button variant="ghost" size="sm" on:click={() => handleRemove(itemId)} disabled={itemLoading}>
                            {#if removingItems.has(itemId)}
                                <Loader2 class="h-4 w-4 animate-spin" />
                            {:else}
                                <X class="h-4 w-4" />
                            {/if}
                        </Button>
                    {/if}
                </div>
            </div>
        {/each}
    {:else}
        <div class="text-center py-6 text-muted-foreground">
            <svelte:component this={icon} class="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No {relationshipType} found</p>
            {#if canAdd || canCreate}
                <div class="flex gap-2 mt-2 justify-center">
                    {#if canAdd}
                        <Button variant="outline" size="sm" on:click={() => addDialogOpen = true} disabled={loading}>
                            <Plus class="h-4 w-4 mr-1" />
                            Add {getSingularForm(relationshipType)}
                        </Button>
                    {/if}
                    {#if canCreate}
                        <Button variant="default" size="sm" on:click={handleCreate} disabled={loading}>
                            <Plus class="h-4 w-4 mr-1" />
                            Create {getSingularForm(relationshipType)}
                        </Button>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}

    {#if (canAdd || canCreate) && relationships.length > 0}
        <div class="flex justify-center gap-2 pt-2">
            {#if canAdd}
                <Button variant="outline" size="sm" on:click={() => addDialogOpen = true} disabled={loading}>
                    {#if loading}
                        <Loader2 class="h-4 w-4 mr-1 animate-spin" />
                    {:else}
                        <Plus class="h-4 w-4 mr-1" />
                    {/if}
                    Add {getSingularForm(relationshipType)}
                </Button>
            {/if}
            {#if canCreate}
                <Button variant="default" size="sm" on:click={handleCreate} disabled={loading}>
                    <Plus class="h-4 w-4 mr-1" />
                    Create {getSingularForm(relationshipType)}
                </Button>
            {/if}
        </div>
    {/if}
</div>

<!-- Add Dialog -->
<RelationshipAddDialog
    bind:open={addDialogOpen}
    {relationshipType}
    {availableItems}
    {relationships}
    {multiSelect}
    {loading}
    {addingItems}
    on:add={handleAdd}
/>

<!-- Delete Dialog -->
<RelationshipDeleteDialog
    bind:open={deleteDialogOpen}
    item={itemToDelete}
    {relationshipType}
    {destructiveRemoval}
    {warningMessage}
    on:confirm={handleDeleteConfirm}
    on:cancel={handleDeleteCancel}
/> 
