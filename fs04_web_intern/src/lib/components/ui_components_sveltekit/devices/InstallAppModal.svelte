<script lang="ts">
  export let show = false;
  export let items: any[] = [];
  export let loading = false;
  export let page = 1;
  export let totalPages = 1;
  export let search = '';
  export let selectedId: string | null = null;

  export let searchFn: (page?: number) => void;
  export let selectFn: (id: string) => void;
  export let onClose: () => void;
  export let onConfirm: () => void;

  function handleSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      searchFn && searchFn(1);
    }
  }

  // Format file size: convert bytes to KB, MB, or GB
  function formatFileSize(bytes: number | null | undefined): string {
    if (!bytes || bytes === 0) return '-';
    
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${Math.round(kb * 10) / 10} KB`;
    }
    
    const mb = kb / 1024;
    if (mb < 1024) {
      return `${Math.round(mb * 10) / 10} MB`;
    }
    
    const gb = mb / 1024;
    return `${Math.round(gb * 10) / 10} GB`;
  }

  // Get file type from format or file extension
  function getFileType(file: any): string {
    if (file.format) {
      return file.format.toUpperCase();
    }
    if (file.name) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext) {
        return ext.toUpperCase();
      }
    }
    return '-';
  }
</script>

{#if show}
  <div class="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 overflow-y-auto p-4">
    <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-[90vw] max-w-3xl max-h-[90vh] overflow-hidden flex flex-col my-4 sm:my-0">
      <div class="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <h3 class="text-base font-semibold">Select App</h3>
          <p class="text-xs text-neutral-500 mt-1">Resources sorted by creation date (newest first)</p>
        </div>
        <button class="text-neutral-500 hover:text-neutral-800" on:click={onClose}>✕</button>
      </div>
      <div class="p-4 space-y-3">
        <div class="flex items-center gap-2">
          <input
            class="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
            placeholder="Search apps..."
            bind:value={search}
            on:keydown={handleSearchKeydown}
          />
          <button class="text-sm px-3 py-2 rounded-md bg-neutral-900 text-white" on:click={() => searchFn && searchFn(1)}>Search</button>
        </div>

        {#if loading}
          <div class="py-10 text-center text-sm text-neutral-500">Loading apps…</div>
        {:else if items.length === 0}
          <div class="py-10 text-center text-sm text-neutral-500">No apps found.</div>
        {:else}
          <div class="space-y-2 max-h-[48vh] overflow-auto pr-1">
            {#each items as app}
              <label class="flex items-start gap-3 p-3 rounded-md border hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                <input type="radio" name="app" value={app.id} checked={selectedId === app.id} on:change={() => selectFn && selectFn(app.id)} />
                <div class="flex-1">
                  <!-- Resource Information Table -->
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="space-y-1">
                      <div class="flex">
                        <span class="font-medium text-neutral-600 dark:text-neutral-400 w-16">ID:</span>
                        <span class="text-neutral-800 dark:text-neutral-200 font-mono">{app.id}</span>
                      </div>
                      <div class="flex">
                        <span class="font-medium text-neutral-600 dark:text-neutral-400 w-16">Name:</span>
                        <span class="text-neutral-800 dark:text-neutral-200">{app.name || '-'}</span>
                      </div>
                      <div class="flex">
                        <span class="font-medium text-neutral-600 dark:text-neutral-400 w-16">Package:</span>
                        <span class="text-neutral-800 dark:text-neutral-200">{app.packageName || '-'}</span>
                      </div>
                      <div class="flex">
                        <span class="font-medium text-neutral-600 dark:text-neutral-400 w-16">Type:</span>
                        <span class="text-neutral-800 dark:text-neutral-200">{getFileType(app)}</span>
                      </div>
                    </div>
                    <div class="space-y-1">
                      <div class="flex">
                        <span class="font-medium text-neutral-600 dark:text-neutral-400 w-16">Version:</span>
                        <span class="text-neutral-800 dark:text-neutral-200">{app.version || '-'}</span>
                      </div>
                      <div class="flex">
                        <span class="font-medium text-neutral-600 dark:text-neutral-400 w-16">Size:</span>
                        <span class="text-neutral-800 dark:text-neutral-200">
                          {formatFileSize(app.size)}
                        </span>
                      </div>
                      <div class="flex">
                        <span class="font-medium text-neutral-600 dark:text-neutral-400 w-16">Created:</span>
                        <span class="text-neutral-800 dark:text-neutral-200">
                          {app.createdAt ? new Date(app.createdAt).toLocaleString() : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Additional info if available -->
                  {#if app.description}
                    <div class="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      <div class="text-xs text-neutral-500 line-clamp-2">{app.description}</div>
                    </div>
                  {/if}
                </div>
              </label>
            {/each}
          </div>
          <div class="flex items-center justify-between pt-2 text-xs text-neutral-500">
            <div>Page {page} of {totalPages}</div>
            <div class="flex items-center gap-2">
              <button class="px-2 py-1 rounded border" disabled={page <= 1} on:click={() => searchFn && searchFn(page - 1)}>Prev</button>
              <button class="px-2 py-1 rounded border" disabled={page >= totalPages} on:click={() => searchFn && searchFn(page + 1)}>Next</button>
            </div>
          </div>
        {/if}
      </div>
      <div class="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
        <button class="px-3 py-2 text-sm rounded-md border" on:click={onClose}>Cancel</button>
        <button class="px-3 py-2 text-sm rounded-md bg-neutral-900 text-white disabled:opacity-50" disabled={!selectedId} on:click={onConfirm}>Confirm</button>
      </div>
    </div>
  </div>
{/if}
