<script lang="ts">
    import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import ChevronDown from "lucide-svelte/icons/chevron-down";
    import ChevronUp from "lucide-svelte/icons/chevron-up";
    import { slide } from "svelte/transition";
    import { writable } from "svelte/store";
    
    // Define the message type
    type MessageType = 'error' | 'success' | 'info' | 'warning';
    
    export type AlertMessage = {
        type?: MessageType;
        text?: string;
        details?: string;
        code?: string;
        requestId?: string;
        timestamp?: string | number;
    };
    
    export let message: AlertMessage | null = null;
    export let className = "";
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
    
    // Get variant based on message type
    function getVariant(type: MessageType | undefined): string {
        switch (type) {
            case 'error': return 'destructive';
            case 'warning': return 'warning';
            case 'success': return 'default';
            case 'info': return 'info';
            default: return 'default';
        }
    }
    
    // Get title based on message type
    function getTitle(type: MessageType | undefined): string {
        switch (type) {
            case 'error': return 'Error';
            case 'warning': return 'Warning';
            case 'success': return 'Success';
            case 'info': return 'Information';
            default: return 'Message';
        }
    }
</script>

{#if message}
    <Alert 
        variant={getVariant(message.type)} 
        className={className}
    >
        <AlertTitle>{getTitle(message.type)}</AlertTitle>
        <AlertDescription>
            <div className="space-y-2">
                <p className="font-medium">{message.text || 'An alert message occurred'}</p>
                
                {#if message.details}
                    <p className="text-sm">{message.details}</p>
                {/if}
                
                {#if message.code || message.requestId || message.timestamp}
                    {#if useDialog}
                        <Dialog.Root>
                            <Dialog.Trigger asChild let:builder>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-1 h-7 text-xs"
                                    builders={[builder]}
                                >
                                    View technical details
                                </Button>
                            </Dialog.Trigger>
                            <Dialog.Content className="sm:max-w-md">
                                <Dialog.Header>
                                    <Dialog.Title>Message Details</Dialog.Title>
                                    <Dialog.Description>
                                        Technical information about this message
                                    </Dialog.Description>
                                </Dialog.Header>
                                <div className="text-xs bg-muted p-4 rounded font-mono">
                                    {#if message.code}
                                        <div className="flex justify-between py-1">
                                            <span className="font-semibold">Code:</span>
                                            <span>{message.code}</span>
                                        </div>
                                    {/if}
                                    {#if message.requestId}
                                        <div className="flex justify-between py-1">
                                            <span className="font-semibold">Request ID:</span>
                                            <span>{message.requestId}</span>
                                        </div>
                                    {/if}
                                    {#if message.timestamp}
                                        <div className="flex justify-between py-1">
                                            <span className="font-semibold">Time:</span>
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
                        <div className="text-xs bg-background/50 p-2 rounded">
                            {#if message.code}
                                <p><span className="font-mono">Code:</span> {message.code}</p>
                            {/if}
                            {#if message.requestId}
                                <p><span className="font-mono">Request ID:</span> {message.requestId}</p>
                            {/if}
                            {#if message.timestamp}
                                <p><span className="font-mono">Time:</span> {formatTimestamp(message.timestamp)}</p>
                            {/if}
                        </div>
                    {:else}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-0 h-6 text-xs flex items-center gap-1"
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
                            <div className="text-xs bg-background/50 p-2 rounded" transition:slide={{ duration: 150 }}>
                                {#if message.code}
                                    <p><span className="font-mono">Code:</span> {message.code}</p>
                                {/if}
                                {#if message.requestId}
                                    <p><span className="font-mono">Request ID:</span> {message.requestId}</p>
                                {/if}
                                {#if message.timestamp}
                                    <p><span className="font-mono">Time:</span> {formatTimestamp(message.timestamp)}</p>
                                {/if}
                            </div>
                        {/if}
                    {/if}
                {/if}
            </div>
        </AlertDescription>
    </Alert>
{/if}
