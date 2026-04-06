<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Button } from '$lib/components/ui/button';
    import { Badge } from '$lib/components/ui/badge';
    import { Plus, Search, Check, Loader2 } from 'lucide-svelte';
    import { Input } from '$lib/components/ui/input';
    import * as Dialog from '$lib/components/ui/dialog';
    import * as Select from '$lib/components/ui/select';
    
    // Import directly from text-utils to avoid crypto module issues
    import { truncateText } from "$lib/utils/text-utils";

    
    import { 
        AVAILABLE_ROLES, 
        getStatusBadge, 
        getDisplayName, 
        getSingularForm,
        type RelationshipType 
    } from './relationship-utils';

    export let open: boolean = false;
    export let relationshipType: RelationshipType;
    export let availableItems: Array<{
        id: string;
        name: string;
        status?: string;
        description?: string;
        [key: string]: any;
    }> = [];
    export let relationships: Array<any> = [];
    export let multiSelect: boolean = false;
    export let loading: boolean = false;
    export let addingItems: Set<string> = new Set();

    const dispatch = createEventDispatcher();

    // Dialog state
    let searchTerm = '';
    let selectedItemIds: string[] = [];
    let selectedRole = 'MEMBER';

    // Handle role selection change
    function handleRoleChange(selected: any) {
        if (selected) {
            selectedRole = selected.value;
        }
    }

    // Create reactive selection map
    $: selectionMap = selectedItemIds.reduce((map, id) => {
        map[id] = true;
        return map;
    }, {} as Record<string, boolean>);

    // Filter available items
    $: filteredItems = availableItems.filter(item => {
        if (!item || !item.name) return false;
        
        // Check if already added
        let isAlreadyAdded = false;
        if (relationshipType === 'members') {
            isAlreadyAdded = !!relationships.find(rel => {
                if (rel.user) {
                    return rel.user.id === item.id;
                }
                return rel.id === item.id;
            });
        } else {
            isAlreadyAdded = !!relationships.find(rel => rel.id === item.id);
        }
        
        if (isAlreadyAdded) return false;
        
        // Search by both name and email (for members)
        if (!searchTerm) return true; // Show all if no search term
        
        const query = searchTerm.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(query);
        
        // For members, also search by email
        let emailMatch = false;
        if (relationshipType === 'members') {
            emailMatch = item.email?.toLowerCase().includes(query) || false;
        }
        
        return nameMatch || emailMatch;
    });

    function toggleItemSelection(itemId: string) {
        if (selectionMap[itemId]) {
            selectedItemIds = selectedItemIds.filter(id => id !== itemId);
        } else {
            if (multiSelect) {
                selectedItemIds = [...selectedItemIds, itemId];
            } else {
                selectedItemIds = [itemId];
            }
        }
    }

    function handleAdd() {
        if (selectedItemIds.length > 0) {
            const roleValue = (relationshipType === 'members' && selectedRole) ? selectedRole : undefined;
            
            if (multiSelect) {
                dispatch('add', { itemIds: selectedItemIds, role: roleValue });
            } else {
                dispatch('add', { itemId: selectedItemIds[0], role: roleValue });
            }
            
            resetDialog();
        }
    }

    function resetDialog() {
        selectedItemIds = [];
        searchTerm = '';
        selectedRole = 'MEMBER';
        open = false;
    }

    // Reset when dialog closes
    $: if (!open) {
        resetDialog();
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <Dialog.Title>Add {getSingularForm(relationshipType)}{multiSelect ? 's' : ''}</Dialog.Title>
            <Dialog.Description>
                Select from available {relationshipType} to add to this account.
                {#if relationshipType === 'members'}
                    Choose the role each member will have in this account.
                {/if}
                {#if multiSelect}
                    You can select multiple items.
                {/if}
            </Dialog.Description>
        </Dialog.Header>
        
        <div class="space-y-4">
            <!-- Search -->
            <div class="relative">
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    bind:value={searchTerm}
                    placeholder={relationshipType === 'members' ? 'Search by name or email...' : `Search ${relationshipType}...`}
                    class="pl-10 pr-3"
                    style="text-overflow: ellipsis;"
                    disabled={loading}
                />
            </div>

            <!-- Role Selection for Members -->
            {#if relationshipType === 'members'}
                <div class="space-y-2">
                    <label class="text-sm font-medium">Role</label>
                    <Select.Root 
                        selected={{ value: selectedRole, label: AVAILABLE_ROLES.find(r => r.value === selectedRole)?.label || selectedRole }}
                        onSelectedChange={handleRoleChange}
                    >
                        <Select.Trigger class="w-full">
                            <Select.Value placeholder="Select role..." />
                        </Select.Trigger>
                        <Select.Content>
                            {#each AVAILABLE_ROLES as role}
                                <Select.Item value={role.value} label={role.label}>
                                    {role.label}
                                </Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </div>
            {/if}

            <!-- Available Items -->
            <div class="max-h-60 overflow-y-auto space-y-2">
                {#if filteredItems.length > 0}
                    {#each filteredItems as item}
                        <div 
                            class="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors"
                            class:bg-muted={selectionMap[item.id]}
                            class:border-primary={selectionMap[item.id]}
                            class:opacity-50={addingItems.has(item.id)}
                            class:pointer-events-none={loading || addingItems.has(item.id)}
                            on:click={() => !loading && !addingItems.has(item.id) && toggleItemSelection(item.id)}
                            role="button"
                            tabindex="0"
                            on:keydown={(e) => {
                                if ((e.key === 'Enter' || e.key === ' ') && !loading && !addingItems.has(item.id)) {
                                    e.preventDefault();
                                    toggleItemSelection(item.id);
                                }
                            }}
                        >
                            <div class="flex items-center gap-3 flex-1">
                                {#if multiSelect}
                                    <div class="flex-shrink-0">
                                        {#if addingItems.has(item.id)}
                                            <div class="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center bg-gray-100">
                                                <Loader2 class="h-3 w-3 animate-spin text-gray-500" />
                                            </div>
                                        {:else if selectionMap[item.id]}
                                            <div class="w-5 h-5 border-2 border-blue-500 rounded flex items-center justify-center bg-blue-500">
                                                <Check class="h-3 w-3 text-white font-bold stroke-[3]" />
                                            </div>
                                        {:else}
                                            <div class="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center bg-white hover:border-gray-400">
                                            </div>
                                        {/if}
                                    </div>
                                {:else}
                                    <div class="flex-shrink-0">
                                        {#if addingItems.has(item.id)}
                                            <div class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center bg-gray-100">
                                                <Loader2 class="h-3 w-3 animate-spin text-gray-500" />
                                            </div>
                                        {:else if selectionMap[item.id]}
                                            <div class="w-5 h-5 border-2 border-blue-500 rounded-full flex items-center justify-center bg-white">
                                                <div class="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                                            </div>
                                        {:else}
                                            <div class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center bg-white hover:border-gray-400">
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                                <div class="flex-1 min-w-0">
                                    <div class="font-medium flex items-center gap-2 flex-wrap">
                                        {#if relationshipType === 'members'}
                                            {@const displayText = item.email || item.name || 'Unknown User'}
                                            <span class="truncate max-w-[280px]" title={displayText}>
                                                {truncateText(displayText, 35)}
                                            </span>
                                        {:else}
                                            {@const displayText = getDisplayName(item, relationshipType)}
                                            <span class="truncate max-w-[280px]" title={displayText}>
                                                {truncateText(displayText, 35)}
                                            </span>
                                        {/if}
                                        {#if addingItems.has(item.id)}
                                            <Badge variant="outline" class="animate-pulse">
                                                <Loader2 class="h-3 w-3 mr-1 animate-spin" />
                                                Adding...
                                            </Badge>
                                        {/if}
                                    </div>
                                    {#if relationshipType === 'members' && item.name && item.email}
                                        <div class="text-sm text-muted-foreground truncate max-w-[280px]" title={item.name}>
                                            {truncateText(item.name, 35)}
                                        </div>
                                    {:else if item.description}
                                        <div class="text-sm text-muted-foreground truncate max-w-[280px]" title={item.description}>
                                            {truncateText(item.description, 35)}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                            {#if item.status}
                                {@const statusBadge = getStatusBadge(item.status)}
                                {#if statusBadge}
                                    <svelte:component this={statusBadge.component} {...statusBadge.props}>
                                        {statusBadge.children}
                                    </svelte:component>
                                {/if}
                            {/if}
                        </div>
                    {/each}
                {:else}
                    <div class="text-center py-4 text-muted-foreground">
                        {#if searchTerm}
                            <div class="break-words px-2">
                                No {relationshipType} found matching "<span class="font-medium">{truncateText(searchTerm)}</span>"
                            </div>
                        {:else}
                            No available {relationshipType}
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- Selection Summary -->
            {#if multiSelect && selectedItemIds.length > 0}
                <div class="text-sm text-muted-foreground">
                    {selectedItemIds.length} item{selectedItemIds.length === 1 ? '' : 's'} selected
                </div>
            {/if}
        </div>

        <Dialog.Footer>
            <Button variant="outline" on:click={resetDialog} disabled={loading}>
                Cancel
            </Button>
            <Button 
                on:click={handleAdd}
                disabled={selectedItemIds.length === 0 || loading}
            >
                {#if loading}
                    <Loader2 class="h-4 w-4 mr-1 animate-spin" />
                {:else}
                    <Plus class="h-4 w-4 mr-1" />
                {/if}
                Add {getSingularForm(relationshipType)}{multiSelect && selectedItemIds.length > 1 ? 's' : ''}
                {#if relationshipType === 'members' && selectedRole && selectedRole !== 'MEMBER'}
                    as {AVAILABLE_ROLES.find(r => r.value === selectedRole)?.label || selectedRole}
                {/if}
                ({selectedItemIds.length})
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root> 