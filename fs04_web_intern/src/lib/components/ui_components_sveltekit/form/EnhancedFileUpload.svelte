<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Upload, X, FileText, Image, Video, File, Clipboard } from 'lucide-svelte';
    import { cn } from '$lib/utils/ui-utils';
    import { Button } from '$lib/components/ui/button';
    import { Progress } from '$lib/components/ui/progress';
    import { onDestroy } from 'svelte';
    import { browser } from '$app/environment';

    export let id: string = '';
    export let name: string = '';
    export let accept: string = '*/*';
    export let maxSize: number = 1000 * 1024 * 1024; // 500MB default
    export let multiple: boolean = false;
    export let disabled: boolean = false;
    export let value: File[] = [];
    export let preview: boolean = true;
    export let showProgress: boolean = true;
    export let className: string = '';
    export let uploadProgress: number = 0;
    export let uploading: boolean = false;
    export let error: string = '';

    const dispatch = createEventDispatcher<{
        change: { files: File[] };
        drop: { files: File[] };
        paste: { files: File[] };
        remove: { index: number };
        error: { message: string };
    }>();

    let dragActive = false;
    let pasteActive = false;
    let pasteTimeout: ReturnType<typeof setTimeout> | null = null;
    let fileInput: HTMLInputElement;
    let dropZone: HTMLDivElement;
    // Handle file selection from input
    function handleFileChange(event: Event) {
        const target = event.target as HTMLInputElement;
        if (!target.files || target.files.length === 0) return;
        
        const files = processFiles(Array.from(target.files));
        if (files.length > 0) {
            dispatch('change', { files });
            // Let the parent component handle the value binding
            // This prevents conflicts between the internal state and external binding
        }
        
        // Reset the input value to allow selecting the same file again
        if (fileInput) {
            fileInput.value = '';
        }
    }

    // Process files to check size and type
    function processFiles(files: File[]): File[] {
        const validFiles: File[] = [];
        error = ''; // Clear previous errors
        
        for (const file of files) {
            if (file.size > maxSize) {
                const sizeMB = (maxSize / (1024 * 1024)).toFixed(2);
                const errorMsg = `File ${file.name} exceeds maximum size of ${sizeMB}MB`;
                dispatch('error', { message: errorMsg });
                error = errorMsg;
                continue;
            }
            
            // Check if file type is accepted
            if (accept !== '*/*') {
                const acceptTypes = accept.split(',').map(type => type.trim());
                const fileType = file.type;
                const fileName = file.name.toLowerCase();
                
                const isAccepted = acceptTypes.some(type => {
                    // Handle extension-based validation (e.g., .zip, .cpk, .apk)
                    if (type.startsWith('.')) {
                        return fileName.endsWith(type.toLowerCase());
                    }
                    // Handle MIME type validation
                    if (type.endsWith('/*')) {
                        const category = type.split('/')[0];
                        return fileType.startsWith(category + '/');
                    }
                    return type === fileType;
                });
                
                if (!isAccepted) {
                    const errorMsg = `File type ${fileType} is not accepted. Only .zip, .cpk, and .apk files are allowed.`;
                    dispatch('error', { message: errorMsg });
                    error = errorMsg;
                    continue;
                }
            }
            
            validFiles.push(file);
        }
        
        return validFiles;
    }

    // Handle drag events
    function handleDragEnter(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) return;
        dragActive = true;
    }

    function handleDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) return;
        
        // Only set dragActive to false if we're leaving the dropzone
        // and not entering a child element
        if (event.target === dropZone) {
            dragActive = false;
        }
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) return;
        dragActive = true;
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) return;
        
        dragActive = false;
        
        if (event.dataTransfer?.files) {
            const files = processFiles(Array.from(event.dataTransfer.files));
            if (files.length > 0) {
                dispatch('drop', { files });
                // Let the parent component handle the value binding
                // This prevents conflicts between the internal state and external binding
            }
        }
    }

    // Handle paste events (for images)
    function handlePaste(event: ClipboardEvent) {
        if (disabled || !event.clipboardData) return;
        
        // Check if we're focused on the drop zone or a child element
        const activeElement = document.activeElement;
        const isDropZoneFocused = dropZone.contains(activeElement) || activeElement === dropZone || activeElement === document.body;
        
        if (isDropZoneFocused) {
            const items = event.clipboardData.items;
            const imageFiles: File[] = [];
            
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) imageFiles.push(file);
                }
            }
            
            if (imageFiles.length > 0) {
                const files = processFiles(imageFiles);
                if (files.length > 0) {
                    event.preventDefault();
                    dispatch('paste', { files });
                    // Let the parent component handle the value binding
                    // This prevents conflicts between the internal state and external binding
                    
                    // Reset paste active state after successful paste
                    pasteActive = false;
                    if (pasteTimeout) {
                        clearTimeout(pasteTimeout);
                        pasteTimeout = null;
                    }
                }
            } else {
                error = 'No image found in clipboard. Try copying an image first.';
                dispatch('error', { message: error });
            }
        }
    }
    
    // Handle click on drop zone
    function handleDropZoneClick() {
        if (disabled) return;
        
        // Focus the drop zone to capture paste events
        dropZone.focus();
        
        // Clear any existing timeout
        if (pasteTimeout) {
            clearTimeout(pasteTimeout);
            pasteTimeout = null;
        }
        
        // Activate paste mode
        pasteActive = true;
        
        // Set a timeout to deactivate paste mode after 5 seconds
        pasteTimeout = setTimeout(() => {
            pasteActive = false;
            pasteTimeout = null;
        }, 5000);
    }

    // Handle keyboard events for accessibility
    function handleKeyDown(event: KeyboardEvent) {
        if (disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleDropZoneClick();
        }
    }

    // Remove a file from the selection
    function removeFile(index: number) {
        // Only dispatch the remove event, let the parent component handle the value binding
        // This prevents conflicts between the internal state and external binding
        dispatch('remove', { index });
    }

    // Get file icon based on type
    function getFileIcon(file: any) {
        // Handle null or undefined files
        if (!file) return File;
        
        // Handle browser environment check
        if (!browser || typeof file !== 'object' || !('type' in file) || !file.type) return File;
        
        const type = file.type;
        
        if (type.startsWith('image/')) return Image;
        if (type.startsWith('video/')) return Video;
        if (type.startsWith('text/') || type.includes('document')) return FileText;
        
        return File;
    }

    // Format file size
    function formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    // Cleanup object URLs on component unmount
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
        aria-label="Drop files here or click to paste an image"
        class={cn(
            "border-2 border-dashed rounded-md p-6 transition-colors",
            "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
            dragActive ? "border-primary bg-primary/5" : "",
            pasteActive ? "border-green-500 bg-green-50/10" : "border-muted-foreground/20",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            "outline-none"
        )}
        tabindex={disabled ? "-1" : "0"}
        on:dragenter={handleDragEnter}
        on:dragleave={handleDragLeave}
        on:dragover={handleDragOver}
        on:drop={handleDrop}
        on:click={handleDropZoneClick}
        on:keydown={handleKeyDown}
    >
        <div class="flex flex-col items-center justify-center gap-4 text-center">
            <Upload class="h-10 w-10 text-muted-foreground" />
            
            <div class="flex flex-col gap-1">
                <p class="text-sm font-medium">
                    {#if pasteActive}
                        <span class="text-green-600">Press Ctrl+V (or Cmd+V) to paste an image</span>
                    {:else}
                        Drag and drop files here or click to paste an image
                    {/if}
                </p>
                
                <!-- Action buttons -->
                <div class="flex flex-wrap justify-center gap-2 mt-2">
                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        disabled={disabled}
                        on:click={() => fileInput.click()}
                    >
                        <File class="h-4 w-4 mr-2" />
                        Browse Files
                    </Button>
                    
                    <Button
                        type="button"
                        variant={pasteActive ? "default" : "outline"}
                        size="sm"
                        disabled={disabled}
                        on:click={handleDropZoneClick}
                        class={pasteActive ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                    >
                        <Clipboard class="h-4 w-4 mr-2" />
                        {pasteActive ? "Ready to Paste" : "Paste Image"}
                    </Button>
                </div>
                
                <!-- File type and size info -->
                <p class="text-xs text-muted-foreground mt-3">
                    {#if accept !== '*/*'}
                        Accepted file types: {accept}
                    {/if}
                    {#if maxSize}
                        {accept !== '*/*' ? ' • ' : ''}
                        Max size: {formatFileSize(maxSize)}
                    {/if}
                </p>
                
                <!-- Error message -->
                {#if error}
                    <p class="text-xs text-destructive mt-1">{error}</p>
                {/if}
            </div>
        </div>
    </div>
    
    <!-- Upload progress -->
    {#if showProgress && uploading}
        <div class="mt-2">
            <Progress value={uploadProgress} />
            <p class="text-xs text-muted-foreground mt-1">Uploading... {uploadProgress}%</p>
        </div>
    {/if}
    
    <!-- File previews -->
    {#if browser && value && value.length > 0}
        <div class="mt-4 space-y-2">
            {#each value as file, i}
                {#if file}
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
