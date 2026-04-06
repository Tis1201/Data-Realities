<script lang="ts">
    import { Badge } from "$lib/components/ui/badge";
    import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip";
    
    export let webhookEndpoints: any[] = [];
    export let whatsappAccounts: any[] = [];
    export let listenToAll: boolean = false;
    
    $: webhookCount = webhookEndpoints?.length || 0;
    $: whatsappCount = whatsappAccounts?.length || 0;
</script>

<div class="flex flex-wrap gap-2">
    {#if listenToAll}
        <Badge variant="outline" class="text-xs">All Events</Badge>
    {:else}
        {#if webhookCount > 0}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant="secondary" class="text-xs">
                        <span class="font-medium">{webhookCount}</span> 
                        <span class="ml-1">{webhookCount === 1 ? 'endpoint' : 'endpoints'}</span>
                    </Badge>
                </TooltipTrigger>
                <TooltipContent align="start" class="p-2">
                    <div class="text-xs">
                        <div class="font-medium mb-1">Webhook Endpoints:</div>
                        {#if webhookCount > 0}
                            <ul class="list-disc pl-4 space-y-1">
                                {#each webhookEndpoints.slice(0, 5) as endpoint}
                                    <li class="truncate max-w-[200px]">{endpoint.name}</li>
                                {/each}
                                {#if webhookEndpoints.length > 5}
                                    <li class="text-muted-foreground">+{webhookEndpoints.length - 5} more</li>
                                {/if}
                            </ul>
                        {:else}
                            <div class="text-muted-foreground">None connected</div>
                        {/if}
                    </div>
                </TooltipContent>
            </Tooltip>
        {/if}
        
        {#if whatsappCount > 0}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant="secondary" class="text-xs">
                        <span class="font-medium">{whatsappCount}</span> 
                        <span class="ml-1">{whatsappCount === 1 ? 'account' : 'accounts'}</span>
                    </Badge>
                </TooltipTrigger>
                <TooltipContent align="start" class="p-2">
                    <div class="text-xs">
                        <div class="font-medium mb-1">WhatsApp Accounts:</div>
                        {#if whatsappCount > 0}
                            <ul class="list-disc pl-4 space-y-1">
                                {#each whatsappAccounts.slice(0, 5) as account}
                                    <li class="truncate max-w-[200px]">{account.name || account.phoneNumber}</li>
                                {/each}
                                {#if whatsappAccounts.length > 5}
                                    <li class="text-muted-foreground">+{whatsappAccounts.length - 5} more</li>
                                {/if}
                            </ul>
                        {:else}
                            <div class="text-muted-foreground">None connected</div>
                        {/if}
                    </div>
                </TooltipContent>
            </Tooltip>
        {/if}
        
        {#if webhookCount === 0 && whatsappCount === 0}
            <Badge variant="outline" class="text-xs text-muted-foreground">No connections</Badge>
        {/if}
    {/if}
</div>
