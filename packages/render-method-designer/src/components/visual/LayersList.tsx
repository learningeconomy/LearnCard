import React from 'react';
import { useStore } from 'zustand';
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { DesignerStoreApi } from '../../store/designerStore';
import type { DesignerElement, ElementType } from '../../ir/types';
import { ElementLibrary } from './ElementLibrary';

const ELEMENT_LABELS: Record<ElementType, string> = {
    rect: 'Rectangle',
    text: 'Text',
    image: 'Image',
    'field-row': 'Field Row',
    divider: 'Divider',
    path: 'Path',
};

const ELEMENT_ICONS: Record<ElementType, string> = {
    rect: '▭',
    text: 'T',
    image: '🖼',
    'field-row': '☰',
    divider: '—',
    path: '✦',
};

const elementSummary = (el: DesignerElement): string => {
    switch (el.type) {
        case 'text':
            return el.content.kind === 'static'
                ? `"${el.content.value}"`
                : `{{${el.content.path}}}`;
        case 'image':
            return el.source.kind === 'url' ? 'URL image' : `{{${el.source.path}}}`;
        case 'field-row':
            return el.label;
        case 'rect':
            return el.fill.kind === 'solid' ? 'Solid' : 'Gradient';
        case 'divider':
            return `${el.w}px`;
        case 'path':
            return el.fill.kind === 'solid' ? 'Imported path' : 'Imported path (gradient)';
    }
};

interface LayerRowProps {
    element: DesignerElement;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
}

const LayerRow: React.FC<LayerRowProps> = ({
    element,
    isSelected,
    onSelect,
    onDuplicate,
    onDelete,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: element.id,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <li ref={setNodeRef} style={style}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 6px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? '#EFF0F5' : 'transparent',
                    border: isSelected ? '1px solid #C5C8D3' : '1px solid transparent',
                    marginBottom: '2px',
                }}
                onClick={() => onSelect(element.id)}
            >
                <button
                    type="button"
                    title="Drag to reorder"
                    {...attributes}
                    {...listeners}
                    style={{
                        width: '16px',
                        height: '16px',
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        color: '#A8ACBD',
                        cursor: 'grab',
                        fontSize: '13px',
                        lineHeight: 1,
                        flexShrink: 0,
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    ⋮⋮
                </button>
                <span
                    style={{
                        width: '18px',
                        textAlign: 'center',
                        fontSize: '13px',
                        color: '#52597A',
                        flexShrink: 0,
                    }}
                >
                    {ELEMENT_ICONS[element.type]}
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
                        {ELEMENT_LABELS[element.type]}
                    </div>
                    <div
                        style={{
                            fontSize: '10px',
                            color: '#8B91A7',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontFamily:
                                element.type === 'text' || element.type === 'image'
                                    ? "'JetBrains Mono', monospace"
                                    : 'inherit',
                        }}
                    >
                        {elementSummary(element)}
                    </div>
                </div>
                {isSelected && (
                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                        <IconButton
                            title="Duplicate"
                            onClick={e => {
                                e.stopPropagation();
                                onDuplicate(element.id);
                            }}
                        >
                            ⧉
                        </IconButton>
                        <IconButton
                            title="Delete"
                            onClick={e => {
                                e.stopPropagation();
                                onDelete(element.id);
                            }}
                        >
                            ✕
                        </IconButton>
                    </div>
                )}
            </div>
        </li>
    );
};

export interface LayersListProps {
    store: DesignerStoreApi;
}

export const LayersList: React.FC<LayersListProps> = ({ store }) => {
    const elements = useStore(store, s => s.template.elements);
    const selectedId = useStore(store, s => s.selectedElementId);
    const selectElement = useStore(store, s => s.selectElement);
    const reorderElements = useStore(store, s => s.reorderElements);
    const deleteElement = useStore(store, s => s.deleteElement);
    const duplicateElement = useStore(store, s => s.duplicateElement);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );

    const displayOrder = [...elements].reverse();
    const displayIds = displayOrder.map(e => e.id);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldDisplayIndex = displayIds.indexOf(active.id as string);
        const newDisplayIndex = displayIds.indexOf(over.id as string);
        if (oldDisplayIndex < 0 || newDisplayIndex < 0) return;
        const lastIdx = elements.length - 1;
        const fromIrIdx = lastIdx - oldDisplayIndex;
        const toIrIdx = lastIdx - newDisplayIndex;
        reorderElements(fromIrIdx, toIrIdx);
    };

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
            <ElementLibrary store={store} />
            <div
                style={{
                    padding: '10px 12px 6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.8px',
                    color: '#8B91A7',
                    textTransform: 'uppercase',
                }}
            >
                Layers
            </div>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '0 6px 6px' }}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={displayIds} strategy={verticalListSortingStrategy}>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {displayOrder.map(el => (
                                <LayerRow
                                    key={el.id}
                                    element={el}
                                    isSelected={el.id === selectedId}
                                    onSelect={selectElement}
                                    onDuplicate={duplicateElement}
                                    onDelete={deleteElement}
                                />
                            ))}
                        </ul>
                    </SortableContext>
                </DndContext>
                {elements.length === 0 && (
                    <div
                        style={{
                            padding: '12px',
                            fontSize: '11px',
                            color: '#8B91A7',
                            textAlign: 'center',
                        }}
                    >
                        No elements yet. Add one from the library above, or pick a starter template.
                    </div>
                )}
            </div>
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
