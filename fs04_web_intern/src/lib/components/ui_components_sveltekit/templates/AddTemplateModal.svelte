<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import {
        Modal,
        Button,
        InputField,
        TextareaField,
        TabGroup,
        Toggle,
        Dropdown,
        ProgressBar
    } from '$lib/design-system/components';
    import { Plus, Search, Trash2, X } from 'lucide-svelte';
    import { DESCRIPTION_MAX } from '$lib/constants/description';
    import CharacterCount from '$lib/components/ui_components_sveltekit/form/CharacterCount.svelte';

    export let open: boolean = false;
    /** 'alert' | 'configuration' - which template type is being added */
    export let templateType: 'alert' | 'configuration' = 'alert';
    /** Available sensors to select from (passed from parent) */
    export let availableSensors: SelectedSensor[] = [];

    // Types
    interface ZoneRow {
        id: string;
        name: string;
        active: boolean;
        zoneNumber?: number;
        // Position data - default to tracking area bounds
        startX?: number;
        startY?: number;
        endX?: number;
        endY?: number;
        xMin?: number;
        xMax?: number;
        yMin?: number;
        yMax?: number;
        color?: string;
    }
    interface SelectedSensor {
        id: string;
        name: string;
        mac?: string;
    }

    // Alert settings types
    type AlertThresholdUnit = 'minutes' | 'hours';
    interface AlertState {
        sensorOffline: { enabled: boolean; threshold: string; unit: AlertThresholdUnit };
        noData: { enabled: boolean; threshold: string; unit: AlertThresholdUnit };
        dwellTime: { enabled: boolean; zoneId: string; threshold: string };
        email: { enabled: boolean; address: string };
        webhook: { enabled: boolean; url: string };
    }

    const dispatch = createEventDispatcher<{
        close: void;
        add: {
            name: string;
            description: string;
            type: string;
            trackingArea: { xMin: string; xMax: string; yMin: string; yMax: string };
            zones: ZoneRow[];
            deviceSettings: {
                deviceMode: string;
                timezone: string;
                pathTracking: boolean;
                dwellThreshold: number;
            };
            alertSettings?: AlertState;
            selectedSensors: SelectedSensor[];
        };
    }>();

    // Form state
    let templateName = '';
    let description = '';
    // Default tab based on template type
    $: defaultTab = templateType === 'alert' ? 'alert' : 'configuration';
    let activeTab = 'configuration';

    // Alert threshold unit options
    const alertThresholdUnitOptions = [
        { id: 'minutes', label: 'minutes' },
        { id: 'hours', label: 'hours' }
    ];

    // Alert state
    let alertState: AlertState = {
        sensorOffline: { enabled: false, threshold: '5', unit: 'minutes' },
        noData: { enabled: false, threshold: '30', unit: 'minutes' },
        dwellTime: { enabled: false, zoneId: '', threshold: '120' },
        email: { enabled: false, address: '' },
        webhook: { enabled: false, url: '' }
    };

    // Zone options for dwell time alert dropdown
    $: alertZoneOptions = zones.map((z) => ({ id: z.id, label: z.name || z.id }));

    // Tracking Area (Configuration)
    let xMin = '';
    let xMax = '';
    let yMin = '';
    let yMax = '';

    // Zones (Configuration) - start with empty, user adds zones
    let zones: ZoneRow[] = [];

    // Device Settings (Configuration)
    const deviceModeOptions = [
        { id: 'LIVE_PREVIEW', label: 'Live Preview' },
        { id: 'BACKGROUND', label: 'Background' }
    ];
    const timezoneOptions = [
        { id: 'utc', label: 'UTC (GMT +0)' },
        { id: 'vietnam', label: 'Ho Chi Minh (UTC+7)' }
    ];
    let deviceMode = '';
    let timezone = '';
    let pathTracking = false;
    let dwellThreshold = 0;

    // Assign Sensor
    let sensorSearch = '';
    let selectedSensors: SelectedSensor[] = [];

    // Tracking Area Constraints (same as EditDeviceModal)
    const TRACKING_AREA_CONSTRAINTS = {
        X_MIN: -4,
        X_MAX: 4,
        Y_MIN: 0,
        Y_MAX: 7
    };

    // Validation errors
    interface FormErrors {
        templateName?: string;
    }
    let errors: FormErrors = {};

    // Tracking area field-specific errors
    interface TrackingAreaErrors {
        xMin?: string;
        xMax?: string;
        yMin?: string;
        yMax?: string;
    }
    let trackingAreaErrors: TrackingAreaErrors = {};

    // Tabs based on template type
    const CONFIG_TABS = [
        { id: 'configuration', label: 'Configuration' },
        { id: 'assign-sensor', label: 'Assign Sensor' }
    ];
    const ALERT_TABS = [
        { id: 'alert', label: 'Alert' },
        { id: 'assign-sensor', label: 'Assign Sensor' }
    ];
    // For Configuration template that also has Alert tab
    const CONFIG_WITH_ALERT_TABS = [
        { id: 'configuration', label: 'Configuration' },
        { id: 'alert', label: 'Alert' },
        { id: 'assign-sensor', label: 'Assign Sensor' }
    ];
    $: TABS = templateType === 'alert' ? ALERT_TABS : CONFIG_TABS;

    // Reset form when modal opens
    function resetForm() {
        templateName = '';
        description = '';
        // Set default tab based on template type
        activeTab = templateType === 'alert' ? 'alert' : 'configuration';
        xMin = '';
        xMax = '';
        yMin = '';
        yMax = '';
        zones = [];
        deviceMode = '';
        timezone = '';
        pathTracking = false;
        dwellThreshold = 0;
        sensorSearch = '';
        selectedSensors = [];
        errors = {};
        trackingAreaErrors = {};
        // Reset alert state
        alertState = {
            sensorOffline: { enabled: false, threshold: '5', unit: 'minutes' },
            noData: { enabled: false, threshold: '30', unit: 'minutes' },
            dwellTime: { enabled: false, zoneId: '', threshold: '120' },
            email: { enabled: false, address: '' },
            webhook: { enabled: false, url: '' }
        };
    }

    // Watch for modal open to reset form
    $: if (open) {
        resetForm();
    }

    function handleClose() {
        dispatch('close');
    }

    const MAX_NAME_LENGTH = 500;

    // Validate a single field
    function validateField(field: keyof FormErrors): string | undefined {
        switch (field) {
            case 'templateName':
                if (!templateName.trim()) {
                    return 'Template name is required';
                }
                if (templateName.length > MAX_NAME_LENGTH) {
                    return `Template name must be ${MAX_NAME_LENGTH} characters or less`;
                }
                return undefined;
            default:
                return undefined;
        }
    }

    // Validate tracking area field
    function validateTrackingField(value: string, isXAxis: boolean): string | undefined {
        // Empty is allowed (optional field)
        if (!value.trim()) {
            return undefined;
        }

        const num = parseFloat(value);
        if (isNaN(num)) {
            return 'Must be a valid number';
        }

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

    // Validate all tracking area fields
    function validateTrackingArea(): boolean {
        const newErrors: TrackingAreaErrors = {};

        const xMinError = validateTrackingField(xMin, true);
        if (xMinError) newErrors.xMin = xMinError;

        const xMaxError = validateTrackingField(xMax, true);
        if (xMaxError) newErrors.xMax = xMaxError;

        const yMinError = validateTrackingField(yMin, false);
        if (yMinError) newErrors.yMin = yMinError;

        const yMaxError = validateTrackingField(yMax, false);
        if (yMaxError) newErrors.yMax = yMaxError;

        trackingAreaErrors = newErrors;
        return Object.keys(newErrors).length === 0;
    }

    // Validate all required fields
    function validateForm(): boolean {
        const newErrors: FormErrors = {};

        const templateNameError = validateField('templateName');
        if (templateNameError) newErrors.templateName = templateNameError;

        errors = newErrors;

        // Also validate tracking area
        const trackingAreaValid = validateTrackingArea();

        return Object.keys(newErrors).length === 0 && trackingAreaValid;
    }

    function handleAdd() {
        // Validate before dispatching
        if (!validateForm()) {
            return;
        }

        dispatch('add', {
            name: templateName,
            description,
            type: templateType,
            trackingArea: { xMin, xMax, yMin, yMax },
            zones,
            deviceSettings: {
                deviceMode,
                timezone,
                pathTracking,
                dwellThreshold
            },
            alertSettings: templateType === 'alert' ? alertState : undefined,
            selectedSensors
        });
    }

    function addZone() {
        const next = zones.length + 1;
        // Calculate default zone position based on tracking area
        // Each zone takes a portion of the tracking area
        const taXMin = parseFloat(xMin) || TRACKING_AREA_CONSTRAINTS.X_MIN;
        const taXMax = parseFloat(xMax) || TRACKING_AREA_CONSTRAINTS.X_MAX;
        const taYMin = parseFloat(yMin) || TRACKING_AREA_CONSTRAINTS.Y_MIN;
        const taYMax = parseFloat(yMax) || TRACKING_AREA_CONSTRAINTS.Y_MAX;
        
        // Default zone size (1m x 1m) centered in tracking area
        const zoneWidth = 1;
        const zoneHeight = 1;
        const centerX = (taXMin + taXMax) / 2;
        const centerY = (taYMin + taYMax) / 2;
        
        // Offset each zone slightly so they don't overlap
        const offset = (next - 1) * 0.5;
        const zoneStartX = Math.max(taXMin, centerX - zoneWidth / 2 + offset);
        const zoneStartY = Math.max(taYMin, centerY - zoneHeight / 2 + offset);
        const zoneEndX = Math.min(taXMax, zoneStartX + zoneWidth);
        const zoneEndY = Math.min(taYMax, zoneStartY + zoneHeight);
        
        zones = [...zones, { 
            id: String(Date.now()), 
            name: `Zone ${next}`, 
            active: true,
            zoneNumber: next,
            startX: zoneStartX,
            startY: zoneStartY,
            endX: zoneEndX,
            endY: zoneEndY,
            xMin: zoneStartX,
            xMax: zoneEndX,
            yMin: zoneStartY,
            yMax: zoneEndY
        }];
    }

    function removeZone(id: string) {
        zones = zones.filter((z) => z.id !== id);
    }

    function removeSensor(id: string) {
        selectedSensors = selectedSensors.filter((s) => s.id !== id);
    }

    // Filter available sensors based on search and exclude already selected
    $: filteredSensors = availableSensors.filter((sensor) => {
        const isSelected = selectedSensors.some((s) => s.id === sensor.id);
        if (isSelected) return false;
        if (!sensorSearch.trim()) return true;
        const search = sensorSearch.toLowerCase();
        return (
            sensor.name.toLowerCase().includes(search) ||
            (sensor.mac && sensor.mac.toLowerCase().includes(search))
        );
    });

    function selectSensor(sensor: SelectedSensor) {
        selectedSensors = [...selectedSensors, sensor];
        sensorSearch = '';
    }

    $: selectedCount = selectedSensors.length;
</script>

<Modal
    {open}
    title="Add Template"
    width="880px"
    showFooter={true}
    cancelText="Cancel"
    confirmText="Add"
    on:close={handleClose}
    on:confirm={handleAdd}
>
    <div class="add-template-modal-body">
        <div class="add-device-fields">
            <div class="add-device-field add-device-field-full">
                <InputField
                    label="Template Name"
                    required={true}
                    placeholder="Enter template name"
                    bind:value={templateName}
                    maxlength={MAX_NAME_LENGTH}
                    state={errors.templateName ? 'error' : 'default'}
                    helperText={errors.templateName || ''}
                    on:blur={() => { errors.templateName = validateField('templateName'); }}
                />
                <CharacterCount current={templateName.length} max={MAX_NAME_LENGTH} />
            </div>
            <div class="add-device-field add-device-field-full">
                <TextareaField
                    label="Description"
                    placeholder="Enter template description"
                    bind:value={description}
                    rows={4}
                    maxlength={DESCRIPTION_MAX}
                />
                <CharacterCount current={description.length} max={DESCRIPTION_MAX} />
            </div>

            <div class="edit-device-tabs-wrap">
                <TabGroup
                    tabs={TABS}
                    activeTab={activeTab}
                    type="underline"
                    size="md"
                    fullWidth={false}
                    on:change={(e) => (activeTab = e.detail)}
                />
            </div>

            {#if activeTab === 'configuration'}
                <div class="add-device-section">
                    <h3 class="add-device-section-title">Tracking Area</h3>
                    <div class="add-device-row">
                        <div class="add-device-field">
                            <InputField
                                label="X Min"
                                placeholder="Enter"
                                bind:value={xMin}
                                state={trackingAreaErrors.xMin ? 'error' : 'default'}
                                helperText={trackingAreaErrors.xMin || ''}
                                on:blur={() => { trackingAreaErrors.xMin = validateTrackingField(xMin, true); }}
                            />
                        </div>
                        <div class="add-device-field">
                            <InputField
                                label="X Max"
                                placeholder="Enter"
                                bind:value={xMax}
                                state={trackingAreaErrors.xMax ? 'error' : 'default'}
                                helperText={trackingAreaErrors.xMax || ''}
                                on:blur={() => { trackingAreaErrors.xMax = validateTrackingField(xMax, true); }}
                            />
                        </div>
                    </div>
                    <div class="add-device-row">
                        <div class="add-device-field">
                            <InputField
                                label="Y Min"
                                placeholder="Enter"
                                bind:value={yMin}
                                state={trackingAreaErrors.yMin ? 'error' : 'default'}
                                helperText={trackingAreaErrors.yMin || ''}
                                on:blur={() => { trackingAreaErrors.yMin = validateTrackingField(yMin, false); }}
                            />
                        </div>
                        <div class="add-device-field">
                            <InputField
                                label="Y Max"
                                placeholder="Enter"
                                bind:value={yMax}
                                state={trackingAreaErrors.yMax ? 'error' : 'default'}
                                helperText={trackingAreaErrors.yMax || ''}
                                on:blur={() => { trackingAreaErrors.yMax = validateTrackingField(yMax, false); }}
                            />
                        </div>
                    </div>
                </div>

                <div class="add-device-section">
                    <div class="add-device-zones-header">
                        <h3 class="add-device-section-title">Zones</h3>
                        <div class="add-device-add-zone-right">
                            <Button
                                variant="text"
                                color="primary"
                                size="md"
                                iconLeft={true}
                                on:click={addZone}
                            >
                                <Plus size={20} slot="icon-left" />
                                Add Zone
                            </Button>
                        </div>
                    </div>
                    {#if zones.length === 0}
                        <p class="zones-empty">No zones added. Click "Add Zone" to create a zone.</p>
                    {:else}
                        {#each zones as zone (zone.id)}
                            <div class="add-device-zone-wrap">
                                <div class="add-device-zone-toggle">
                                    <Toggle
                                        size="sm"
                                        checked={zone.active}
                                        on:change={(e) => {
                                            zone.active = e.detail;
                                            zones = zones;
                                        }}
                                    />
                                </div>
                                <div class="add-device-zone-input">
                                    <InputField
                                        label=""
                                        type="text"
                                        bind:value={zone.name}
                                        placeholder="Enter zone name"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    color="danger"
                                    size="md"
                                    icon={Trash2}
                                    iconPosition="only"
                                    on:click={() => removeZone(zone.id)}
                                    class="add-device-zone-delete"
                                />
                            </div>
                        {/each}
                    {/if}
                </div>

                <div class="add-device-section">
                    <h3 class="add-device-section-title">Device Settings</h3>
                    <div class="add-device-row add-device-row-device-settings">
                        <div class="add-device-field">
                            <Dropdown
                                label="Device Mode"
                                options={deviceModeOptions}
                                bind:value={deviceMode}
                                width="100%"
                            />
                        </div>
                        <div class="add-device-field">
                            <Dropdown
                                label="Timezone"
                                options={timezoneOptions}
                                bind:value={timezone}
                                width="100%"
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
                                checked={pathTracking}
                                on:change={(e) => (pathTracking = e.detail)}
                            />
                        </div>
                    </div>
                    <div class="add-device-dwell-row">
                        <label class="add-device-dwell-label" for="add-template-dwell-slider">Dwell Threshold</label>
                        <div class="add-device-dwell-control">
                            <div class="add-device-dwell-slider-wrap">
                                <ProgressBar
                                    value={Math.min(100, (dwellThreshold / 120) * 100)}
                                    showThumb={true}
                                    showLabel={false}
                                    size="md"
                                    color="gray"
                                />
                                <input
                                    id="add-template-dwell-slider"
                                    type="range"
                                    class="add-device-dwell-range"
                                    min="0"
                                    max="120"
                                    step="1"
                                    bind:value={dwellThreshold}
                                    aria-valuemin={0}
                                    aria-valuemax={120}
                                    aria-valuenow={dwellThreshold}
                                    aria-label="Dwell Threshold (seconds)"
                                />
                            </div>
                            <div class="add-device-dwell-value-wrap">
                                <span class="add-device-dwell-value">{dwellThreshold}</span>
                                <span class="add-device-dwell-unit">sec</span>
                            </div>
                        </div>
                    </div>
                </div>
            {:else if activeTab === 'alert'}
                <!-- Alert Tab: same structure as Edit Device -> Alert tab (edit-device-alert-section) -->
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
                                        <InputField
                                            label=""
                                            type="text"
                                            bind:value={alertState.sensorOffline.threshold}
                                            placeholder="Enter"
                                        />
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
                                        <InputField
                                            label=""
                                            type="text"
                                            bind:value={alertState.noData.threshold}
                                            placeholder="Enter"
                                        />
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
                                                clearable={false}
                                                placeholder="Select zone"
                                            />
                                        </div>
                                        <div class="edit-device-alert-dwell-input-wrap">
                                            <InputField
                                                label=""
                                                type="text"
                                                bind:value={alertState.dwellTime.threshold}
                                                placeholder="Enter"
                                            />
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
                                    <InputField
                                        label=""
                                        type="email"
                                        bind:value={alertState.email.address}
                                        placeholder="Enter email"
                                    />
                                </div>
                            {/if}
                        </div>
                        <div class="edit-device-alert-card">
                            <div class="edit-device-alert-table-row">
                                <span class="edit-device-alert-rule-title">Webhook</span>
                                <Toggle
                                    size="sm"
                                    checked={alertState.webhook.enabled}
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
                                    <InputField
                                        label=""
                                        type="url"
                                        bind:value={alertState.webhook.url}
                                        placeholder="https://"
                                    />
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {:else}
                <!-- Assign Sensor Tab -->
                <div class="assign-sensor-wrap">
                    <InputField
                        type="search"
                        placeholder="Search and select device"
                        bind:value={sensorSearch}
                        suffixIcon={true}
                    >
                        <Search size={22} slot="suffix-icon" />
                    </InputField>
                    <!-- Search results dropdown - only show when user is typing and has available sensors -->
                    {#if sensorSearch.trim() && availableSensors.length > 0}
                        {#if filteredSensors.length > 0}
                            <div class="search-results">
                                {#each filteredSensors as sensor (sensor.id)}
                                    <button
                                        type="button"
                                        class="search-result-item"
                                        on:click={() => selectSensor(sensor)}
                                    >
                                        <span class="search-result-name">{sensor.name}</span>
                                        {#if sensor.mac}
                                            <span class="search-result-mac">{sensor.mac}</span>
                                        {/if}
                                    </button>
                                {/each}
                            </div>
                        {:else}
                            <p class="search-no-results">No devices found matching "{sensorSearch}"</p>
                        {/if}
                    {/if}
                </div>
                <div class="selected-wrap">
                    <p class="selected-heading">Selected ({selectedCount} items)</p>
                    {#if selectedSensors.length > 0}
                        <div class="selected-list">
                            {#each selectedSensors as sensor (sensor.id)}
                                <div class="selected-item">
                                    <div class="selected-item-content">
                                        <span class="selected-item-name">{sensor.name}</span>
                                        {#if sensor.mac}
                                            <span class="selected-item-mac">{sensor.mac}</span>
                                        {/if}
                                    </div>
                                    <button
                                        type="button"
                                        class="selected-remove-btn"
                                        aria-label="Remove"
                                        on:click={() => removeSensor(sensor.id)}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <p class="selected-empty">No devices selected. Use the search above to find and select devices.</p>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</Modal>

<style>

    .add-template-modal-body {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        min-width: 100%;
        box-sizing: border-box;
        padding: var(--ds-space-4);
        gap: var(--ds-space-4);
        max-height: min(1058px, calc(100vh - 180px));
        overflow-y: auto;
    }

    /* Edit Device–style layout (match EditDeviceModal) */
    .add-device-fields {
        display: flex;
        flex-direction: column;
        gap: var(--ds-space-4);
        width: 100%;
        min-width: 0;
    }
    .edit-device-tabs-wrap {
        width: 100%;
        border-bottom: 1px solid var(--ds-color-neutral-true-200, #E5E5E5);
    }
    /* Alert tab: same layout as Edit Device -> Alert (edit-device-alert-section) */
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
    .zones-empty {
        margin: 0;
        font-family: var(--ds-font-family-primary);
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
        color: var(--ds-color-neutral-true-500, #737373);
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

    /* Assign Sensor Tab */
    .assign-sensor-wrap {
        display: flex;
        flex-direction: column;
        gap: var(--ds-space-1);
        width: 100%;
        min-width: 0;
        position: relative;
    }

    .search-results {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-height: 200px;
        overflow-y: auto;
        background: var(--ds-color-white, #FFFFFF);
        border: 1px solid var(--ds-color-neutral-true-200, #E5E5E5);
        border-radius: var(--ds-radius-md);
        box-shadow: var(--ds-shadow-md);
        margin-top: 4px;
    }

    .search-result-item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 8px 16px;
        gap: 2px;
        width: 100%;
        border: none;
        background: transparent;
        cursor: pointer;
        text-align: left;
    }

    .search-result-item:hover {
        background: var(--ds-color-neutral-true-50, #FAFAFA);
    }

    .search-result-name {
        font-family: var(--ds-font-family-primary);
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
        color: var(--ds-color-neutral-true-900, #141414);
    }

    .search-result-mac {
        font-family: var(--ds-font-family-primary);
        font-size: 12px;
        font-weight: 400;
        line-height: 16px;
        letter-spacing: 0.01em;
        color: var(--ds-color-gray-500, #667085);
    }

    .search-no-results {
        margin: 4px 0 0 0;
        padding: 12px 16px;
        font-family: var(--ds-font-family-primary);
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
        color: var(--ds-color-neutral-true-500, #737373);
        background: var(--ds-color-white, #FFFFFF);
        border: 1px solid var(--ds-color-neutral-true-200, #E5E5E5);
        border-radius: var(--ds-radius-md);
    }

    .selected-wrap {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 0;
        gap: var(--ds-space-2);
        width: 100%;
    }

    .selected-heading {
        margin: 0;
        font-family: var(--ds-font-family-primary);
        font-size: 16px;
        font-weight: 500;
        line-height: 24px;
        color: var(--ds-color-neutral-true-800, #292929);
    }

    .selected-list {
        display: flex;
        flex-direction: column;
        gap: var(--ds-space-2);
        width: 100%;
    }

    .selected-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 8px 16px;
        gap: 12px;
        background: var(--ds-color-neutral-true-50, #FAFAFA);
        border-radius: 6px;
        width: 100%;
        box-sizing: border-box;
        min-height: 54px;
    }

    .selected-item-content {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 0;
        gap: 2px;
        flex: 1;
        min-width: 0;
    }

    .selected-item-name {
        font-family: var(--ds-font-family-primary);
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
        color: var(--ds-color-neutral-true-900, #141414);
    }

    .selected-item-mac {
        font-family: var(--ds-font-family-primary);
        font-size: 12px;
        font-weight: 400;
        line-height: 16px;
        letter-spacing: 0.01em;
        color: var(--ds-color-gray-500, #667085);
    }

    .selected-remove-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--ds-color-neutral-true-800, #292929);
        cursor: pointer;
        flex: none;
    }

    .selected-remove-btn:hover {
        color: var(--ds-color-neutral-true-900, #141414);
    }

    .selected-empty {
        margin: 0;
        font-family: var(--ds-font-family-primary);
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
        color: var(--ds-color-neutral-true-500, #737373);
    }
</style>
