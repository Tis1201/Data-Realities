<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import SecureKeyDisplay from "$lib/components/ui_components_sveltekit/display/SecureKeyDisplay.svelte";
  import { Shield, Key, RefreshCw } from "lucide-svelte";

  export let device: any;
  export let apiKeyEnhance: any;
  export let apiKeySubmitting: any;
</script>

<h3 class="text-sm font-medium text-foreground mb-2 flex items-center">
  <Shield class="mr-1.5 h-4 w-4" />
  Security
</h3>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    <div class="font-medium flex items-center text-sm">
      <Key class="mr-1.5 h-3.5 w-3.5" />
      API Key
    </div>
    <form id="api-key-form" action="?/generateApiKey" method="POST" use:apiKeyEnhance>
      <Button type="submit" variant="outline" size="sm" disabled={$apiKeySubmitting} class="flex items-center">
        <RefreshCw class="mr-2 h-3 w-3" />
        {$apiKeySubmitting ? 'Generating...' : 'Generate New Key'}
      </Button>
    </form>
  </div>

  <SecureKeyDisplay
    apiKey={device.apiKey || ''}
    createdAt={device.apiKeyCreatedAt}
    rotatedAt={device.apiKeyRotatedAt}
    loading={$apiKeySubmitting}
  />
</div>


