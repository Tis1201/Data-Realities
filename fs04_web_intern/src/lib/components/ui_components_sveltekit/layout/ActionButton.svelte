<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import type { ComponentProps } from "svelte";
  import type { LucideIcon } from "lucide-svelte";
  
  type ButtonVariant = ComponentProps<Button>["variant"];
  
  export let label: string;
  export let icon: LucideIcon = undefined;
  export let href: string = undefined;
  export let onClick: (() => void) = undefined;
  export let variant: ButtonVariant = "default";
  export let size: "default" | "sm" | "lg" | "icon" = "default";
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let class_: string = ""; // Custom class
  
  // Determine if this is a link or button
  $: isLink = !!href && !disabled && !loading;
</script>

{#if isLink}
  <Button
    {variant}
    {size}
    {href}
    class={class_}
    on:click
  >
    {#if icon}
      <svelte:component this={icon} class="w-4 h-4 mr-2" />
    {/if}
    {label}
  </Button>
{:else}
  <Button
    {variant}
    {size}
    {disabled}
    class={class_}
    on:click={onClick || (() => {})}
  >
    {#if loading}
      <span class="mr-2">
        <svg class="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </span>
    {:else if icon}
      <svelte:component this={icon} class="w-4 h-4 mr-2" />
    {/if}
    {label}
  </Button>
{/if}
