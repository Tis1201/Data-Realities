<script lang="ts">
    import { Skeleton } from "$lib/components/ui/skeleton";
    import { Button } from "$lib/components/ui/button";
    import {
        Copy,
        Eye,
        EyeOff,
        RefreshCw,
        Clock as ClockIcon,
        Calendar,
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { writable } from "svelte/store";
    import { cn } from "$lib/utils/ui-utils";
    import RelativeDate from "$lib/components/ui_components_sveltekit/date/RelativeDate.svelte";
    import { Check } from "lucide-svelte";
    // Props
    export let apiKey: string = "";
    export let createdAt: Date | string | null = null;
    export let rotatedAt: Date | string | null = null;
    export let loading: boolean = false;
    export let showCopyButton: boolean = true;
    export let showVisibilityToggle: boolean = true;
    export let maskCharacter: string = "•";
    export let className: string = "";
    export let buttonClass: string = "h-8 w-8 p-1.5 hover:bg-muted rounded";
    export let truncate: boolean = false; // Single line with ellipsis for compact table display
    export let maxMaskLength: number = 8; // Max number of mask chars to show when truncated

    // State
    const isVisible = writable(false);
    const isCopied = writable(false);

    // Format the API key for display
    $: maskedKey = apiKey ? maskApiKey(apiKey, $isVisible, maskCharacter) : "";

    // Format dates
    $: formattedCreatedAt = formatDate(createdAt);
    $: formattedRotatedAt = formatDate(rotatedAt);

    // Helper functions
    function maskApiKey(key: string, visible: boolean, mask: string): string {
        if (visible) {
            // When visible and truncate mode, show truncated visible key
            if (truncate && key.length > 20) {
                return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
            }
            return key;
        }

        // Show first 4 and last 4 characters, mask the rest
        if (key.length <= 8) return key;
        const firstFour = key.substring(0, 4);
        const lastFour = key.substring(key.length - 4);

        // For truncate mode, limit the masked portion
        if (truncate) {
            const maskedPart = mask.repeat(
                Math.min(maxMaskLength, key.length - 8),
            );
            return `${firstFour}${maskedPart}${lastFour}`;
        }

        const maskedPart = mask.repeat(key.length - 8);
        return `${firstFour}${maskedPart}${lastFour}`;
    }

    function formatDate(date: Date | string | null): string {
        if (!date) return "";
        const d = typeof date === "string" ? new Date(date) : date;
        return d.toLocaleString();
    }

    async function copyToClipboard() {
        if (!apiKey) return;

        try {
            await navigator.clipboard.writeText(apiKey);
            isCopied.set(true);
            toast.success("API key copied to clipboard");

            // Reset the copied state after 2 seconds
            setTimeout(() => {
                isCopied.set(false);
            }, 2000);
        } catch (error) {
            toast.error("Failed to copy API key");
            console.error("Failed to copy API key:", error);
        }
    }

    function toggleVisibility() {
        isVisible.update((value) => !value);
    }
</script>

{#if loading}
    <div class="space-y-2">
        <Skeleton class="h-8 w-full" />
        <Skeleton class="h-4 w-1/2" />
    </div>
{:else if !apiKey}
    <div class="text-sm text-muted-foreground italic">
        No API key has been generated
    </div>
{:else}
    <div class={cn("w-full", className)}>
        <div class="flex items-center gap-2 w-full">
            <div
                class={cn(
                    "font-mono text-xs bg-muted/50 p-2 rounded border flex-1 min-w-[100px] overflow-hidden",
                    truncate ? "truncate whitespace-nowrap" : "break-all",
                )}
            >
                <span
                    class={truncate ? "" : "break-words"}
                    title={truncate ? apiKey : undefined}>{maskedKey}</span
                >
            </div>

            <div class="flex items-center space-x-1">
                {#if showVisibilityToggle}
                    <Button
                        variant="ghost"
                        size="icon"
                        class={buttonClass}
                        on:click={toggleVisibility}
                        title={$isVisible ? "Hide key" : "Show key"}
                    >
                        {#if $isVisible}
                            <EyeOff class="h-4 w-4" />
                        {:else}
                            <Eye class="h-4 w-4" />
                        {/if}
                    </Button>
                {/if}

                {#if showCopyButton}
                    <Button
                        variant="ghost"
                        size="icon"
                        class={buttonClass}
                        on:click={copyToClipboard}
                        title="Copy to clipboard"
                    >
                        {#if $isCopied}
                            <Check class="h-4 w-4 text-green-500" />
                        {:else}
                            <Copy class="h-4 w-4" />
                        {/if}
                    </Button>
                {/if}
            </div>
        </div>

        {#if createdAt || rotatedAt}
            <div class="text-xs text-muted-foreground">
                <div class="flex items-center gap-4">
                    {#if createdAt}
                        <div class="flex items-center gap-1.5">
                            <Calendar
                                size={12}
                                class="text-muted-foreground/50"
                            />
                            <span class="font-medium text-foreground/80"
                                >Created</span
                            >
                            <span class="text-muted-foreground/70">
                                <RelativeDate
                                    date={createdAt}
                                    format="relative"
                                    showTooltip={true}
                                    useHoverCard={false}
                                    iconSize={0}
                                    className="text-inherit hover:underline"
                                />
                            </span>
                        </div>
                    {/if}
                    {#if rotatedAt && rotatedAt !== createdAt}
                        <div class="flex items-center gap-1.5">
                            <ClockIcon
                                size={12}
                                class="text-muted-foreground/50"
                            />
                            <span class="font-medium text-foreground/80"
                                >Rotated</span
                            >
                            <span class="text-muted-foreground/70">
                                <RelativeDate
                                    date={rotatedAt}
                                    format="relative"
                                    showTooltip={true}
                                    useHoverCard={false}
                                    iconSize={0}
                                    className="text-inherit hover:underline"
                                />
                            </span>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
{/if}
