<script lang="ts">
  export let show = false;
  export let sourcePath = '';
  export let loading = false;
  export let progress = 0;
  export let statusMessage = '';

  export let onClose: () => void;
  export let onConfirm: () => void;

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && sourcePath.trim()) {
      onConfirm && onConfirm();
    }
  }
</script>

{#if show}
  <div class="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 overflow-y-auto p-4">
    <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-[90vw] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col my-4 sm:my-0">
      <div class="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <h3 class="text-base font-semibold">Pull File from Device</h3>
          <p class="text-xs text-neutral-500 mt-1">Enter the path to a file on the device to pull to server</p>
        </div>
        <button class="text-neutral-500 hover:text-neutral-800" on:click={onClose}>✕</button>
      </div>
      
      <div class="flex-1 overflow-hidden flex flex-col">
        <!-- Source Path Input -->
        <div class="px-4 py-6">
          <label for="source-path" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Source File Path on Device
          </label>
          <input
            id="source-path"
            type="text"
            placeholder="e.g., /home/user/documents/file.txt"
            bind:value={sourcePath}
            on:keydown={handleKeydown}
            disabled={loading}
            class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p class="text-xs text-neutral-500 mt-1">Enter the full path to the file you want to pull from the device</p>
        </div>

        <!-- Progress Display -->
        {#if loading}
          <div class="px-4 py-4 border-t border-neutral-200 dark:border-neutral-800">
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-neutral-600 dark:text-neutral-400">Pulling file...</span>
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

        <!-- File Info -->
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
                  File Transfer Information
                </h3>
                <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <ul class="list-disc list-inside space-y-1">
                    <li>The file will be streamed from the device to the server</li>
                    <li>Large files may take several minutes to transfer</li>
                    <li>You can monitor progress in the action logs</li>
                    <li>The file will be saved to the server's resource storage</li>
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
          on:click={onConfirm}
          disabled={!sourcePath.trim() || loading}
          class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if loading}
            <div class="flex items-center gap-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Pulling...
            </div>
          {:else}
            Pull File
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
