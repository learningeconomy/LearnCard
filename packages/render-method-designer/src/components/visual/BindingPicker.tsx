import React, { useMemo, useState } from 'react';

import { walkVariables, type DiscoveredVariable } from '../../lib/walkVariables';
import {
    DATE_FORMAT_KEYS,
    DATE_FORMAT_LABELS,
    STRING_FORMAT_KEYS,
    STRING_FORMAT_LABELS,
    classifyFormattable,
} from '../../lib/format-aliases';
import type { StringValue } from '../../ir/types';
import type { RenderData } from '../../types';

export interface BindingPickerProps {
    value: StringValue;
    onChange: (next: StringValue) => void;
    data: RenderData;
    label?: string;
}

/**
 * Walk a dotted path through the render data to find the bound value. Used to determine
 * the field's type so the format dropdown can show the right options (date vs identifier
 * vs no formatting available).
 */
const lookupPath = (data: RenderData, path: string): unknown => {
    if (!path) return undefined;
    const parts = path.split('.');
    let cur: unknown = data;
    for (const part of parts) {
        if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
        cur = (cur as Record<string, unknown>)[part];
    }
    return cur;
};

export const BindingPicker: React.FC<BindingPickerProps> = ({ value, onChange, data, label }) => {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [filter, setFilter] = useState('');

    const variables = useMemo<DiscoveredVariable[]>(() => walkVariables(data), [data]);
    const filtered = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return variables;
        return variables.filter(v => v.path.toLowerCase().includes(q));
    }, [variables, filter]);

    const boundValue = value.kind === 'binding' ? lookupPath(data, value.path) : undefined;
    const fieldKind = classifyFormattable(boundValue);
    const formatKeys: readonly string[] | null =
        fieldKind === 'date' ? DATE_FORMAT_KEYS : fieldKind === 'identifier' ? STRING_FORMAT_KEYS : null;
    const formatLabels =
        fieldKind === 'date'
            ? (DATE_FORMAT_LABELS as Record<string, string>)
            : fieldKind === 'identifier'
                ? (STRING_FORMAT_LABELS as Record<string, string>)
                : null;

    const setKind = (kind: 'static' | 'binding') => {
        if (kind === 'static') {
            onChange({ kind: 'static', value: value.kind === 'static' ? value.value : '' });
        } else {
            onChange({
                kind: 'binding',
                path: value.kind === 'binding' ? value.path : '',
                fallback: value.kind === 'binding' ? value.fallback : undefined,
                format: value.kind === 'binding' ? value.format : undefined,
            });
        }
    };

    return (
        <div>
            {label && (
                <div style={{ fontSize: '11px', color: '#6F7590', marginBottom: '4px' }}>
                    {label}
                </div>
            )}
            <div
                style={{
                    display: 'flex',
                    gap: '0',
                    marginBottom: '6px',
                    border: '1px solid #E2E3E9',
                    borderRadius: '8px',
                    padding: '2px',
                    width: 'fit-content',
                }}
            >
                {(['static', 'binding'] as const).map(k => (
                    <button
                        key={k}
                        type="button"
                        onClick={() => setKind(k)}
                        style={{
                            padding: '3px 10px',
                            fontSize: '11px',
                            fontWeight: 500,
                            borderRadius: '6px',
                            border: 'none',
                            background: value.kind === k ? '#18224E' : 'transparent',
                            color: value.kind === k ? '#FFFFFF' : '#52597A',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                        }}
                    >
                        {k}
                    </button>
                ))}
            </div>

            {value.kind === 'static' ? (
                <input
                    type="text"
                    value={value.value}
                    onChange={e => onChange({ kind: 'static', value: e.target.value })}
                    placeholder="Enter text..."
                    style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '12px',
                        border: '1px solid #E2E3E9',
                        borderRadius: '8px',
                        outline: 'none',
                        color: '#18224E',
                        background: '#FFFFFF',
                    }}
                />
            ) : (
                <>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={value.path}
                            onChange={e =>
                                onChange({ ...value, path: e.target.value })
                            }
                            onFocus={() => setPickerOpen(true)}
                            placeholder="credentialSubject.name"
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
                        {pickerOpen && variables.length > 0 && (
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
                                    maxHeight: '240px',
                                    overflowY: 'auto',
                                }}
                            >
                                <input
                                    type="text"
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                    placeholder="Filter..."
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
                                        No matches.
                                    </div>
                                ) : (
                                    filtered.slice(0, 30).map(v => (
                                        <button
                                            key={v.path}
                                            type="button"
                                            onMouseDown={e => {
                                                e.preventDefault();
                                                onChange({ ...value, path: v.path });
                                                setPickerOpen(false);
                                                setFilter('');
                                            }}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                width: '100%',
                                                padding: '4px 8px',
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: '4px',
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
                                            <code style={{ color: '#18224E' }}>{v.path}</code>
                                            <span style={{ color: '#8B91A7', fontSize: '10px' }}>
                                                {v.preview}
                                            </span>
                                        </button>
                                    ))
                                )}
                                <button
                                    type="button"
                                    onMouseDown={e => {
                                        e.preventDefault();
                                        setPickerOpen(false);
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
                    {value.kind === 'binding' && formatKeys && formatLabels && (
                        <div style={{ marginTop: '6px' }}>
                            <div
                                style={{
                                    fontSize: '10px',
                                    color: '#6F7590',
                                    marginBottom: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                <span>Format</span>
                                <span
                                    style={{
                                        padding: '1px 6px',
                                        fontSize: '9px',
                                        background: '#EFF0F5',
                                        borderRadius: '4px',
                                        color: '#52597A',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {fieldKind}
                                </span>
                            </div>
                            <select
                                value={value.format ?? ''}
                                onChange={e =>
                                    onChange({
                                        ...value,
                                        format: e.target.value || undefined,
                                    })
                                }
                                style={{
                                    width: '100%',
                                    padding: '6px 10px',
                                    fontSize: '11px',
                                    border: '1px solid #E2E3E9',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    color: '#18224E',
                                    background: '#FFFFFF',
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="">Raw value (no formatting)</option>
                                {formatKeys.map(k => (
                                    <option key={k} value={k}>
                                        {formatLabels[k]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <input
                        type="text"
                        value={value.fallback ?? ''}
                        onChange={e =>
                            onChange({
                                ...value,
                                fallback: e.target.value || undefined,
                            })
                        }
                        placeholder="Fallback (shown when field is missing)"
                        style={{
                            width: '100%',
                            marginTop: '6px',
                            padding: '6px 10px',
                            fontSize: '11px',
                            border: '1px solid #E2E3E9',
                            borderRadius: '8px',
                            outline: 'none',
                            color: '#52597A',
                            background: '#FBFBFC',
                            fontStyle: 'italic',
                        }}
                    />
                </>
            )}
        </div>
    );
};
