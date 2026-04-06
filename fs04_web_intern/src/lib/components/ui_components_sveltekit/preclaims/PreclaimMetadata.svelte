<script lang="ts">
  import MetadataFooter from "$lib/components/ui_components_sveltekit/metadata/MetadataFooter.svelte";
  
  export let preclaimSet: any;
</script>

<MetadataFooter
  items={[
    { label: "ID", value: preclaimSet?.id, icon: "hash" },
    { label: "Account", value: preclaimSet?.account?.name || "None", icon: "tag" },
    { label: "Created By", value: preclaimSet?.user?.displayName || preclaimSet?.user?.name || preclaimSet?.user?.email || "Unknown", icon: "user" },
    { label: "Created", date: preclaimSet?.createdAt, icon: "calendar" },
    { label: "Last Updated", date: preclaimSet?.updatedAt, icon: "clock" }
  ]}
/>

