<script lang="ts">
    import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { KeyRound } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    
    // Import directly from text-utils to avoid crypto module issues
    import { truncateText } from "$lib/utils/text-utils";

    export let open = false;
    export let user: any = null;
    export let action = "?/resetPassword";
    export let onSuccess: ((result?: any) => void) | null = null;
    export let onError: ((error?: any) => void) | null = null;

    let isResettingPassword = false;
    
    $: displayName = user?.name || user?.email || 'this user';
    $: truncatedName = truncateText(displayName, 30);

    // Reset password handler
    async function handlePasswordReset() {
        if (!user) return;
        
        open = false;
        isResettingPassword = true;
        
        try {
            const formData = new FormData();
            formData.append('userId', user.id);
            const response = await fetch(action, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            // Handle different response structures
            const isSuccess = response.ok && (
                result.success === true || 
                result.success === 1 || 
                result.type === 'success' || 
                response.status === 200
            );
            
            if (isSuccess) {
                // Extract message from different possible structures
                const message = result.message || 
                             result.details || 
                             'Password reset successfully. The user will receive an email with the new temporary password.';
                
                toast.success(message);
                if (onSuccess) onSuccess(result);
            } else {
                const errorMessage = result.message || 
                                   result.error || 
                                   'Failed to reset password. Please try again.';
                toast.error(errorMessage);
                if (onError) onError(result);
            }
        } catch (error) {
            const errorMessage = 'Failed to reset password. Please try again.';
            toast.error(errorMessage);
            if (onError) onError(error);
        } finally {
            isResettingPassword = false;
        }
    }
</script>

<!-- Reset Password Confirmation Dialog -->
<Dialog bind:open>
    <DialogContent class="sm:max-w-md">
        <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
                <div class="flex items-start gap-1 flex-wrap">
                    <span>Are you sure you want to reset the password for</span>
                    <strong 
                        class="truncate max-w-[220px] inline-block" 
                        title={displayName}
                    >
                        {truncatedName}
                    </strong>
                    <span>?</span>
                </div>
            </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4">
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-yellow-800">
                            This action will:
                        </h3>
                        <div class="mt-2 text-sm text-yellow-700">
                            <ul class="list-disc list-inside space-y-1">
                                <li>Generate a new temporary password</li>
                                <li>Invalidate the current password</li>
                                <li>Send an email with the new password</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <DialogFooter>
            <Button 
                variant="outline" 
                on:click={() => open = false}
                disabled={isResettingPassword}
            >
                Cancel
            </Button>
            <Button 
                variant="destructive" 
                on:click={handlePasswordReset}
                disabled={isResettingPassword}
                class="flex items-center gap-2"
            >
                <KeyRound class="h-4 w-4" />
                {isResettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>