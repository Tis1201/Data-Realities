<script lang="ts">
    /**
     * A standardized form container component that provides consistent
     * form structure and spacing for form content.
     */
    import ErrorAlert from "$lib/components/ui_components_sveltekit/alerts/ErrorAlert.svelte";
    import { toast } from 'svelte-sonner';
    import { onMount } from 'svelte';
    
    // Define proper types for error messages
    interface ExtendedErrorMessage {
        text: string;
        details?: string;
        code?: string;
        requestId?: string;
        timestamp?: string | number;
    }
    
    // Props
    export let action: string = "?/save";
    // Optional form id so external buttons can target this form via the 'form' attribute
    export let id: string | undefined = undefined;
    export let spacing: number = 4; // Space between form elements (tailwind spacing)
    export let method: string = "POST";
    export let enhance: any = undefined;
    export let novalidate: boolean = false;
    export let enctype: string | undefined = undefined;
    export let errorMessage: ExtendedErrorMessage | string | null | undefined = null;
    export let successMessage: ExtendedErrorMessage | string | null | undefined = null;
    export let showAlerts: boolean = true;
    export let showToasts: boolean = true; // Control whether to show toasts
    
    // New props for timeout and loading states
    export let hasTimeout: boolean = false;
    export let isLoading: boolean = false;
    export let delayed: boolean = false;
    export let disabled: boolean = false;
    
    // Customization options for the new features
    export let timeoutTitle: string = "Request Timeout";
    export let timeoutMessage: string = "The request is taking longer than expected. Please check your connection and try again.";
    export let loadingText: string = "Processing...";
    export let delayedText: string = "Saving changes...";
    export let showTimeoutAlert: boolean = true;
    export let showLoadingOverlay: boolean = true;

    // Process messages to ensure they're in the correct format
    $: processedErrorMessage = errorMessage ? 
        (typeof errorMessage === 'string' ? { text: errorMessage } : 
         errorMessage?.text ? { 
            text: errorMessage.text,
            details: errorMessage.details,
            code: errorMessage.code,
            requestId: errorMessage.requestId,
            timestamp: errorMessage.timestamp
         } : null) : null;
         
    $: processedSuccessMessage = successMessage ? 
        (typeof successMessage === 'string' ? { text: successMessage } : 
         successMessage?.text ? { 
            text: successMessage.text,
            details: successMessage.details,
            code: successMessage.code,
            requestId: successMessage.requestId,
            timestamp: successMessage.timestamp
         } : null) : null;

    // Track if we've shown a toast to prevent duplicates
    let lastToastMessage = '';
    
    // Show toast when messages change
    $: if (showToasts && processedErrorMessage) {
        const message = processedErrorMessage.text;
        if (message && message !== lastToastMessage) {
            lastToastMessage = message;
            toast.error(message);
        }
    }
    
    $: if (showToasts && processedSuccessMessage) {
        const message = processedSuccessMessage.text;
        if (message && message !== lastToastMessage) {
            lastToastMessage = message;
            toast.success(message);
        }
    }
</script>

<div class="w-full">
    {#if processedErrorMessage && showAlerts}
        <div class="w-full mb-4">
            <ErrorAlert 
                message={{
                    type: 'error',
                    text: processedErrorMessage.text,
                    details: processedErrorMessage.details,
                    code: processedErrorMessage.code,
                    requestId: processedErrorMessage.requestId,
                    timestamp: processedErrorMessage.timestamp
                }} 
                className="w-full"
                showDetails={true}
            />
            <!-- Only show debug info in development mode -->
            {#if import.meta.env.DEV && processedErrorMessage}
                <div class="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                    <pre>Error Message Debug: {JSON.stringify(processedErrorMessage, null, 2)}</pre>
                </div>
            {/if}
        </div>
    {/if}

    {#if processedSuccessMessage && !processedErrorMessage && showAlerts}
        <div class="w-full mb-4">
            <ErrorAlert 
                message={{
                    type: 'success',
                    text: processedSuccessMessage.text,
                    details: processedSuccessMessage.details
                }} 
                className="w-full"
                showDetails={true}
            />
        </div>
    {/if}

    <form {id} {method} action={action} use:enhance={enhance} {novalidate} enctype={enctype} class="w-full relative">
        <!-- Timeout Alert -->
        {#if hasTimeout && showTimeoutAlert}
            <div class="mb-4">
                <ErrorAlert 
                    message={{
                        type: 'warning',
                        text: `${timeoutTitle}: ${timeoutMessage}`
                    }}
                    className="w-full"
                />
            </div>
        {/if}

        <!-- Loading State Overlay -->
        {#if isLoading && showLoadingOverlay}
            <div class="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <div class="flex items-center space-x-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span class="text-sm text-muted-foreground">
                        {delayed ? delayedText : loadingText}
                    </span>
                </div>
            </div>
        {/if}

        <div class="space-y-{spacing} w-full">
            <slot />
        </div>
    </form>
    
    <!-- Debug message state (hidden in production) -->
    {#if import.meta.env.DEV && (processedErrorMessage || processedSuccessMessage)}
        <div class="hidden">
            <p>Debug message state:</p>
            <pre>{JSON.stringify({
                error: processedErrorMessage,
                success: processedSuccessMessage,
                originalError: errorMessage,
                originalSuccess: successMessage
            }, null, 2)}</pre>
        </div>
    {/if}
</div>
