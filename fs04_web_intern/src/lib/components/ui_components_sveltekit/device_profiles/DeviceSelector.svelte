<script lang="ts">
  import { createEventDispatcher, tick, onDestroy } from 'svelte';
  import { Button, Modal, InputField, Checkbox, Badge, ConfirmModal } from '$lib/design-system/components';
  import { X, Search } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';
  import { browser } from '$app/environment';

  /** Portal: render dropdown in body so it is not clipped by modal overflow */
  function appendToBody(node: HTMLElement) {
    if (typeof document !== 'undefined') document.body.appendChild(node);
    return {
      destroy() {
        if (node.parentNode) node.parentNode.removeChild(node);
      }
    };
  }

  interface Device {
    id: string;
    name: string;
    status: string;
    model?: string;
    description?: string;
    connected?: boolean;
    macAddress?: string;
    profileAssignment?: {
      profileId: string;
      profile: { id: string; name: string; level?: string };
    };
  }

  export let open = false;
  export let profileId: string = '';
  export let bundleId: string = '';
  export let apiPrefix: string = '/api/v2';
  export let status: 'assigned' | 'available' = 'available';
  export let title: string = 'Select Devices';
  export let confirmLabel: string = '';
  export let existingDeviceIds: string[] = [];
  /** Current profile name for reassign warning (TC-RDM-PR-0124). When set, devices already assigned to another profile will show a confirmation before reassigning. */
  export let currentProfileName: string = '';

  const PAGE_LIMIT = 100;
  /** px from bottom of dropdown to start fetching the next page */
  const SCROLL_LOAD_THRESHOLD_PX = 100;
  /** ms debounce before server search fires after user stops typing */
  const SEARCH_DEBOUNCE_MS = 300;

  let loading = false;
  let loadingMore = false;
  /** Total devices matching the list query (from API). */
  let listTotalCount = 0;
  /** Next `offset` query param for the following page. */
  let nextFetchOffset = 0;
  /**
   * Monotonically increasing counter. Each call to `loadDevices` increments it;
   * `loadMoreDevices` captures the current value and bails if it changed, preventing
   * stale page merges when `profileId`/`search` changes mid-flight.
   */
  let fetchEpoch = 0;

  let selectedDevices: Device[] = [];
  let devices: Device[] = [];
  let search = '';
  let dropdownOpen = false;
  let dropdownInteracting = false;
  let inputContainer: HTMLDivElement;
  let dropdownPortalEl: HTMLElement | null = null;
  let dropdownRect: { top: number; left: number; width: number } | null = null;
  let scrollResizeCleanup: (() => void) | null = null;
  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  const dispatch = createEventDispatcher<{
    select: { id: string; name: string }[];
    close: void;
  }>();

  // Debounced server-side search: re-fetch from offset 0 whenever search changes (after modal open).
  // Search is handled entirely server-side, so `devices` always matches the current query.
  let prevSearch = '';
  $: if (browser && (profileId || bundleId) && open && search !== prevSearch) {
    prevSearch = search;
    if (searchDebounceTimer != null) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      searchDebounceTimer = null;
      void loadDevices();
    }, SEARCH_DEBOUNCE_MS);
  }

  let prevOpen = false;
  $: if (browser && open && !prevOpen && (profileId || bundleId)) {
    prevOpen = true;
    resetAndLoad();
  } else if (!open && prevOpen) {
    prevOpen = false;
    dropdownOpen = false;
    dropdownInteracting = false;
    dropdownRect = null;
    if (searchDebounceTimer != null) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }
  }

  /** Compute dropdown position for portal. Use device-selector-input-container bottom (includes InputField border+padding) so gap is accurate. */
  function updateDropdownPosition() {
    if (!inputContainer || !dropdownOpen) return;
    const r = inputContainer.getBoundingClientRect();
    dropdownRect = {
      left: r.left,
      top: r.bottom + 8,
      width: r.width
    };
  }

  $: if (browser && dropdownOpen && inputContainer) {
    updateDropdownPosition();
    // Re-run after layout settles (double rAF ensures layout/paint complete)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => updateDropdownPosition());
    });
  } else if (!dropdownOpen) {
    dropdownRect = null;
  }

  // Re-compute dropdown position whenever selectedDevices changes.
  // Modal is vertically centered (align-items: center), so adding/removing items
  // causes the modal to shift up/down in viewport, moving the search input.
  $: if (browser && dropdownOpen && inputContainer && selectedDevices) {
    requestAnimationFrame(() => updateDropdownPosition());
  }

  /**
   * Sync dropdown position on scroll/resize so it stays aligned with input (portal uses position: fixed).
   * Scroll events don't bubble, so we must listen to each scroll container.
   * The portal element itself is excluded to avoid a feedback loop: scrolling the
   * dropdown list would otherwise reposition the dropdown mid-scroll (jitter).
   */
  $: if (browser && dropdownOpen && inputContainer) {
    if (scrollResizeCleanup) {
      scrollResizeCleanup();
      scrollResizeCleanup = null;
    }
    const onSync = () => updateDropdownPosition();
    const scrollTargets: (Window | Element)[] = [window];
    let el: Element | null = inputContainer;
    while (el) {
      // Skip the portal element itself – scrolling inside the dropdown must not
      // trigger a position recalculation (would cause jitter).
      if (el !== dropdownPortalEl) {
        const style = getComputedStyle(el);
        const overflow = style.overflow + style.overflowY + style.overflowX;
        if (/\b(auto|scroll|overlay)\b/.test(overflow)) scrollTargets.push(el);
      }
      el = el.parentElement;
    }
    scrollTargets.forEach((t) => t.addEventListener('scroll', onSync, true));
    window.addEventListener('resize', onSync);
    scrollResizeCleanup = () => {
      scrollTargets.forEach((t) => t.removeEventListener('scroll', onSync, true));
      window.removeEventListener('resize', onSync);
    };
  } else {
    if (scrollResizeCleanup) {
      scrollResizeCleanup();
      scrollResizeCleanup = null;
    }
  }

  async function resetAndLoad() {
    search = '';
    prevSearch = '';
    selectedDevices = [];
    dropdownOpen = false;
    dropdownInteracting = false;
    dropdownRect = null;
    await loadDevices();
    await tick();
    await tick();
    const tryOpenDropdown = (retries = 0) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (inputContainer) {
            dropdownOpen = true;
          } else if (retries < 5) {
            tryOpenDropdown(retries + 1); // Retry if inputContainer not yet bound
          }
        });
      });
    };
    tryOpenDropdown();
    // Defer position update so layout is settled (Selected section, etc.)
    setTimeout(updateDropdownPosition, 50);
  }

  function mergeDevicesById(existing: Device[], incoming: Device[]): Device[] {
    const seen = new Set(existing.map((d) => d.id));
    const out = [...existing];
    for (const d of incoming) {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        out.push(d);
      }
    }
    return out;
  }

  async function fetchDevicePage(offset: number, searchTerm: string): Promise<{ batch: Device[]; payload: Record<string, unknown> }> {
    const params = new URLSearchParams();
    params.append('limit', String(PAGE_LIMIT));
    params.append('offset', String(offset));
    if (searchTerm) params.append('search', searchTerm);

    const listUrl = bundleId
      ? `${apiPrefix}/bundles/${bundleId}/devices/available?${params}`
      : `${apiPrefix}/device-profiles/${profileId}/devices?${params}&status=${status}`;

    const res = await fetch(listUrl);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    const payload = (data?.data ?? data) as Record<string, unknown>;
    const batch = (payload.devices || []) as Device[];
    return { batch, payload };
  }

  /** Update `nextFetchOffset` / `listTotalCount` after a page fetch (`pageOffset` = request offset). */
  function syncPagingAfterFetch(pageOffset: number, batch: Device[], payload: Record<string, unknown>) {
    const pag = payload.pagination as { totalCount?: unknown } | undefined;
    const reportedRaw = pag?.totalCount ?? payload.total;
    const reportedNum =
      reportedRaw != null && reportedRaw !== '' ? Number(reportedRaw) : Number.NaN;
    const hasReported = Number.isFinite(reportedNum) && reportedNum >= 0;

    nextFetchOffset = pageOffset + batch.length;

    if (hasReported) {
      // Never let the total shrink below what we have already loaded – avoids
      // prematurely setting hasMorePages=false when the API reports a stale count.
      listTotalCount = Math.max(listTotalCount, reportedNum);
    } else if (batch.length < PAGE_LIMIT) {
      // Short page means this was the last one.
      listTotalCount = nextFetchOffset;
    } else {
      // Full page but no total reported – assume more pages exist.
      listTotalCount = Number.POSITIVE_INFINITY;
    }
  }

  async function loadDevices() {
    fetchEpoch += 1;
    const myEpoch = fetchEpoch;

    try {
      loading = true;
      loadingMore = false;
      listTotalCount = 0;
      nextFetchOffset = 0;

      const { batch, payload } = await fetchDevicePage(0, search);

      // Bail if a newer load superseded this one.
      if (myEpoch !== fetchEpoch) return;

      devices = batch;
      syncPagingAfterFetch(0, batch, payload);
    } catch (err) {
      if (myEpoch !== fetchEpoch) return;
      console.error('Failed to load devices:', err);
      toast.error('Failed to load devices. Please try again.');
      devices = [];
      listTotalCount = 0;
      nextFetchOffset = 0;
    } finally {
      if (myEpoch === fetchEpoch) loading = false;
    }
  }

  $: hasMorePages = nextFetchOffset < listTotalCount;

  async function loadMoreDevices() {
    if (!hasMorePages || loading || loadingMore) return;
    loadingMore = true;
    const myEpoch = fetchEpoch;
    try {
      const pageOffset = nextFetchOffset;
      const { batch, payload } = await fetchDevicePage(pageOffset, search);

      // Bail if loadDevices was called while this was in-flight.
      if (myEpoch !== fetchEpoch) return;

      if (batch.length === 0) {
        listTotalCount = pageOffset;
        nextFetchOffset = pageOffset;
      } else {
        devices = mergeDevicesById(devices, batch);
        syncPagingAfterFetch(pageOffset, batch, payload);
      }
    } catch (err) {
      if (myEpoch !== fetchEpoch) return;
      console.error('Failed to load more devices:', err);
      toast.error('Failed to load more devices.');
    } finally {
      if (myEpoch === fetchEpoch) loadingMore = false;
    }
  }

  function handleDropdownScroll(e: Event) {
    const el = e.currentTarget as HTMLElement;
    if (el.scrollHeight - el.scrollTop - el.clientHeight > SCROLL_LOAD_THRESHOLD_PX) return;
    void loadMoreDevices();
  }

  async function handleFocus() {
    dropdownOpen = true;
    await tick();
  }

  function handleBlur() {
    setTimeout(() => {
      if (!dropdownInteracting) dropdownOpen = false;
    }, 150);
  }

  function handleInputClick() {
    dropdownOpen = true;
  }

  function handleWindowMouseDown(e: MouseEvent) {
    if (!dropdownOpen || !inputContainer) return;
    const target = e.target as HTMLElement;
    if (inputContainer.contains(target)) return;
    if (target.closest('.device-selector-dropdown-portal')) return;
    dropdownOpen = false;
  }

  function handleRowClick(device: Device) {
    if (!canSelectDevice(device)) return;
    const idx = selectedDevices.findIndex((d) => d.id === device.id);
    if (idx >= 0) {
      selectedDevices = selectedDevices.filter((d) => d.id !== device.id);
    } else {
      selectedDevices = [...selectedDevices, device];
    }
  }

  function removeSelection(device: Device) {
    selectedDevices = selectedDevices.filter((d) => d.id !== device.id);
  }

  function handleSelectAll() {
    // Only operate on currently-loaded devices; disabled when more pages are pending.
    const selectable = devices.filter((d) => canSelectDevice(d));
    const allSelected = selectable.length > 0 && selectable.every((d) => selectedDevices.some((s) => s.id === d.id));
    if (allSelected) {
      const ids = selectable.map((d) => d.id);
      selectedDevices = selectedDevices.filter((d) => !ids.includes(d.id));
    } else {
      const newIds = selectable.filter((d) => !selectedDevices.some((s) => s.id === d.id)).map((d) => d.id);
      const toAdd = devices.filter((d) => newIds.includes(d.id));
      selectedDevices = [...selectedDevices, ...toAdd];
    }
  }

  /** Devices already assigned to another GLOBAL profile (need reassign confirmation).
   * Exclude DEVICE-level: device-level profile is the device's own config, not a global assignment.
   * Assigning from device-level to global is "assign", not "reassign". */
  function getDevicesAssignedToOtherProfile(): Device[] {
    if (!profileId) return [];
    return selectedDevices.filter(
      (d) =>
        d.profileAssignment?.profileId &&
        d.profileAssignment.profileId !== profileId &&
        d.profileAssignment.profile?.level !== 'DEVICE'
    );
  }

  let showReassignConfirm = false;

  function handleConfirm() {
    if (selectedDevices.length === 0) return;
    const assignedElsewhere = getDevicesAssignedToOtherProfile();
    if (profileId && assignedElsewhere.length > 0) {
      showReassignConfirm = true;
      return;
    }
    doConfirmSelect();
  }

  function doConfirmSelect() {
    if (selectedDevices.length > 0) {
      dispatch('select', selectedDevices.map((d) => ({ id: d.id, name: d.name })));
      handleClose();
    }
    showReassignConfirm = false;
  }

  function closeReassignConfirm() {
    showReassignConfirm = false;
  }

  /** TC-RDM-PR-0124: Build reassign warning message */
  function getReassignDescription(): string {
    const list = getDevicesAssignedToOtherProfile();
    if (list.length === 0) return '';
    const targetProfile = currentProfileName || 'this profile';
    const items = list
      .map((d) => `${d.name} (${d.profileAssignment?.profile?.name ?? 'another profile'})`)
      .join(', ');
    return `The following device(s) are already assigned to another profile: ${items}. Reassigning will move them to ${targetProfile}. Do you want to continue?`;
  }

  $: reassignDescription = showReassignConfirm ? getReassignDescription() : '';

  function handleClose() {
    // Dispatch close and let the parent set open=false via bind:open or on:close handler.
    // Avoid mutating the prop directly so parents without two-way binding still work.
    selectedDevices = [];
    search = '';
    prevSearch = '';
    dispatch('close');
  }

  function getDeviceStatusBadge(device: Device) {
    return device.connected
      ? ({ color: 'success' as const, label: 'Online' })
      : ({ color: 'error' as const, label: 'Offline' });
  }

  function canSelectDevice(device: Device) {
    return !existingDeviceIds.includes(device.id);
  }

  onDestroy(() => {
    if (scrollResizeCleanup) {
      scrollResizeCleanup();
      scrollResizeCleanup = null;
    }
    if (searchDebounceTimer != null) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }
  });
</script>

<Modal
  {open}
  {title}
  size="xl"
  overlayBg="rgba(0, 78, 235, 0.03)"
  closeOnBackdrop={true}
  closeOnEscape={true}
  showFooter={false}
  on:close={handleClose}
>
  <p class="device-selector-description">
    Choose devices to assign to this profile (click to select/deselect)
  </p>

  <div class="device-selector-body">
    <!-- Combobox: Search and select device (Figma layout like Add App) -->
    <div
      class="device-selector-input-container"
      bind:this={inputContainer}
      role="combobox"
      aria-expanded={dropdownOpen}
      aria-controls="device-selector-listbox"
      aria-haspopup="listbox"
      tabindex="0"
      on:click={handleInputClick}
      on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleInputClick())}
    >
      <InputField
        type="text"
        placeholder="Search and select device"
        suffixIcon={true}
        bind:value={search}
        state={dropdownOpen ? 'focused' : 'default'}
        on:focus={handleFocus}
        on:blur={handleBlur}
      >
        <svelte:fragment slot="suffix-icon">
          <Search size={22} />
        </svelte:fragment>
      </InputField>
    </div>

    <!-- Portal: dropdown in body to avoid modal overflow clipping -->
    {#if dropdownOpen && dropdownRect}
      <div
        use:appendToBody
        bind:this={dropdownPortalEl}
        id="device-selector-listbox"
        role="listbox"
        tabindex="-1"
        class="device-selector-dropdown device-selector-dropdown-portal"
        style="position: fixed; top: {dropdownRect.top}px; left: {dropdownRect.left}px; width: {dropdownRect.width}px; z-index: 9999;"
        on:scroll={handleDropdownScroll}
        on:mouseenter={() => (dropdownInteracting = true)}
        on:mouseleave={() => (dropdownInteracting = false)}
        on:mousedown|stopPropagation={() => (dropdownInteracting = true)}
      >
        {#if loading}
          <div class="device-selector-empty">Loading…</div>
        {:else}
          <!-- Select All row (Figma).
               Disabled while more pages remain unloaded to prevent silently missing devices. -->
          {@const selectable = devices.filter((d) => canSelectDevice(d))}
          {@const allSelected = selectable.length > 0 && selectable.every((d) => selectedDevices.some((s) => s.id === d.id))}
          {@const selectAllDisabled = selectable.length === 0 || hasMorePages}
          <div
            role="button"
            tabindex="0"
            class="device-selector-option device-selector-select-all"
            on:click|stopPropagation={() => !selectAllDisabled && handleSelectAll()}
            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && !selectAllDisabled && (e.preventDefault(), handleSelectAll())}
          >
            <span class="device-selector-checkbox-visual" aria-hidden="true">
              <Checkbox checked={allSelected} size="sm" disabled={selectAllDisabled} />
            </span>
            <span class="device-selector-option-name">
              Select All{hasMorePages ? ' (scroll to load all)' : ''}
            </span>
          </div>
          {#each devices as device (device.id)}
            {@const canSelect = canSelectDevice(device)}
            {@const isSelected = selectedDevices.some((d) => d.id === device.id)}
            {@const statusBadge = getDeviceStatusBadge(device)}
            <div
              role="button"
              tabindex="0"
              class="device-selector-option {!canSelect ? 'opacity-50' : ''}"
              on:click|stopPropagation={() => handleRowClick(device)}
              on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && canSelect && (e.preventDefault(), handleRowClick(device))}
            >
              <span class="device-selector-checkbox-visual" aria-hidden="true">
                <Checkbox checked={isSelected} size="sm" disabled={!canSelect} />
              </span>
              <div class="device-selector-option-content">
                <div class="device-selector-option-name">{device.name}</div>
                <div class="device-selector-option-meta">
                  {device.model || 'Unknown Model'} • {device.status}
                  {#if device.macAddress}
                    <span class="device-selector-mac">MAC: {device.macAddress}</span>
                  {/if}
                </div>
              </div>
              <Badge label={statusBadge.label} color={statusBadge.color} size="sm" interactive={false} />
              {#if !canSelect}
                <Badge label="Already assigned" color="gray" size="sm" interactive={false} />
              {/if}
            </div>
          {/each}
          {#if devices.length === 0 && !loadingMore}
            <div class="device-selector-empty">No devices found</div>
          {/if}
          {#if loadingMore}
            <div class="device-selector-loading-more">Loading more…</div>
          {/if}
        {/if}
      </div>
    {/if}

    <!-- Selected chips: "Selected (N items)" (Figma, like Add App) -->
    <div class="device-selector-selected-section">
      <p class="device-selector-selected-label">Selected ({selectedDevices.length} items)</p>
      <div class="device-selector-selected-container">
        {#each selectedDevices as device (device.id)}
          <div class="device-selector-selected-item">
            <div class="device-selector-selected-content">
              <span class="device-selector-selected-name">{device.name}</span>
              <span class="device-selector-selected-meta">{device.model || 'Unknown Model'} • {device.status}</span>
            </div>
            <Button
              variant="text"
              size="sm"
              icon={X}
              iconPosition="only"
              iconSize={16}
              on:click={() => removeSelection(device)}
              aria-label="Remove"
            />
          </div>
        {/each}
        {#if selectedDevices.length === 0}
          <span class="device-selector-empty-state">No devices selected</span>
        {/if}
      </div>
    </div>
  </div>

  <div slot="footer" class="flex items-center justify-end gap-4 w-full">
    <Button variant="outline" color="primary" size="lg" on:click={handleClose}>
      Cancel
    </Button>
    <Button 
      variant="filled" 
      color="primary" 
      size="lg" 
      on:click={handleConfirm} 
      disabled={selectedDevices.length === 0}
      style="min-width: 100px;"
    >
      {confirmLabel || `Add`}
    </Button>
  </div>
</Modal>

<!-- TC-RDM-PR-0124: Reassign warning when device(s) already assigned to another profile -->
<ConfirmModal
  open={showReassignConfirm}
  title="Reassign device(s)?"
  description={reassignDescription}
  confirmText="OK"
  cancelText="Cancel"
  type="warning"
  on:close={closeReassignConfirm}
  on:confirm={doConfirmSelect}
/>

<svelte:window on:mousedown={handleWindowMouseDown} />

<style>
  /* Align with Add App: use design tokens for consistent new UI (Figma layout) */
  .device-selector-description {
    font-family: var(--ds-font-family-primary);
    font-size: var(--ds-text-sm);
    line-height: var(--ds-leading-sm);
    color: var(--ds-text-tertiary);
    margin: 0 0 var(--ds-space-4) 0;
  }

  .device-selector-body {
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-4);
    min-height: 0;
    flex: 1;
    overflow: visible; /* Ensure listbox dropdown is not clipped by modal-body */
  }

  .device-selector-input-container {
    position: relative;
    overflow: visible;
    z-index: 10;
  }

  .device-selector-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    width: 100%;
    margin-top: var(--ds-space-1);
    background: var(--ds-bg-primary);
    border: 1px solid var(--ds-border-default);
    border-radius: var(--ds-radius-lg);
    /* Limit to ~4-5 visible items; scroll for rest – avoids layout break/clipping */
    max-height: 288px; /* ~5 rows × 54px + padding */
    min-height: 120px;
    overflow-y: auto;
    overflow-x: hidden;
    z-index: 150;
    box-shadow: var(--ds-shadow-lg);
    padding: var(--ds-space-1);
    display: flex;
    flex-direction: column;
  }

  .device-selector-dropdown::-webkit-scrollbar {
    width: 16px;
  }
  .device-selector-dropdown::-webkit-scrollbar-track {
    background: var(--ds-bg-secondary);
  }
  .device-selector-dropdown::-webkit-scrollbar-thumb {
    background: var(--ds-color-neutral-true-200);
    border-radius: var(--ds-radius-lg);
    border: 4px solid var(--ds-bg-secondary);
  }

  .device-selector-option {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--ds-space-3);
    padding: var(--ds-space-2) var(--ds-space-4);
    border: none;
    background: transparent;
    border-radius: var(--ds-radius-md);
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s ease;
    min-height: 54px;
  }

  .device-selector-select-all {
    border-bottom: 1px solid var(--ds-border-default);
  }

  .device-selector-checkbox-visual {
    pointer-events: none;
  }

  .device-selector-option:hover {
    background: var(--ds-color-neutral-true-50);
  }

  .device-selector-option-content {
    display: flex;
    flex-direction: column;
    gap: 0;
    flex: 1;
    min-width: 0;
  }

  .device-selector-option-name {
    font-family: var(--ds-font-family-primary);
    font-size: var(--ds-text-sm);
    line-height: var(--ds-leading-sm);
    color: var(--ds-color-neutral-true-800);
  }

  .device-selector-option-meta {
    font-family: var(--ds-font-family-primary);
    font-size: var(--ds-text-xs);
    line-height: var(--ds-leading-xs);
    color: var(--ds-color-gray-500);
  }

  .device-selector-mac {
    font-family: var(--ds-font-family-mono);
  }

  .device-selector-empty {
    padding: var(--ds-space-3) var(--ds-space-4);
    text-align: center;
    font-family: var(--ds-font-family-primary);
    font-size: var(--ds-text-sm);
    color: var(--ds-color-gray-500);
  }

  .device-selector-selected-label {
    font-family: var(--ds-font-family-primary);
    font-weight: var(--ds-font-medium);
    font-size: var(--ds-text-md);
    line-height: var(--ds-leading-md);
    color: var(--ds-color-neutral-true-800);
    margin: 0 0 var(--ds-space-2) 0;
  }

  .device-selector-selected-section {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .device-selector-selected-container {
    display: flex;
    flex-direction: column;
    gap: 0;
    height: 200px;
    overflow-y: auto;
  }

  .device-selector-selected-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--ds-space-3) 0;
    border-bottom: 1px solid var(--ds-border-default);
  }

  .device-selector-selected-content {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .device-selector-selected-name {
    font-family: var(--ds-font-family-primary);
    font-size: var(--ds-text-sm);
    line-height: var(--ds-leading-sm);
    font-weight: var(--ds-font-medium);
    color: var(--ds-color-neutral-true-800);
  }

  .device-selector-selected-meta {
    font-family: var(--ds-font-family-primary);
    font-size: var(--ds-text-xs);
    line-height: var(--ds-leading-xs);
    color: var(--ds-color-gray-500);
  }

  .device-selector-empty-state {
    font-family: var(--ds-font-family-primary);
    font-size: var(--ds-text-sm);
    color: var(--ds-color-gray-500);
    padding: var(--ds-space-3) 0;
  }

  .device-selector-loading-more {
    padding: var(--ds-space-2) var(--ds-space-4);
    text-align: center;
    font-family: var(--ds-font-family-primary);
    font-size: var(--ds-text-xs);
    color: var(--ds-color-gray-400);
    font-style: italic;
  }
</style>
