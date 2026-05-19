import React, { useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

import type { Theme } from '../../ir/types';

export interface ColorInputProps {
    value: string;
    onChange: (next: string) => void;
    theme: Theme;
    label?: string;
}

const TOKEN_KEYS: Array<keyof Theme['colors']> = [
    'primary',
    'secondary',
    'accent',
    'surface',
    'text',
    'muted',
    'border',
    'background',
];

const resolveSwatch = (value: string, theme: Theme): string => {
    if (!value.startsWith('$')) return value;
    const token = value.slice(1) as keyof Theme['colors'];
    return theme.colors[token] ?? '#FF00FF';
};

export const ColorInput: React.FC<ColorInputProps> = ({ value, onChange, theme, label }) => {
    const [open, setOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement | null>(null);

    const isToken = value.startsWith('$');
    const swatchColor = resolveSwatch(value, theme);

    return (
        <div style={{ position: 'relative' }}>
            {label && (
                <div style={{ fontSize: '11px', color: '#6F7590', marginBottom: '4px' }}>
                    {label}
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        border: '1px solid #C5C8D3',
                        background: swatchColor,
                        cursor: 'pointer',
                        padding: 0,
                        flexShrink: 0,
                    }}
                    aria-label={label ?? 'Pick color'}
                />
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        border: '1px solid #E2E3E9',
                        borderRadius: '6px',
                        background: '#FFFFFF',
                        color: '#18224E',
                        outline: 'none',
                        minWidth: 0,
                    }}
                />
            </div>
            {open && (
                <div
                    ref={popoverRef}
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        zIndex: 20,
                        background: '#FFFFFF',
                        border: '1px solid #E2E3E9',
                        borderRadius: '12px',
                        boxShadow: '0 12px 32px rgba(24, 34, 78, 0.18)',
                        padding: '12px',
                        width: '232px',
                    }}
                >
                    <HexColorPicker
                        color={isToken ? swatchColor : value}
                        onChange={next => onChange(next.toUpperCase())}
                        style={{ width: '208px', height: '208px' }}
                    />
                    <div style={{ marginTop: '10px' }}>
                        <div
                            style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#8B91A7',
                                letterSpacing: '0.6px',
                                marginBottom: '6px',
                            }}
                        >
                            THEME TOKENS
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                            {TOKEN_KEYS.map(key => {
                                const tokenValue = `$${key}`;
                                const isActive = value === tokenValue;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                            onChange(tokenValue);
                                            setOpen(false);
                                        }}
                                        title={`${tokenValue} (${theme.colors[key]})`}
                                        style={{
                                            width: '100%',
                                            height: '28px',
                                            borderRadius: '6px',
                                            border: isActive ? '2px solid #18224E' : '1px solid #E2E3E9',
                                            background: theme.colors[key],
                                            cursor: 'pointer',
                                            padding: 0,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        style={{
                            marginTop: '10px',
                            width: '100%',
                            padding: '6px',
                            fontSize: '11px',
                            border: '1px solid #C5C8D3',
                            borderRadius: '6px',
                            background: '#FFFFFF',
                            color: '#52597A',
                            cursor: 'pointer',
                        }}
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};
