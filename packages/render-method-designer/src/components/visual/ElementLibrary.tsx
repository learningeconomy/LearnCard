import React from 'react';
import { useStore } from 'zustand';

import type { DesignerStoreApi, DesignerStore } from '../../store/designerStore';
import { generateId } from '../../store/designerStore';
import type {
    DesignerElement,
    DividerElement,
    ElementType,
    FieldRowElement,
    ImageElement,
    RectElement,
    TextElement,
} from '../../ir/types';

/**
 * Factory functions that produce a sensible default element of each type. Defaults
 * use theme tokens (`$primary`, `$muted`, etc.) so the new element picks up the
 * active template's palette automatically. Positioning is keyed off the canvas
 * center so newly added elements appear visible rather than off-screen.
 */
const elementFactories: Record<
    ElementType,
    (centerX: number, centerY: number) => DesignerElement
> = {
    rect: (cx, cy): RectElement => ({
        id: generateId('rect'),
        type: 'rect',
        x: cx - 60,
        y: cy - 40,
        w: 120,
        h: 80,
        rx: 8,
        fill: { kind: 'solid', color: '$accent' },
    }),
    text: (cx, cy): TextElement => ({
        id: generateId('text'),
        type: 'text',
        x: cx,
        y: cy,
        content: { kind: 'static', value: 'New text' },
        font: 'heading',
        size: 16,
        weight: 600,
        color: '$text',
        align: 'middle',
    }),
    image: (cx, cy): ImageElement => ({
        id: generateId('image'),
        type: 'image',
        x: cx - 48,
        y: cy - 48,
        w: 96,
        h: 96,
        source: { kind: 'binding', path: 'credentialSubject.image' },
        fit: 'cover',
        clip: 'rounded',
        cornerRadius: 16,
    }),
    'field-row': (cx, cy): FieldRowElement => ({
        id: generateId('row'),
        type: 'field-row',
        x: cx - 120,
        y: cy,
        w: 240,
        label: 'LABEL',
        value: { kind: 'binding', path: 'credentialSubject.name', fallback: '—' },
        labelColor: '$muted',
        valueColor: '$text',
    }),
    divider: (cx, cy): DividerElement => ({
        id: generateId('div'),
        type: 'divider',
        x: cx - 120,
        y: cy,
        w: 240,
        color: '$border',
        thickness: 1,
    }),
};

const ELEMENT_LIBRARY: Array<{
    type: ElementType;
    label: string;
    icon: string;
}> = [
    { type: 'text', label: 'Text', icon: 'T' },
    { type: 'rect', label: 'Rectangle', icon: '▭' },
    { type: 'image', label: 'Image', icon: '🖼' },
    { type: 'field-row', label: 'Field Row', icon: '☰' },
    { type: 'divider', label: 'Divider', icon: '—' },
];

export interface ElementLibraryProps {
    store: DesignerStoreApi;
}

export const ElementLibrary: React.FC<ElementLibraryProps> = ({ store }) => {
    const size = useStore(store, (s: DesignerStore) => s.template.size);
    const addElement = useStore(store, (s: DesignerStore) => s.addElement);

    const handleAdd = (type: ElementType) => {
        const factory = elementFactories[type];
        const cx = size.w / 2;
        const cy = size.h / 2;
        addElement(factory(cx, cy));
    };

    return (
        <div
            style={{
                padding: '8px',
                borderBottom: '1px solid #E2E3E9',
                background: '#FFFFFF',
            }}
        >
            <div
                style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.8px',
                    color: '#8B91A7',
                    textTransform: 'uppercase',
                    padding: '4px 4px 6px',
                }}
            >
                Add Element
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                {ELEMENT_LIBRARY.map(item => (
                    <button
                        key={item.type}
                        type="button"
                        title={`Add ${item.label}`}
                        onClick={() => handleAdd(item.type)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2px',
                            padding: '6px 2px',
                            background: '#FBFBFC',
                            border: '1px solid #E2E3E9',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#52597A',
                            transition: 'background 0.12s, border-color 0.12s',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#EFF0F5';
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#C5C8D3';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#FBFBFC';
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E3E9';
                        }}
                    >
                        <span style={{ fontSize: '14px', lineHeight: 1 }}>{item.icon}</span>
                        <span style={{ fontSize: '9px', fontWeight: 500 }}>{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
