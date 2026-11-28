import React from 'react';

export type ToolbarSlot = 'start' | 'secondary' | 'primary' | 'end';

export type ToolbarSlots = Record<ToolbarSlot | 'content', React.ReactNode[]>;

const SLOTS: readonly ToolbarSlot[] = ['start', 'secondary', 'primary', 'end'];

const isToolbarSlot = (slot: unknown): slot is ToolbarSlot =>
    typeof slot === 'string' && (SLOTS as readonly string[]).includes(slot);

/**
 * Splits toolbar children by their `slot` prop, as ion-toolbar's shadow `<slot>`s did. Fragments
 * are flattened (they rendered no element, so their children were the host's children). Children
 * with an unknown `slot` are dropped: no shadow `<slot>` took them, so they never rendered.
 */
export const partitionToolbarChildren = (children: React.ReactNode): ToolbarSlots => {
    const slots: ToolbarSlots = { start: [], secondary: [], content: [], primary: [], end: [] };

    const visit = (nodes: React.ReactNode, keyPrefix: string): void => {
        React.Children.toArray(nodes).forEach(child => {
            if (!React.isValidElement<{ children?: React.ReactNode; slot?: unknown }>(child)) {
                slots.content.push(child);
                return;
            }
            if (child.type === React.Fragment) {
                visit(child.props.children, `${keyPrefix}${String(child.key)}/`);
                return;
            }
            const keyed = keyPrefix
                ? React.cloneElement(child, { key: `${keyPrefix}${String(child.key)}` })
                : child;
            const { slot } = child.props;
            if (slot === undefined || slot === null || slot === '') slots.content.push(keyed);
            else if (isToolbarSlot(slot)) slots[slot].push(keyed);
        });
    };
    visit(children, '');

    return slots;
};
