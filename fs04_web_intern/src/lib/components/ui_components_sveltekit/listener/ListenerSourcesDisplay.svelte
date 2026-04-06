<script lang="ts">
    import { Badge } from "$lib/components/ui/badge";
    
    export let webhookEndpoints: any[] = [];
    export let whatsappAccounts: any[] = [];
    export let listenToAll: boolean = false;
    export let showBadges: boolean = true;
</script>

{#if listenToAll}
    <div class="flex items-center gap-2 flex-wrap">
        <span class="text-sm break-words">All Events</span>
        {#if showBadges}
            <Badge variant="outline" class="text-xs">Global</Badge>
        {/if}
    </div>
{:else}
    <div class="flex flex-col gap-1 w-full">
        {#if webhookEndpoints.length > 0 || whatsappAccounts.length > 0}
            <div class="flex flex-wrap gap-2">
                {#if webhookEndpoints.length > 0}
                    <div class="flex items-center gap-1 flex-wrap">
                        {#if showBadges}
                            <Badge variant="outline" class="text-xs">Webhook</Badge>
                        {/if}
                        <span class="text-sm break-words">{webhookEndpoints.length} endpoint{webhookEndpoints.length !== 1 ? 's' : ''}</span>
                    </div>
                {/if}
                
                {#if whatsappAccounts.length > 0}
                    <div class="flex items-center gap-1 flex-wrap">
                        {#if showBadges}
                            <Badge variant="outline" class="text-xs">WhatsApp</Badge>
                        {/if}
                        <span class="text-sm break-words">{whatsappAccounts.length} account{whatsappAccounts.length !== 1 ? 's' : ''}</span>
                    </div>
                {/if}
            </div>
        {:else}
            <span class="text-sm text-muted-foreground break-words">No sources</span>
        {/if}
    </div>
{/if}
