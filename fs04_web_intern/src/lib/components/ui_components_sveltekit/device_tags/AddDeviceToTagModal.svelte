<script lang="ts">
    import { createEventDispatcher, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { Modal, InputField, Button, Checkbox } from '$lib/design-system/components';
    import { Search, X } from 'lucide-svelte';
    import { toast } from '$lib/stores/alertToast';

    interface DeviceItem {
        id: string;
        name: string;
        status?: string;
        model?: string;
        description?: string;
        macAddress?: string | null;
        connected?: boolean;
        lastUsedAt?: string;
    }

    export let open = false;
    export let tagId: string = '';
    export let excludeDeviceIds: string[] = [];

    let loading = false;
    let submitting = false;
    let selectedDevices: DeviceItem[] = [];
    let devices: DeviceItem[] = [];
    let searchTerm = '';
    const perPage = 20;

    const dispatch = createEventDispatcher<{
        close: void;
        added: void;
    }>();

    let searchDebounceId: ReturnType<typeof setTimeout> | null = null;
    const SEARCH_DEBOUNCE_MS = 300;
    let didInitialLoad = false;
    let lastSearchedTerm: string | null = null;

    onDestroy(() => {
        if (searchDebounceId) clearTimeout(searchDebounceId);
    });

    $: if (!open) {
        didInitialLoad = false;
        lastSearchedTerm = null;
    }

    $: if (browser && open && tagId && !didInitialLoad) {
        didInitialLoad = true;
        lastSearchedTerm = '';
        loadDevices();
    }

    $: if (browser && open && tagId && didInitialLoad && searchTerm !== lastSearchedTerm) {
        lastSearchedTerm = searchTerm;
        if (searchDebounceId) clearTimeout(searchDebounceId);
        const term = (searchTerm || '').trim();
        searchDebounceId = setTimeout(() => {
            searchDebounceId = null;
            loadDevices();
        }, term === '' ? 0 : SEARCH_DEBOUNCE_MS);
    }

    async function loadDevices() {
        if (!tagId) return;
        try {
            loading = true;
            const params = new URLSearchParams();
            params.set('page', '1');
            params.set('per_page', String(perPage));
            params.set('sort', 'name');
            params.set('order', 'asc');
            if (searchTerm) params.set('search', searchTerm);
            if (excludeDeviceIds.length) params.set('excludeDeviceIds', excludeDeviceIds.join(','));

            const res = await fetch(`/api/v2/devices/select?${params}`);
            const json = await res.json().catch(() => ({}));
            const data = json?.data ?? json;
            devices = data?.devices ?? [];
        } catch (e) {
            console.error('Failed to load devices:', e);
            toast.error('Unable to load devices. Please try again!');
            devices = [];
        } finally {
            loading = false;
        }
    }

    function handleRowClick(device: DeviceItem) {
        const idx = selectedDevices.findIndex((d) => d.id === device.id);
        if (idx >= 0) {
            selectedDevices = selectedDevices.filter((d) => d.id !== device.id);
        } else {
            selectedDevices = [...selectedDevices, device];
        }
    }

    function removeSelected(device: DeviceItem) {
        selectedDevices = selectedDevices.filter((d) => d.id !== device.id);
    }

    async function handleConfirm() {
        if (selectedDevices.length === 0) return;
        submitting = true;
        try {
            let ok = 0;
            let err = 0;
            for (const device of selectedDevices) {
                const res = await fetch(`/api/v2/devices/${device.id}/tags`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deviceTagId: tagId })
                });
                if (res.ok) ok++;
                else err++;
            }
            if (ok) {
                toast.success('Device added successfully!');
                dispatch('added');
                handleClose();
            }
            if (err) toast.error('Unable to add Device. Please try again!');
        } catch {
            toast.error('Unable to add Device. Please try again!');
        } finally {
            submitting = false;
        }
    }

    function handleClose() {
        selectedDevices = [];
        searchTerm = '';
        dispatch('close');
    }

    function displayMac(device: DeviceItem): string {
        return device.macAddress || '—';
    }

    function handleSearchInput(event: CustomEvent<string>) {
        searchTerm = event.detail;
    }
</script>

<Modal
    {open}
    title="Add Device"
    size="lg"
    showFooter={false}
    on:close={handleClose}
>
    <div class="add-device-content">
        <!-- Search Input -->
        <div class="add-device-search">
            <InputField
                type="text"
                placeholder="Search and select device"
                value={searchTerm}
                suffixIcon={true}
                on:input={handleSearchInput}
            >
                <Search size={20} slot="suffix-icon" />
            </InputField>
        </div>

        <!-- Selected Items Section -->
        {#if selectedDevices.length > 0}
            <div class="add-device-selected">
                <div class="add-device-selected-header">
                    <span class="add-device-selected-title">Selected ({selectedDevices.length} item{selectedDevices.length !== 1 ? 's' : ''})</span>
                </div>
                <div class="add-device-selected-list">
                    {#each selectedDevices as device (device.id)}
                        <div class="add-device-selected-item">
                            <div class="add-device-selected-info">
                                <span class="add-device-selected-name">{device.name}</span>
                                <span class="add-device-selected-mac">{displayMac(device)}</span>
                            </div>
                            <button
                                type="button"
                                class="add-device-selected-remove"
                                on:click={() => removeSelected(device)}
                                aria-label="Remove"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Device List -->
        <div class="add-device-list-container">
            {#if loading}
                <div class="add-device-loading">
                    <div class="add-device-spinner"></div>
                    <p>Loading devices…</p>
                </div>
            {:else if devices.length === 0}
                <div class="add-device-empty">
                    <p>No devices found</p>
                </div>
            {:else}
                <div class="add-device-list">
                    {#each devices as device (device.id)}
                        {@const isSelected = selectedDevices.some((d) => d.id === device.id)}
                        <button
                            type="button"
                            class="add-device-row"
                            class:selected={isSelected}
                            on:click={() => handleRowClick(device)}
                        >
                            <div class="add-device-row-checkbox">
                                <Checkbox checked={isSelected} on:change={() => handleRowClick(device)} />
                            </div>
                            <div class="add-device-row-info">
                                <span class="add-device-row-name">{device.name}</span>
                                <span class="add-device-row-mac">{displayMac(device)}</span>
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    </div>

    <!-- Footer -->
    <div slot="footer" class="add-device-footer">
        <Button
            variant="outline"
            color="primary"
            size="lg"
            on:click={handleClose}
            disabled={submitting}
        >
            Cancel
        </Button>
        <Button
            variant="filled"
            color="primary"
            size="lg"
            on:click={handleConfirm}
            loading={submitting}
            disabled={selectedDevices.length === 0 || submitting}
        >
            Add
        </Button>
    </div>
</Modal>

<style>
    .add-device-content {
        display: flex;
        flex-direction: column;
        gap: var(--ds-space-4);
    }

    .add-device-search {
        width: 100%;
    }

    /* Selected Section */
    .add-device-selected {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--ds-border-default);
        border-radius: var(--ds-radius-lg);
        overflow: hidden;
    }

    .add-device-selected-header {
        padding: 12px 16px;
        background: var(--ds-bg-primary);
        border-bottom: 1px solid var(--ds-border-default);
    }

    .add-device-selected-title {
        font-family: var(--ds-font-family-primary);
        font-weight: var(--ds-font-semibold);
        font-size: var(--ds-text-sm);
        line-height: var(--ds-leading-sm);
        color: var(--ds-text-primary);
    }

    .add-device-selected-list {
        display: flex;
        flex-direction: column;
        max-height: 160px;
        overflow-y: auto;
    }

    .add-device-selected-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--ds-border-default);
    }

    .add-device-selected-item:last-child {
        border-bottom: none;
    }

    .add-device-selected-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .add-device-selected-name {
        font-family: var(--ds-font-family-primary);
        font-weight: var(--ds-font-medium);
        font-size: var(--ds-text-sm);
        line-height: var(--ds-leading-sm);
        color: var(--ds-text-primary);
    }

    .add-device-selected-mac {
        font-family: var(--ds-font-family-primary);
        font-size: 12px;
        line-height: 16px;
        color: var(--ds-text-tertiary);
    }

    .add-device-selected-remove {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: var(--ds-radius-md);
        background: transparent;
        color: var(--ds-text-tertiary);
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .add-device-selected-remove:hover {
        background: var(--ds-bg-secondary);
        color: var(--ds-text-primary);
    }

    /* Device List */
    .add-device-list-container {
        border: 1px solid var(--ds-border-default);
        border-radius: var(--ds-radius-lg);
        overflow: hidden;
        min-height: 200px;
        max-height: 300px;
    }

    .add-device-list {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        max-height: 300px;
    }

    .add-device-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border: none;
        border-bottom: 1px solid var(--ds-border-default);
        background: var(--ds-bg-primary);
        cursor: pointer;
        transition: background 0.15s ease;
        width: 100%;
        text-align: left;
    }

    .add-device-row:last-child {
        border-bottom: none;
    }

    .add-device-row:hover {
        background: var(--ds-bg-secondary);
    }

    .add-device-row.selected {
        background: var(--ds-color-blue-light-50);
    }

    .add-device-row-checkbox {
        flex-shrink: 0;
    }

    .add-device-row-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
    }

    .add-device-row-name {
        font-family: var(--ds-font-family-primary);
        font-weight: var(--ds-font-medium);
        font-size: var(--ds-text-sm);
        line-height: var(--ds-leading-sm);
        color: var(--ds-text-primary);
    }

    .add-device-row-mac {
        font-family: var(--ds-font-family-primary);
        font-size: 12px;
        line-height: 16px;
        color: var(--ds-text-tertiary);
    }

    /* Loading & Empty States */
    .add-device-loading,
    .add-device-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 48px 16px;
        color: var(--ds-text-tertiary);
    }

    .add-device-spinner {
        width: 32px;
        height: 32px;
        border: 2px solid var(--ds-border-default);
        border-top-color: var(--ds-color-primary-600);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Footer */
    .add-device-footer {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
        gap: var(--ds-space-4);
        width: 100%;
    }

    .add-device-footer :global(button) {
        min-width: 100px;
    }
</style>
