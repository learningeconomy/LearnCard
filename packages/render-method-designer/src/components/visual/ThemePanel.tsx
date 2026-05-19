import React, { useState } from 'react';
import { useStore } from 'zustand';

import type { DesignerStoreApi } from '../../store/designerStore';
import type { Theme } from '../../ir/types';
import { ColorInput } from './ColorInput';

const COLOR_LABELS: Record<keyof Theme['colors'], string> = {
    primary: 'Primary',
    secondary: 'Secondary',
    accent: 'Accent',
    surface: 'Surface',
    text: 'Text',
    muted: 'Muted',
    border: 'Border',
    background: 'Background',
};

export interface ThemePanelProps {
    store: DesignerStoreApi;
}

export const ThemePanel: React.FC<ThemePanelProps> = ({ store }) => {
    const [expanded, setExpanded] = useState(false);
    const theme = useStore(store, s => s.template.theme);
    const updateTheme = useStore(store, s => s.updateTheme);

    return (
        <div style={{ borderTop: '1px solid #E2E3E9' }}>
            <button
                type="button"
                onClick={() => setExpanded(e => !e)}
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: expanded ? '1px solid #E2E3E9' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.8px',
                    color: '#8B91A7',
                    textTransform: 'uppercase',
                }}
            >
                <span>Theme</span>
                <span style={{ fontSize: '12px' }}>{expanded ? '▾' : '▸'}</span>
            </button>
            {expanded && (
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(Object.keys(COLOR_LABELS) as Array<keyof Theme['colors']>).map(key => (
                        <ColorInput
                            key={key}
                            label={COLOR_LABELS[key]}
                            value={theme.colors[key]}
                            onChange={next => updateTheme(t => { t.colors[key] = next; })}
                            theme={theme}
                        />
                    ))}
                    <div>
                        <div style={{ fontSize: '11px', color: '#6F7590', marginBottom: '4px' }}>
                            Heading font
                        </div>
                        <input
                            type="text"
                            value={theme.fonts.heading}
                            onChange={e => updateTheme(t => { t.fonts.heading = e.target.value; })}
                            style={{
                                width: '100%',
                                padding: '6px 10px',
                                fontSize: '12px',
                                fontFamily: "'JetBrains Mono', monospace",
                                border: '1px solid #E2E3E9',
                                borderRadius: '6px',
                                color: '#18224E',
                                background: '#FFFFFF',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#6F7590', marginBottom: '4px' }}>
                            Body font
                        </div>
                        <input
                            type="text"
                            value={theme.fonts.body}
                            onChange={e => updateTheme(t => { t.fonts.body = e.target.value; })}
                            style={{
                                width: '100%',
                                padding: '6px 10px',
                                fontSize: '12px',
                                fontFamily: "'JetBrains Mono', monospace",
                                border: '1px solid #E2E3E9',
                                borderRadius: '6px',
                                color: '#18224E',
                                background: '#FFFFFF',
                                outline: 'none',
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
