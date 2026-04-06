<script lang="ts">
    import { page } from '$app/stores';
    import PopoverFilter from './PopoverFilter.svelte';
    
    export let paramName: string;
    export let options: Array<{value: string, label: string}>;
    export let label: string;
    
    const handleChange = (values: string[]) => {
        const url = new URL(window.location.href);
        url.searchParams.set(paramName, values.join(','));
        if (!values.length) {
            url.searchParams.delete(paramName);
        }
        url.searchParams.set('page', '1');
        window.history.pushState({}, '', url);
        window.dispatchEvent(new Event('popstate'));
    };
    
    $: selectedValues = $page.url.searchParams.get(paramName)?.split(',').filter(Boolean) || [];
</script>

<PopoverFilter
    {label}
    {options}
    selectedValues={selectedValues}
    key={paramName}
    on:change={({ detail: values }) => handleChange(values)}
/>
