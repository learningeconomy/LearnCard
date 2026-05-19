import React, { useMemo, useState } from 'react';

import { walkVariables, type DiscoveredVariable } from '../../lib/walkVariables';
import type { StringValue } from '../../ir/types';
import type { RenderData } from '../../types';

export interface BindingPickerProps {
    value: StringValue;
    onChange: (next: StringValue) => void;
    data: RenderData;
    label?: string;
}

export const BindingPicker: React.FC<BindingPickerProps> = ({ value, onChange, data, label }) => {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [filter, setFilter] = useState('');

    const variables = useMemo<DiscoveredVariable[]>(() => walkVariables(data), [data]);
    const filtered = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return variables;
        return variables.filter(v => v.path.toLowerCase().includes(q));
    }, [variables, filter]);

    const setKind = (kind: 'static' | 'binding') => {
        if (kind === 'static') {
            onChange({ kind: 'static', value: value.kind === 'static' ? value.value : '' });
        } else {
            onChange({
                kind: 'binding',
                path: value.kind === 'binding' ? value.path : '',
                fallback: value.kind === 'binding' ? value.fallback : undefined,
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
