/**
 * Zone color palette per design: each zone uses a distinct border + fill.
 * Used for zone icons (40×40), list, and visual editor.
 * Design: Zone 1–5 with exact border (viền) and fill (nền) hex values.
 */
export interface ZoneColorSet {
    /** Border color (viền) */
    border: string;
    /** Fill/background color (nền) */
    fill: string;
}

/** Design palette: Zone 1–5 border and fill. Index 0 = Zone 1, etc. */
export const ZONE_COLOR_PALETTE: ZoneColorSet[] = [
    { border: '#2B6FFF', fill: '#E9F0FF' },   // Zone 1 – blue
    { border: '#2E8C5B', fill: '#EAF7EF' },   // Zone 2 – green
    { border: '#B66D26', fill: '#FDF6ED' },   // Zone 3 – orange/rust
    { border: '#BB3333', fill: '#FDF2F2' },   // Zone 4 – red
    { border: '#7C50DA', fill: '#F3F0FC' },   // Zone 5 – purple
];

/**
 * Get border and fill for a zone by 0-based index (or zone number 1–5).
 * Use zoneIndex when iterating (e.g. zones.forEach((z, i) => getZoneColors(i))).
 * Use zoneNumber - 1 when zone has zoneNumber 1–5 for consistent mapping.
 */
export function getZoneColors(zoneIndexOrNumber: number): ZoneColorSet {
    const index = zoneIndexOrNumber >= 1 && zoneIndexOrNumber <= 5
        ? zoneIndexOrNumber - 1
        : Math.max(0, zoneIndexOrNumber) % ZONE_COLOR_PALETTE.length;
    return ZONE_COLOR_PALETTE[index];
}

/**
 * Border color only (for backward compatibility where a single color is stored, e.g. zone.color).
 */
export function getZoneBorderColor(zoneIndexOrNumber: number): string {
    return getZoneColors(zoneIndexOrNumber).border;
}
