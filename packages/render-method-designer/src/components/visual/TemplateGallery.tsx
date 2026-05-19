import React from 'react';

import { STARTER_TEMPLATES, type TemplateGalleryEntry } from '../../templates';
import type { CredentialTemplate } from '../../ir/types';

export interface TemplateGalleryProps {
    onPick: (template: CredentialTemplate) => void;
    onClose: () => void;
    extraTemplates?: TemplateGalleryEntry[];
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onPick, onClose, extraTemplates = [] }) => {
    const all = [...STARTER_TEMPLATES, ...extraTemplates];

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(24, 34, 78, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                padding: '24px',
            }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    maxWidth: '900px',
                    width: '100%',
                    maxHeight: '80vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
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
                            Pick a starter template
                        </div>
                        <div style={{ fontSize: '12px', color: '#6F7590', marginTop: '2px' }}>
                            Customize the design after — colors, text, bindings, all editable.
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
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '24px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '16px',
                    }}
                >
                    {all.map(entry => (
                        <button
                            key={entry.id}
                            type="button"
                            onClick={() => {
                                onPick(entry.template);
                                onClose();
                            }}
                            style={{
                                background: '#FBFBFC',
                                border: '1px solid #E2E3E9',
                                borderRadius: '16px',
                                padding: '12px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'border-color 0.15s, transform 0.15s',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.borderColor = '#18224E';
                                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.borderColor = '#E2E3E9';
                                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                            }}
                        >
                            <div
                                style={{
                                    aspectRatio: `${entry.template.size.w} / ${entry.template.size.h}`,
                                    background: '#FFFFFF',
                                    border: '1px solid #E2E3E9',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <TemplateThumbnail template={entry.template} />
                            </div>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#18224E' }}>
                                    {entry.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: '11px',
                                        color: '#6F7590',
                                        marginTop: '2px',
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {entry.description}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TemplateThumbnail: React.FC<{ template: CredentialTemplate }> = ({ template }) => (
    <div
        style={{
            width: '100%',
            height: '100%',
            background: template.theme.colors.surface,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '12%',
            color: template.theme.colors.text,
            fontFamily: template.theme.fonts.heading,
        }}
    >
        <div
            style={{
                width: '24%',
                height: '4%',
                background: template.theme.colors.accent,
                borderRadius: '2px',
            }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4%' }}>
            <div
                style={{
                    width: '70%',
                    height: '8%',
                    background: template.theme.colors.primary,
                    borderRadius: '2px',
                }}
            />
            <div
                style={{
                    width: '50%',
                    height: '4%',
                    background: template.theme.colors.muted,
                    borderRadius: '2px',
                }}
            />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3%' }}>
            <div
                style={{
                    width: '80%',
                    height: '3%',
                    background: template.theme.colors.border,
                    borderRadius: '2px',
                }}
            />
            <div
                style={{
                    width: '60%',
                    height: '3%',
                    background: template.theme.colors.border,
                    borderRadius: '2px',
                }}
            />
        </div>
    </div>
);
