<script lang="ts">
    import { Skeleton } from "$lib/components/ui/skeleton";
    import { Badge } from "$lib/components/ui/badge";
    import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip";
    import { cn } from "$lib/utils/ui-utils";

    export let webhooks: string[] = [];
    export let whatsappAccounts: string[] = [];
    export let type: "webhooks" | "whatsapp" = "webhooks";
    export let loading = false;

    $: isEmpty = type === "webhooks" ? !webhooks?.length : !whatsappAccounts?.length;
    $: items = type === "webhooks" ? webhooks : whatsappAccounts;
    $: label = type === "webhooks" ? "Webhooks" : "WhatsApp";
</script>

{#if loading}
    <div class="flex flex-col gap-1">
        <Skeleton class="h-5 w-20" />
        <Skeleton class="h-6 w-32" />
    </div>
{:else}
    <div class="flex flex-col gap-1">
        <span class="text-xs font-medium text-muted-foreground">{label}</span>
        {#if isEmpty}
            <span class="text-xs text-muted-foreground">None connected</span>
        {:else}
            <div class="flex flex-wrap gap-1">
                {#each items.slice(0, 2) as item}
                    <Badge variant="outline" class="text-xs">{item}</Badge>
                {/each}
                {#if items.length > 2}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="outline" class="text-xs cursor-help">+{items.length - 2} more</Badge>
                        </TooltipTrigger>
                        <TooltipContent align="start" class="max-w-[300px]">
                            <div class="text-xs space-y-1">
                                {#each items.slice(2) as item}
                                    <div class="truncate">{item}</div>
                                {/each}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                {/if}
            </div>
        {/if}
    </div>
{/if}
