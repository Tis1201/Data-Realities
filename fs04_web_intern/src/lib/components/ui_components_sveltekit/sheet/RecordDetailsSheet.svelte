<script lang="ts">
    import { writable, type Writable } from "svelte/store";
    import { Skeleton } from "$lib/components/ui/skeleton";
    import {
        Sheet,
        SheetContent,
        SheetDescription,
        SheetHeader,
        SheetTitle,
        SheetFooter,
        SheetClose
    } from "$lib/components/ui/sheet";

    // Generic type for record
    export let open: Writable<boolean> = writable(false);
    export let record: any = null;
    
    // Customization props
    export let title = "Record Details";
    export let description = "Detailed information about the selected record";
    export let closeButtonText = "Close";
    export let side: "top" | "right" | "bottom" | "left" = "right";
    export let size: "sm" | "md" | "lg" | "xl" | "full" = "md";
    
    // Determine width class based on size
    let sizeClass: string;
    $: {
        switch (size) {
            case "sm": sizeClass = "sm:max-w-sm"; break;
            case "md": sizeClass = "sm:max-w-md"; break;
            case "lg": sizeClass = "sm:max-w-lg"; break;
            case "xl": sizeClass = "sm:max-w-xl"; break;
            case "full": sizeClass = "sm:max-w-full"; break;
            default: sizeClass = "sm:max-w-md";
        }
    }
</script>

<Sheet bind:open={$open}>
    <SheetContent {side} class={sizeClass}>
        <div class="flex flex-col h-full max-h-full overflow-hidden">
            <SheetHeader class="pb-2">
                <SheetTitle class="text-xl">{title}</SheetTitle>
                <SheetDescription class="text-sm text-muted-foreground">
                    {description}
                </SheetDescription>
            </SheetHeader>
            
            <div class="flex-1 overflow-y-auto pr-1 -mr-1">
                {#if record}
                    <slot name="content" {record}>
                        <!-- Default content if no slot is provided -->
                        <div class="py-4 space-y-4">
                            <div class="border rounded-md p-4">
                                <div class="grid grid-cols-[120px_1fr] gap-3">
                                    {#each Object.entries(record) as [key, value]}
                                        {#if key !== 'id' && typeof value !== 'object'}
                                            <div class="text-sm text-muted-foreground">{key}</div>
                                            <div class="text-sm">{value || 'N/A'}</div>
                                        {/if}
                                    {/each}
                                </div>
                            </div>
                        </div>
                    </slot>
                {:else}
                    <div class="py-4 space-y-4">
                        <Skeleton class="h-16 w-full rounded-md" />
                        <Skeleton class="h-24 w-full rounded-md" />
                        <Skeleton class="h-32 w-full rounded-md" />
                        <Skeleton class="h-24 w-full rounded-md" />
                    </div>
                {/if}
            </div>
            
            <SheetFooter class="pt-4 border-t mt-auto">
                <slot name="footer">
                    <SheetClose class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                        {closeButtonText}
                    </SheetClose>
                </slot>
            </SheetFooter>
        </div>
    </SheetContent>
</Sheet>
