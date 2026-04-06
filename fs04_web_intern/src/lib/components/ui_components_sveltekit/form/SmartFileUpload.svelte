<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { browser } from '$app/environment';
    import EnhancedFileUpload from './EnhancedFileUpload.svelte';
    import CloudFileUpload from './CloudFileUpload.svelte';
    import { getPresignedUrlEndpoint } from '$lib/utils/storage-utils';

    export let id: string = '';
    export let name: string = '';
    export let accept: string = '*/*';
    export let maxSize: number = 1000 * 1024 * 1024; // 500MB
    export let multiple: boolean = false;
    export let disabled: boolean = false;
    export let value: File[] = [];
    export let preview: boolean = true;
    export let className: string = '';
    export let uploading: boolean = false;
    export let error: string = '';
    export let isAdmin: boolean = false; // Whether this is for admin or user context
    export let autoUpload: boolean = false; // Whether to auto-upload files

    const dispatch = createEventDispatcher<{
        change: { files: File[] };
        drop: { files: File[] };
        paste: { files: File[] };
        remove: { index: number };
        error: { message: string };
        uploadComplete?: { file: File; url: string };
        uploadProgress?: { file: File; progress: number };
    }>();

    let storageMode: 'LOCAL' | 'LOCAL_CLOUD' | 'GCLOUD' = 'LOCAL';
    let useCloudUpload = false;
    let cloudUploading = false;
    let cloudFileUploadRef: any;

    // Check storage mode on mount
    onMount(async () => {
        if (browser) {
            try {
                // Fetch storage configuration from server
                const response = await fetch('/api/storage/config');
                if (response.ok) {
                    const config = await response.json();
                    storageMode = config.mode;
                    useCloudUpload = storageMode === 'LOCAL_CLOUD' || storageMode === 'GCLOUD';
                }
            } catch (error) {
                console.warn('Failed to fetch storage configuration, using LOCAL mode:', error);
                storageMode = 'LOCAL';
                useCloudUpload = false;
            }
        }
    });

    function handleChange(event: CustomEvent<{ files: File[] }>) {
        dispatch('change', event.detail);
    }

    function handleDrop(event: CustomEvent<{ files: File[] }>) {
        dispatch('drop', event.detail);
    }

    function handlePaste(event: CustomEvent<{ files: File[] }>) {
        dispatch('paste', event.detail);
    }

    function handleRemove(event: CustomEvent<{ index: number }>) {
        dispatch('remove', event.detail);
    }

    function handleError(event: CustomEvent<{ message: string }>) {
        dispatch('error', event.detail);
    }

    function handleUploadComplete(event: CustomEvent<{ file: File; url: string }>) {
        console.log('[SmartFileUpload] Received uploadComplete from CloudFileUpload:', event.detail);
        console.log('[SmartFileUpload] Dispatching uploadComplete to parent');
        dispatch('uploadComplete', event.detail);
    }

    function handleUploadProgress(event: CustomEvent<{ file: File; progress: number }>) {
        dispatch('uploadProgress', event.detail);
    }

    function handleCloudUploadStart() {
        cloudUploading = true;
    }

    function handleCloudUploadEnd() {
        cloudUploading = false;
    }

    // Expose uploadFiles method
    export async function uploadFiles() {
        if (useCloudUpload && cloudFileUploadRef) {
            return await cloudFileUploadRef.uploadFiles();
        }
    }

    // Expose areAllFilesUploaded method
    export function areAllFilesUploaded(): boolean {
        if (useCloudUpload && cloudFileUploadRef) {
            return cloudFileUploadRef.areAllFilesUploaded();
        }
        return true;
    }
</script>

{#if useCloudUpload}
    <CloudFileUpload
        bind:this={cloudFileUploadRef}
        {id}
        {name}
        {accept}
        {maxSize}
        {multiple}
        {disabled}
        bind:value
        {preview}
        {className}
        uploading={uploading || cloudUploading}
        {error}
        {autoUpload}
        apiEndpoint={getPresignedUrlEndpoint(isAdmin)}
        on:change={handleChange}
        on:drop={handleDrop}
        on:paste={handlePaste}
        on:remove={handleRemove}
        on:error={handleError}
        on:uploadComplete={handleUploadComplete}
        on:uploadProgress={handleUploadProgress}
    />
{:else}
    <EnhancedFileUpload
        {id}
        {name}
        {accept}
        {maxSize}
        {multiple}
        {disabled}
        bind:value
        {preview}
        {className}
        {uploading}
        {error}
        on:change={handleChange}
        on:drop={handleDrop}
        on:paste={handlePaste}
        on:remove={handleRemove}
        on:error={handleError}
    />
{/if}
