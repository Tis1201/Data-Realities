<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import { getActionLabel, getStatusBadgeVariant, getStatusLabel } from './actionLabels';

  export let actionLogs: any[] = [];
</script>

<div class="overflow-x-auto">
  <table class="w-full text-sm">
    <thead>
      <tr class="text-left border-b">
        <th class="py-2 pr-4">When</th>
        <th class="py-2 pr-4">Action</th>
        <th class="py-2 pr-4">Status</th>
        <th class="py-2 pr-4">Progress</th>
        <th class="py-2 pr-4">Duration</th>
        <th class="py-2 pr-4">Message</th>
      </tr>
    </thead>
    <tbody>
      {#each actionLogs as log}
        <tr class="border-b last:border-b-0">
          <td class="py-2 pr-4 text-neutral-500">{new Date(log.initiatedAt).toLocaleString()}</td>
          <td class="py-2 pr-4">{getActionLabel(log.actionType)}</td>
          <td class="py-2 pr-4">
            <Badge variant={getStatusBadgeVariant(log.status)}>
              {getStatusLabel(log.status)}
            </Badge>
          </td>
          <td class="py-2 pr-4">{log.progress != null ? `${log.progress}%` : '—'}</td>
          <td class="py-2 pr-4">{log.durationMs != null ? Math.round(log.durationMs/1000) + 's' : '—'}</td>
          <td class="py-2 pr-4 truncate max-w-[320px]" title={log.message || log.error || ''}>
            {log.message || log.error || '—'}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
 </div>


