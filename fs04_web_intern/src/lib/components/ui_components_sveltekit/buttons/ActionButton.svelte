<script lang="ts">
    /**
     * Reusable action button component with icon support
     */
    
    import { Button } from "$lib/components/ui/button";
    
    // Props
    export let label: string;
    export let href: string | undefined = undefined;
    export let icon: any = undefined; // Svelte component (e.g., from lucide-svelte)
    export let variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" = "default";
    export let size: "default" | "sm" | "lg" | "icon" = "default";
    export let onClick: (() => void) | undefined = undefined;
    export let disabled: boolean = false;
    export let title: string | undefined = undefined;
    
    // Handle click based on props provided
    function handleClick() {
        if (onClick) {
            onClick();
        }
    }
</script>

{#if href}
    <a {href} title={title} aria-disabled={disabled} class={disabled ? 'pointer-events-none' : ''}>
        <Button {variant} {size} disabled={disabled}>
            {#if icon}
                <svelte:component this={icon} class="mr-2 h-4 w-4" />
            {/if}
            {label}
        </Button>
    </a>
{:else}
    <Button {variant} {size} on:click={handleClick} disabled={disabled} title={title}>
        {#if icon}
            <svelte:component this={icon} class="mr-2 h-4 w-4" />
        {/if}
        {label}
    </Button>
{/if}
