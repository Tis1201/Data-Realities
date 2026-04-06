<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { X, Upload, CheckCircle, AlertCircle } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button';
    import { Progress } from '$lib/components/ui/progress';

    export let isOpen: boolean = false;
    export let fileName: string = '';
    export let progress: number = 0;
    export let status: 'uploading' | 'completed' | 'error' = 'uploading';
    export let errorMessage: string = '';

    const dispatch = createEventDispatcher<{
        close: void;
        retry: void;
    }>();

    function handleClose() {
        if (status === 'completed' || status === 'error') {
            dispatch('close');
        }
    }

    function handleRetry() {
        dispatch('retry');
    }

    // Calculate progress for circular indicator
    $: circumference = 2 * Math.PI * 45; // radius = 45
    $: strokeDasharray = circumference;
    $: strokeDashoffset = circumference - (progress / 100) * circumference;
    
</script>

{#if isOpen}
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <!-- Modal -->
        <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {#if status === 'uploading'}
                        Uploading File
                    {:else if status === 'completed'}
                        Upload Complete
                    {:else if status === 'error'}
                        Upload Failed
                    {/if}
                </h3>
                {#if status === 'completed' || status === 'error'}
                    <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8"
                        on:click={handleClose}
                    >
                        <X class="h-4 w-4" />
                    </Button>
                {/if}
            </div>

            <!-- Content -->
            <div class="text-center space-y-6">
                <!-- File Info -->
                <div class="space-y-2">
                    <p class="text-sm text-gray-600 dark:text-gray-400 truncate" title={fileName}>
                        {fileName}
                    </p>
                </div>

                <!-- Progress Indicator -->
                <div class="flex justify-center">
                    {#if status === 'uploading'}
                        <!-- Circular Progress -->
                        <div class="relative w-24 h-24">
                            <svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                                <!-- Background circle -->
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="currentColor"
                                    stroke-width="8"
                                    fill="none"
                                    class="text-gray-200 dark:text-gray-700"
                                />
                                <!-- Progress circle -->
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="currentColor"
                                    stroke-width="8"
                                    fill="none"
                                    stroke-linecap="round"
                                    class="text-blue-600 transition-all duration-300 ease-in-out"
                                    style="
                                        stroke-dasharray: {strokeDasharray};
                                        stroke-dashoffset: {strokeDashoffset};
                                    "
                                />
                            </svg>
                            <!-- Percentage text -->
                            <div class="absolute inset-0 flex items-center justify-center">
                                <span class="text-lg font-semibold text-gray-900 dark:text-white">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                        </div>
                    {:else if status === 'completed'}
                        <!-- Success Icon -->
                        <div class="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <CheckCircle class="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                    {:else if status === 'error'}
                        <!-- Error Icon -->
                        <div class="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                            <AlertCircle class="w-12 h-12 text-red-600 dark:text-red-400" />
                        </div>
                    {/if}
                </div>

                <!-- Status Message -->
                <div class="space-y-2">
                    {#if status === 'uploading'}
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            Uploading to server...
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-500">
                            Please don't close this window
                        </p>
                    {:else if status === 'completed'}
                        <p class="text-sm text-green-600 dark:text-green-400 font-medium">
                            File uploaded successfully!
                        </p>
                    {:else if status === 'error'}
                        <p class="text-sm text-red-600 dark:text-red-400 font-medium">
                            {errorMessage || 'Upload failed. Please try again.'}
                        </p>
                    {/if}
                </div>

                <!-- Linear Progress Bar (for additional visual feedback) -->
                {#if status === 'uploading'}
                    <div class="w-full">
                        <Progress value={progress} class="h-2" />
                    </div>
                {/if}

                <!-- Action Buttons -->
                {#if status === 'error'}
                    <div class="flex gap-3 justify-center">
                        <Button variant="outline" on:click={handleClose}>
                            Cancel
                        </Button>
                        <Button on:click={handleRetry}>
                            Try Again
                        </Button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
