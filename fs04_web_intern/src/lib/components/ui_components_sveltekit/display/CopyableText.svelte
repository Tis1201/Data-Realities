<script lang="ts">
    import { Check, Copy } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { cn } from "$lib/utils/ui-utils";
    import { Skeleton } from "$lib/components/ui/skeleton";
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";
    
    export let text: string;
    export let className = "";
    export let loading = false;
    export let mask = false;
    export let showCopyButton = true;
    export let monospace = false;
    export let maskLength = 16; // Maximum number of mask characters
    export let visiblePrefix = 4; // Number of characters to show at the beginning
    export let visibleSuffix = 4; // Number of characters to show at the end
    export let maskChar = "•"; // Character to use for masking
    export let tooltipText = "Copy to clipboard";
    export let copiedTooltipText = "Copied!";
    export let buttonSize = "icon"; // "icon", "sm", "default", "lg"
    export let buttonVariant = "outline"; // "outline", "ghost", "default", etc.
    
    let copied = false;
    let timeout: NodeJS.Timeout;
    
    // Mask the text for display
    function getMaskedText(value: string): string {
        if (!value) return "";
        
        // If the string is shorter than the combined visible parts, just return it
        if (value.length <= (visiblePrefix + visibleSuffix)) return value;
        
        // Get the prefix and suffix parts
        const prefix = value.substring(0, visiblePrefix);
        const suffix = value.substring(value.length - visibleSuffix);
        
        // Calculate how many mask characters we need
        // Use a fixed number of mask characters instead of trying to match the hidden portion length
        const middleMask = maskChar.repeat(maskLength);
        
        return `${prefix}${middleMask}${suffix}`;
    }
    
    // Function to copy text to clipboard
    async function copyToClipboard() {
        if (!text) return;
        
        try {
            await navigator.clipboard.writeText(text);
            copied = true;
            
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                copied = false;
            }, 2000);
        } catch (error) {
            console.error("Failed to copy text:", error);
        }
    }
    
    // Clean up on component destroy
    import { onDestroy } from "svelte";
    onDestroy(() => {
        if (timeout) clearTimeout(timeout);
    });
</script>

<div class={cn("flex items-center space-x-2", className)}>
    {#if loading}
        <div class="flex-1">
            <Skeleton class="h-9 w-full" />
        </div>
        {#if showCopyButton}
            <Skeleton class="h-9 w-9" />
        {/if}
    {:else}
        <div class={cn(
            "flex-1 bg-muted/40 border border-muted rounded-md px-3 py-2 text-sm overflow-x-auto",
            monospace && "font-mono tracking-wide text-primary-foreground font-medium"
        )}>
            {mask ? getMaskedText(text) : text}
        </div>
        
        {#if showCopyButton}
            <Tooltip.Root>
                <Tooltip.Trigger>
                    <Button 
                        variant={buttonVariant} 
                        size={buttonSize} 
                        on:click={copyToClipboard}
                        class="h-9 w-9"
                    >
                        {#if copied}
                            <Check class="h-4 w-4 text-success" />
                        {:else}
                            <Copy class="h-4 w-4" />
                        {/if}
                    </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>
                    <p>{copied ? copiedTooltipText : tooltipText}</p>
                </Tooltip.Content>
            </Tooltip.Root>
        {/if}
    {/if}
</div>