export const ACTION_LABELS: Record<string, string> = {
  firmware_update: 'Firmware update',
  screenshot: 'Screenshot',
  snapshot: 'Snapshot',
  restart: 'Restart',
  refresh: 'Refresh',
  remote_desktop: 'Remote desktop',
  terminal: 'Terminal',
  logs: 'View logs',
  install_app: 'Install App',
  ping: 'Ping',
  status_check: 'Status check',
  config_update: 'Configuration update',
  restartApp: 'Restart App',
  pushFile: 'Push File',
  pullFile: 'Pull File',
  reboot: 'Reboot'
};

export const STATUS_LABELS: Record<string, string> = {
  initiated: 'Initiated',
  in_progress: 'In progress',
  success: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  timeout: 'Timed out'
};

export function toTitleCaseFromSnake(input: string): string {
  return (input || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getActionLabel(actionType: string): string {
  return ACTION_LABELS[actionType] ?? toTitleCaseFromSnake(actionType);
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? toTitleCaseFromSnake(status);
}

export function getStatusBadgeVariant(status: string): 'success' | 'destructive' | 'secondary' | 'outline' {
  const s = (status || '').toLowerCase();
  if (s === 'success') return 'success';
  if (s === 'failed' || s === 'timeout') return 'destructive';
  if (s === 'in_progress' || s === 'initiated') return 'secondary';
  if (s === 'cancelled') return 'outline';
  return 'outline';
}


