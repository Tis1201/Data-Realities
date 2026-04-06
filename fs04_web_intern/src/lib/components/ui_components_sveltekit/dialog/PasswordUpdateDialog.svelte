<script lang="ts">
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { PasswordInput } from "$lib/components/ui/password-input";
  import { toast } from "svelte-sonner";
  import type { User } from "@prisma/client";
  import { enhance } from "$app/forms";
  import { Skeleton } from "$lib/components/ui/skeleton";
  
  // Import directly from text-utils to avoid crypto module issues
  import { truncateEmail } from "$lib/utils/text-utils";

  // Props
  export let open: boolean = false;
  export let user: User | null = null;
  export let onSuccess: (() => void) | null = null;
  export let action: string = "?/updatePassword";

  // Form data
  let password = "";
  let passwordError = "";
  let isSubmitting = false;
  
  // Compute truncated email for display
  $: userEmail = user?.email || 'the user';
  $: truncatedEmail = truncateEmail(userEmail, 35);

  // Reset form when dialog opens
  $: if (open) {
    password = "";
    passwordError = "";
    isSubmitting = false;
  }
</script>

<Dialog bind:open>
  <DialogContent class="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Update Password</DialogTitle>
      <DialogDescription>
        <div class="space-y-1">
          <div class="flex items-start gap-1 flex-wrap">
            <span>Enter a new password for</span>
            <span 
              class="font-medium truncate max-w-[280px] inline-block" 
              title={userEmail}
            >
              {truncatedEmail}
            </span>
          </div>
          <small class="text-muted-foreground block">
            Password requirements depend on your system settings.
          </small>
        </div>
      </DialogDescription>
    </DialogHeader>
    
    <form 
      method="POST" 
      action={action}
      class="space-y-4 py-4"
      use:enhance={({ formData, cancel }) => {
        // Basic validation - just check if password is not empty
        const pwdValue = formData.get('password')?.toString() || '';
        
        if (!pwdValue || pwdValue.length === 0) {
          passwordError = "Password is required";
          cancel();
          return;
        }
        
        isSubmitting = true;
        passwordError = "";
        
        return ({ result, update }) => {
          isSubmitting = false;
          
          if (result.type === 'success') {
            const displayEmail = truncateEmail(user?.email, 30) || 'user';
            toast.success(`Password updated successfully for ${displayEmail}`);
            if (onSuccess) onSuccess();
            open = false;
          } else if (result.type === 'failure') {
            const message = result.data?.message || 'Unknown error';
            toast.error(`Failed to update password: ${message}`);
            passwordError = message;
          }
        };
      }}
    >
      <input type="hidden" name="userId" value={user?.id || ''} />
      
      <div class="grid gap-2">
        <Label for="password">New Password</Label>
        <PasswordInput 
          id="password" 
          name="password"
          bind:value={password} 
          placeholder="Enter new password" 
          class="w-full"
        />
        {#if passwordError}
          <p class="text-sm text-destructive">{passwordError}</p>
        {/if}
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" on:click={() => (open = false)} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {#if isSubmitting}
            <div class="flex items-center gap-2">
              <Skeleton class="h-4 w-4 rounded-full" />
              Updating...
            </div>
          {:else}
            Update Password
          {/if}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
