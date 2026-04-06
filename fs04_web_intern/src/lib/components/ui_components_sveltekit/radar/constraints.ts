/**
 * Radar coordinate constraints
 * xmin >= -4, xmax <= 4, ymin >= 0, ymax <= 7
 */

export const RADAR_CONSTRAINTS = {
    X_MIN: -4,
    X_MAX: 4,
    Y_MIN: 0,
    Y_MAX: 7,
} as const;

/**
 * Add Device modal: default initial values for tracking area (not constraints).
 * Constraints use RADAR_CONSTRAINTS (X: -4..4, Y: 0..7).
 */
export const ADD_DEVICE_TRACKING_DEFAULTS = {
    X_MIN: -3,
    X_MAX: 3,
    Y_MIN: 0,
    Y_MAX: 5,
} as const;

/** @deprecated Use RADAR_CONSTRAINTS + validateBounds. Kept for any legacy usage. */
export const ADD_DEVICE_TRACKING_CONSTRAINTS = {
    X_MIN: -3,
    X_MAX: 3,
    Y_MIN: 0,
    Y_MAX: 5,
} as const;

/** Validate bounds against Add Device tracking constraints */
export function validateAddDeviceTrackingBounds(
    bounds: CoordinateBounds,
    c: typeof ADD_DEVICE_TRACKING_CONSTRAINTS = ADD_DEVICE_TRACKING_CONSTRAINTS
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (bounds.startX < c.X_MIN) errors.push(`X Min (${bounds.startX}) must be >= ${c.X_MIN}`);
    if (bounds.startX > c.X_MAX) errors.push(`X Min (${bounds.startX}) must be <= ${c.X_MAX}`);
    if (bounds.endX < c.X_MIN) errors.push(`X Max (${bounds.endX}) must be >= ${c.X_MIN}`);
    if (bounds.endX > c.X_MAX) errors.push(`X Max (${bounds.endX}) must be <= ${c.X_MAX}`);
    if (bounds.startY < c.Y_MIN) errors.push(`Y Min (${bounds.startY}) must be >= ${c.Y_MIN}`);
    if (bounds.startY > c.Y_MAX) errors.push(`Y Min (${bounds.startY}) must be <= ${c.Y_MAX}`);
    if (bounds.endY < c.Y_MIN) errors.push(`Y Max (${bounds.endY}) must be >= ${c.Y_MIN}`);
    if (bounds.endY > c.Y_MAX) errors.push(`Y Max (${bounds.endY}) must be <= ${c.Y_MAX}`);
    if (bounds.startX >= bounds.endX) errors.push('X Min must be less than X Max');
    if (bounds.startY >= bounds.endY) errors.push('Y Min must be less than Y Max');
    return { valid: errors.length === 0, errors };
}

export interface CoordinateBounds {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

/**
 * Clamp a coordinate value to valid range
 */
export function clampCoordinate(value: number, axis: 'x' | 'y'): number {
    if (axis === 'x') {
        return Math.max(RADAR_CONSTRAINTS.X_MIN, Math.min(RADAR_CONSTRAINTS.X_MAX, value));
    } else {
        return Math.max(RADAR_CONSTRAINTS.Y_MIN, Math.min(RADAR_CONSTRAINTS.Y_MAX, value));
    }
}

/**
 * Clamp bounds to valid coordinate ranges
 */
export function clampBounds(bounds: CoordinateBounds): CoordinateBounds {
    return {
        startX: clampCoordinate(bounds.startX, 'x'),
        startY: clampCoordinate(bounds.startY, 'y'),
        endX: clampCoordinate(bounds.endX, 'x'),
        endY: clampCoordinate(bounds.endY, 'y'),
    };
}

/**
 * Validate bounds against constraints
 */
export function validateBounds(bounds: CoordinateBounds): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (bounds.startX < RADAR_CONSTRAINTS.X_MIN) {
        errors.push(`Start X (${bounds.startX}) must be >= ${RADAR_CONSTRAINTS.X_MIN}`);
    }
    if (bounds.startX > RADAR_CONSTRAINTS.X_MAX) {
        errors.push(`Start X (${bounds.startX}) must be <= ${RADAR_CONSTRAINTS.X_MAX}`);
    }
    if (bounds.endX < RADAR_CONSTRAINTS.X_MIN) {
        errors.push(`End X (${bounds.endX}) must be >= ${RADAR_CONSTRAINTS.X_MIN}`);
    }
    if (bounds.endX > RADAR_CONSTRAINTS.X_MAX) {
        errors.push(`End X (${bounds.endX}) must be <= ${RADAR_CONSTRAINTS.X_MAX}`);
    }
    if (bounds.startY < RADAR_CONSTRAINTS.Y_MIN) {
        errors.push(`Start Y (${bounds.startY}) must be >= ${RADAR_CONSTRAINTS.Y_MIN}`);
    }
    if (bounds.startY > RADAR_CONSTRAINTS.Y_MAX) {
        errors.push(`Start Y (${bounds.startY}) must be <= ${RADAR_CONSTRAINTS.Y_MAX}`);
    }
    if (bounds.endY < RADAR_CONSTRAINTS.Y_MIN) {
        errors.push(`End Y (${bounds.endY}) must be >= ${RADAR_CONSTRAINTS.Y_MIN}`);
    }
    if (bounds.endY > RADAR_CONSTRAINTS.Y_MAX) {
        errors.push(`End Y (${bounds.endY}) must be <= ${RADAR_CONSTRAINTS.Y_MAX}`);
    }

    // Ensure start < end
    if (bounds.startX >= bounds.endX) {
        errors.push('Start X must be less than End X');
    }
    if (bounds.startY >= bounds.endY) {
        errors.push('Start Y must be less than End Y');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Normalize bounds (ensure start < end)
 */
export function normalizeBounds(bounds: CoordinateBounds): CoordinateBounds {
    return {
        startX: Math.min(bounds.startX, bounds.endX),
        startY: Math.min(bounds.startY, bounds.endY),
        endX: Math.max(bounds.startX, bounds.endX),
        endY: Math.max(bounds.startY, bounds.endY),
    };
}


