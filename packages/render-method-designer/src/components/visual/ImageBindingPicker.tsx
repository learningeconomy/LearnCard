import React, { useMemo, useState } from 'react';

import type { RenderData } from '../../types';

export interface ImageBindingPickerProps {
    /** Current credential field path (e.g. `credentialSubject.achievement.image`). */
    path: string;
    onChange: (path: string) => void;
    data: RenderData;
    label?: string;
}

/**
 * A path is "image-like" when it resolves to one of:
 *   - a string URL (commonly under a key literally named `image`)
 *   - an `{ id, type? }` ImageObject (OBv3 / VCDM image convention)
 *   - already-shaped `{ resolved: <url>, ... }` (the `renderValues` convention)
 *
 * The emitter (`src/ir/emit.ts`) generates a three-tier Mustache chain that prefers
 * `renderValues.<path>.resolved`, so we surface that explicitly in the UI so authors can
 * see *why* a given path is a valid image source.
 */
const URL_HINT_RE = /^(https?:|data:image\/|\/|\.\/)/i;

const looksLikeImageString = (key: string, value: string): boolean => {
    if (URL_HINT_RE.test(value)) return true;
    return key.toLowerCase() === 'image' && value.length > 0;
};

const looksLikeImageObject = (value: Record<string, unknown>): boolean => {
    if (typeof value.resolved === 'string' && value.resolved.length > 0) return true;
    if (typeof value.id === 'string' && value.id.length > 0) {
        // OBv3 / VCDM image: { id: 'https://…', type: 'Image', caption?: '…' }
        return typeof value.type === 'string' || 'caption' in value || URL_HINT_RE.test(value.id);
    }
    return false;
};

interface ImageCandidate {
    /** Public path the user binds to, e.g. `credentialSubject.achievement.image`. */
    path: string;
    /** URL we previewed at the time of discovery. */
    preview: string;
    /** Where in the data shape the URL came from — drives the badge tooltip. */
    via: 'resolved' | 'id' | 'string';
}

const isUnsafeKey = (key: string): boolean =>
    key === '__proto__' || key === 'constructor' || key === 'prototype';

const VALID_KEY_RE = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;

const SKIP_TOP_LEVEL = new Set(['vc', 'credential', 'credentialSubjects', 'renderValues']);

const MAX_DEPTH = 6;

/**
 * Walk the sample VC for image-bearing leaves. We deliberately skip the `renderValues`
 * alias tree (it would just produce a duplicate set of paths) and discover those values
 * by inspecting the raw shape — the emitter rewrites the user-facing path into the
 * `renderValues.X.resolved` form on save.
 */
const walkImageCandidates = (data: RenderData): ImageCandidate[] => {
    const out: ImageCandidate[] = [];
    const seen = new Set<string>();

    const push = (path: string, preview: string, via: ImageCandidate['via']): void => {
        if (seen.has(path)) return;
        seen.add(path);
        out.push({ path, preview, via });
    };

    const visit = (value: unknown, parts: string[], depth: number): void => {
        if (depth > MAX_DEPTH) return;
        if (value === null || value === undefined) return;
        const key = parts[parts.length - 1] ?? '';
        if (typeof value === 'string') {
            if (looksLikeImageString(key, value)) {
                push(parts.join('.'), value, 'string');
            }
            return;
        }
        if (Array.isArray(value)) return; // arrays aren't auto-pickable
        if (typeof value !== 'object') return;

        const record = value as Record<string, unknown>;
        if (looksLikeImageObject(record)) {
            const resolved =
                typeof record.resolved === 'string' && record.resolved.length > 0
                    ? record.resolved
                    : typeof record.id === 'string'
                        ? record.id
                        : '';
            push(
                parts.join('.'),
                resolved,
                typeof record.resolved === 'string' ? 'resolved' : 'id'
            );
            // fall through — there may be image-like leaves nested even deeper
        }
        for (const k of Object.keys(record)) {
            if (isUnsafeKey(k) || !VALID_KEY_RE.test(k)) continue;
            visit(record[k], [...parts, k], depth + 1);
        }
    };

    for (const k of Object.keys(data)) {
        if (isUnsafeKey(k) || SKIP_TOP_LEVEL.has(k) || !VALID_KEY_RE.test(k)) continue;
        visit(data[k], [k], 1);
    }
    out.sort((a, b) => a.path.localeCompare(b.path));
    return out;
};

const lookupPath = (data: RenderData, path: string): unknown => {
    if (!path) return undefined;
    let cur: unknown = data;
    for (const part of path.split('.')) {
        if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
        cur = (cur as Record<string, unknown>)[part];
    }
    return cur;
};

const truncateMiddle = (value: string, front = 36, back = 8): string => {
    if (value.length <= front + back + 3) return value;
    return `${value.slice(0, front)}…${value.slice(-back)}`;
};

/**
 * Resolve what URL the canvas + emitter will actually use for a given user-facing path,
 * mirroring the runtime chain: `renderValues.X.resolved` → `X.id` → `X` (if string).
 * Returned only for preview purposes; the IR still stores the user-facing `path`.
 */
const resolveBoundUrl = (data: RenderData, path: string): string | null => {
    if (!path) return null;
    const resolved = lookupPath(data, `renderValues.${path}.resolved`);
    if (typeof resolved === 'string' && resolved.length > 0) return resolved;
    const id = lookupPath(data, `${path}.id`);
    if (typeof id === 'string' && id.length > 0) return id;
    const raw = lookupPath(data, path);
    if (typeof raw === 'string' && raw.length > 0) return raw;
    return null;
};

export const ImageBindingPicker: React.FC<ImageBindingPickerProps> = ({
    path,
    onChange,
    data,
    label,
}) => {
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('');

    const candidates = useMemo(() => walkImageCandidates(data), [data]);
    const filtered = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return candidates;
        return candidates.filter(c => c.path.toLowerCase().includes(q));
    }, [candidates, filter]);

    const resolvedUrl = useMemo(() => resolveBoundUrl(data, path), [data, path]);
    const hasResolvedVariant = useMemo(() => {
        if (!path) return false;
        const v = lookupPath(data, `renderValues.${path}.resolved`);
        return typeof v === 'string' && v.length > 0;
    }, [data, path]);

    return (
        <div>
            {label && (
                <div style={{ fontSize: '11px', color: '#6F7590', marginBottom: '4px' }}>
                    {label}
                </div>
            )}
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={path}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => setOpen(true)}
                    placeholder="credentialSubject.achievement.image"
                    style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        border: '1px solid #E2E3E9',
                        borderRadius: '8px',
                        outline: 'none',
                        color: '#18224E',
                        background: '#FFFFFF',
                    }}
                />
                {open && candidates.length > 0 && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            zIndex: 30,
                            background: '#FFFFFF',
                            border: '1px solid #E2E3E9',
                            borderRadius: '12px',
                            boxShadow: '0 12px 32px rgba(24, 34, 78, 0.18)',
                            padding: '6px',
                            maxHeight: '260px',
                            overflowY: 'auto',
                        }}
                    >
                        <input
                            type="text"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            placeholder="Filter image fields…"
                            style={{
                                width: '100%',
                                padding: '4px 8px',
                                fontSize: '11px',
                                border: '1px solid #E2E3E9',
                                borderRadius: '6px',
                                marginBottom: '4px',
                                outline: 'none',
                                color: '#18224E',
                            }}
                        />
                        {filtered.length === 0 ? (
                            <div style={{ padding: '6px', fontSize: '11px', color: '#8B91A7' }}>
                                No image fields found in this sample.
                            </div>
                        ) : (
                            filtered.slice(0, 30).map(c => (
                                <button
                                    key={c.path}
                                    type="button"
                                    onMouseDown={e => {
                                        e.preventDefault();
                                        onChange(c.path);
                                        setOpen(false);
                                        setFilter('');
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '100%',
                                        padding: '4px 8px',
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        textAlign: 'left',
                                        gap: '8px',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background =
                                            '#EFF0F5';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background =
                                            'transparent';
                                    }}
                                >
                                    {c.preview ? (
                                        <img
                                            src={c.preview}
                                            alt=""
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                objectFit: 'cover',
                                                borderRadius: '4px',
                                                background: '#EFF0F5',
                                                flexShrink: 0,
                                            }}
                                            onError={e => {
                                                (e.currentTarget as HTMLImageElement).style.visibility =
                                                    'hidden';
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '4px',
                                                background: '#EFF0F5',
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <code style={{ color: '#18224E', display: 'block' }}>
                                            {c.path}
                                        </code>
                                        <span
                                            style={{
                                                color: '#8B91A7',
                                                fontSize: '10px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                display: 'block',
                                            }}
                                        >
                                            {truncateMiddle(c.preview)}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                        <button
                            type="button"
                            onMouseDown={e => {
                                e.preventDefault();
                                setOpen(false);
                            }}
                            style={{
                                width: '100%',
                                padding: '4px',
                                marginTop: '4px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '10px',
                                color: '#8B91A7',
                            }}
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>

            {path && (
                <div
                    style={{
                        marginTop: '8px',
                        padding: '8px',
                        border: '1px solid #E2E3E9',
                        borderRadius: '8px',
                        background: '#FBFBFC',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                    }}
                >
                    {resolvedUrl ? (
                        <img
                            src={resolvedUrl}
                            alt=""
                            style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                background: '#EFF0F5',
                                flexShrink: 0,
                            }}
                            onError={e => {
                                (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '6px',
                                background: '#EFF0F5',
                                color: '#A8ACBD',
                                fontSize: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                textAlign: 'center',
                                lineHeight: 1.1,
                                padding: '2px',
                            }}
                        >
                            No match
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '2px',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '9px',
                                    fontWeight: 600,
                                    letterSpacing: '0.4px',
                                    textTransform: 'uppercase',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: hasResolvedVariant ? '#E8F5EE' : '#EFF0F5',
                                    color: hasResolvedVariant ? '#1F7A4D' : '#52597A',
                                }}
                                title={
                                    hasResolvedVariant
                                        ? 'This field has a `renderValues.<path>.resolved` form. The emitter will prefer it so renderers receive a canonical URL whether the source is a string or an ImageObject.'
                                        : 'No `renderValues.<path>.resolved` for this path. The emitter falls back to `<path>.id` then `<path>`.'
                                }
                            >
                                {hasResolvedVariant ? 'Resolved variant' : 'Raw value'}
                            </span>
                            <code
                                style={{
                                    fontSize: '10px',
                                    color: '#6F7590',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {hasResolvedVariant
                                    ? `renderValues.${path}.resolved`
                                    : `{{${path}}}`}
                            </code>
                        </div>
                        <div
                            style={{
                                fontSize: '10px',
                                color: resolvedUrl ? '#52597A' : '#A8ACBD',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                            title={resolvedUrl ?? ''}
                        >
                            {resolvedUrl
                                ? truncateMiddle(resolvedUrl, 40, 10)
                                : 'No image found at this path in the current sample.'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
