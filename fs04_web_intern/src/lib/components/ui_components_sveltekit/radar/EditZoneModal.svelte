<script lang="ts">
  import { Modal, Button, InputField, Toggle } from '$lib/design-system/components';
  import { validateBounds, normalizeBounds } from '$lib/components/ui_components_sveltekit/radar/constraints';
  import { getZoneColors, getZoneBorderColor } from '$lib/components/ui_components_sveltekit/radar/zoneColors';

  export let open = false;
  /** Zone to edit; when set, form is pre-filled. zoneNumber optional (defaults to 1). */
  export let zone: {
    id?: string;
    name: string;
    zoneNumber?: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color?: string;
    active?: boolean;
  } | null = null;
  /** Tracking area for read-only display: width x height in m */
  export let trackingAreaWidth: number = 10;
  export let trackingAreaHeight: number = 10;
  /** Called when user clicks Save with valid zone data. */
  export let onSave: (zone: {
    id?: string;
    name: string;
    zoneNumber: number;
    color: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    active: boolean;
  }) => void = () => {};
  export let onClose: () => void = () => {};

  let name = '';
  let active = true;
  let positionX = '0';
  let positionY = '0';
  let width = '2';
  let height = '2';
  let error = '';

  $: if (open && zone) {
    name = zone.name || `Zone ${zone.zoneNumber}`;
    active = zone.active !== false;
    positionX = String(zone.startX);
    positionY = String(zone.startY);
    width = String(Math.max(0, zone.endX - zone.startX));
    height = String(Math.max(0, zone.endY - zone.startY));
    error = '';
  }

  $: zoneNumber = (zone?.zoneNumber != null ? zone.zoneNumber : 1);
  $: zoneColors = getZoneColors(zoneNumber);
  $: computedStartX = Number(positionX) || 0;
  $: computedStartY = Number(positionY) || 0;
  $: computedEndX = computedStartX + (Number(width) || 0);
  $: computedEndY = computedStartY + (Number(height) || 0);

  function handleSave(): void {
    const w = Number(width);
    const h = Number(height);
    if (!name?.trim()) {
      error = 'Zone name is required.';
      return;
    }
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      error = 'Width and height must be greater than 0.';
      return;
    }
    const startX = Number(positionX) || 0;
    const startY = Number(positionY) || 0;
    const endX = startX + w;
    const endY = startY + h;
    const bounds = normalizeBounds({ startX, startY, endX, endY });
    const validation = validateBounds(bounds);
    if (!validation.valid) {
      error = validation.errors.join('. ');
      return;
    }
    error = '';
    onSave({
      id: zone?.id,
      name: name.trim(),
      zoneNumber,
      color: getZoneBorderColor(zoneNumber),
      startX: bounds.startX,
      startY: bounds.startY,
      endX: bounds.endX,
      endY: bounds.endY,
      active,
    });
    open = false;
    onClose();
  }

  function handleClose(): void {
    open = false;
    onClose();
  }
</script>

<Modal
  open={open}
  title="Edit Zone"
  size="md"
  showFooter={false}
  on:close={handleClose}
>
  <div class="edit-zone-form">
    {#if error}
      <p class="edit-zone-error" role="alert">{error}</p>
    {/if}
    <div class="edit-zone-row edit-zone-row-name">
      <div
        class="edit-zone-color-swatch"
        style="background: {zoneColors.fill}; border-color: {zoneColors.border};"
        aria-hidden="true"
      ></div>
      <div class="edit-zone-name-field">
        <InputField
          label="Zone Name"
          type="text"
          bind:value={name}
          placeholder="Zone {zoneNumber}"
          required={true}
        />
      </div>
      <div class="edit-zone-active-wrap">
        <Toggle size="sm" checked={active} on:change={(e) => (active = e.detail)} />
        <span class="edit-zone-active-label">Active</span>
      </div>
    </div>
    <div class="edit-zone-section">
      <h3 class="edit-zone-section-title">Position</h3>
      <div class="edit-zone-fields-row">
        <div class="edit-zone-field-group">
          <InputField
            label="X Position"
            type="number"
            bind:value={positionX}
            placeholder="00"
            suffixText="m"
          />
          <p class="edit-zone-helper">Distance from left edge</p>
        </div>
        <div class="edit-zone-field-group">
          <InputField
            label="Y Position"
            type="number"
            bind:value={positionY}
            placeholder="00"
            suffixText="m"
          />
          <p class="edit-zone-helper">Distance from top edge</p>
        </div>
      </div>
    </div>
    <div class="edit-zone-section">
      <h3 class="edit-zone-section-title">Size</h3>
      <div class="edit-zone-fields-row">
        <div class="edit-zone-field-group">
          <InputField
            label="Width"
            type="number"
            bind:value={width}
            placeholder="00"
            suffixText="m"
          />
        </div>
        <div class="edit-zone-field-group">
          <InputField
            label="Height"
            type="number"
            bind:value={height}
            placeholder="00"
            suffixText="m"
          />
        </div>
      </div>
    </div>
    <div class="edit-zone-section edit-zone-section-readonly">
      <p class="edit-zone-readonly-line"><span class="edit-zone-readonly-label">Tracking Area:</span> {Number(trackingAreaWidth).toFixed(1)} × {Number(trackingAreaHeight).toFixed(1)} m</p>
      <h4 class="edit-zone-subtitle">Computed Bounds</h4>
      <ul class="edit-zone-bounds-list">
        <li>Top – Left: ({computedStartX.toFixed(2)}m, {computedStartY.toFixed(2)}m)</li>
        <li>Bottom – Right: ({computedEndX.toFixed(2)}m, {computedEndY.toFixed(2)}m)</li>
      </ul>
    </div>
  </div>
  <svelte:fragment slot="footer">
    <div class="edit-zone-actions">
      <Button variant="outline" color="primary" size="md" on:click={handleClose}>Cancel</Button>
      <Button variant="filled" color="primary" size="md" on:click={handleSave}>Save</Button>
    </div>
  </svelte:fragment>
</Modal>

<style>
  .edit-zone-form {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--ds-space-4);
    font-family: var(--ds-font-family-primary);
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
  .edit-zone-error {
    font-size: var(--ds-text-sm);
    color: var(--ds-color-error-500);
    margin: 0;
  }
  .edit-zone-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--ds-space-4);
    padding: 0;
    min-height: 48px;
    width: 100%;
    align-self: stretch;
  }
  .edit-zone-row-name {
    flex-wrap: nowrap;
  }
  .edit-zone-color-swatch {
    box-sizing: border-box;
    width: 40px;
    height: 40px;
    border-radius: var(--ds-radius-lg);
    border: 1px solid;
    flex: none;
    flex-grow: 0;
  }
  .edit-zone-name-field {
    flex: 1 1 auto;
    min-width: 0;
  }
  .edit-zone-name-field :global(.input-label) {
    display: none;
  }
  .edit-zone-name-field :global(.input-field-wrapper) {
    min-height: 48px;
  }
  .edit-zone-name-field :global(input) {
    font-size: var(--ds-text-md);
    line-height: var(--ds-leading-md);
    color: var(--ds-color-neutral-true-900);
  }
  .edit-zone-active-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--ds-space-2);
    padding: 0;
    flex: none;
    flex-grow: 0;
  }
  .edit-zone-active-label {
    font: var(--ds-text-sm-medium);
    color: var(--ds-color-neutral-true-800);
  }
  .edit-zone-section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--ds-space-1);
    width: 100%;
    align-self: stretch;
  }
  .edit-zone-section-title {
    font: var(--ds-text-md);
    font-weight: var(--ds-font-semibold);
    line-height: var(--ds-leading-md);
    color: var(--ds-color-neutral-true-700);
    margin: 0;
  }
  .edit-zone-fields-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: var(--ds-space-4);
    width: 100%;
    align-self: stretch;
  }
  .edit-zone-field-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--ds-space-1);
    flex: 1 1 0;
    min-width: 0;
  }
  .edit-zone-field-group .edit-zone-helper {
    margin: 0;
    font: var(--ds-text-sm-regular);
    color: var(--ds-color-neutral-true-500);
  }
  .edit-zone-helper {
    font: var(--ds-text-sm-regular);
    color: var(--ds-color-neutral-true-500);
    margin: 0;
  }
  .edit-zone-section-readonly {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: var(--ds-space-3);
    gap: var(--ds-space-2);
    background: var(--ds-color-neutral-true-50);
    border-radius: var(--ds-radius-lg);
    width: 100%;
    align-self: stretch;
    flex: none;
  }
  .edit-zone-readonly-line {
    font: var(--ds-text-sm-regular);
    color: var(--ds-color-neutral-true-500);
    margin: 0;
    align-self: stretch;
  }
  .edit-zone-readonly-label {
    color: var(--ds-color-neutral-true-500);
    font-weight: inherit;
  }
  .edit-zone-subtitle {
    font: var(--ds-text-sm-semibold);
    color: var(--ds-color-neutral-true-800);
    margin: 0;
    align-self: stretch;
  }
  .edit-zone-bounds-list {
    margin: 0;
    padding-left: var(--ds-space-4);
    font: var(--ds-text-sm-regular);
    color: var(--ds-color-neutral-true-500);
    list-style: disc;
  }
  .edit-zone-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--ds-space-3);
  }
</style>
