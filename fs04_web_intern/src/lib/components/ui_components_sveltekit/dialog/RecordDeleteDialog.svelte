<script lang="ts">
    import { enhance } from "$app/forms";
    import { toast } from "svelte-sonner";
    import ConfirmationDialog from "$lib/components/ui_components_sveltekit/dialog/ConfirmationDialog.svelte";
    import type { TableState } from "$lib/components/ui_components_sveltekit/table/types";
    import { Loader2 } from "lucide-svelte";
    
    // Make the component generic to work with any record type
    export let state: TableState<any>;
    export let onConfirm: () => void;
    
    // Allow customization of dialog text
    export let title = "Delete Record";
    export let getDescription = (record: any) => `Are you sure you want to delete this record? This action cannot be undone.`;
    export let confirmText = "Delete";
    export let cancelText = "Cancel";
    export let successMessage = "Record deleted successfully";
    export let errorMessage = "Failed to delete record";
    export let actionName = "delete";
    export let action = `?/${actionName}`;
    
    // Flag to determine if we should use form submission or direct API call
    export let useFormSubmission = true;
    
    // Processing state for API calls
    let isApiProcessing = false;
    
    // All other props will be caught by $$restProps
    
    let formElement: HTMLFormElement;
    
    function handleDelete() {
        if (useFormSubmission && formElement && state.selectedRecord) {
            formElement.requestSubmit();
            // Let the confirmation dialog close normally
        } else {
            // If not using form submission, call onConfirm directly
            isApiProcessing = true;
            try {
                onConfirm();
            } catch (error) {
                console.error('Error in onConfirm:', error);
            } finally {
                isApiProcessing = false;
            }
        }
        
        // Close the confirmation dialog
        state.confirmationOpen = false;
        state.selectedRecord = null;
    }
    
    function handleClose() {
        state.selectedRecord = null;
        state.confirmationOpen = false;
    }
</script>

<!-- Confirmation Dialog - works normally -->
<ConfirmationDialog
    bind:open={state.confirmationOpen}
    title={state.title || title}
    description={state.message || (state.selectedRecord ? getDescription(state.selectedRecord) : '')}
    confirmText={state.confirmButtonText || confirmText}
    cancelText={state.cancelButtonText || cancelText}
    onConfirm={handleDelete}
    onCancel={handleClose}
    {...$$restProps}
/>

<!-- Loading Overlay - shows during API processing -->
{#if isApiProcessing}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="bg-white rounded-lg p-6 shadow-xl">
            <div class="flex items-center space-x-3">
                <Loader2 class="h-6 w-6 animate-spin text-blue-600" />
                <div>
                    <h3 class="text-lg font-medium">Deleting Record</h3>
                    <p class="text-sm text-gray-500">Please wait while we delete the record...</p>
                </div>
            </div>
        </div>
    </div>
{/if}

<!-- Hidden form for submission -->
{#if state.selectedRecord}
    <form
        bind:this={formElement}
        method="POST"
        action={action}
        class="hidden"
        {...$$restProps}
        use:enhance={() => {
            // Show loading state when form submission starts
            isApiProcessing = true;
            
            return async ({ result, update }) => {
                try {
                    if (result.type === 'success') {
                        toast.success(state.successMessage || successMessage);
                        
                        // Wait for the update to complete before proceeding
                        await update({ reset: false });
                        
                        // Now call onConfirm (which may reload the page)
                        onConfirm();
                    } else if (result.type === 'failure') {
                        toast.error(`Operation failed: ${result.data?.error || 'Unknown error'}`);
                    } else {
                        toast.error(state.errorMessage || errorMessage);
                    }
                } catch (error) {
                    console.error('Error in enhance function:', error);
                } finally {
                    // Hide loading state when API finishes
                    isApiProcessing = false;
                }
            };
        }}
    >
        <input type="hidden" name="id" value={state.selectedRecord.id} />
    </form>
{/if}
