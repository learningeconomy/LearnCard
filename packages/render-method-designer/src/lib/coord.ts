import type { RefObject } from 'react';

/**
 * Convert client (viewport) coordinates to the SVG's internal coordinate space using the
 * browser's native `getScreenCTM().inverse()` transform. This is the canonical SVG pattern —
 * it correctly handles any CSS scaling applied to the SVG (zoom, transforms, parent
 * `width`/`height` differing from `viewBox`).
 *
 * Why this exists: the Canvas wrapper uses ResizeObserver-based auto-fit, so the SVG is
 * usually displayed smaller than its native viewBox. Pointer deltas in client pixels are
 * NOT the same as pixel deltas in viewBox units; we must round-trip through the SVG's CTM
 * for drag and resize to feel right.
 */
export const clientPointToSvg = (
    svg: SVGSVGElement,
    clientX: number,
    clientY: number
): { x: number; y: number } => {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: clientX, y: clientY };
    const transformed = pt.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
};

/** Default snap grid step in SVG units. */
export const DEFAULT_GRID_STEP = 4;

/**
 * Round a value to the nearest multiple of `step`. Returns the input unchanged when `step`
 * is 0 or negative, so callers can disable snapping by passing 0 instead of branching.
 */
export const snap = (value: number, step: number): number => {
    if (step <= 0) return value;
    return Math.round(value / step) * step;
};

export const snapPoint = (
    p: { x: number; y: number },
    step: number
): { x: number; y: number } => ({
    x: snap(p.x, step),
    y: snap(p.y, step),
});

/** Resize directions for the 8-handle selection overlay. */
export type ResizeDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const RESIZE_CURSORS: Record<ResizeDirection, string> = {
    nw: 'nwse-resize',
    n: 'ns-resize',
    ne: 'nesw-resize',
    e: 'ew-resize',
    se: 'nwse-resize',
    s: 'ns-resize',
    sw: 'nesw-resize',
    w: 'ew-resize',
};

/**
 * Apply a resize delta to a (x, y, w, h) rectangle for the given handle direction. The
 * opposite anchor stays fixed — dragging the `nw` handle moves x and y while w and h shrink
 * by the same amounts; dragging the `e` handle only changes w. Width and height are clamped
 * to a minimum so users can't accidentally collapse an element to zero pixels.
 */
export const applyResize = (
    bounds: { x: number; y: number; w: number; h: number },
    direction: ResizeDirection,
    dx: number,
    dy: number,
    minSize = 8
): { x: number; y: number; w: number; h: number } => {
    let { x, y, w, h } = bounds;

    if (direction.includes('w')) {
        const maxDx = w - minSize;
        const appliedDx = Math.min(dx, maxDx);
        x += appliedDx;
        w -= appliedDx;
    }
    if (direction.includes('e')) {
        w = Math.max(minSize, w + dx);
    }
    if (direction.includes('n')) {
        const maxDy = h - minSize;
        const appliedDy = Math.min(dy, maxDy);
        y += appliedDy;
        h -= appliedDy;
    }
    if (direction.includes('s')) {
        h = Math.max(minSize, h + dy);
    }

    return { x, y, w, h };
};

/**
 * Pointer-event helper. Distinguishes a click from a drag based on a small movement
 * threshold. Components can check `hasDragged()` on pointerup to decide whether to fire a
 * click handler.
 */
export const DRAG_THRESHOLD_PX = 3;

/** Use a non-react ref-stable container for cross-callback drag state. */
export interface DragState {
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startSvgX: number;
    startSvgY: number;
    moved: boolean;
}

export const svgRefToElement = (ref: RefObject<SVGSVGElement>): SVGSVGElement | null =>
    ref.current ?? null;
