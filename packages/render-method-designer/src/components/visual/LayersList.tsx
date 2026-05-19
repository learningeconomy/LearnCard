import React from 'react';

import type { DesignerStoreApi } from '../../store/designerStore';
import type { DesignerElement, ElementType } from '../../ir/types';
import { useStore } from 'zustand';

const ELEMENT_LABELS: Record<ElementType, string> = {
    rect: 'Rectangle',
    text: 'Text',
    image: 'Image',
    'field-row': 'Field Row',
    divider: 'Divider',
};

const ELEMENT_ICONS: Record<ElementType, string> = {
    rect: '▭',
    text: 'T',
    image: '🖼',
    'field-row': '☰',
    divider: '—',
};

const elementSummary = (el: DesignerElement): string => {
    switch (el.type) {
        case 'text':
            return el.content.kind === 'static' ? `"${el.content.value}"` : `{{${el.content.path}}}`;
        case 'image':
            return el.source.kind === 'url' ? 'URL image' : `{{${el.source.path}}}`;
        case 'field-row':
            return el.label;
        case 'rect':
            return el.fill.kind === 'solid' ? 'Solid' : 'Gradient';
        case 'divider':
            return `${el.w}px`;
    }
};

export interface LayersListProps {
    store: DesignerStoreApi;
}

export const LayersList: React.FC<LayersListProps> = ({ store }) => {
    const elements = useStore(store, s => s.template.elements);
    const selectedId = useStore(store, s => s.selectedElementId);
    const selectElement = useStore(store, s => s.selectElement);
    const moveElement = useStore(store, s => s.moveElement);
    const deleteElement = useStore(store, s => s.deleteElement);
    const duplicateElement = useStore(store, s => s.duplicateElement);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: '#FBFBFC',
                borderRight: '1px solid #E2E3E9',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #E2E3E9',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.8px',
                    color: '#8B91A7',
                    textTransform: 'uppercase',
                }}
            >
                Layers
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: '6px', overflowY: 'auto', flex: 1 }}>
                {[...elements].reverse().map(el => {
                    const isSelected = el.id === selectedId;
                    return (
                        <li key={el.id}>
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => selectElement(el.id)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        selectElement(el.id);
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: isSelected ? '#EFF0F5' : 'transparent',
                                    border: isSelected ? '1px solid #C5C8D3' : '1px solid transparent',
                                    marginBottom: '2px',
                                }}
                            >
                                <span
                                    style={{
                                        width: '20px',
                                        textAlign: 'center',
                                        fontSize: '13px',
                                        color: '#52597A',
                                        flexShrink: 0,
                                    }}
                                >
                                    {ELEMENT_ICONS[el.type]}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            color: '#18224E',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {ELEMENT_LABELS[el.type]}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            color: '#8B91A7',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            fontFamily: el.type === 'text' || el.type === 'image' ? "'JetBrains Mono', monospace" : 'inherit',
                                        }}
                                    >
                                        {elementSummary(el)}
                                    </div>
                                </div>
                                {isSelected && (
                                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                        <IconButton title="Bring forward" onClick={e => { e.stopPropagation(); moveElement(el.id, 'up'); }}>
                                            ↑
                                        </IconButton>
                                        <IconButton title="Send backward" onClick={e => { e.stopPropagation(); moveElement(el.id, 'down'); }}>
                                            ↓
                                        </IconButton>
                                        <IconButton title="Duplicate" onClick={e => { e.stopPropagation(); duplicateElement(el.id); }}>
                                            ⧉
                                        </IconButton>
                                        <IconButton title="Delete" onClick={e => { e.stopPropagation(); deleteElement(el.id); }}>
                                            ✕
                                        </IconButton>
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
                {elements.length === 0 && (
                    <li style={{ padding: '12px', fontSize: '11px', color: '#8B91A7', textAlign: 'center' }}>
                        No elements yet. Pick a starter template.
                    </li>
                )}
            </ul>
        </div>
    );
};

const IconButton: React.FC<{
    children: React.ReactNode;
    onClick: (e: React.MouseEvent) => void;
    title: string;
}> = ({ children, onClick, title }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        style={{
            width: '20px',
            height: '20px',
            padding: 0,
            border: '1px solid #E2E3E9',
            borderRadius: '4px',
            background: '#FFFFFF',
            color: '#52597A',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}
    >
        {children}
    </button>
);
