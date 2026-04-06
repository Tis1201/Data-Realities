<script lang="ts">
  import { Modal, Button, InputField, Toggle } from '$lib/design-system/components';
  import { validateBounds, normalizeBounds } from '$lib/components/ui_components_sveltekit/radar/constraints';
  import { getZoneColors, getZoneBorderColor } from '$lib/components/ui_components_sveltekit/radar/zoneColors';

  export let open = false;
  /** Next zone number (1-based). Used for default name and color. */
  export let nextZoneNumber = 1;
  /** Tracking area for read-only display: width x height in m */
  export let trackingAreaWidth: number = 10;
  export let trackingAreaHeight: number = 10;
  /** Called when user clicks Add with valid zone data. */
  export let onAdd: (zone: {
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

  $: if (open) {
    name = `Zone ${nextZoneNumber}`;
    active = true;
    positionX = '0';
    positionY = '0';
    width = '2';
    height = '2';
    error = '';
  }

  $: zoneColors = getZoneColors(nextZoneNumber);
  $: computedStartX = Number(positionX) || 0;
  $: computedStartY = Number(positionY) || 0;
  $: computedEndX = computedStartX + (Number(width) || 0);
  $: computedEndY = computedStartY + (Number(height) || 0);

  function handleAdd(): void {
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
    onAdd({
      name: name.trim(),
      zoneNumber: nextZoneNumber,
      color: getZoneBorderColor(nextZoneNumber),
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
  title="Add Zone"
  size="md"
  showFooter={false}
  on:close={handleClose}
>
  <div class="add-zone-form">
    {#if error}
      <p class="add-zone-error" role="alert">{error}</p>
    {/if}
    <div class="add-zone-row add-zone-row-name">
      <div
        class="add-zone-color-swatch"
        style="background: {zoneColors.fill}; border-color: {zoneColors.border};"
        aria-hidden="true"
      ></div>
      <div class="add-zone-name-field">
        <InputField
          label="Zone Name"
          type="text"
          bind:value={name}
          placeholder="Zone {nextZoneNumber}"
          required={true}
        />
      </div>
      <div class="add-zone-active-wrap">
        <Toggle size="sm" checked={active} on:change={(e) => (active = e.detail)} />
        <span class="add-zone-active-label">Active</span>
      </div>
    </div>
    <div class="add-zone-section">
      <h3 class="add-zone-section-title">Position</h3>
      <div class="add-zone-fields-row">
        <div class="add-zone-field-group">
          <InputField
            label="X Position"
            type="number"
            bind:value={positionX}
            placeholder="00"
            suffixText="m"
          />
          <p class="add-zone-helper">Distance from left edge</p>
        </div>
        <div class="add-zone-field-group">
          <InputField
            label="Y Position"
            type="number"
            bind:value={positionY}
            placeholder="00"
            suffixText="m"
          />
          <p class="add-zone-helper">Distance from top edge</p>
        </div>
      </div>
    </div>
    <div class="add-zone-section">
      <h3 class="add-zone-section-title">Size</h3>
      <div class="add-zone-fields-row">
        <div class="add-zone-field-group">
          <InputField
            label="Width"
            type="number"
            bind:value={width}
            placeholder="00"
            suffixText="m"
          />
        </div>
        <div class="add-zone-field-group">
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
    <div class="add-zone-section add-zone-section-readonly">
      <p class="add-zone-readonly-line"><span class="add-zone-readonly-label">Tracking Area:</span> {Number(trackingAreaWidth).toFixed(1)} × {Number(trackingAreaHeight).toFixed(1)} m</p>
      <h4 class="add-zone-subtitle">Computed Bounds</h4>
      <ul class="add-zone-bounds-list">
        <li>Top – Left: ({computedStartX}, {computedStartY})</li>
        <li>Bottom – Right: ({computedEndX}, {computedEndY})</li>
      </ul>
    </div>
  </div>
  <svelte:fragment slot="footer">
    <div class="add-zone-actions">
      <Button variant="outline" color="primary" size="md" on:click={handleClose}>Cancel</Button>
      <Button variant="filled" color="primary" size="md" on:click={handleAdd}>Add</Button>
    </div>
  </svelte:fragment>
</Modal>

<style>
  /* Body: flex column, padding from modal; gap 16px per Figma */
  .add-zone-form {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--ds-space-4); /* 16px */
    font-family: var(--ds-font-family-primary);
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
  .add-zone-error {
    font-size: var(--ds-text-sm);
    color: var(--ds-color-error-500);
    margin: 0;
  }
  /* Zone row: flex row, align center, gap 16px, height 48px */
  .add-zone-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--ds-space-4); /* 16px */
    padding: 0;
    min-height: 48px;
    width: 100%;
    align-self: stretch;
  }
  .add-zone-row-name {
    flex-wrap: nowrap;
  }
  /* Color block: 40x40, 1px border, 8px radius; fill/border from zoneColors */
  .add-zone-color-swatch {
    box-sizing: border-box;
    width: 40px;
    height: 40px;
    border-radius: var(--ds-radius-lg); /* 8px */
    border: 1px solid;
    flex: none;
    flex-grow: 0;
  }
  /* Zone name input: flex-grow 1; label hidden per Figma (Base/Sub-Tittle display: none) */
  .add-zone-name-field {
    flex: 1 1 auto;
    min-width: 0;
  }
  .add-zone-name-field :global(.input-label) {
    display: none;
  }
  .add-zone-name-field :global(.input-field-wrapper) {
    min-height: 48px;
  }
  .add-zone-name-field :global(input) {
    font-size: var(--ds-text-md);
    line-height: var(--ds-leading-md);
    color: var(--ds-color-neutral-true-900);
  }
  /* Toggle + Active label: gap 8px; label 14px Medium #292929 */
  .add-zone-active-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--ds-space-2); /* 8px */
    padding: 0;
    flex: none;
    flex-grow: 0;
  }
  .add-zone-active-label {
    font: var(--ds-text-sm-medium);
    color: var(--ds-color-neutral-true-800); /* #292929 */
  }
  /* Section: Position / Size */
  .add-zone-section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--ds-space-1); /* 4px between title and fields */
    width: 100%;
    align-self: stretch;
  }
  /* Section title: Heading H5 - 16px semibold #424242 */
  .add-zone-section-title {
    font: var(--ds-text-md);
    font-weight: var(--ds-font-semibold);
    line-height: var(--ds-leading-md);
    color: var(--ds-color-neutral-true-700); /* #424242 */
    margin: 0;
  }
  /* Fields row: flex row, align flex-start, gap 16px */
  .add-zone-fields-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: var(--ds-space-4); /* 16px */
    width: 100%;
    align-self: stretch;
  }
  .add-zone-field-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--ds-space-1); /* 4px: label, input, caption */
    flex: 1 1 0;
    min-width: 0;
  }
  .add-zone-field-group .add-zone-helper {
    margin: 0;
    font: var(--ds-text-sm-regular);
    color: var(--ds-color-neutral-true-500); /* #737373 */
  }
  .add-zone-helper {
    font: var(--ds-text-sm-regular);
    color: var(--ds-color-neutral-true-500);
    margin: 0;
  }
  /* Info wrap: padding 12px, gap 8px, #FAFAFA, 8px radius */
  .add-zone-section-readonly {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: var(--ds-space-3); /* 12px */
    gap: var(--ds-space-2); /* 8px */
    background: var(--ds-color-neutral-true-50); /* #FAFAFA */
    border-radius: var(--ds-radius-lg); /* 8px */
    width: 100%;
    align-self: stretch;
    flex: none;
  }
  .add-zone-readonly-line {
    font: var(--ds-text-sm-regular);
    color: var(--ds-color-neutral-true-500); /* #737373 */
    margin: 0;
    align-self: stretch;
  }
  .add-zone-readonly-label {
    color: var(--ds-color-neutral-true-500);
    font-weight: inherit;
  }
  /* Computed Bounds: 14px semibold #292929 */
  .add-zone-subtitle {
    font: var(--ds-text-sm-semibold);
    color: var(--ds-color-neutral-true-800); /* #292929 */
    margin: 0;
    align-self: stretch;
  }
  .add-zone-bounds-list {
    margin: 0;
    padding-left: var(--ds-space-4);
    font: var(--ds-text-sm-regular);
    color: var(--ds-color-neutral-true-500);
    list-style: disc;
  }
  .add-zone-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--ds-space-3);
  }
</style>
