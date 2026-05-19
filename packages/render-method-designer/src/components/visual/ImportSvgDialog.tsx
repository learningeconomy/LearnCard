import React, { useState } from 'react';

import { parseSvgToTemplate, type ImportWarning } from '../../ir/parse';
import type { CredentialTemplate } from '../../ir/types';

export interface ImportSvgDialogProps {
    onImport: (template: CredentialTemplate) => void;
    onClose: () => void;
}

export const ImportSvgDialog: React.FC<ImportSvgDialogProps> = ({ onImport, onClose }) => {
    const [svg, setSvg] = useState('');
    const [name, setName] = useState('Imported Template');
    const [useFallback, setUseFallback] = useState(false);
    const [preview, setPreview] = useState<{
        template: CredentialTemplate | null;
        warnings: ImportWarning[];
        droppedCount: number;
        usedFallback: boolean;
    } | null>(null);

    const runParse = (input: string) => {
        if (!input.trim()) {
            setPreview(null);
            return;
        }
        const result = parseSvgToTemplate(input, { name, useFallbackIfLossy: useFallback });
        setPreview(result);
    };

    const handleSvgChange = (next: string) => {
        setSvg(next);
        runParse(next);
    };

    const handleFile = async (file: File) => {
        const text = await file.text();
        setSvg(text);
        if (!name || name === 'Imported Template') {
            const stripped = file.name.replace(/\.svg$/i, '');
            setName(stripped || 'Imported Template');
        }
        runParse(text);
    };

    const handleImport = () => {
        if (!preview?.template) return;
        onImport(preview.template);
        onClose();
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(24, 34, 78, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 110,
                padding: '24px',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '720px',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid #E2E3E9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#18224E' }}>
                            Import SVG
                        </div>
                        <div style={{ fontSize: '12px', color: '#6F7590', marginTop: '2px' }}>
                            Paste or upload an SVG. We parse <code>&lt;rect&gt;</code>,{' '}
                            <code>&lt;text&gt;</code>, <code>&lt;image&gt;</code>,{' '}
                            <code>&lt;line&gt;</code>, gradients, and clip-paths. Everything else is
                            either dropped or embedded as a background.
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            border: '1px solid #C5C8D3',
                            borderRadius: '12px',
                            background: '#FFFFFF',
                            color: '#52597A',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '11px', color: '#6F7590', marginBottom: '4px' }}>
                            Template name
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '13px',
                                border: '1px solid #E2E3E9',
                                borderRadius: '8px',
                                outline: 'none',
                                color: '#18224E',
                                background: '#FFFFFF',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '11px', color: '#6F7590', marginBottom: '4px' }}>
                            SVG source
                        </div>
                        <textarea
                            value={svg}
                            onChange={e => handleSvgChange(e.target.value)}
                            placeholder='<svg xmlns="http://www.w3.org/2000/svg" width="360" height="560">...</svg>'
                            rows={8}
                            style={{
                                width: '100%',
                                padding: '10px',
                                fontSize: '11px',
                                fontFamily: "'JetBrains Mono', monospace",
                                border: '1px solid #E2E3E9',
                                borderRadius: '8px',
                                outline: 'none',
                                color: '#18224E',
                                background: '#FBFBFC',
                                resize: 'vertical',
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                            <label
                                style={{
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    border: '1px solid #C5C8D3',
                                    borderRadius: '12px',
                                    background: '#FFFFFF',
                                    color: '#52597A',
                                    cursor: 'pointer',
                                }}
                            >
                                Upload .svg…
                                <input
                                    type="file"
                                    accept=".svg,image/svg+xml"
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFile(file);
                                    }}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '11px',
                                    color: '#6F7590',
                                    cursor: 'pointer',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={useFallback}
                                    onChange={e => {
                                        setUseFallback(e.target.checked);
                                        runParse(svg);
                                    }}
                                />
                                Embed as background if any element can&apos;t be parsed
                            </label>
                        </div>
                    </div>

                    {preview && (
                        <div
                            style={{
                                marginBottom: '14px',
                                padding: '12px',
                                background: '#FBFBFC',
                                border: '1px solid #E2E3E9',
                                borderRadius: '12px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#8B91A7',
                                    letterSpacing: '0.6px',
                                    textTransform: 'uppercase',
                                    marginBottom: '8px',
                                }}
                            >
                                Parse result
                            </div>
                            {preview.template && (
                                <div style={{ fontSize: '12px', color: '#18224E', marginBottom: '6px' }}>
                                    {preview.usedFallback
                                        ? `Fallback: embedded the original SVG as a single image (canvas ${preview.template.size.w}×${preview.template.size.h}).`
                                        : `${preview.template.elements.length} element(s) parsed, ${preview.droppedCount} dropped (canvas ${preview.template.size.w}×${preview.template.size.h}).`}
                                </div>
                            )}
                            {preview.warnings.length > 0 && (
                                <ul
                                    style={{
                                        listStyle: 'none',
                                        margin: 0,
                                        padding: 0,
                                        maxHeight: '160px',
                                        overflowY: 'auto',
                                    }}
                                >
                                    {preview.warnings.map((w, i) => (
                                        <li
                                            key={i}
                                            style={{
                                                fontSize: '11px',
                                                padding: '4px 6px',
                                                color: w.severity === 'warning' ? '#92400E' : '#52597A',
                                                background:
                                                    w.severity === 'warning' ? '#FFFBEB' : 'transparent',
                                                borderRadius: '4px',
                                                marginBottom: '2px',
                                            }}
                                        >
                                            {w.severity === 'warning' ? '⚠ ' : 'ⓘ '}
                                            {w.message}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {!preview.template && preview.warnings.length === 0 && (
                                <div style={{ fontSize: '12px', color: '#8B91A7' }}>
                                    No template produced.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        padding: '16px 24px',
                        borderTop: '1px solid #E2E3E9',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '8px',
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: 500,
                            border: '1px solid #C5C8D3',
                            borderRadius: '20px',
                            background: '#FFFFFF',
                            color: '#52597A',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleImport}
                        disabled={!preview?.template}
                        style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: 500,
                            border: 'none',
                            borderRadius: '20px',
                            background: '#18224E',
                            color: '#FFFFFF',
                            cursor: preview?.template ? 'pointer' : 'not-allowed',
                            opacity: preview?.template ? 1 : 0.4,
                        }}
                    >
                        Import
                    </button>
                </div>
            </div>
        </div>
    );
};
