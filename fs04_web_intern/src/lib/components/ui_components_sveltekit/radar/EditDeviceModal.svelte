<script lang="ts">
  import { NAME_MAX } from '$lib/constants/description';
  import { Modal, Button, InputField, Alert, Dropdown, Toggle, Tooltip, ProgressBar, TabGroup } from '$lib/design-system/components';
  import CharacterCount from '$lib/components/ui_components_sveltekit/form/CharacterCount.svelte';
  import { timezoneOptions } from '$lib/utils/timezoneOptions';
  import { Plus, Trash2 } from 'lucide-svelte';

  /** Shared Edit Device modal: Sensor Name, Location, tabs Configuration | Alert. Used by Listing and Detail pages. */
  export let open = false;
  /** Sensor to edit: id, name, location, and optional config (zones, trackingArea, alertSettings, deviceSettings) from API. Form is initialized from sensor and config. */
  export let sensor: {
    id: string;
    name: string | null;
    location: string | null;
    updatedAt?: Date | string | null;
    config?: {
      zones?: Array<{ id?: string; name?: string; zoneNumber?: number; startX?: number; startY?: number; endX?: number; endY?: number; active?: boolean }>;
      trackingArea?: { startX?: number; startY?: number; endX?: number; endY?: number };
      alertSettings?: {
        sensorOffline?: { enabled: boolean; threshold: string; unit: string };
        noData?: { enabled: boolean; threshold: string; unit: string };
        dwellTime?: { enabled: boolean; zoneId: string; threshold: string };
        email?: { enabled: boolean; address: string };
        webhook?: { enabled: boolean; url: string };
      };
      deviceMode?: string;
      timezone?: string;
      pathTracking?: boolean;
      dwellThreshold?: number;
    };
  } | null = null;
  /** Called when user clicks Save. Parent should call API (sensor info + alert settings + zones + config) then close modal and invalidate. */
  export let onSave: (payload: {
    name: string;
    location: string;
    alertSettings?: Record<string, unknown>;
    zones?: Array<{ id: string; name: string; active: boolean }>;
    trackingArea?: { startX: number; startY: number; endX: number; endY: number };
    deviceSettings?: { deviceMode: string; timezone: string; pathTracking: boolean; dwellThreshold: number };
  }) => Promise<void> = async () => {};
  /** Called when modal is closed (Cancel or backdrop). */
  export let onClose: () => void = () => {};

  const MAX_ZONES = 5;
  const MAX_NAME_LENGTH = NAME_MAX;
  const configTemplateOptions = [{ id: 'CUSTOM', label: 'Custom Configuration' }];
  const editDeviceTabs = [
    { id: 'configuration', label: 'Configuration' },
    { id: 'alert', label: 'Alert' }
  ];
  const alertTemplateOptions = [{ id: 'CUSTOM', label: 'Custom' }];
  const alertThresholdUnitOptions = [
    { id: 'minutes', label: 'minutes' },
    { id: 'hours', label: 'hours' }
  ];
  type AlertThresholdUnit = 'minutes' | 'hours';

  let form = { name: '', location: '' };
  let tab: 'configuration' | 'alert' = 'configuration';
  let step2 = {
    configTemplate: 'CUSTOM',
    trackingXMin: '',
    trackingXMax: '',
    trackingYMin: '',
    trackingYMax: '',
    deviceMode: 'LIVE_PREVIEW',
    timezone: 'UTC',
    pathTracking: true,
    dwellThreshold: '0',
    zones: [] as { id: string; name: string; active: boolean }[]
  };
  let zoneErrors: Record<string, string> = {};
  let trackingAreaErrors: { xMin?: string; yMin?: string; xMax?: string; yMax?: string } = {};
  let alertState = {
    alertTemplate: 'CUSTOM',
    sensorOffline: { enabled: true, threshold: '5', unit: 'minutes' },
    noData: { enabled: true, threshold: '30', unit: 'minutes' as AlertThresholdUnit },
    dwellTime: { enabled: true, zoneId: 'zone-1', threshold: '120' },
    email: { enabled: true, address: 'administrator@inrealities.com' },
    webhook: { enabled: true, url: 'https://api.example.com/webhook' }
  };
  let loading = false;
  let error = '';

  $: alertZoneOptions = (step2.zones || []).map((z) => ({ id: z.id, label: z.name || z.id }));

  /**
   * Initialize form when modal opens, and re-initialize whenever the underlying
   * sensor data changes (e.g. after a successful save + invalidateAll).
   * We track both sensor.id and sensor.updatedAt so that:
   *   - switching to a different sensor always re-initializes
   *   - saving config and reopening reflects the fresh data even if the modal
   *     was reopened before invalidateAll() completed (race condition fix)
   */
  let lastInitKey: string | null = null;
  $: if (open && sensor) {
    const currentKey = `${sensor.id}::${sensor.updatedAt ?? ''}`;
    if (currentKey !== lastInitKey) {
      lastInitKey = currentKey;
      form = { name: sensor.name ?? '', location: sensor.location ?? '' };
      const apiZones = sensor.config?.zones;
      const zonesFromApi =
        apiZones && apiZones.length > 0
          ? apiZones.map((z, i) => ({
              id: z.id ?? `zone-${z.zoneNumber ?? i + 1}`,
              name: z.name?.trim() ? z.name : `Zone ${(z.zoneNumber ?? i) + 1}`,
              active: z.active !== false
            }))
          : [{ id: 'zone-1', name: 'Zone 1', active: true }];
      const ta = sensor.config?.trackingArea;
      const cfg = sensor.config;
      step2 = {
        configTemplate: 'CUSTOM',
        trackingXMin: ta != null && ta.startX != null ? String(ta.startX) : '',
        trackingYMin: ta != null && ta.startY != null ? String(ta.startY) : '',
        trackingXMax: ta != null && ta.endX != null ? String(ta.endX) : '',
        trackingYMax: ta != null && ta.endY != null ? String(ta.endY) : '',
        deviceMode: cfg?.deviceMode ?? 'LIVE_PREVIEW',
        timezone: cfg?.timezone ?? 'UTC',
        pathTracking: cfg?.pathTracking ?? true,
        dwellThreshold: cfg?.dwellThreshold != null ? String(cfg.dwellThreshold) : '0',
        zones: zonesFromApi
      };
      const firstZoneId = zonesFromApi[0]?.id ?? 'zone-1';
      const as = sensor.config?.alertSettings;
      alertState = {
        alertTemplate: 'CUSTOM',
        sensorOffline: as?.sensorOffline ?? { enabled: true, threshold: '5', unit: 'minutes' },
        noData: {
          enabled: as?.noData?.enabled ?? true,
          threshold: as?.noData?.threshold ?? '30',
          unit: (as?.noData?.unit === 'hours' ? 'hours' : 'minutes') as AlertThresholdUnit
        },
        dwellTime: as?.dwellTime ?? { enabled: true, zoneId: firstZoneId, threshold: '120' },
        email: as?.email ?? { enabled: true, address: 'administrator@inrealities.com' },
        webhook: as?.webhook ?? { enabled: true, url: 'https://api.example.com/webhook' }
      };
      zoneErrors = {};
      trackingAreaErrors = {};
      tab = 'configuration';
      error = '';
    }
  } else {
    lastInitKey = null;
  }

  function addZone() {
    if (step2.zones.length >= MAX_ZONES) return;
    const nextNum = step2.zones.length + 1;
    step2.zones = [...step2.zones, { id: `zone-${nextNum}`, name: `Zone ${nextNum}`, active: true }];
    zoneErrors = {};
  }
  function removeZone(id: string) {
    if (step2.zones.length <= 1) return;
    step2.zones = step2.zones.filter((z) => z.id !== id);
    const next = { ...zoneErrors };
    delete next[id];
    zoneErrors = next;
  }
  function toggleZoneActive(id: string) {
    const z = step2.zones.find((x) => x.id === id);
    if (z) z.active = !z.active;
    step2 = step2;
  }
  function setDwellThresholdFromInput(el: HTMLInputElement | null) {
    if (!el) return;
    step2.dwellThreshold = el.value;
    step2 = step2;
  }

  // Tracking area constraints: X [-4, 4], Y [0, 7]
  const TRACKING_AREA_CONSTRAINTS = {
    X_MIN: -4,
    X_MAX: 4,
    Y_MIN: 0,
    Y_MAX: 7
  };

  // Validate a single tracking area field and return error message if invalid
  function validateTrackingField(value: string, isXAxis: boolean, required: boolean = true): string | undefined {
    if (value === '') return required ? 'Required' : undefined;
    const num = parseFloat(value);
    if (isNaN(num)) return 'Must be a valid number';
    if (isXAxis) {
      if (num < TRACKING_AREA_CONSTRAINTS.X_MIN || num > TRACKING_AREA_CONSTRAINTS.X_MAX) {
        return `Must be between ${TRACKING_AREA_CONSTRAINTS.X_MIN} and ${TRACKING_AREA_CONSTRAINTS.X_MAX}`;
      }
    } else {
      if (num < TRACKING_AREA_CONSTRAINTS.Y_MIN || num > TRACKING_AREA_CONSTRAINTS.Y_MAX) {
        return `Must be between ${TRACKING_AREA_CONSTRAINTS.Y_MIN} and ${TRACKING_AREA_CONSTRAINTS.Y_MAX}`;
      }
    }
    return undefined;
  }

  // Validate all tracking area fields and update trackingAreaErrors
  function validateTrackingArea(): boolean {
    trackingAreaErrors = {
      xMin: validateTrackingField(step2.trackingXMin, true),
      yMin: validateTrackingField(step2.trackingYMin, false),
      xMax: validateTrackingField(step2.trackingXMax, true),
      yMax: validateTrackingField(step2.trackingYMax, false)
    };
    return !trackingAreaErrors.xMin && !trackingAreaErrors.yMin && !trackingAreaErrors.xMax && !trackingAreaErrors.yMax;
  }

  async function handleSave() {
    const name = form.name?.trim() ?? '';
    if (!name) {
      error = 'Sensor name is required.';
      return;
    }
    error = '';
    
    // Validate tracking area fields (inline errors shown via trackingAreaErrors)
    if (!validateTrackingArea()) {
      return;
    }
    
    loading = true;
    try {
      // Build tracking area if values are provided (check for non-empty strings, not truthy values, to allow 0 and negative numbers)
      const hasTrackingArea = step2.trackingXMin !== '' && step2.trackingYMin !== '' && step2.trackingXMax !== '' && step2.trackingYMax !== '';
      let trackingArea: { startX: number; startY: number; endX: number; endY: number } | undefined;
      if (hasTrackingArea) {
        const startX = parseFloat(step2.trackingXMin);
        const startY = parseFloat(step2.trackingYMin);
        const endX = parseFloat(step2.trackingXMax);
        const endY = parseFloat(step2.trackingYMax);
        // Only include if all values are valid numbers (already validated above)
        if (!isNaN(startX) && !isNaN(startY) && !isNaN(endX) && !isNaN(endY)) {
          trackingArea = { startX, startY, endX, endY };
        }
      }

      await onSave({
        name,
        location: form.location?.trim() ?? '',
        alertSettings: {
          sensorOffline: alertState.sensorOffline,
          noData: alertState.noData,
          dwellTime: alertState.dwellTime,
          email: alertState.email,
          webhook: alertState.webhook
        },
        zones: step2.zones,
        trackingArea,
        deviceSettings: {
          deviceMode: step2.deviceMode,
          timezone: step2.timezone,
          pathTracking: step2.pathTracking,
          dwellThreshold: (() => { const n = parseInt(step2.dwellThreshold, 10); return !isNaN(n) ? n : 0; })()
        }
      });
    } finally {
      loading = false;
    }
  }

  function handleClose() {
    if (!loading) {
      open = false;
      onClose();
    }
  }
</script>

<Modal
  open={open}
  title="Edit Device"
  size="xl"
  showFooter={false}
  on:close={handleClose}
>
  <div class="edit-device-form">
    {#if error}
      <Alert
        severity="error"
        variant="outline"
        message={error}
        dismissible={true}
        on:dismiss={() => (error = '')}
      />
    {/if}
    <div class="add-device-fields">
      <div class="add-device-field add-device-field-full">
        <InputField
          label="Sensor Name"
          type="text"
          bind:value={form.name}
          placeholder="Enter"
          required={true}
          maxlength={MAX_NAME_LENGTH}
          disabled={loading}
          helperText="Linked to the IoT device name. If you change this and save, the device name in IoT Devices is updated to match."
        />
        <CharacterCount current={form.name.length} max={MAX_NAME_LENGTH} />
      </div>
      <div class="add-device-field add-device-field-full">
        <InputField
          label="Location"
          type="text"
          bind:value={form.location}
          placeholder="Enter"
          disabled={loading}
        />
      </div>
      <div class="edit-device-tabs-wrap">
        <TabGroup
          tabs={editDeviceTabs}
          activeTab={tab}
          type="underline"
          size="md"
          on:change={(e) => { tab = e.detail === 'alert' ? 'alert' : 'configuration'; }}
        />
      </div>
      {#if tab === 'configuration'}
        <div class="add-device-field add-device-field-full">
          <Dropdown
            label="Configuration Template"
            placeholder="Select"
            options={configTemplateOptions}
            value={step2.configTemplate}
            width="100%"
            disabled={loading}
          />
        </div>
        <div class="add-device-section">
          <h3 class="add-device-section-title">Tracking Area</h3>
          <div class="add-device-row">
            <div class="add-device-field">
              <InputField 
                label="X Min (m)" 
                type="text" 
                bind:value={step2.trackingXMin} 
                placeholder="-4 to 4" 
                disabled={loading}
                required={true}
                state={trackingAreaErrors.xMin ? 'error' : 'default'}
                helperText={trackingAreaErrors.xMin || ''}
                on:blur={() => { trackingAreaErrors.xMin = validateTrackingField(step2.trackingXMin, true); }}
              />
            </div>
            <div class="add-device-field">
              <InputField 
                label="Y Min (m)" 
                type="text" 
                bind:value={step2.trackingYMin} 
                placeholder="0 to 7" 
                disabled={loading}
                required={true}
                state={trackingAreaErrors.yMin ? 'error' : 'default'}
                helperText={trackingAreaErrors.yMin || ''}
                on:blur={() => { trackingAreaErrors.yMin = validateTrackingField(step2.trackingYMin, false); }}
              />
            </div>
            <div class="add-device-field">
              <InputField 
                label="X Max (m)" 
                type="text" 
                bind:value={step2.trackingXMax} 
                placeholder="-4 to 4" 
                disabled={loading}
                required={true}
                state={trackingAreaErrors.xMax ? 'error' : 'default'}
                helperText={trackingAreaErrors.xMax || ''}
                on:blur={() => { trackingAreaErrors.xMax = validateTrackingField(step2.trackingXMax, true); }}
              />
            </div>
            <div class="add-device-field">
              <InputField 
                label="Y Max (m)" 
                type="text" 
                bind:value={step2.trackingYMax} 
                placeholder="0 to 7" 
                disabled={loading}
                required={true}
                state={trackingAreaErrors.yMax ? 'error' : 'default'}
                helperText={trackingAreaErrors.yMax || ''}
                on:blur={() => { trackingAreaErrors.yMax = validateTrackingField(step2.trackingYMax, false); }}
              />
            </div>
          </div>
        </div>
        <div class="add-device-section">
          <div class="add-device-zones-header">
            <h3 class="add-device-section-title">Zones</h3>
            <div class="add-device-add-zone-right">
              <Tooltip text="Maximum 5 zones per device" position="bottom" arrow="top" theme="dark" portal={true}>
                <div class="add-device-add-zone-trigger-wrap">
                  <Button
                    variant="text"
                    color="primary"
                    size="md"
                    iconLeft={true}
                    disabled={step2.zones.length >= MAX_ZONES || loading}
                    on:click={addZone}
                  >
                    <Plus size={20} slot="icon-left" />
                    Add Zone
                  </Button>
                </div>
              </Tooltip>
            </div>
          </div>
          {#each step2.zones as zone (zone.id)}
            <div class="add-device-zone-wrap">
              <div class="add-device-zone-toggle">
                <Tooltip text={zone.active ? 'Active Zone' : 'Inactive Zone'} position="top" theme="dark" portal={true}>
                  <div>
                    <Toggle
                      size="sm"
                      checked={zone.active}
                      disabled={loading}
                      on:change={() => toggleZoneActive(zone.id)}
                    />
                  </div>
                </Tooltip>
              </div>
              <div class="add-device-zone-input">
                <InputField
                  label=""
                  type="text"
                  bind:value={zone.name}
                  placeholder="Enter"
                  disabled={loading}
                  state={zoneErrors[zone.id] ? 'error' : 'default'}
                  helperText={zoneErrors[zone.id]}
                />
              </div>
              <Button
                variant="ghost"
                color="danger"
                size="md"
                icon={Trash2}
                iconPosition="only"
                disabled={step2.zones.length <= 1 || loading}
                on:click={() => removeZone(zone.id)}
                class="add-device-zone-delete"
              />
            </div>
          {/each}
        </div>
        <div class="add-device-section">
          <h3 class="add-device-section-title">Device Settings</h3>
          <div class="add-device-row add-device-row-device-settings">
            <div class="add-device-field">
              <Dropdown
                label="Device Mode"
                placeholder="Select"
                options={[{ id: 'LIVE_PREVIEW', label: 'Live Preview' }, { id: 'BACKGROUND', label: 'Background' }]}
                value={step2.deviceMode}
                width="100%"
                preferPlacement="bottom"
                disabled={loading}
                on:change={(e) => {
                  const v = e.detail;
                  step2.deviceMode = Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
                  step2 = step2;
                }}
              />
            </div>
            <div class="add-device-field">
              <Dropdown
                label="Timezone"
                placeholder="Search timezone..."
                options={timezoneOptions}
                value={step2.timezone}
                width="100%"
                preferPlacement="bottom"
                searchable={true}
                disabled={loading}
                on:change={(e) => {
                  const v = e.detail;
                  step2.timezone = Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
                  step2 = step2;
                }}
              />
            </div>
          </div>
          <div class="add-device-path-tracking-row">
            <div class="add-device-path-tracking-cell-text">
              <span class="add-device-path-tracking-title">Path Tracking</span>
              <span class="add-device-path-tracking-desc">Enable movement path recording</span>
            </div>
            <div class="add-device-path-tracking-cell-toggle">
              <Toggle
                size="sm"
                checked={step2.pathTracking}
                disabled={loading}
                on:change={() => {
                  step2.pathTracking = !step2.pathTracking;
                  step2 = step2;
                }}
              />
            </div>
          </div>
          <div class="add-device-dwell-row">
            <label class="add-device-dwell-label" for="edit-device-dwell-threshold">Dwell Threshold</label>
            <div class="add-device-dwell-control">
              <div class="add-device-dwell-slider-wrap">
                <ProgressBar
                  value={Math.min(100, (parseFloat(step2.dwellThreshold) || 0) / 60 * 100)}
                  showThumb={true}
                  size="md"
                  color="gray"
                />
                <input
                  id="edit-device-dwell-threshold"
                  type="range"
                  class="add-device-dwell-range"
                  min="0"
                  max="60"
                  step="1"
                  value={parseFloat(step2.dwellThreshold) || 0}
                  disabled={loading}
                  on:input={(e) => setDwellThresholdFromInput(e.currentTarget)}
                />
              </div>
              <div class="add-device-dwell-value-wrap">
                <span class="add-device-dwell-value">{step2.dwellThreshold || '0'}</span>
                <span class="add-device-dwell-unit">sec</span>
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="add-device-section">
          <div class="add-device-field add-device-field-full">
            <Dropdown
              label="Alert Template"
              required
              placeholder="Select"
              options={alertTemplateOptions}
              value={alertState.alertTemplate}
              on:change={(e) => {
                const v = e.detail;
                alertState.alertTemplate = Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
                alertState = alertState;
              }}
              width="100%"
              disabled={loading}
            />
          </div>
        </div>
        <div class="edit-device-alert-section">
          <div class="edit-device-alert-section-header">
            <h3 class="add-device-section-title">Alert Rules</h3>
            <p class="edit-device-alert-desc">Configure when sensor stops responding.</p>
          </div>
          <div class="edit-device-alert-table-wrap">
            <div class="edit-device-alert-card">
              <div class="edit-device-alert-table-row">
                <div class="edit-device-alert-rule-label-wrap">
                  <span class="edit-device-alert-rule-title">Sensor Offline Alert</span>
                  <span class="edit-device-alert-rule-desc">Alert when sensor stops responding</span>
                </div>
                <Toggle
                  size="sm"
                  checked={alertState.sensorOffline.enabled}
                  disabled={loading}
                  on:change={() => {
                    alertState.sensorOffline.enabled = !alertState.sensorOffline.enabled;
                    alertState = alertState;
                  }}
                />
              </div>
              {#if alertState.sensorOffline.enabled}
                <div class="edit-device-alert-card-divider"></div>
                <div class="edit-device-alert-table-row edit-device-alert-input-row edit-device-alert-threshold-row">
                  <span class="edit-device-alert-threshold-label">Threshold</span>
                  <div class="edit-device-alert-field-box">
                    <InputField label="" type="text" bind:value={alertState.sensorOffline.threshold} placeholder="Enter" disabled={loading} />
                    <span class="edit-device-alert-unit-inline">minutes</span>
                  </div>
                </div>
              {/if}
            </div>
            <div class="edit-device-alert-card">
              <div class="edit-device-alert-table-row">
                <div class="edit-device-alert-rule-label-wrap">
                  <span class="edit-device-alert-rule-title">No Data Alert</span>
                  <span class="edit-device-alert-rule-desc">Alert when no detections received</span>
                </div>
                <Toggle
                  size="sm"
                  checked={alertState.noData.enabled}
                  disabled={loading}
                  on:change={() => {
                    alertState.noData.enabled = !alertState.noData.enabled;
                    alertState = alertState;
                  }}
                />
              </div>
              {#if alertState.noData.enabled}
                <div class="edit-device-alert-card-divider"></div>
                <div class="edit-device-alert-table-row edit-device-alert-input-row edit-device-alert-threshold-row">
                  <span class="edit-device-alert-threshold-label">Threshold</span>
                  <div class="edit-device-alert-field-box">
                    <InputField label="" type="text" bind:value={alertState.noData.threshold} placeholder="Enter" disabled={loading} />
                    <div class="edit-device-alert-unit-dropdown">
                      <Dropdown
                        options={alertThresholdUnitOptions}
                        value={alertState.noData.unit}
                        on:change={(e) => {
                          const v = e.detail;
                          alertState.noData.unit = (Array.isArray(v) ? v[0] : v) === 'hours' ? 'hours' : 'minutes';
                          alertState = alertState;
                        }}
                        width="100%"
                        disabled={loading}
                        clearable={false}
                      />
                    </div>
                  </div>
                </div>
              {/if}
            </div>
            <div class="edit-device-alert-card">
              <div class="edit-device-alert-table-row">
                <div class="edit-device-alert-rule-label-wrap">
                  <span class="edit-device-alert-rule-title">Dwell Time Alert</span>
                  <span class="edit-device-alert-rule-desc">Alert when dwell time exceeds threshold</span>
                </div>
                <Toggle
                  size="sm"
                  checked={alertState.dwellTime.enabled}
                  disabled={loading}
                  on:change={() => {
                    alertState.dwellTime.enabled = !alertState.dwellTime.enabled;
                    alertState = alertState;
                  }}
                />
              </div>
              {#if alertState.dwellTime.enabled}
                <div class="edit-device-alert-card-divider"></div>
                <div class="edit-device-alert-table-row edit-device-alert-input-row edit-device-alert-label-field-row">
                  <span class="edit-device-alert-threshold-label">Zone & Threshold</span>
                  <div class="edit-device-alert-dwell-field">
                    <div class="edit-device-alert-dwell-zone-wrap">
                      <Dropdown
                        label=""
                        options={alertZoneOptions}
                        value={alertState.dwellTime.zoneId}
                        on:change={(e) => {
                          const v = e.detail;
                          alertState.dwellTime.zoneId = Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
                          alertState = alertState;
                        }}
                        width="100%"
                        disabled={loading}
                        clearable={false}
                      />
                    </div>
                    <div class="edit-device-alert-dwell-input-wrap">
                      <InputField label="" type="text" bind:value={alertState.dwellTime.threshold} placeholder="Enter" disabled={loading} />
                    </div>
                    <span class="edit-device-alert-field-divider" aria-hidden="true"></span>
                    <span class="edit-device-alert-unit-inline">seconds</span>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
        <div class="edit-device-alert-divider" role="separator" aria-hidden="true"></div>
        <div class="edit-device-alert-section">
          <div class="edit-device-alert-section-header">
            <h3 class="add-device-section-title">Notification Channels</h3>
            <p class="edit-device-alert-desc">Configure how alerts are delivered.</p>
          </div>
          <div class="edit-device-alert-table-wrap">
            <div class="edit-device-alert-card">
              <div class="edit-device-alert-table-row">
                <span class="edit-device-alert-rule-title">Email Notifications</span>
                <Toggle
                  size="sm"
                  checked={alertState.email.enabled}
                  disabled={loading}
                  on:change={() => {
                    alertState.email.enabled = !alertState.email.enabled;
                    alertState = alertState;
                  }}
                />
              </div>
              {#if alertState.email.enabled}
                <div class="edit-device-alert-card-divider"></div>
                <div class="edit-device-alert-table-row edit-device-alert-input-row edit-device-alert-label-field-row edit-device-alert-field-row-end">
                  <span class="edit-device-alert-threshold-label">Email Address</span>
                  <InputField label="" type="email" bind:value={alertState.email.address} placeholder="Enter email" disabled={loading} />
                </div>
              {/if}
            </div>
            <div class="edit-device-alert-card">
              <div class="edit-device-alert-table-row">
                <span class="edit-device-alert-rule-title">Webhook</span>
                <Toggle
                  size="sm"
                  checked={alertState.webhook.enabled}
                  disabled={loading}
                  on:change={() => {
                    alertState.webhook.enabled = !alertState.webhook.enabled;
                    alertState = alertState;
                  }}
                />
              </div>
              {#if alertState.webhook.enabled}
                <div class="edit-device-alert-card-divider"></div>
                <div class="edit-device-alert-table-row edit-device-alert-input-row edit-device-alert-label-field-row edit-device-alert-field-row-end">
                  <span class="edit-device-alert-threshold-label">Webhook Address</span>
                  <InputField label="" type="url" bind:value={alertState.webhook.url} placeholder="https://" disabled={loading} />
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
  <svelte:fragment slot="footer">
    <div class="add-device-actions">
      <Button type="button" variant="outline" color="primary" size="lg" on:click={handleClose} disabled={loading}>
        Cancel
      </Button>
      <Button type="button" variant="filled" color="primary" size="lg" disabled={loading} on:click={handleSave}>
        {#if loading}
          Saving…
        {:else}
          Save
        {/if}
      </Button>
    </div>
  </svelte:fragment>
</Modal>

<style>
  .edit-device-form {
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-4);
    width: 100%;
    min-width: 0;
    font-family: var(--ds-font-family-primary);
  }
  .edit-device-tabs-wrap {
    width: 100%;
    border-bottom: 1px solid var(--ds-color-neutral-true-200, #E5E5E5);
  }
  .edit-device-alert-section {
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-3, 12px);
    width: 100%;
  }
  .edit-device-alert-section-header {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
  }
  .edit-device-alert-desc {
    font-family: var(--ds-font-family-primary);
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    color: var(--ds-color-gray-600, #475467);
    margin: 0;
  }
  .edit-device-alert-table-wrap {
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-3, 12px);
    width: 100%;
  }
  .edit-device-alert-card {
    width: 100%;
    background: var(--ds-color-neutral-true-50, #FAFAFA);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .edit-device-alert-card-divider {
    width: 100%;
    height: 0;
    border: none;
    border-top: 1px solid var(--ds-color-gray-200, #EAECF0);
    flex-shrink: 0;
    margin: 0;
  }
  .edit-device-alert-table-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-space-4);
    padding: 16px;
    min-height: 52px;
    box-sizing: border-box;
  }
  .edit-device-alert-table-row.edit-device-alert-input-row {
    align-items: center;
    min-height: 0;
    padding: 16px;
    margin-top: var(--ds-space-2, 8px);
  }
  .edit-device-alert-threshold-row,
  .edit-device-alert-label-field-row {
    align-items: center;
    gap: var(--ds-space-4, 16px);
  }
  .edit-device-alert-label-field-row.edit-device-alert-field-row-end {
    justify-content: space-between;
  }
  .edit-device-alert-threshold-label {
    flex-shrink: 0;
    font-family: var(--ds-font-family-primary);
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    color: var(--ds-color-neutral-true-600, #525252);
  }
  .edit-device-alert-field-box {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    align-self: center;
    width: 100%;
    max-width: 328px;
    height: 52px;
    min-height: 52px;
    padding: 0;
    background: var(--ds-color-gray-1-9, #FEFEFE);
    border: 1px solid var(--ds-color-neutral-true-300, #D6D6D6);
    border-radius: var(--ds-radius-lg, 8px);
    overflow: visible;
    flex-shrink: 0;
    box-sizing: border-box;
  }
  .edit-device-alert-field-box :global(.input-field-wrapper) {
    flex: 1;
    min-width: 0;
    margin: 0;
    border: none;
    min-height: 0;
    align-self: stretch;
  }
  .edit-device-alert-field-box :global(.input-container) {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    border-radius: 0;
    height: 100%;
    min-height: 0;
    max-height: 52px;
    padding: 12px 14px;
  }
  .edit-device-alert-field-box .edit-device-alert-unit-inline {
    flex-shrink: 0;
    padding: 14px;
    font-family: var(--ds-font-family-primary);
    font-size: 16px;
    line-height: 24px;
    color: var(--ds-color-neutral-true-800, #292929);
  }
  .edit-device-alert-field-box .edit-device-alert-unit-dropdown {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    min-width: 120px;
    max-width: 140px;
    height: 52px;
    min-height: 52px;
    max-height: 52px;
    padding: 0 14px;
    gap: 8px;
    box-sizing: border-box;
  }
  .edit-device-alert-field-box .edit-device-alert-unit-dropdown :global(.dropdown-container) {
    flex: 1;
    min-width: 0;
    height: 100%;
    min-height: 52px;
  }
  .edit-device-alert-field-box .edit-device-alert-unit-dropdown :global(.dropdown-trigger) {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    border-radius: 0;
    min-height: 52px !important;
    height: 52px !important;
    max-height: 52px !important;
    padding: 0 14px !important;
    min-width: 0;
  }
  .edit-device-alert-field-box .edit-device-alert-unit-dropdown :global(.dropdown-trigger-text) {
    min-width: 4.5em;
    flex: 1 1 auto;
  }
  .edit-device-alert-unit-inline {
    flex-shrink: 0;
    font-family: var(--ds-font-family-primary);
    font-size: 16px;
    line-height: 24px;
    color: var(--ds-color-neutral-true-500, #737373);
  }
  .edit-device-alert-dwell-field {
    flex: 1;
    min-width: 0;
    max-width: 328px;
    display: flex;
    flex-direction: row;
    align-items: center;
    align-self: center;
    height: 52px;
    min-height: 52px;
    padding: 0;
    background: var(--ds-color-gray-1-9, #FEFEFE);
    border: 1px solid var(--ds-color-neutral-true-300, #D6D6D6);
    border-radius: var(--ds-radius-lg, 8px);
    box-sizing: border-box;
    overflow: hidden;
  }
  .edit-device-alert-dwell-zone-wrap {
    flex: 1 1 auto;
    min-width: 0;
    max-width: 140px;
    display: flex;
    align-items: center;
    padding: 14px;
    gap: 4px;
    border-right: 1px solid var(--ds-color-neutral-true-300, #D6D6D6);
    box-sizing: border-box;
  }
  .edit-device-alert-dwell-zone-wrap :global(.dropdown-container) {
    width: 100%;
    border: none;
  }
  .edit-device-alert-dwell-zone-wrap :global(.dropdown-trigger) {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    border-radius: 0;
    min-height: 24px;
    padding: 0;
  }
  .edit-device-alert-dwell-input-wrap {
    flex: 1;
    min-width: 80px;
    max-width: 120px;
  }
  .edit-device-alert-dwell-input-wrap :global(.input-field-wrapper) {
    margin: 0;
    border: none;
    min-height: 0;
    align-self: stretch;
  }
  .edit-device-alert-dwell-input-wrap :global(.input-container) {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    padding: 12px 14px;
    height: 100%;
    min-height: 0;
    max-height: 52px;
  }
  .edit-device-alert-field-divider {
    width: 1px;
    align-self: stretch;
    background: var(--ds-color-neutral-true-300, #D6D6D6);
    flex-shrink: 0;
  }
  .edit-device-alert-dwell-field .edit-device-alert-unit-inline {
    flex: none;
    min-width: 96px;
    padding: 14px;
    font-family: var(--ds-font-family-primary);
    font-size: 16px;
    line-height: 24px;
    color: var(--ds-color-neutral-true-400, #A3A3A3);
  }
  .edit-device-alert-divider {
    width: 100%;
    height: 0;
    border: none;
    border-top: 1px solid var(--ds-color-neutral-true-200, #E5E5E5);
    margin: var(--ds-space-6, 24px) 0;
    flex-shrink: 0;
  }
  .edit-device-alert-rule-label-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .edit-device-alert-rule-title {
    font-family: var(--ds-font-family-primary);
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    color: var(--ds-text-primary);
  }
  .edit-device-alert-rule-desc {
    font-family: var(--ds-font-family-primary);
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    color: var(--ds-color-neutral-true-500, #737373);
  }
  .edit-device-alert-threshold-row :global(.input-field-wrapper),
  .edit-device-alert-label-field-row :global(.input-field-wrapper) {
    flex: 1;
    min-width: 0;
  }
  .edit-device-alert-label-field-row > :global(.input-field-wrapper) {
    max-width: 328px;
  }

  .add-device-fields {
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-4);
    width: 100%;
    min-width: 0;
  }
  .add-device-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--ds-space-4, 16px);
    width: 100%;
    min-width: 0;
  }
  .add-device-row-device-settings {
    align-items: start;
  }
  .add-device-row-device-settings .add-device-field {
    min-width: 0;
  }
  .add-device-row-device-settings .add-device-field :global(button[class*="dropdown-trigger"]) {
    min-height: 48px;
    height: 48px;
  }
  .add-device-section {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: var(--ds-space-4);
    gap: var(--ds-space-4);
    width: 100%;
    min-width: 0;
    background: var(--ds-color-neutral-true-50);
    border-radius: var(--ds-radius-lg);
  }
  .add-device-section-title {
    font-family: var(--ds-font-family-primary);
    font-size: var(--ds-text-base, 1rem);
    font-weight: 600;
    line-height: 24px;
    color: var(--ds-color-neutral-true-700);
    margin: 0;
  }
  .add-device-constraint-hint {
    font-size: var(--ds-text-sm);
    color: var(--ds-color-gray-500);
    margin: 0 0 var(--ds-space-1) 0;
  }
  .add-device-zones-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    width: 100%;
  }
  .add-device-zones-header .add-device-section-title {
    flex: 0 0 auto;
  }
  .add-device-add-zone-right {
    margin-left: auto;
    flex: none;
  }
  .add-device-add-zone-trigger-wrap {
    display: inline-flex;
    width: fit-content;
  }
  .add-device-zone-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--ds-space-4);
    width: 100%;
    min-height: 48px;
  }
  .add-device-zone-toggle {
    flex: none;
    width: 36px;
    display: flex;
    align-items: center;
  }
  .add-device-zone-input {
    flex: 1 1 auto;
    min-width: 0;
  }
  .add-device-field {
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-1);
    min-width: 0;
    width: 100%;
  }
  .add-device-field-full {
    grid-column: 1 / -1;
    width: 100%;
  }
  .add-device-path-tracking-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 0;
    width: 100%;
    height: 52px;
    flex: none;
  }
  .add-device-path-tracking-cell-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0;
    gap: 0;
    min-height: 40px;
    justify-content: center;
    flex: 1;
    min-width: 0;
  }
  .add-device-path-tracking-title {
    font-family: var(--ds-font-family-primary);
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    color: var(--ds-color-neutral-true-600, #525252);
  }
  .add-device-path-tracking-desc {
    font-family: var(--ds-font-family-primary);
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    color: var(--ds-color-neutral-true-500, #737373);
  }
  .add-device-path-tracking-cell-toggle {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    padding: 16px 0;
    gap: 12px;
    width: 36px;
    height: 52px;
    min-height: 52px;
    flex: none;
  }
  .add-device-dwell-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0;
    gap: 4px;
    width: 100%;
  }
  .add-device-dwell-label {
    font-family: var(--ds-font-family-primary);
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    color: var(--ds-color-neutral-true-600, #525252);
  }
  .add-device-dwell-control {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0;
    gap: 16px;
    width: 100%;
    height: 52px;
  }
  .add-device-dwell-slider-wrap {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    min-height: 12px;
  }
  .add-device-dwell-slider-wrap :global(.progress-container) {
    width: 100%;
  }
  .add-device-dwell-range {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
    z-index: 2;
    -webkit-appearance: none;
    appearance: none;
  }
  .add-device-dwell-value-wrap {
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 12px 14px;
    gap: 4px;
    width: 130px;
    height: 52px;
    min-height: 52px;
    background: var(--ds-color-gray-1-9, #FEFEFE);
    border: 1px solid var(--ds-color-neutral-true-300, #D6D6D6);
    border-radius: 8px;
    flex: none;
  }
  .add-device-dwell-value {
    font-family: var(--ds-font-family-primary);
    font-size: 16px;
    line-height: 24px;
    font-weight: 400;
    color: var(--ds-color-neutral-true-900, #141414);
  }
  .add-device-dwell-unit {
    font-family: var(--ds-font-family-primary);
    font-size: 16px;
    line-height: 24px;
    font-weight: 400;
    color: var(--ds-color-neutral-true-400, #A3A3A3);
  }
  .add-device-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--ds-space-4);
    width: 100%;
  }
</style>
