import React, { useEffect, useRef, useState } from 'react';
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

/**
 * The Canvas renders the IR directly as React-SVG, NOT via the Mustache emitter. This
 * gives us click-to-select for free (every element gets an onClick handler), avoids the
 * cost of a Mustache parse on every keystroke in the properties panel, and keeps the
 * preview reactive.
 *
 * The trade-off: the canvas output and the saved output use two different pipelines.
 * The save path is `emit.ts` (correctness-critical, sanitization-applied). The canvas
 * path is this file (interactivity-critical, sample-data-driven). Discrepancies between
 * them are bugs — the IR's semantics MUST be identical in both. The shared `theme.ts`
 * resolvers and the central element types are how we keep them in sync.
 */

const resolveString = (sv: StringValue, data: RenderData): string => {
    if (sv.kind === 'static') return sv.value;
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

const useGradientId = (fill: FillRef, key: string): string => {
    if (fill.kind === 'solid') return '';
    return `canvas_grad_${key}`;
};

interface ElementRenderProps<E extends DesignerElement> {
    el: E;
    theme: Theme;
    data: RenderData;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

const RectRender: React.FC<ElementRenderProps<RectElement>> = ({ el, theme, isSelected, onSelect }) => {
    const gradientId = useGradientId(el.fill, el.id);
    let fill: string;
    if (el.fill.kind === 'solid') {
        fill = resolveColor(el.fill.color, theme);
    } else {
        fill = `url(#${gradientId})`;
    }
    return (
        <g onClick={e => { e.stopPropagation(); onSelect(el.id); }} style={{ cursor: 'pointer' }}>
            {el.fill.kind === 'linear-gradient' && (
                <defs>
                    <linearGradient
                        id={gradientId}
                        x1={el.fill.direction === 'vertical' ? '0%' : '0%'}
                        y1={el.fill.direction === 'vertical' ? '0%' : '0%'}
                        x2={el.fill.direction === 'horizontal' ? '100%' : el.fill.direction === 'vertical' ? '0%' : '100%'}
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
            {isSelected && <SelectionRect x={el.x} y={el.y} w={el.w} h={el.h} />}
        </g>
    );
};

const TextRender: React.FC<ElementRenderProps<TextElement>> = ({ el, theme, data, isSelected, onSelect }) => {
    const text = resolveString(el.content, data);
    if (!text && el.content.kind === 'binding' && !el.content.fallback) return null;
    const lineHeight = el.size * 1.2;
    return (
        <g onClick={e => { e.stopPropagation(); onSelect(el.id); }} style={{ cursor: 'pointer' }}>
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
            {isSelected && (
                <SelectionRect
                    x={el.align === 'middle' ? el.x - (el.maxWidth ?? 100) / 2 : el.align === 'end' ? el.x - (el.maxWidth ?? 100) : el.x}
                    y={el.y - el.size}
                    w={el.maxWidth ?? Math.max(60, text.length * el.size * 0.5)}
                    h={lineHeight}
                />
            )}
        </g>
    );
};

const ImageRender: React.FC<ElementRenderProps<ImageElement>> = ({ el, theme, data, isSelected, onSelect }) => {
    const href = el.source.kind === 'url' ? el.source.value : (lookupPath(data, el.source.path) as string | undefined);
    const clipId = `canvas_clip_${el.id}`;
    return (
        <g onClick={e => { e.stopPropagation(); onSelect(el.id); }} style={{ cursor: 'pointer' }}>
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
                            <rect x={el.x} y={el.y} width={el.w} height={el.h} rx={el.cornerRadius ?? 12} />
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
            {isSelected && <SelectionRect x={el.x} y={el.y} w={el.w} h={el.h} />}
        </g>
    );
};

const FieldRowRender: React.FC<ElementRenderProps<FieldRowElement>> = ({ el, theme, data, isSelected, onSelect }) => {
    const valueText = resolveString(el.value, data);
    return (
        <g onClick={e => { e.stopPropagation(); onSelect(el.id); }} style={{ cursor: 'pointer' }}>
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
            {isSelected && <SelectionRect x={el.x} y={el.y - (el.labelSize ?? 10)} w={el.w} h={(el.valueSize ?? 13) + 6} />}
        </g>
    );
};

const DividerRender: React.FC<ElementRenderProps<DividerElement>> = ({ el, theme, isSelected, onSelect }) => (
    <g onClick={e => { e.stopPropagation(); onSelect(el.id); }} style={{ cursor: 'pointer' }}>
        <line
            x1={el.x}
            y1={el.y}
            x2={el.x + el.w}
            y2={el.y}
            stroke={resolveColor(el.color, theme)}
            strokeWidth={el.thickness}
        />
        {isSelected && <SelectionRect x={el.x} y={el.y - 4} w={el.w} h={Math.max(8, el.thickness + 6)} />}
    </g>
);

const SelectionRect: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
    <rect
        x={x - 4}
        y={y - 4}
        width={w + 8}
        height={h + 8}
        fill="none"
        stroke="#22D3EE"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        pointerEvents="none"
    />
);

export interface CanvasProps {
    store: DesignerStoreApi;
    data: RenderData;
}

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

export const Canvas: React.FC<CanvasProps> = ({ store, data }) => {
    const template = useStore(store, s => s.template);
    const selectedId = useStore(store, s => s.selectedElementId);
    const selectElement = useStore(store, s => s.selectElement);

    const { size, theme, elements } = template;

    const containerRef = useRef<HTMLDivElement>(null);
    const [renderSize, setRenderSize] = useState<{ w: number; h: number } | null>(null);

    useEffect(() => {
        const el = containerRef.current;
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

    return (
        <div
            ref={containerRef}
            onClick={() => selectElement(null)}
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
                        viewBox={`0 0 ${size.w} ${size.h}`}
                        preserveAspectRatio="xMidYMid meet"
                        style={{ width: '100%', height: '100%', display: 'block' }}
                    >
                        {elements.map(el => {
                            if (!checkVisibility(el.visibility, data)) return null;
                            const isSelected = el.id === selectedId;
                            const renderProps = { theme, data, isSelected, onSelect: selectElement };
                            switch (el.type) {
                                case 'rect':
                                    return <RectRender key={el.id} el={el} {...renderProps} />;
                                case 'text':
                                    return <TextRender key={el.id} el={el} {...renderProps} />;
                                case 'image':
                                    return <ImageRender key={el.id} el={el} {...renderProps} />;
                                case 'field-row':
                                    return <FieldRowRender key={el.id} el={el} {...renderProps} />;
                                case 'divider':
                                    return <DividerRender key={el.id} el={el} {...renderProps} />;
                                default:
                                    return null;
                            }
                        })}
                    </svg>
                </div>
            )}
        </div>
    );
};
