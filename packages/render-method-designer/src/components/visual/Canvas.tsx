import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';

import type { DesignerStoreApi } from '../../store/designerStore';
import type {
    DesignerElement,
    DividerElement,
    FieldRowElement,
    FillRef,
    ImageElement,
    RectElement,
    StringValue,
    TextElement,
    Theme,
    Visibility,
} from '../../ir/types';
import type { RenderData } from '../../types';
import { resolveColor, resolveFont } from '../../ir/theme';
import {
    DEFAULT_GRID_STEP,
    DRAG_THRESHOLD_PX,
    applyResize,
    clientPointToSvg,
    snap,
    type ResizeDirection,
} from '../../lib/coord';
import { SelectionOverlay, elementBounds, supportedResizeDirections } from './SelectionOverlay';

/**
 * The Canvas renders the IR directly as React-SVG and owns the pointer-based interactions
 * (drag-to-move, resize). Click-vs-drag is decided by movement threshold; on pointerup we
 * either select (no movement) or commit a single-undo-step transformation (moved beyond
 * threshold). Pointer events are delegated from a single handler on the SVG root via
 * `data-element-id` attributes on each element's `<g>` wrapper.
 *
 * Coordinate space: pointer deltas are transformed through `clientPointToSvg` so they map
 * 1:1 to viewBox units even when the SVG is CSS-scaled (the auto-fit logic on the wrapper
 * regularly displays the SVG at < 1× its native size).
 */

const resolveString = (sv: StringValue, data: RenderData): string => {
    if (sv.kind === 'static') return sv.value;
    if (sv.format) {
        const formatted = lookupPath(data, `formattedValues.${sv.path}.${sv.format}`);
        if (formatted !== undefined && formatted !== null && formatted !== '') {
            return String(formatted);
        }
    }
    const value = lookupPath(data, sv.path);
    if (value !== undefined && value !== null && value !== '') return String(value);
    return sv.fallback ?? '';
};

const lookupPath = (data: RenderData, path: string): unknown => {
    if (path === '') return undefined;
    const parts = path.split('.');
    let current: unknown = data;
    for (const part of parts) {
        if (current === null || current === undefined || typeof current !== 'object') return undefined;
        current = (current as Record<string, unknown>)[part];
    }
    return current;
};

const checkVisibility = (v: Visibility | undefined, data: RenderData): boolean => {
    if (!v || v.kind === 'always') return true;
    const value = lookupPath(data, v.path);
    return value !== undefined && value !== null && value !== '';
};

const gradientIdFor = (fill: FillRef, key: string): string => {
    if (fill.kind === 'solid') return '';
    return `canvas_grad_${key}`;
};

interface RenderProps<E extends DesignerElement> {
    el: E;
    theme: Theme;
    data: RenderData;
}

const RectRender: React.FC<RenderProps<RectElement>> = ({ el, theme }) => {
    const gradId = gradientIdFor(el.fill, el.id);
    const fill =
        el.fill.kind === 'solid' ? resolveColor(el.fill.color, theme) : `url(#${gradId})`;
    return (
        <g data-element-id={el.id} style={{ cursor: 'move' }}>
            {el.fill.kind === 'linear-gradient' && (
                <defs>
                    <linearGradient
                        id={gradId}
                        x1="0%"
                        y1="0%"
                        x2={el.fill.direction === 'horizontal' || el.fill.direction === 'diagonal' ? '100%' : '0%'}
                        y2={el.fill.direction === 'vertical' || el.fill.direction === 'diagonal' ? '100%' : '0%'}
                    >
                        <stop offset="0%" stopColor={resolveColor(el.fill.from, theme)} />
                        <stop offset="100%" stopColor={resolveColor(el.fill.to, theme)} />
                    </linearGradient>
                </defs>
            )}
            <rect
                x={el.x}
                y={el.y}
                width={el.w}
                height={el.h}
                rx={el.rx}
                fill={fill}
                stroke={el.stroke ? resolveColor(el.stroke.color, theme) : undefined}
                strokeWidth={el.stroke?.width}
            />
        </g>
    );
};

const TextRender: React.FC<RenderProps<TextElement>> = ({ el, theme, data }) => {
    const text = resolveString(el.content, data);
    if (!text && el.content.kind === 'binding' && !el.content.fallback) return null;
    return (
        <g data-element-id={el.id} style={{ cursor: 'move' }}>
            <text
                x={el.x}
                y={el.y}
                fontFamily={resolveFont(el.font, theme)}
                fontSize={el.size}
                fontWeight={el.weight}
                fill={resolveColor(el.color, theme)}
                textAnchor={el.align}
                letterSpacing={el.letterSpacing}
            >
                {text}
            </text>
        </g>
    );
};

const ImageRender: React.FC<RenderProps<ImageElement>> = ({ el, theme, data }) => {
    const href =
        el.source.kind === 'url'
            ? el.source.value
            : (lookupPath(data, el.source.path) as string | undefined);
    const clipId = `canvas_clip_${el.id}`;
    return (
        <g data-element-id={el.id} style={{ cursor: 'move' }}>
            {el.clip !== 'none' && (
                <defs>
                    <clipPath id={clipId}>
                        {el.clip === 'circle' ? (
                            <circle
                                cx={el.x + el.w / 2}
                                cy={el.y + el.h / 2}
                                r={Math.min(el.w, el.h) / 2}
                            />
                        ) : (
                            <rect
                                x={el.x}
                                y={el.y}
                                width={el.w}
                                height={el.h}
                                rx={el.cornerRadius ?? 12}
                            />
                        )}
                    </clipPath>
                </defs>
            )}
            {href ? (
                <image
                    x={el.x}
                    y={el.y}
                    width={el.w}
                    height={el.h}
                    href={href}
                    preserveAspectRatio={el.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
                    clipPath={el.clip !== 'none' ? `url(#${clipId})` : undefined}
                />
            ) : (
                <rect
                    x={el.x}
                    y={el.y}
                    width={el.w}
                    height={el.h}
                    rx={el.clip === 'rounded' ? el.cornerRadius ?? 12 : 0}
                    fill={resolveColor('$background', theme)}
                    stroke={resolveColor('$border', theme)}
                    strokeDasharray="4 4"
                />
            )}
        </g>
    );
};

const FieldRowRender: React.FC<RenderProps<FieldRowElement>> = ({ el, theme, data }) => {
    const valueText = resolveString(el.value, data);
    return (
        <g data-element-id={el.id} style={{ cursor: 'move' }}>
            <text
                x={el.x}
                y={el.y}
                fontFamily={resolveFont('body', theme)}
                fontSize={el.labelSize ?? 10}
                fontWeight={700}
                letterSpacing={0.8}
                fill={resolveColor(el.labelColor, theme)}
            >
                {el.label}
            </text>
            {valueText && (
                <text
                    x={el.x + el.w}
                    y={el.y}
                    fontFamily={resolveFont('body', theme)}
                    fontSize={el.valueSize ?? 13}
                    fontWeight={700}
                    fill={resolveColor(el.valueColor, theme)}
                    textAnchor="end"
                >
                    {valueText}
                </text>
            )}
        </g>
    );
};

const DividerRender: React.FC<RenderProps<DividerElement>> = ({ el, theme }) => (
    <g data-element-id={el.id} style={{ cursor: 'move' }}>
        <line
            x1={el.x}
            y1={el.y}
            x2={el.x + el.w}
            y2={el.y}
            stroke={resolveColor(el.color, theme)}
            strokeWidth={el.thickness}
        />
    </g>
);

const renderElement = (
    el: DesignerElement,
    theme: Theme,
    data: RenderData
): React.ReactNode => {
    switch (el.type) {
        case 'rect':
            return <RectRender key={el.id} el={el} theme={theme} data={data} />;
        case 'text':
            return <TextRender key={el.id} el={el} theme={theme} data={data} />;
        case 'image':
            return <ImageRender key={el.id} el={el} theme={theme} data={data} />;
        case 'field-row':
            return <FieldRowRender key={el.id} el={el} theme={theme} data={data} />;
        case 'divider':
            return <DividerRender key={el.id} el={el} theme={theme} data={data} />;
        default:
            return null;
    }
};

const OUTER_PADDING = 16;
const CARD_PADDING = 8;

const fitSize = (
    containerW: number,
    containerH: number,
    nativeW: number,
    nativeH: number
): { w: number; h: number } | null => {
    const availW = containerW - OUTER_PADDING * 2 - CARD_PADDING * 2;
    const availH = containerH - OUTER_PADDING * 2 - CARD_PADDING * 2;
    if (availW <= 0 || availH <= 0) return null;
    const aspect = nativeW / nativeH;
    let w = availW;
    let h = w / aspect;
    if (h > availH) {
        h = availH;
        w = h * aspect;
    }
    return { w: Math.min(w, nativeW), h: Math.min(h, nativeH) };
};

export interface CanvasProps {
    store: DesignerStoreApi;
    data: RenderData;
    gridStep?: number;
    snapToGrid?: boolean;
}

/**
 * Drag / resize interaction state held in a ref so callbacks don't re-create on every
 * pointermove. `kind` discriminates a move-drag from a resize-drag; resize-drag carries
 * the initial bounds and the handle direction so each frame's geometry is relative to
 * the interaction's start, not the previous frame (avoids accumulated rounding error).
 */
interface InteractionState {
    kind: 'move' | 'resize';
    elementId: string;
    startSvgX: number;
    startSvgY: number;
    initial: { x: number; y: number; w?: number; h?: number };
    direction?: ResizeDirection;
    moved: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({
    store,
    data,
    gridStep = DEFAULT_GRID_STEP,
    snapToGrid = true,
}) => {
    const template = useStore(store, s => s.template);
    const selectedId = useStore(store, s => s.selectedElementId);
    const selectElement = useStore(store, s => s.selectElement);
    const updateElement = useStore(store, s => s.updateElement);
    const beginInteraction = useStore(store, s => s.beginInteraction);
    const endInteraction = useStore(store, s => s.endInteraction);

    const { size, theme, elements } = template;

    const wrapperRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const interactionRef = useRef<InteractionState | null>(null);

    const [renderSize, setRenderSize] = useState<{ w: number; h: number } | null>(null);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const update = () => {
            const rect = el.getBoundingClientRect();
            setRenderSize(fitSize(rect.width, rect.height, size.w, size.h));
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [size.w, size.h]);

    const maybeSnap = useCallback(
        (n: number) => (snapToGrid ? snap(n, gridStep) : n),
        [gridStep, snapToGrid]
    );

    const onPointerMove = useCallback(
        (e: PointerEvent) => {
            const state = interactionRef.current;
            const svg = svgRef.current;
            if (!state || !svg) return;
            const { x: svgX, y: svgY } = clientPointToSvg(svg, e.clientX, e.clientY);
            const dx = svgX - state.startSvgX;
            const dy = svgY - state.startSvgY;
            const pixelDx = e.clientX - state.startSvgX;
            const pixelDy = e.clientY - state.startSvgY;
            const sqMoved = pixelDx * pixelDx + pixelDy * pixelDy;

            if (!state.moved && sqMoved < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;

            if (!state.moved) {
                state.moved = true;
                beginInteraction();
            }

            if (state.kind === 'move') {
                const newX = maybeSnap(state.initial.x + dx);
                const newY = maybeSnap(state.initial.y + dy);
                updateElement(state.elementId, el => {
                    if ('x' in el) el.x = newX;
                    if ('y' in el) el.y = newY;
                });
            } else {
                const initialBounds = {
                    x: state.initial.x,
                    y: state.initial.y,
                    w: state.initial.w ?? 0,
                    h: state.initial.h ?? 0,
                };
                const direction = state.direction;
                if (!direction) return;
                const next = applyResize(initialBounds, direction, dx, dy);
                const snapped = {
                    x: maybeSnap(next.x),
                    y: maybeSnap(next.y),
                    w: maybeSnap(next.w),
                    h: maybeSnap(next.h),
                };
                updateElement(state.elementId, el => {
                    if ('x' in el) el.x = snapped.x;
                    if ('y' in el) el.y = snapped.y;
                    if ('w' in el) el.w = snapped.w;
                    if (el.type === 'rect' || el.type === 'image') {
                        el.h = snapped.h;
                    }
                });
            }
        },
        [beginInteraction, maybeSnap, updateElement]
    );

    const onPointerUp = useCallback(() => {
        const state = interactionRef.current;
        const svg = svgRef.current;
        if (svg) {
            try {
                svg.releasePointerCapture && svg.releasePointerCapture(0);
            } catch {
                // pointer was already released; ignore
            }
        }
        if (state) {
            if (state.moved) {
                endInteraction();
            } else {
                selectElement(state.elementId);
            }
            interactionRef.current = null;
        }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
    }, [endInteraction, onPointerMove, selectElement]);

    const beginMove = useCallback(
        (elementId: string, clientX: number, clientY: number) => {
            const svg = svgRef.current;
            if (!svg) return;
            const target = template.elements.find(e => e.id === elementId);
            if (!target) return;
            const { x: startSvgX, y: startSvgY } = clientPointToSvg(svg, clientX, clientY);
            const x = 'x' in target ? (target.x as number) : 0;
            const y = 'y' in target ? (target.y as number) : 0;
            interactionRef.current = {
                kind: 'move',
                elementId,
                startSvgX,
                startSvgY,
                initial: { x, y },
                moved: false,
            };
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        },
        [onPointerMove, onPointerUp, template.elements]
    );

    const beginResize = useCallback(
        (elementId: string, direction: ResizeDirection, clientX: number, clientY: number) => {
            const svg = svgRef.current;
            if (!svg) return;
            const target = template.elements.find(e => e.id === elementId);
            if (!target) return;
            const bounds = elementBounds(target);
            if (!bounds) return;
            const { x: startSvgX, y: startSvgY } = clientPointToSvg(svg, clientX, clientY);
            interactionRef.current = {
                kind: 'resize',
                elementId,
                startSvgX,
                startSvgY,
                initial: bounds,
                direction,
                moved: false,
            };
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        },
        [onPointerMove, onPointerUp, template.elements]
    );

    const handleSvgPointerDown = useCallback(
        (e: React.PointerEvent<SVGSVGElement>) => {
            const target = e.target as Element | null;
            const groupEl = target?.closest('[data-element-id]') as Element | null;
            if (!groupEl) {
                selectElement(null);
                return;
            }
            const id = groupEl.getAttribute('data-element-id');
            if (!id) return;
            e.stopPropagation();
            beginMove(id, e.clientX, e.clientY);
        },
        [beginMove, selectElement]
    );

    const selectedElement = elements.find(el => el.id === selectedId) ?? null;
    const selectionBounds = selectedElement ? elementBounds(selectedElement) : null;
    const selectionDirections = selectedElement ? supportedResizeDirections(selectedElement) : [];

    return (
        <div
            ref={wrapperRef}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#F1F2F6',
                padding: `${OUTER_PADDING}px`,
                overflow: 'hidden',
                minHeight: 0,
                minWidth: 0,
            }}
        >
            {renderSize && (
                <div
                    style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        boxShadow: '0 12px 36px rgba(24, 34, 78, 0.16)',
                        padding: `${CARD_PADDING}px`,
                        width: renderSize.w + CARD_PADDING * 2,
                        height: renderSize.h + CARD_PADDING * 2,
                        display: 'flex',
                    }}
                >
                    <svg
                        ref={svgRef}
                        viewBox={`0 0 ${size.w} ${size.h}`}
                        preserveAspectRatio="xMidYMid meet"
                        style={{ width: '100%', height: '100%', display: 'block' }}
                        onPointerDown={handleSvgPointerDown}
                    >
                        {elements.map(el => {
                            if (!checkVisibility(el.visibility, data)) return null;
                            return renderElement(el, theme, data);
                        })}
                        {selectedElement && selectionBounds && (
                            <SelectionOverlay
                                bounds={selectionBounds}
                                directions={selectionDirections}
                                onResizeStart={(direction, e) => {
                                    beginResize(selectedElement.id, direction, e.clientX, e.clientY);
                                }}
                            />
                        )}
                    </svg>
                </div>
            )}
        </div>
    );
};
