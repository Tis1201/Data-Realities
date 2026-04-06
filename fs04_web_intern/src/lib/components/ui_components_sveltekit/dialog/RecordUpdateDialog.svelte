<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "$lib/components/ui/alert-dialog/index.js";
  import type { ActionResult } from "@sveltejs/kit";

  // State-based approach (consistent with RecordDeleteDialog)
  export let open = false;
  export let action = "";
  export let record: any = null;
  export let isProcessing = false;
  export let onSuccess: ((result: any) => void) | null = null;
  export let onError: ((error: any) => void) | null = null;
  export let getFormData: (() => Record<string, any>) | null = null;
  
  // Dialog configuration - can come from parent or use defaults
  export let title: string | null = null;
  export let description: string | null = null;
  export let confirmText: string | null = null;
  export let cancelText: string | null = null;
  
  // Computed values with fallbacks
  $: dialogTitle = title || "Update Record";
  $: dialogDescription = description || "Are you sure you want to update this record?";
  $: dialogConfirmText = confirmText || "Update";
  $: dialogCancelText = cancelText || "Cancel";
  
  // Form element reference
  let formElement: HTMLFormElement | null = null;
  
  // Submit the form programmatically
  export function submit() {
    if (formElement) {
      formElement.requestSubmit();
    }
  }
  
  // Handle confirm action
  function handleConfirm() {
    if (formElement && record) {
      formElement.requestSubmit();
      return false; // Don't close dialog yet, let form submission handle it
    }
  }
  
  // Handle cancel action
  function handleCancel() {
    open = false;
    isProcessing = false;
  }
  
  // Reset state when dialog closes
  $: if (!open) {
    isProcessing = false;
  }
</script>

<AlertDialog bind:open>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
      <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel on:click={handleCancel} disabled={isProcessing}>
        {dialogCancelText}
      </AlertDialogCancel>
      <AlertDialogAction on:click={handleConfirm} disabled={isProcessing}>
        {isProcessing ? "Processing..." : dialogConfirmText}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

{#if record}
  <form
    bind:this={formElement}
    method="POST"
    action={action}
    class="hidden"
    use:enhance={({ formData }) => {
      isProcessing = true;
      
      // Add any additional form data if provided
      if (getFormData) {
        const additionalData = getFormData();
        for (const [key, value] of Object.entries(additionalData)) {
          formData.set(key, value);
        }
      }
      
      return async ({ result }) => {
        isProcessing = false;
        
        if (result.type === 'success') {
          open = false; // Close dialog on success
          if (onSuccess) {
            onSuccess(result);
          } else {
            toast.success("Operation completed successfully");
          }
        } else if (result.type === 'failure') {
          open = false; // Close dialog on error too
          if (onError) {
            onError(result);
          } else {
            toast.error(`Operation failed: ${result.data?.error || 'Unknown error'}`);
          }
        }
      };
    }}
  >
    <!-- Pass through any inputs or content via slot -->
    <slot></slot>
  </form>
{/if}
