import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppReorder } from './AppReorder';
import { AppReorderGroup } from './AppReorderGroup';

/** AppReorderGroup / AppReorder (ion-reorder-group port): mouse and touch drags, nesting, scrolling, disabled. */
const move = <T,>(list: T[], from: number, to: number): T[] => {
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};

const Grip: React.FC = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
            d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);

const Row: React.FC<{ label: string; defaultIcon?: boolean; mode?: 'md' | 'ios' }> = ({
    label,
    defaultIcon,
    mode,
}) => (
    <div className="flex items-center gap-3 border-b border-grayscale-200 bg-white px-4 py-3 text-sm text-grayscale-900">
        <span className="flex-1">{label}</span>
        {defaultIcon ? (
            <AppReorder mode={mode} />
        ) : (
            <div className="shrink-0 rounded-[10px] bg-grayscale-100 p-1.5 text-grayscale-700">
                <AppReorder mode={mode}>
                    <Grip />
                </AppReorder>
            </div>
        )}
    </div>
);

const List: React.FC<{
    initial: string[];
    disabled?: boolean;
    defaultIcon?: boolean;
    mode?: 'md' | 'ios';
}> = ({ initial, disabled = false, defaultIcon, mode }) => {
    const [rows, setRows] = useState(initial);
    const [log, setLog] = useState('-');
    return (
        <div className="flex flex-col gap-2">
            <output className="font-mono text-xs">last: {log}</output>
            <AppReorderGroup
                mode={mode}
                disabled={disabled}
                onIonReorderEnd={e => {
                    const { from, to } = e.detail;
                    setLog(`${from} → ${to}`);
                    setRows(move(rows, from, to));
                    e.detail.complete();
                }}
            >
                {rows.map(row => (
                    <Row key={row} label={row} defaultIcon={defaultIcon} mode={mode} />
                ))}
            </AppReorderGroup>
        </div>
    );
};

const LETTERS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'];

const Nested: React.FC = () => {
    const [groups, setGroups] = useState([
        { name: 'Work', items: ['Plan', 'Build', 'Ship'] },
        { name: 'Home', items: ['Cook', 'Clean'] },
        { name: 'Play', items: ['Run', 'Read', 'Paint'] },
    ]);
    return (
        <AppReorderGroup
            disabled={false}
            onIonReorderEnd={e => {
                setGroups(move(groups, e.detail.from, e.detail.to));
                e.detail.complete();
            }}
        >
            {groups.map((group, gi) => (
                <div
                    key={group.name}
                    className="mb-3 flex items-start gap-2 rounded-xl bg-white p-3"
                >
                    <div className="flex-1">
                        <strong className="text-sm">{group.name}</strong>
                        <AppReorderGroup
                            disabled={false}
                            onIonReorderEnd={e => {
                                const items = move(group.items, e.detail.from, e.detail.to);
                                setGroups(groups.map((g, i) => (i === gi ? { ...g, items } : g)));
                                e.detail.complete();
                            }}
                        >
                            {group.items.map(item => (
                                <Row key={item} label={item} />
                            ))}
                        </AppReorderGroup>
                    </div>
                    <AppReorder>
                        <Grip />
                    </AppReorder>
                </div>
            ))}
        </AppReorderGroup>
    );
};

const meta: Meta<typeof AppReorderGroup> = {
    title: 'Widgets/AppReorder',
    component: AppReorderGroup,
};

export default meta;

type Story = StoryObj<typeof AppReorderGroup>;

export const Basic: Story = {
    render: () => (
        <div style={{ maxWidth: 360 }}>
            <List initial={LETTERS} />
        </div>
    ),
};

export const DefaultIcons: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: 24 }}>
            {(['md', 'ios'] as const).map(mode => (
                <div key={mode} style={{ width: 260 }}>
                    <strong>{mode}</strong>
                    <List initial={LETTERS.slice(0, 4)} defaultIcon mode={mode} />
                </div>
            ))}
        </div>
    ),
};

/** Each list only reorders its own rows; the right-hand handles move whole cards. */
export const NestedGroups: Story = { render: () => <Nested /> };

/** Drag to the top or bottom 60px of the scroll area to auto-scroll it. */
export const Scrolling: Story = {
    render: () => (
        <div style={{ maxWidth: 360, height: 300, overflowY: 'auto' }}>
            <List initial={Array.from({ length: 20 }, (_, i) => `Row ${i + 1}`)} />
        </div>
    ),
};

export const Disabled: Story = {
    render: () => (
        <div style={{ maxWidth: 360 }}>
            <List initial={LETTERS} disabled />
        </div>
    ),
};
