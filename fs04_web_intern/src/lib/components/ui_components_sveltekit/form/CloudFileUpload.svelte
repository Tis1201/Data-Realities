<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { Upload, X, FileText, Image, Video, File as FileIcon, Clipboard, CheckCircle, AlertCircle } from 'lucide-svelte';
    import { cn } from '$lib/utils/ui-utils';
    import { Button } from '$lib/components/ui/button';
    import { Progress } from '$lib/components/ui/progress';
    import { onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import UploadModal from './UploadModal.svelte';

    export let id: string = '';
    export let name: string = '';
    export let accept: string = '*/*';
    export let maxSize: number = 1000 * 1024 * 1024; // 500MB default
    export let multiple: boolean = false;
    export let disabled: boolean = false;
    export let value: File[] = [];
    export let preview: boolean = true;
    export let className: string = '';
    export let uploading: boolean = false;
    export let error: string = '';
    export let apiEndpoint: string = ''; // API endpoint for presigned URL generation
    export let autoUpload: boolean = false; // Whether to auto-upload files or wait for manual trigger

    const dispatch = createEventDispatcher<{
        change: { files: File[] };
        drop: { files: File[] };
        paste: { files: File[] };
        remove: { index: number };
        error: { message: string };
        uploadComplete: { file: File; url: string };
        uploadProgress: { file: File; progress: number };
        filesReady: { files: File[] };
    }>();

    let dragActive = false;
    let pasteActive = false;
    let pasteTimeout: ReturnType<typeof setTimeout> | null = null;
    let fileInput: HTMLInputElement;
    let dropZone: HTMLDivElement;
    let uploadStates: Map<string, { progress: number; status: 'pending' | 'uploading' | 'completed' | 'error'; url?: string }> = new Map();
    let overallUploading = false;
    let showUploadModal = false;
    let currentUploadFile: File | null = null;
    let currentUploadProgress = 0;
    let currentUploadStatus: 'uploading' | 'completed' | 'error' = 'uploading';
    let currentUploadError = '';

    // Handle file selection from input
    function handleFileChange(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.files) {
            const files = processFiles(Array.from(target.files));
            if (files.length > 0) {
                dispatch('change', { files });
                dispatch('filesReady', { files });
                
                if (autoUpload) {
                    // Start upload process for each file
                    files.forEach(file => startUpload(file));
                }
            }
        }
    }

    function handleDropZoneClick() {
        if (disabled || uploading || overallUploading) return;
        fileInput?.click();
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (disabled || uploading || overallUploading) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            fileInput?.click();
        }
    }

    function processFiles(files: File[]): File[] {
        const validFiles: File[] = [];
        
        for (const file of files) {
            if (file.size > maxSize) {
                dispatch('error', { message: `File ${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}.` });
                continue;
            }
            
            if (accept !== '*/*' && !isFileTypeAccepted(file, accept)) {
                dispatch('error', { message: `File ${file.name} is not an accepted file type. Only .zip, .cpk, .deb, .apk, and .exe files are allowed.` });
                continue;
            }
            
            validFiles.push(file);
        }
        
        return validFiles;
    }

    function isFileTypeAccepted(file: File, accept: string): boolean {
        if (accept === '*/*') return true;
        
        const acceptedTypes = accept.split(',').map(type => type.trim());
        return acceptedTypes.some(type => {
            if (type.startsWith('.')) {
                return file.name.toLowerCase().endsWith(type.toLowerCase());
            }
            if (type.includes('*')) {
                const baseType = type.split('/')[0];
                return file.type.startsWith(baseType + '/');
            }
            return file.type === type;
        });
    }

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function getFileIcon(file: File) {
        if (file.type.startsWith('image/')) return Image;
        if (file.type.startsWith('video/')) return Video;
        if (file.type === 'application/pdf') return FileText;
        return FileIcon;
    }

    function removeFile(index: number) {
        if (disabled || uploading || overallUploading) return;
        
        const file = value[index];
        if (file) {
            // Clean up upload state
            uploadStates.delete(file.name);
            dispatch('remove', { index });
        }
    }

    // Start upload process for a file
    async function startUpload(file: File) {
        if (!apiEndpoint) {
            dispatch('error', { message: 'Upload endpoint not configured' });
            return;
        }

        // Set overall uploading state and show modal
        overallUploading = true;
        currentUploadFile = file;
        currentUploadProgress = 0;
        currentUploadStatus = 'uploading';
        currentUploadError = '';
        showUploadModal = true;
        
        

        // Initialize upload state
        uploadStates.set(file.name, { progress: 0, status: 'pending' });
        dispatch('uploadProgress', { file, progress: 0 });

        // Variables to track upload details for cleanup if needed
        let bucket: string | undefined;
        let objectPath: string | undefined;

        try {
            // Get presigned URL
            // Use file.type if available, otherwise let the backend infer it from the file extension
            const requestContentType = file.type || '';
            
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName: file.name,
                    contentType: requestContentType,
                    expiresSeconds: 600
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to get presigned URL' }));
                throw new Error(errorData.details || errorData.error || `Failed to get presigned URL: ${response.status} ${response.statusText}`);
            }

            const { data } = await response.json();
            const { url, bucket: responseBucket, objectPath: responseObjectPath, contentType, resourcePath: apiResourcePath, resourceDisplayUrl } = data;
            
            // Validate that we got the required fields
            if (!url || !responseBucket || !responseObjectPath) {
                throw new Error('Invalid response from server: missing required fields');
            }
            
            // Store for potential cleanup
            bucket = responseBucket;
            objectPath = responseObjectPath;

            // Use the contentType returned from the API (it's what was used to sign the URL)
            const uploadContentType = contentType || file.type || 'application/octet-stream';

            // Update status to uploading
            uploadStates.set(file.name, { progress: 0, status: 'uploading' });
            currentUploadProgress = 0;

            // Start progress simulation before upload
            const progressInterval = setInterval(() => {
                if (currentUploadProgress < 90) {
                    // More realistic progress simulation
                    const increment = Math.random() * 8 + 2; // 2-10% increments
                    currentUploadProgress += increment;
                    const progress = Math.min(Math.round(currentUploadProgress), 90);
                    uploadStates.set(file.name, { 
                        progress, 
                        status: 'uploading' 
                    });
                    dispatch('uploadProgress', { file, progress });
                }
            }, 250);

            // Upload file to presigned URL
            const uploadResponse = await fetch(url, {
                method: 'PUT',
                body: file as BodyInit,
                headers: {
                    'Content-Type': uploadContentType,
                }
            });

            if (!uploadResponse.ok) {
                clearInterval(progressInterval);
                throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
            }

            // Clear progress interval and complete upload
            clearInterval(progressInterval);
            
            // Small delay to show completion
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Use resourcePath (object path) or resourceDisplayUrl (CDN URL) when API provides them; fallback for legacy
            const resolvedUrl = apiResourcePath ?? resourceDisplayUrl ?? `https://storage.googleapis.com/${bucket}/${objectPath}`;

            // Update status to completed
            currentUploadProgress = 100;
            currentUploadStatus = 'completed';
            uploadStates.set(file.name, { 
                progress: 100, 
                status: 'completed',
                url: resolvedUrl
            });

            dispatch('uploadProgress', { file, progress: 100 });
            dispatch('uploadComplete', { file, url: resolvedUrl });

        } catch (error) {
            console.error('Upload error:', error);
            currentUploadStatus = 'error';
            currentUploadError = error instanceof Error ? error.message : String(error);
            uploadStates.set(file.name, { 
                progress: 0, 
                status: 'error'
            });
            
            // Notify backend about failed upload for cleanup
            // Use object path or legacy URL - deleteFileFromCloudStorage accepts both
            if (bucket && objectPath) {
                try {
                    const cleanupPath = apiResourcePath ?? `https://storage.googleapis.com/${bucket}/${objectPath}`;
                    await fetch('/api/v2/upload/cleanup', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            filePath: cleanupPath,
                            resourceId: null // Will be set by backend if needed
                        })
                    });
                } catch (cleanupError) {
                    // Silently fail cleanup - it's not critical
                    console.error('Failed to notify backend about upload failure:', cleanupError);
                }
            }
            
            dispatch('error', { message: `Upload failed: ${error instanceof Error ? error.message : String(error)}` });
        } finally {
            // Check if all uploads are complete
            const allComplete = Array.from(uploadStates.values()).every(state => 
                state.status === 'completed' || state.status === 'error'
            );
            if (allComplete) {
                overallUploading = false;
            }
        }
    }

    function handleModalClose() {
        showUploadModal = false;
        currentUploadFile = null;
        currentUploadProgress = 0;
        currentUploadStatus = 'uploading';
        currentUploadError = '';
    }

    function handleModalRetry() {
        if (currentUploadFile) {
            startUpload(currentUploadFile);
        }
    }

    // Public method to trigger upload of all files
    export async function uploadFiles() {
        if (value && value.length > 0) {
            for (const file of value) {
                await startUpload(file);
            }
        }
    }

    // Public method to check if all files are uploaded
    export function areAllFilesUploaded(): boolean {
        if (!value || value.length === 0) return true;
        return value.every(file => {
            const state = uploadStates.get(file.name);
            return state?.status === 'completed';
        });
    }

    // Public method to get uploaded file URLs (for form submission)
    export function getUploadedUrls(): string[] {
        const urls: string[] = [];
        for (const file of value) {
            const state = uploadStates.get(file.name);
            if (state && state.status === 'completed' && state.url) {
                urls.push(state.url);
            }
        }
        return urls;
    }

    // Public method to clear file data after upload (to prevent 512KB limit)
    export function clearFileDataForSubmission() {
        // This will be called after uploads are complete to prevent
        // the file data from being sent in form submission
        value = [];
    }


    function handleDragEnter(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (disabled || uploading || overallUploading) return;
        dragActive = true;
    }

    function handleDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (disabled || uploading || overallUploading) return;
        dragActive = false;
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (disabled || uploading || overallUploading) return;
        dragActive = true;
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (disabled || uploading || overallUploading) return;
        
        dragActive = false;
        
        if (event.dataTransfer?.files) {
            const files = processFiles(Array.from(event.dataTransfer.files));
            if (files.length > 0) {
                dispatch('drop', { files });
                dispatch('filesReady', { files });
                
                if (autoUpload) {
                    // Start upload process for each file
                    files.forEach(file => startUpload(file));
                }
            }
        }
    }

    // Handle paste events (for images)
    function handlePaste(event: ClipboardEvent) {
        if (disabled || !event.clipboardData || uploading) return;
        
        // Check if we're focused on the drop zone or a child element
        const activeElement = document.activeElement;
        const isDropZoneFocused = dropZone.contains(activeElement) || activeElement === dropZone || activeElement === document.body;
        
        if (isDropZoneFocused) {
            const items = Array.from(event.clipboardData.items);
            const files: File[] = [];
            
            for (const item of items) {
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file) {
                        files.push(file);
                    }
                }
            }
            
            if (files.length > 0) {
                const validFiles = processFiles(files);
                if (validFiles.length > 0) {
                    dispatch('paste', { files: validFiles });
                    dispatch('filesReady', { files: validFiles });
                    
                    if (autoUpload) {
                        // Start upload process for each file
                        validFiles.forEach(file => startUpload(file));
                    }
                    
                    // Show paste feedback
                    pasteActive = true;
                    if (pasteTimeout) clearTimeout(pasteTimeout);
                    pasteTimeout = setTimeout(() => {
                        pasteActive = false;
                    }, 1000);
                }
            }
        }
    }

    let objectUrls: string[] = [];
    
    $: {
        // Only run in browser environment
        if (browser && typeof URL !== 'undefined') {
            // Clean up previous object URLs when value changes
            if (value) {
                // First revoke old URLs to prevent memory leaks
                objectUrls.forEach(url => {
                    if (url) URL.revokeObjectURL(url);
                });
                
                // Create new object URLs for previews if needed
                if (preview) {
                    objectUrls = value.map(file => {
                        // Only create URLs for image files with proper type
                        if (file && typeof file === 'object' && 'type' in file && file.type && file.type.startsWith('image/')) {
                            try {
                                return URL.createObjectURL(file);
                            } catch (error) {
                                console.error('Error creating object URL:', error);
                                return '';
                            }
                        }
                        return '';
                    });
                } else {
                    objectUrls = [];
                }
            } else {
                // If value is null/undefined, clean up and reset
                objectUrls.forEach(url => {
                    if (url) URL.revokeObjectURL(url);
                });
                objectUrls = [];
            }
        }
    }
    
    onDestroy(() => {
        if (browser && typeof URL !== 'undefined') {
            objectUrls.forEach(url => {
                if (url) URL.revokeObjectURL(url);
            });
        }
        if (pasteTimeout) clearTimeout(pasteTimeout);
    });
</script>

<svelte:window on:paste={handlePaste} />

<div class={cn("w-full", className)}>
    <!-- Hidden file input -->
    <input
        type="file"
        {id}
        {name}
        {accept}
        {multiple}
        {disabled}
        class="sr-only"
        bind:this={fileInput}
        on:change={handleFileChange}
    />
    
    <!-- Drop zone -->
    <div
        bind:this={dropZone}
        role="button"
        aria-label="Drop files here or click to upload"
        class={cn(
            "border-2 border-dashed rounded-md p-6 transition-colors",
            "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
            dragActive ? "border-primary bg-primary/5" : "",
            pasteActive ? "border-green-500 bg-green-50/10" : "border-muted-foreground/20",
            disabled || uploading || overallUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            "outline-none"
        )}
        tabindex={disabled || uploading || overallUploading ? -1 : 0}
        on:dragenter={handleDragEnter}
        on:dragleave={handleDragLeave}
        on:dragover={handleDragOver}
        on:drop={handleDrop}
        on:click={handleDropZoneClick}
        on:keydown={handleKeyDown}
    >
        <div class="flex flex-col items-center justify-center gap-4 text-center">
            <div class="rounded-full bg-muted p-3">
                <Upload class="h-6 w-6 text-muted-foreground" />
            </div>
            <div class="space-y-1">
                <p class="text-sm font-medium">
                    {#if overallUploading}
                        Uploading to server...
                    {:else if uploading}
                        Uploading...
                    {:else}
                        Drop files here or click to upload
                    {/if}
                </p>
                <p class="text-xs text-muted-foreground">
                    {accept === '*/*' ? 'Any file type' : `Accepted: ${accept}`} • Max {formatFileSize(maxSize)}
                </p>
                {#if overallUploading}
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div class="bg-blue-600 h-2 rounded-full animate-pulse" style="width: 100%"></div>
                    </div>
                {/if}
                
                <!-- Files Ready for Upload (when autoUpload is false) -->
                {#if !autoUpload && value && value.length > 0}
                    <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex items-start space-x-2 min-w-0 flex-1">
                                <Upload class="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div class="min-w-0 flex-1">
                                    <div class="text-sm font-medium text-blue-900 truncate" title={value.length === 1 ? value[0].name : `${value.length} files ready`}>
                                        {value.length === 1 ? value[0].name : `${value.length} files ready`}
                                    </div>
                                    {#if value.length === 1}
                                        <p class="text-xs text-blue-600 mt-0.5">{formatFileSize(value[0].size)}</p>
                                    {/if}
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 flex-shrink-0">
                                <span class="text-xs text-blue-600 font-medium whitespace-nowrap">Ready to upload</span>
                                <button
                                    type="button"
                                    class="text-blue-600 hover:text-blue-800 p-1 flex-shrink-0"
                                    on:click={() => {
                                        value = [];
                                        uploadStates.clear();
                                        showUploadModal = false;
                                        currentUploadFile = null;
                                    }}
                                >
                                    <X class="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
    
    <!-- Error message -->
    {#if error}
        <div class="mt-2 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle class="h-4 w-4" />
            <span>{error}</span>
        </div>
    {/if}
    
    <!-- File previews with upload status -->
    {#if browser && value && value.length > 0}
        <div class="mt-4 space-y-2">
            {#each value as file, i}
                {#if file}
                    {@const uploadState = uploadStates.get(file.name)}
                    <div class="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                        {#if preview && file && typeof file === 'object' && 'type' in file && file.type && file.type.startsWith('image/') && objectUrls[i]}
                            <div class="h-10 w-10 rounded-md overflow-hidden flex-shrink-0">
                                <img 
                                    src={objectUrls[i]} 
                                    alt={file.name || 'Image preview'} 
                                    class="h-full w-full object-cover"
                                />
                            </div>
                        {:else}
                            <svelte:component this={getFileIcon(file)} class="h-5 w-5 text-muted-foreground" />
                        {/if}
                        
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium truncate">{file.name || 'Unnamed file'}</p>
                            <p class="text-xs text-muted-foreground">{formatFileSize(file.size || 0)}</p>
                            
                            <!-- Upload progress -->
                            {#if uploadState}
                                <div class="mt-1">
                                    {#if uploadState.status === 'pending'}
                                        <div class="flex items-center gap-1 text-xs text-muted-foreground">
                                            <div class="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
                                            <span>Pending...</span>
                                        </div>
                                    {:else if uploadState.status === 'uploading'}
                                        <div class="space-y-1">
                                            <div class="flex items-center gap-1 text-xs text-muted-foreground">
                                                <div class="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                <span>Uploading... {uploadState.progress}%</span>
                                            </div>
                                            <Progress value={Number(uploadState.progress)} class="h-1" />
                                        </div>
                                    {:else if uploadState.status === 'completed'}
                                        <div class="flex items-center gap-1 text-xs text-green-600">
                                            <CheckCircle class="h-3 w-3" />
                                            <span>Uploaded successfully</span>
                                        </div>
                                    {:else if uploadState.status === 'error'}
                                        <div class="flex items-center gap-1 text-xs text-destructive">
                                            <AlertCircle class="h-3 w-3" />
                                            <span>Upload failed</span>
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                        
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            class="h-8 w-8" 
                            disabled={disabled || uploading}
                            on:click={(e) => {
                                e.stopPropagation();
                                removeFile(i);
                            }}
                        >
                            <X class="h-4 w-4" />
                            <span class="sr-only">Remove file</span>
                        </Button>
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
</div>

<!-- Upload Modal -->
<UploadModal
    isOpen={showUploadModal}
    fileName={currentUploadFile?.name || ''}
    progress={currentUploadProgress}
    status={currentUploadStatus}
    errorMessage={currentUploadError}
    on:close={handleModalClose}
    on:retry={handleModalRetry}
/>
