<script lang="ts">
    import { Copy, Check } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { Button } from "$lib/components/ui/button";
    import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip";
    import { browser } from "$app/environment";
    import { onMount } from "svelte";

    export let postfix: string;
    export let basePath: string = "/api/webhook";
    let copied = false;
    let fullUrl = "";
    
    onMount(() => {
        if (browser) {
            updateFullUrl();
            // Update URL if window location changes
            window.addEventListener('popstate', updateFullUrl);
            return () => {
                window.removeEventListener('popstate', updateFullUrl);
            };
        }
    });
    
    function updateFullUrl() {
        const origin = window.location.origin;
        fullUrl = `${origin}${basePath}/${postfix}`;
    }
    
    async function copyToClipboard(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Make sure we have the latest URL
        updateFullUrl();
        await navigator.clipboard.writeText(fullUrl);
        copied = true;
        toast.success('Endpoint URL copied to clipboard');
        setTimeout(() => {
            copied = false;
        }, 2000);
    }
</script>

<div class="flex items-center gap-2 w-full flex-wrap">
    {#if browser}
        <div class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs bg-muted text-muted-foreground overflow-hidden break-all max-w-full">
            <span class="break-all">{fullUrl}</span>
        </div>
    {:else}
        <div class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs bg-muted text-muted-foreground overflow-hidden break-all max-w-full">
            <span class="break-all">{basePath}/{postfix}</span>
        </div>
    {/if}
    <Tooltip>
        <TooltipTrigger asChild>
            <Button 
                variant="outline" 
                size="icon" 
                class="h-6 w-6 p-0 border-dashed" 
                on:click={copyToClipboard}
            >
                {#if copied}
                    <Check class="h-3.5 w-3.5 text-green-500" />
                {:else}
                    <Copy class="h-3.5 w-3.5" />
                {/if}
            </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
            <p>Copy full endpoint URL</p>
        </TooltipContent>
    </Tooltip>
</div>
