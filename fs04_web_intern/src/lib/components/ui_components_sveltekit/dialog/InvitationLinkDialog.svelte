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
  import { Input } from "$lib/components/ui/input";
  import { Check, Copy, Link } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  
  // Import directly from text-utils to avoid crypto module issues
  import { truncateEmail } from "$lib/utils/text-utils";

  export let open: boolean; // Controls dialog visibility
  export let userId: string = ""; // User ID for generating the invitation link
  export let userEmail: string = ""; // User email to display
  export let invitationToken: string = ""; // Token for the invitation
  export let expiresAt: Date = new Date(Date.now() + 24 * 60 * 60 * 1000); // When the token expires
  export let onClose: () => void = () => {}; // Callback when dialog is closed

  // Generate the invitation link
  $: invitationLink = invitationToken 
    ? `${window.location.origin}/user/invite?token=${invitationToken}` 
    : "";
  
  // Truncate email for display
  $: truncatedEmail = truncateEmail(userEmail, 30);

  let copied = false;

  // Copy the invitation link to clipboard
  function copyInvitationLink() {
    if (invitationLink) {
      navigator.clipboard.writeText(invitationLink);
      copied = true;
      toast.success("Invitation link copied to clipboard");
      setTimeout(() => {
        copied = false;
      }, 2000);
    }
  }

  // Handle dialog close
  function handleClose() {
    onClose();
    open = false;
  }
</script>

<Dialog bind:open on:close={handleClose}>
  <DialogContent class="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>User Created Successfully</DialogTitle>
      <DialogDescription>
        <div class="flex items-start gap-1 flex-wrap">
          <span>Share this invitation link with</span>
          <span 
            class="font-medium truncate max-w-[200px] inline-block" 
            title={userEmail}
          >
            {truncatedEmail}
          </span>
          <span>to complete their account setup.</span>
        </div>
      </DialogDescription>
    </DialogHeader>
    
    <div class="flex items-center space-x-2 mt-4">
      <div class="grid flex-1 gap-2">
        <div class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden">
          <div class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {invitationLink}
          </div>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="icon" 
        class="h-10 w-10"
        on:click={copyInvitationLink}
      >
        {#if copied}
          <Check class="h-4 w-4 text-success" />
        {:else}
          <Copy class="h-4 w-4" />
        {/if}
      </Button>
    </div>
    
    <div class="mt-2 text-sm text-muted-foreground">
      <p>This link will expire on {expiresAt.toLocaleString()}. The user will need to set a new password when they first log in.</p>
    </div>

    <DialogFooter class="sm:justify-end mt-4">
      <Button on:click={handleClose}>Done</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
