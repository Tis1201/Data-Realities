<script lang="ts">
  export let open = false;
  export let imageData: string | null = null;
  export let format: string = 'jpeg';
  export let onClose: () => void;

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) onClose?.();
  }
</script>

<svelte:window on:keydown={handleKey} />

{#if open && imageData}
  <div class="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center bg-black/75 overflow-y-auto p-4" role="dialog" aria-modal="true">
    <button 
      class="absolute inset-0 h-full w-full cursor-default bg-transparent" 
      on:click={onClose}
      aria-label="Close modal"
      tabindex="-1"
    ></button>
    <div class="relative z-10 mx-auto max-w-[90vw] max-h-[90vh] overflow-auto rounded-lg bg-white p-4 shadow-xl" role="document">
      <button class="absolute right-2 top-2 text-neutral-600 hover:text-neutral-900" on:click={onClose} aria-label="Close">×</button>
      <img src={`data:image/${format};base64,${imageData}`} alt="Screenshot" class="block max-h-[80vh] max-w-full rounded-md object-contain" />
    </div>
  </div>
{/if}


