import React from 'react';

import type { DesignerElement } from '../../ir/types';
import type { ResizeDirection } from '../../lib/coord';
import { RESIZE_CURSORS } from '../../lib/coord';

/**
 * Compute the axis-aligned bounding box of an element in canvas (viewBox) coordinates.
 * Returns null for elements that don't have a meaningful editable bound (text uses font
 * metrics that we don't compute; the SelectionOverlay falls back to a simple highlight).
 */
export const elementBounds = (
    el: DesignerElement
): { x: number; y: number; w: number; h: number } | null => {
    switch (el.type) {
        case 'rect':
        case 'image':
            return { x: el.x, y: el.y, w: el.w, h: el.h };
        case 'field-row':
            return {
                x: el.x,
                y: el.y - (el.labelSize ?? 10),
                w: el.w,
                h: (el.labelSize ?? 10) + (el.valueSize ?? 13) + 6,
            };
        case 'divider':
            return { x: el.x, y: el.y - 4, w: el.w, h: Math.max(8, el.thickness + 6) };
        case 'text':
            return null;
    }
};

/**
 * Which resize directions an element type supports. Divider is width-only; field-row is
 * width-only (height tracks font sizes); rect and image are full 8-way; text doesn't
 * resize via handles (its size is controlled by font-size in the Properties panel).
 */
export const supportedResizeDirections = (el: DesignerElement): ResizeDirection[] => {
    switch (el.type) {
        case 'rect':
        case 'image':
            return ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        case 'field-row':
        case 'divider':
            return ['w', 'e'];
        case 'text':
            return [];
    }
};

interface SelectionOverlayProps {
    bounds: { x: number; y: number; w: number; h: number };
    directions: ResizeDirection[];
    onResizeStart: (direction: ResizeDirection, event: React.PointerEvent<SVGElement>) => void;
}

const HANDLE_R = 4;
const HANDLE_STROKE = '#22D3EE';
const HANDLE_FILL = '#FFFFFF';

const handlePositions = (
    bounds: { x: number; y: number; w: number; h: number }
): Record<ResizeDirection, { cx: number; cy: number }> => {
    const { x, y, w, h } = bounds;
    return {
        nw: { cx: x, cy: y },
        n: { cx: x + w / 2, cy: y },
        ne: { cx: x + w, cy: y },
        e: { cx: x + w, cy: y + h / 2 },
        se: { cx: x + w, cy: y + h },
        s: { cx: x + w / 2, cy: y + h },
        sw: { cx: x, cy: y + h },
        w: { cx: x, cy: y + h / 2 },
    };
};

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
    bounds,
    directions,
    onResizeStart,
}) => {
    const positions = handlePositions(bounds);
    return (
        <g pointerEvents="none">
            <rect
                x={bounds.x - 1}
                y={bounds.y - 1}
                width={bounds.w + 2}
                height={bounds.h + 2}
                fill="none"
                stroke="#22D3EE"
                strokeWidth={1.5}
                strokeDasharray="4 3"
            />
            {directions.map(dir => {
                const { cx, cy } = positions[dir];
                return (
                    <rect
                        key={dir}
                        x={cx - HANDLE_R}
                        y={cy - HANDLE_R}
                        width={HANDLE_R * 2}
                        height={HANDLE_R * 2}
                        fill={HANDLE_FILL}
                        stroke={HANDLE_STROKE}
                        strokeWidth={1.5}
                        style={{
                            cursor: RESIZE_CURSORS[dir],
                            pointerEvents: 'auto',
                        }}
                        onPointerDown={e => {
                            e.stopPropagation();
                            onResizeStart(dir, e);
                        }}
                    />
                );
            })}
        </g>
    );
};
