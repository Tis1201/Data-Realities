<script lang="ts">
  export let online: boolean = false;
  export let title: string = online ? 'Online' : 'Offline';
</script>

<span
  class={`inline-block h-2.5 w-2.5 rounded-full ${online ? 'bg-green-500 ring-1 ring-green-600/30' : 'bg-red-500 ring-1 ring-red-600/30'}`}
  {title}
  aria-label={title}
/>


