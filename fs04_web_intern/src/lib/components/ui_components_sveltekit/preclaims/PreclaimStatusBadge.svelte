<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";

  export let status: string | null | undefined;

  function getStatusDisplay(status: any) {
    const map: Record<string, string> = {
      'ACTIVE': 'Active',
      'INACTIVE': 'Inactive',
      'EXPIRED': 'Expired'
    };
    return map[status] || status || 'Unknown';
  }

  function getStatusVariant(status: any): 'outline' | 'default' | 'destructive' | 'success' | 'secondary' {
    const map: Record<string, 'outline' | 'default' | 'destructive' | 'success' | 'secondary'> = {
      'ACTIVE': 'success',
      'INACTIVE': 'secondary',
      'EXPIRED': 'secondary'
    };
    return map[status] || 'outline';
  }
</script>

<Badge variant={getStatusVariant(status)}>
  {getStatusDisplay(status)}
</Badge>
