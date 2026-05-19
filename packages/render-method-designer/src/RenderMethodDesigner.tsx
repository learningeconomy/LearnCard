import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EditorView } from '@codemirror/view';

import { CodeEditor } from './components/CodeEditor';
import { LivePreview } from './components/LivePreview';
import { VariablePicker } from './components/VariablePicker';
import { Toolbar } from './components/Toolbar';
import { VisualEditor } from './components/visual/VisualEditor';
import { resolveAdapter } from './suites';
import { insertAtCursor } from './lib/insertAtCursor';
import { buildPreviewData } from './lib/walkVariables';
import { validateMustacheTemplate } from './lib/validateMustache';
import type {
    DesignerMode,
    RenderMethodDesignerProps,
    ValidationResult,
} from './types';

const VALID_DEFAULT: ValidationResult = { valid: true, errors: [], warnings: [] };

const modeButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '12px',
    border: 'none',
    background: active ? '#18224E' : 'transparent',
    color: active ? '#FFFFFF' : '#52597A',
    cursor: 'pointer',
});

const ModeSwitcher: React.FC<{
    mode: DesignerMode;
    onChange: (m: DesignerMode) => void;
}> = ({ mode, onChange }) => (
    <div
        style={{
            display: 'inline-flex',
            padding: '2px',
            background: '#FFFFFF',
            border: '1px solid #E2E3E9',
            borderRadius: '14px',
            gap: '2px',
        }}
    >
        <button type="button" onClick={() => onChange('visual')} style={modeButtonStyle(mode === 'visual')}>
            Visual
        </button>
        <button type="button" onClick={() => onChange('code')} style={modeButtonStyle(mode === 'code')}>
            Code
        </button>
    </div>
);

export const RenderMethodDesigner: React.FC<RenderMethodDesignerProps> = ({
    initialTemplate,
    initialMode = 'visual',
    allowModeSwitch = true,
    initialCodeTemplate,
    renderSuite = 'svg-mustache',
    adapters = [],
    sampleVCs = [],
    onSave,
    onCancel,
    className,
}) => {
    const [mode, setMode] = useState<DesignerMode>(initialMode);
    const adapter = useMemo(() => resolveAdapter(renderSuite, adapters), [renderSuite, adapters]);
    const starter = adapter?.starterTemplate ?? '';
    const [codeTemplate, setCodeTemplate] = useState<string>(initialCodeTemplate ?? starter);
    const [selectedSampleId, setSelectedSampleId] = useState<string | null>(
        sampleVCs.length > 0 ? sampleVCs[0].id : null
    );
    const [validation, setValidation] = useState<ValidationResult>(VALID_DEFAULT);
    const [saving, setSaving] = useState(false);
    const editorViewRef = useRef<EditorView | null>(null);

    const selectedSample = useMemo(
        () => sampleVCs.find(s => s.id === selectedSampleId) ?? sampleVCs[0] ?? null,
        [sampleVCs, selectedSampleId]
    );

    const previewData = useMemo(
        () => (selectedSample ? buildPreviewData(selectedSample.credential) : {}),
        [selectedSample]
    );

    useEffect(() => {
        if (mode === 'code') setValidation(validateMustacheTemplate(codeTemplate));
    }, [codeTemplate, mode]);

    const handleViewReady = useCallback((view: EditorView) => {
        editorViewRef.current = view;
    }, []);

    const handleInsertVariable = useCallback((token: string) => {
        const view = editorViewRef.current;
        if (view) {
            insertAtCursor(view, token);
            view.focus();
            return;
        }
        setCodeTemplate(t => `${t}${token}`);
    }, []);

    const handleResetCode = useCallback(() => {
        setCodeTemplate(starter);
    }, [starter]);

    const handleSaveCode = useCallback(async () => {
        if (!onSave) return;
        setSaving(true);
        try {
            await onSave({ svgMustache: codeTemplate });
        } finally {
            setSaving(false);
        }
    }, [onSave, codeTemplate]);

    if (mode === 'visual') {
        return (
            <div
                className={className}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    minHeight: 0,
                    background: '#FFFFFF',
                    border: '1px solid #E2E3E9',
                    borderRadius: '16px',
                    overflow: 'hidden',
                }}
            >
                <VisualEditor
                    initialTemplate={initialTemplate}
                    sampleVCs={sampleVCs}
                    onSave={async ({ svgMustache, template }) => {
                        if (onSave) await onSave({ svgMustache, template });
                    }}
                    onCancel={onCancel}
                    toolbarExtras={allowModeSwitch ? <ModeSwitcher mode={mode} onChange={setMode} /> : undefined}
                />
            </div>
        );
    }

    if (!adapter) {
        return (
            <div className={className} style={{ padding: '16px', color: '#B91C1C' }}>
                No adapter registered for renderSuite="{renderSuite}". Pass an adapter via the
                `adapters` prop or use a built-in suite (e.g. "svg-mustache").
            </div>
        );
    }

    return (
        <div
            className={className}
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                minHeight: 0,
                background: '#FFFFFF',
                border: '1px solid #E2E3E9',
                borderRadius: '16px',
                overflow: 'hidden',
                fontFamily: 'Poppins, system-ui, -apple-system, sans-serif',
            }}
        >
            <Toolbar
                samples={sampleVCs}
                selectedSampleId={selectedSampleId}
                onSelectSample={setSelectedSampleId}
                onReset={handleResetCode}
                onSave={handleSaveCode}
                onCancel={onCancel}
                saving={saving}
                validation={validation}
                suiteLabel={adapter.label}
            >
                {allowModeSwitch && <ModeSwitcher mode={mode} onChange={setMode} />}
                <VariablePicker
                    data={previewData}
                    onInsert={handleInsertVariable}
                    disabled={!selectedSample}
                />
            </Toolbar>

            <div
                style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    minHeight: 0,
                }}
            >
                <div style={{ borderRight: '1px solid #E2E3E9', overflow: 'hidden' }}>
                    <CodeEditor value={codeTemplate} onChange={setCodeTemplate} onViewReady={handleViewReady} />
                </div>
                <div style={{ overflow: 'auto' }}>
                    <LivePreview template={codeTemplate} data={previewData} adapter={adapter} />
                </div>
            </div>
        </div>
    );
};
