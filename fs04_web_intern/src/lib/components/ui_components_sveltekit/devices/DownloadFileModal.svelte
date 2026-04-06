<script lang="ts">
  import { onMount } from 'svelte';
  
  export let show = false;
  export let fileName = '';
  export let fileSize = 0;
  export let downloadUrl = '';
  export let loading = false;
  export let progress = 0;
  export let statusMessage = '';

  export let onClose: () => void;
  export let onDownload: (fileHandle?: FileSystemFileHandle) => void;

  let supportsFileSystemAccess = false;
  let selectedLocation = 'downloads'; // 'downloads' or 'custom'
  let customPath = '';

  onMount(() => {
    // Check if browser supports File System Access API
    supportsFileSystemAccess = 'showSaveFilePicker' in window;
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !loading) {
      handleDownload();
    }
  }

  async function handleDownload() {
    if (selectedLocation === 'downloads') {
      // Traditional download to Downloads folder
      onDownload && onDownload();
    } else {
      // Use File System Access API to let user choose location
      try {
        if (supportsFileSystemAccess) {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: 'All Files',
              accept: { '*/*': [] }
            }]
          });
          onDownload && onDownload(fileHandle);
        } else {
          // Fallback to traditional download
          onDownload && onDownload();
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error selecting file location:', error);
        }
      }
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

{#if show}
  <div class="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 overflow-y-auto p-4">
    <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-[90vw] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col my-4 sm:my-0">
      <div class="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <h3 class="text-base font-semibold">Download File</h3>
          <p class="text-xs text-neutral-500 mt-1">Choose where to save the file on your computer</p>
        </div>
        <button class="text-neutral-500 hover:text-neutral-800" on:click={onClose}>✕</button>
      </div>
      
      <div class="flex-1 overflow-hidden flex flex-col">
        <!-- File Information -->
        <div class="px-4 py-6">
          <div class="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-neutral-900 dark:text-white truncate">
                  {fileName || 'Unknown file'}
                </p>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  {formatFileSize(fileSize)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Download Location Selection -->
        <div class="px-4 py-4 border-t border-neutral-200 dark:border-neutral-800">
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            Choose Download Location
          </label>
          
          <div class="space-y-3">
            <!-- Downloads Folder Option -->
            <label class="flex items-center space-x-3 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <input
                type="radio"
                bind:group={selectedLocation}
                value="downloads"
                disabled={loading}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300"
              />
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <svg class="h-5 w-5 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  <span class="text-sm font-medium text-neutral-900 dark:text-white">Downloads Folder</span>
                </div>
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Save to your default Downloads folder
                </p>
              </div>
            </label>

            <!-- Custom Location Option (if supported) -->
            {#if supportsFileSystemAccess}
              <label class="flex items-center space-x-3 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <input
                  type="radio"
                  bind:group={selectedLocation}
                  value="custom"
                  disabled={loading}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300"
                />
                <div class="flex-1">
                  <div class="flex items-center space-x-2">
                    <svg class="h-5 w-5 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-sm font-medium text-neutral-900 dark:text-white">Choose Location</span>
                  </div>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Select a custom folder and filename
                  </p>
                </div>
              </label>
            {/if}
          </div>
        </div>

        <!-- Progress Display -->
        {#if loading}
          <div class="px-4 py-4 border-t border-neutral-200 dark:border-neutral-800">
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-neutral-600 dark:text-neutral-400">Downloading file...</span>
                <span class="text-neutral-600 dark:text-neutral-400">{progress}%</span>
              </div>
              <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div 
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style="width: {progress}%"
                ></div>
              </div>
              {#if statusMessage}
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{statusMessage}</p>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Browser Support Info -->
        <div class="px-4 py-4 border-t border-neutral-200 dark:border-neutral-800">
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Download Information
                </h3>
                <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <ul class="list-disc list-inside space-y-1">
                    <li>Files will be downloaded to your chosen location</li>
                    <li>Large files may take several minutes to download</li>
                    <li>You can monitor progress in the action logs</li>
                    {#if supportsFileSystemAccess}
                      <li>Modern browsers support custom location selection</li>
                    {:else}
                      <li>Your browser will use the default Downloads folder</li>
                    {/if}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
        <button
          on:click={onClose}
          disabled={loading}
          class="px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          on:click={handleDownload}
          disabled={loading}
          class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if loading}
            <div class="flex items-center gap-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Downloading...
            </div>
          {:else}
            Download File
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
