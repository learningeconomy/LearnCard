import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';

import {
    createDesignerStore,
    type DesignerStoreApi,
} from '../../store/designerStore';
import type { CredentialTemplate } from '../../ir/types';
import type { SampleVC } from '../../types';
import { buildPreviewData } from '../../lib/walkVariables';
import { emitSvgMustache } from '../../ir/emit';
import { STARTER_TEMPLATES, type TemplateGalleryEntry } from '../../templates';
import { Canvas } from './Canvas';
import { LayersList } from './LayersList';
import { PropertiesPanel } from './PropertiesPanel';
import { ThemePanel } from './ThemePanel';
import { TemplateGallery } from './TemplateGallery';
import { ImportSvgDialog } from './ImportSvgDialog';

export interface VisualEditorProps {
    initialTemplate?: CredentialTemplate;
    extraTemplates?: TemplateGalleryEntry[];
    sampleVCs: SampleVC[];
    onSave: (output: { svgMustache: string; template: CredentialTemplate }) => void | Promise<void>;
    onCancel?: () => void;
    /** Extra controls rendered in the toolbar (right side, before Cancel/Save). Used by
     *  `RenderMethodDesigner` to inline the Visual/Code mode switcher. */
    toolbarExtras?: React.ReactNode;
}

const buttonPrimary: React.CSSProperties = {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: '20px',
    border: 'none',
    background: '#18224E',
    color: '#FFFFFF',
    cursor: 'pointer',
};

const buttonSecondary: React.CSSProperties = {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: '20px',
    border: '1px solid #C5C8D3',
    background: '#FFFFFF',
    color: '#52597A',
    cursor: 'pointer',
};

export const VisualEditor: React.FC<VisualEditorProps> = ({
    initialTemplate,
    extraTemplates,
    sampleVCs,
    onSave,
    onCancel,
    toolbarExtras,
}) => {
    const storeRef = useRef<DesignerStoreApi | null>(null);
    if (!storeRef.current) {
        storeRef.current = createDesignerStore(initialTemplate ?? STARTER_TEMPLATES[0].template);
    }
    const store = storeRef.current;

    const [selectedSampleId, setSelectedSampleId] = useState<string | null>(
        sampleVCs.length > 0 ? sampleVCs[0].id : null
    );
    const [showGallery, setShowGallery] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialTemplate) store.getState().setTemplate(initialTemplate);
    }, [initialTemplate, store]);

    const selectedSample = useMemo(
        () => sampleVCs.find(s => s.id === selectedSampleId) ?? sampleVCs[0] ?? null,
        [sampleVCs, selectedSampleId]
    );
    const data = useMemo(
        () => (selectedSample ? buildPreviewData(selectedSample.credential) : {}),
        [selectedSample]
    );

    const template = useStore(store, s => s.template);
    const setTemplate = useStore(store, s => s.setTemplate);
    const undo = useStore(store, s => s.undo);
    const redo = useStore(store, s => s.redo);
    const canUndo = useStore(store, s => s.history.past.length > 0);
    const canRedo = useStore(store, s => s.history.future.length > 0);

    const handleSave = async () => {
        setSaving(true);
        try {
            const svgMustache = emitSvgMustache(template);
            await onSave({ svgMustache, template });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                minHeight: 0,
                background: '#FFFFFF',
                fontFamily: 'Poppins, system-ui, sans-serif',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderBottom: '1px solid #E2E3E9',
                    background: '#FBFBFC',
                    flexWrap: 'wrap',
                    flexShrink: 0,
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
                    {template.name}
                </div>

                <button type="button" onClick={() => setShowGallery(true)} style={buttonSecondary}>
                    Change template
                </button>

                {sampleVCs.length > 0 && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#6F7590' }}>Sample</span>
                        <select
                            value={selectedSampleId ?? ''}
                            onChange={e => setSelectedSampleId(e.target.value)}
                            style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                border: '1px solid #C5C8D3',
                                borderRadius: '12px',
                                background: '#FFFFFF',
                                color: '#18224E',
                                outline: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            {sampleVCs.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                <button
                    type="button"
                    disabled={!canUndo}
                    onClick={undo}
                    style={{ ...buttonSecondary, opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'not-allowed' }}
                    title="Undo"
                >
                    ↶
                </button>
                <button
                    type="button"
                    disabled={!canRedo}
                    onClick={redo}
                    style={{ ...buttonSecondary, opacity: canRedo ? 1 : 0.4, cursor: canRedo ? 'pointer' : 'not-allowed' }}
                    title="Redo"
                >
                    ↷
                </button>

                <div style={{ flex: 1 }} />

                {toolbarExtras}

                {onCancel && (
                    <button type="button" onClick={onCancel} style={buttonSecondary}>
                        Cancel
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        ...buttonPrimary,
                        opacity: saving ? 0.4 : 1,
                        cursor: saving ? 'not-allowed' : 'pointer',
                    }}
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </div>

            <div
                style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: '220px minmax(0, 1fr) 260px',
                    minHeight: 0,
                    minWidth: 0,
                    overflow: 'hidden',
                }}
            >
                <LayersList store={store} />
                <Canvas store={store} data={data} />
                <div
                    style={{
                        borderLeft: '1px solid #E2E3E9',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        overflow: 'hidden',
                        background: '#FFFFFF',
                    }}
                >
                    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <PropertiesPanel store={store} data={data} />
                    </div>
                    <ThemePanel store={store} />
                </div>
            </div>

            {showGallery && (
                <TemplateGallery
                    onPick={t => setTemplate(t)}
                    onClose={() => setShowGallery(false)}
                    onImportSvg={() => setShowImport(true)}
                    extraTemplates={extraTemplates}
                />
            )}

            {showImport && (
                <ImportSvgDialog
                    onImport={t => setTemplate(t)}
                    onClose={() => setShowImport(false)}
                />
            )}
        </div>
    );
};
