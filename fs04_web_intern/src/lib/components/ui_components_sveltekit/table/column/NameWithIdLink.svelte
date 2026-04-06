<script lang="ts">
    import { goto } from "$app/navigation";
    import { Badge } from "$lib/components/ui/badge";
    import { page } from "$app/stores"
    
    // Props for the component
    export let record: any;
    export let baseUrl: string = "/admin/whatsapp/accounts";
    export let idField: string = "id";
    export let nameField: string = "name";
    export let showId: boolean = true;
    export let className: string = "";
    export let showBadge: boolean = false;
    export let badgeText: string = "";
    export let badgeClass: string = "bg-yellow-50 text-yellow-800 border-yellow-200";
    export let useDirectUrl: boolean = false; // If true, use baseUrl as-is without appending ID
    
    // Get the display name and full name (for tooltip)
    $: displayName = record[nameField] || '';
    $: fullName = record.fullName || record[nameField] || '';
    $: showTooltip = fullName && fullName.length > displayName.length;

    const returnUrl = encodeURIComponent($page.url.pathname + $page.url.search)

    // Function to navigate to edit page
    function navigateToEdit() {
        const url = useDirectUrl ? baseUrl : `${baseUrl}/${record[idField]}?returnUrl=${returnUrl}`;
        goto(url);
    }
</script>

<div 
    class="cursor-pointer {className}" 
    on:click={navigateToEdit} 
    on:keydown={(e) => e.key === 'Enter' && navigateToEdit()}
    role="button"
    tabindex="0"
    aria-label="Edit {fullName}"
    title={showTooltip ? fullName : undefined}
>
    <div class="flex items-center gap-2">
        <span class="font-medium text-blue-600 hover:underline">{displayName}</span>
        {#if showBadge && badgeText}
            <Badge variant="outline" class={badgeClass}>{badgeText}</Badge>
        {/if}
    </div>
    {#if showId}
        <div
            class="truncate max-w-full"
            style="font-family: var(--ds-font-family-primary); font-size: 12px; color: var(--ds-color-gray-500); margin-top: 2px;"
            title={record[idField]}
        >{record[idField]}</div>
    {/if}
</div>
