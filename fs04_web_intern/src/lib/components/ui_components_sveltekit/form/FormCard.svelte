<script lang="ts">
    /**
     * A reusable form card component that provides consistent styling and layout for forms
     * across the application. It handles loading states with skeletons and provides a
     * standardized container for form content.
     */
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
    import { onMount } from 'svelte';
    
    // Props
    export let title: string;
    export let description: string = "";
    export let loading: boolean = false;
    export let maxWidth: string = "max-w-5xl"; // Default max width
    export let footerSlot: boolean = false; // Whether the form has a footer section
    export let error: any = null; // Error object or message
    export let nullValue: any = undefined; // Prop to handle null value passed from parent
    
    import { tick } from 'svelte';
    
    // Function to handle error display
    async function processError() {
        await tick();
        console.log('FormCard processing error:', error);
    }
    
    // Call processError whenever error changes
    $: if (error !== undefined) processError();
    
    // Compute error display properties directly from the error prop
    $: hasError = !!error;
    $: errorType = error?.type || 'error';
    $: errorText = error?.text || 'An error occurred';
    $: errorDetails = error?.details || '';
    $: errorCode = error?.code || '';
    $: errorRequestId = error?.requestId || '';
    $: errorTimestamp = error?.timestamp || '';
</script>

<Card class={maxWidth}>
    <CardHeader>
        <CardTitle>{title}</CardTitle>
        {#if description}
            <CardDescription>{description}</CardDescription>
        {/if}
    </CardHeader>
    <CardContent>
        <!-- Debug info - hidden in production -->
        <div class="hidden">
            <p>Has error: {hasError}</p>
            <p>Error type: {errorType}</p>
            <p>Error text: {errorText}</p>
        </div>
        
        {#if hasError}
            <Alert variant={errorType === 'success' ? 'default' : 'destructive'} class="mb-6">
                <AlertTitle>{errorType === 'error' ? 'Error' : 'Information'}</AlertTitle>
                <AlertDescription>
                    <div class="space-y-2">
                        <p class="font-medium">{errorText}</p>
                        {#if errorDetails}
                            <p class="text-sm">{errorDetails}</p>
                        {/if}
                        {#if errorCode}
                            <div class="text-xs bg-background/50 p-2 rounded">
                                <p><span class="font-mono">Code:</span> {errorCode}</p>
                                {#if errorRequestId}
                                    <p><span class="font-mono">Request ID:</span> {errorRequestId}</p>
                                {/if}
                                {#if errorTimestamp}
                                    <p><span class="font-mono">Time:</span> {new Date(errorTimestamp).toLocaleString()}</p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                </AlertDescription>
            </Alert>
        {/if}
        
        {#if loading}
            <slot name="skeleton">
                <!-- Default skeleton if none provided -->
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="h-8 w-full bg-muted rounded animate-pulse"></div>
                        <div class="h-8 w-full bg-muted rounded animate-pulse"></div>
                    </div>
                    <div class="h-20 w-full bg-muted rounded animate-pulse"></div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="h-8 w-full bg-muted rounded animate-pulse"></div>
                        <div class="flex justify-end gap-4">
                            <div class="h-10 w-24 bg-muted rounded animate-pulse"></div>
                            <div class="h-10 w-32 bg-muted rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </slot>
        {:else}
            <slot></slot>
            
            {#if footerSlot}
                <slot name="footer"></slot>
            {/if}
        {/if}
    </CardContent>
</Card>
