import React from 'react';

import type { SampleVC, ValidationResult } from '../types';

export interface ToolbarProps {
    samples: SampleVC[];
    selectedSampleId: string | null;
    onSelectSample: (id: string) => void;
    onReset: () => void;
    onSave: () => void;
    onCancel?: () => void;
    saving: boolean;
    validation: ValidationResult;
    suiteLabel: string;
    children?: React.ReactNode;
}

const primaryButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: '20px',
    border: 'none',
    background: '#18224E',
    color: '#FFFFFF',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
};

const secondaryButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: '20px',
    border: '1px solid #C5C8D3',
    background: '#FFFFFF',
    color: '#52597A',
    cursor: 'pointer',
    transition: 'background 0.15s',
};

const selectStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '12px',
    border: '1px solid #C5C8D3',
    background: '#FFFFFF',
    color: '#18224E',
    cursor: 'pointer',
    outline: 'none',
};

export const Toolbar: React.FC<ToolbarProps> = ({
    samples,
    selectedSampleId,
    onSelectSample,
    onReset,
    onSave,
    onCancel,
    saving,
    validation,
    suiteLabel,
    children,
}) => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                padding: '12px 16px',
                borderBottom: '1px solid #E2E3E9',
                background: '#FBFBFC',
            }}
        >
            <div
                style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.8px',
                    color: '#8B91A7',
                    textTransform: 'uppercase',
                }}
            >
                {suiteLabel}
            </div>

            {samples.length > 0 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#6F7590' }}>Sample</span>
                    <select
                        value={selectedSampleId ?? ''}
                        onChange={e => onSelectSample(e.target.value)}
                        style={selectStyle}
                    >
                        {samples.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            {children}

            <div style={{ flex: 1 }} />

            {!validation.valid && validation.errors.length > 0 && (
                <span
                    style={{
                        fontSize: '12px',
                        color: '#B91C1C',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '8px',
                        padding: '4px 10px',
                    }}
                    title={validation.errors.join('\n')}
                >
                    {validation.errors[0]}
                </span>
            )}
            {validation.valid && validation.warnings.length > 0 && (
                <span
                    style={{
                        fontSize: '12px',
                        color: '#92400E',
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: '8px',
                        padding: '4px 10px',
                    }}
                    title={validation.warnings.join('\n')}
                >
                    {validation.warnings[0]}
                </span>
            )}

            <button type="button" onClick={onReset} style={secondaryButtonStyle}>
                Reset
            </button>
            {onCancel && (
                <button type="button" onClick={onCancel} style={secondaryButtonStyle}>
                    Cancel
                </button>
            )}
            <button
                type="button"
                onClick={onSave}
                disabled={saving || !validation.valid}
                style={{
                    ...primaryButtonStyle,
                    opacity: saving || !validation.valid ? 0.4 : 1,
                    cursor: saving || !validation.valid ? 'not-allowed' : 'pointer',
                }}
            >
                {saving ? 'Saving…' : 'Save'}
            </button>
        </div>
    );
};
