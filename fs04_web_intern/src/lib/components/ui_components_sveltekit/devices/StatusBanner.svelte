<script lang="ts">
  import { Loader2, CheckCircle, AlertCircle } from "lucide-svelte";
  export let status: { action: string; status: string; message: string } = { action: '', status: '', message: '' };
</script>

{#if status.status}
  <div
    class="mt-4 p-3 rounded-md text-sm flex items-center"
    class:bg-muted={status.status === 'loading'}
    class:bg-green-50={status.status === 'success'}
    class:bg-red-50={status.status === 'error'}
  >
    {#if status.status === 'loading'}
      <Loader2 class="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
    {:else if status.status === 'success'}
      <CheckCircle class="mr-2 h-4 w-4 text-green-500" />
    {:else if status.status === 'error'}
      <AlertCircle class="mr-2 h-4 w-4 text-red-500" />
    {/if}
    <span
      class:text-muted-foreground={status.status === 'loading'}
      class:text-green-700={status.status === 'success'}
      class:text-red-700={status.status === 'error'}
    >
      {status.message}
    </span>
  </div>
{/if}


