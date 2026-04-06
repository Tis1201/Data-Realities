<script lang="ts">
    import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import ChevronDown from "lucide-svelte/icons/chevron-down";
    import ChevronUp from "lucide-svelte/icons/chevron-up";
    import { slide } from "svelte/transition";
    import { writable } from "svelte/store";
    
    // Define the error message type
    type ErrorMessage = {
        type?: 'error' | 'success' | 'info' | 'warning';
        text?: string;
        details?: string;
        code?: string;
        requestId?: string;
        timestamp?: string | number;
    };
    
    export let message: ErrorMessage | null = null;
    export let className = "mb-6"; // Keep as className in the props
    export let showDetails = false;
    export let useDialog = false;
    
    // Local state for expanded details
    const expanded = writable(false);
    
    // Function to format timestamp
    function formatTimestamp(timestamp: string | number | undefined): string {
        if (!timestamp) return '';
        try {
            return new Date(timestamp).toLocaleString();
        } catch (e) {
            return String(timestamp);
        }
    }
</script>

{#if message}
    <Alert 
        variant={message.type === 'success' ? 'default' : 'destructive'} 
        class={className}
    >
        <AlertTitle>{message.type === 'error' ? 'Error' : 'Information'}</AlertTitle>
        <AlertDescription>
            <div class="space-y-2">
                <p class="font-medium">{message.text || 'An error occurred'}</p>
                
                {#if message.details}
                    <p class="text-sm">{message.details}</p>
                {/if}
                
                {#if message.code || message.requestId || message.timestamp}
                    {#if useDialog}
                        <Dialog.Root>
                            <Dialog.Trigger asChild let:builder>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    class="mt-1 h-7 text-xs"
                                    builders={[builder]}
                                >
                                    View technical details
                                </Button>
                            </Dialog.Trigger>
                            <Dialog.Content class="sm:max-w-md">
                                <Dialog.Header>
                                    <Dialog.Title>Error Details</Dialog.Title>
                                    <Dialog.Description>
                                        Technical information about this error
                                    </Dialog.Description>
                                </Dialog.Header>
                                <div class="text-xs bg-muted p-4 rounded font-mono">
                                    {#if message.code}
                                        <div class="flex justify-between py-1">
                                            <span class="font-semibold">Code:</span>
                                            <span>{message.code}</span>
                                        </div>
                                    {/if}
                                    {#if message.requestId}
                                        <div class="flex justify-between py-1">
                                            <span class="font-semibold">Request ID:</span>
                                            <span>{message.requestId}</span>
                                        </div>
                                    {/if}
                                    {#if message.timestamp}
                                        <div class="flex justify-between py-1">
                                            <span class="font-semibold">Time:</span>
                                            <span>{formatTimestamp(message.timestamp)}</span>
                                        </div>
                                    {/if}
                                </div>
                                <Dialog.Footer>
                                    <Dialog.Close asChild let:builder>
                                        <Button builders={[builder]}>Close</Button>
                                    </Dialog.Close>
                                </Dialog.Footer>
                            </Dialog.Content>
                        </Dialog.Root>
                    {:else if showDetails}
                        <div class="text-xs bg-background/50 p-2 rounded">
                            {#if message.code}
                                <p><span class="font-mono">Code:</span> {message.code}</p>
                            {/if}
                            {#if message.requestId}
                                <p><span class="font-mono">Request ID:</span> {message.requestId}</p>
                            {/if}
                            {#if message.timestamp}
                                <p><span class="font-mono">Time:</span> {formatTimestamp(message.timestamp)}</p>
                            {/if}
                        </div>
                    {:else}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            class="p-0 h-6 text-xs flex items-center gap-1"
                            on:click={() => $expanded = !$expanded}
                        >
                            <span>Technical details</span>
                            {#if $expanded}
                                <ChevronUp size={14} />
                            {:else}
                                <ChevronDown size={14} />
                            {/if}
                        </Button>
                        
                        {#if $expanded}
                            <div class="text-xs bg-background/50 p-2 rounded" transition:slide={{ duration: 150 }}>
                                {#if message.code}
                                    <p><span class="font-mono">Code:</span> {message.code}</p>
                                {/if}
                                {#if message.requestId}
                                    <p><span class="font-mono">Request ID:</span> {message.requestId}</p>
                                {/if}
                                {#if message.timestamp}
                                    <p><span class="font-mono">Time:</span> {formatTimestamp(message.timestamp)}</p>
                                {/if}
                            </div>
                        {/if}
                    {/if}
                {/if}
            </div>
        </AlertDescription>
    </Alert>
{/if}
