<script lang="ts">
  import PreclaimStatusBadge from "$lib/components/ui_components_sveltekit/preclaims/PreclaimStatusBadge.svelte";
  import { Badge } from "$lib/components/ui/badge";
  import { Settings } from "lucide-svelte";

  export let preclaimSet: any;
  export let isAdmin: boolean = false;

  // Generate profile link based on user role
  $: profileLink = preclaimSet?.profile?.id 
    ? (isAdmin 
        ? `/admin/iot/device-profiles/${preclaimSet.profile.id}/edit` 
        : `/user/iot/device-profiles/${preclaimSet.profile.id}`)
    : null;
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div class="space-y-1">
    <p class="text-xs text-muted-foreground">Name</p>
    <p class="text-sm font-medium">{preclaimSet?.name || 'Unnamed'}</p>
  </div>
  <div class="space-y-1">
    <p class="text-xs text-muted-foreground">Status</p>
    <div>
      <PreclaimStatusBadge status={preclaimSet.status} />
    </div>
  </div>
  <div class="space-y-1 md:col-span-2">
    <p class="text-xs font-medium text-muted-foreground mb-2">Device Profile</p>
    {#if preclaimSet?.profile}
      <div class="flex items-start gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
        <div class="mt-0.5">
          <Settings class="h-5 w-5 text-primary" />
        </div>
        <div class="flex-1 flex flex-col gap-1">
          <div class="flex items-center gap-2 flex-wrap">
            {#if profileLink}
              <a 
                href={profileLink} 
                class="text-base font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors inline-flex items-center gap-1"
              >
                {preclaimSet.profile.name}
              </a>
            {:else}
              <span class="text-base font-semibold text-primary">{preclaimSet.profile.name}</span>
            {/if}
            {#if !preclaimSet.profile.isActive}
              <Badge variant="destructive" class="text-xs">Inactive</Badge>
            {:else}
              <Badge variant="outline" class="text-xs border-primary/30 text-primary">Active</Badge>
            {/if}
          </div>
          {#if preclaimSet.profile.description}
            <p class="text-sm text-muted-foreground">{preclaimSet.profile.description}</p>
          {/if}
        </div>
      </div>
    {:else}
      <div class="p-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30">
        <p class="text-sm text-muted-foreground italic">No profile assigned</p>
      </div>
    {/if}
  </div>
</div>



