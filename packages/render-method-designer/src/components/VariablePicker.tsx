import React, { useMemo, useState } from 'react';

import { walkVariables, type DiscoveredVariable } from '../lib/walkVariables';
import type { RenderData } from '../types';

export interface VariablePickerProps {
    data: RenderData;
    onInsert: (token: string) => void;
    disabled?: boolean;
}

export const VariablePicker: React.FC<VariablePickerProps> = ({ data, onInsert, disabled }) => {
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('');

    const variables = useMemo<DiscoveredVariable[]>(() => walkVariables(data), [data]);

    const filtered = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return variables;
        return variables.filter(v => v.path.toLowerCase().includes(q));
    }, [variables, filter]);

    if (disabled || variables.length === 0) {
        return (
            <button
                type="button"
                disabled
                style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '20px',
                    border: '1px solid #E2E3E9',
                    color: '#A8ACBD',
                    background: '#FFFFFF',
                    cursor: 'not-allowed',
                }}
            >
                Insert variable
            </button>
        );
    }

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '20px',
                    border: '1px solid #C5C8D3',
                    color: '#353E64',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    fontWeight: 500,
                }}
            >
                Insert variable ({variables.length})
            </button>
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        zIndex: 10,
                        width: '320px',
                        maxHeight: '360px',
                        overflowY: 'auto',
                        background: '#FFFFFF',
                        border: '1px solid #E2E3E9',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(24, 34, 78, 0.12)',
                        padding: '8px',
                    }}
                >
                    <input
                        type="text"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder="Filter paths..."
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '6px 10px',
                            fontSize: '12px',
                            borderRadius: '8px',
                            border: '1px solid #E2E3E9',
                            marginBottom: '8px',
                            outline: 'none',
                            color: '#18224E',
                            background: '#FFFFFF',
                        }}
                    />
                    {filtered.length === 0 ? (
                        <div style={{ padding: '8px', fontSize: '12px', color: '#8B91A7' }}>
                            No matches.
                        </div>
                    ) : (
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {filtered.map(v => (
                                <li key={v.path}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onInsert(`{{${v.path}}}`);
                                            setOpen(false);
                                            setFilter('');
                                        }}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            gap: '12px',
                                            width: '100%',
                                            padding: '6px 8px',
                                            background: 'transparent',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            textAlign: 'left',
                                            color: '#353E64',
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
                                        <code
                                            style={{
                                                fontFamily:
                                                    "'JetBrains Mono', 'Fira Code', monospace",
                                                color: '#18224E',
                                            }}
                                        >
                                            {`{{${v.path}}}`}
                                        </code>
                                        <span style={{ color: '#8B91A7', fontSize: '11px' }}>
                                            {v.preview}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};
