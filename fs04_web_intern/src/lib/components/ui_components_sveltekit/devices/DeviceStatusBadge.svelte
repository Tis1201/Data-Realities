<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";

  export let status: string | null | undefined;

  const formatDeviceStatus = (s: string | null | undefined) => (s ? s.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—');
  
  const getStatusVariant = (status: string | null | undefined) => {
    if (status === "ACTIVE") return "success";
    if (status === "INACTIVE") return "destructive";
    if (status === "PENDING") return "secondary";
    return "outline";
  };
</script>

<Badge variant={getStatusVariant(status)}>
  {formatDeviceStatus(status)}
</Badge>
