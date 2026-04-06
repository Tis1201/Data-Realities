<script lang="ts">
    import ActionDropdown from "$lib/components/ui_components_sveltekit/table/column/ActionDropdown.svelte";
    
    // Define a type for action items
    export type ActionItem = {
        label: string;
        icon: any;
        onClick: () => void;
        disabled?: boolean;
    };
    
    // Accept items as a prop instead of defining them internally
    export let items: ActionItem[];
</script>

<ActionDropdown {items} />
