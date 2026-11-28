import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppFab, AppFabButton } from './AppFab';

/** Synthetic AppFab / AppFabButton matrix: colors, sizes, disabled, and both modes. */
const Plus: React.FC = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const MODES = ['md', 'ios'] as const;

const Matrix: React.FC = () => {
    const [clicks, setClicks] = useState(0);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>clicks={clicks}</span>
            {MODES.map(mode => (
                <div key={mode} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, width: 32 }}>{mode}</span>
                    <AppFabButton
                        mode={mode}
                        aria-label={`Add (${mode}, primary)`}
                        onClick={() => setClicks(c => c + 1)}
                    >
                        <Plus />
                    </AppFabButton>
                    <AppFabButton
                        mode={mode}
                        color="light"
                        aria-label={`Add (${mode}, light)`}
                        onClick={() => setClicks(c => c + 1)}
                    >
                        <Plus />
                    </AppFabButton>
                    <AppFabButton
                        mode={mode}
                        color="indigo-500"
                        aria-label={`Add (${mode}, indigo)`}
                        onClick={() => setClicks(c => c + 1)}
                    >
                        <Plus />
                    </AppFabButton>
                    <AppFabButton
                        mode={mode}
                        size="small"
                        aria-label={`Add (${mode}, small)`}
                        onClick={() => setClicks(c => c + 1)}
                    >
                        <Plus />
                    </AppFabButton>
                    <AppFabButton mode={mode} disabled aria-label={`Add (${mode}, disabled)`}>
                        <Plus />
                    </AppFabButton>
                </div>
            ))}
        </div>
    );
};

const Positions: React.FC = () => (
    <div style={{ position: 'relative', height: 240, border: '1px dashed #9ca3af', margin: 24 }}>
        <AppFab vertical="top" horizontal="start">
            <AppFabButton size="small" aria-label="Top start">
                <Plus />
            </AppFabButton>
        </AppFab>
        <AppFab vertical="center" horizontal="center">
            <AppFabButton color="light" aria-label="Center">
                <Plus />
            </AppFabButton>
        </AppFab>
        <AppFab vertical="bottom" horizontal="end">
            <AppFabButton color="indigo-500" aria-label="Bottom end">
                <Plus />
            </AppFabButton>
        </AppFab>
    </div>
);

const meta: Meta<typeof AppFabButton> = {
    title: 'Widgets/AppFab',
    component: AppFabButton,
};

export default meta;

type Story = StoryObj<typeof AppFabButton>;

export const Buttons: Story = { render: () => <Matrix /> };

export const Placement: Story = { render: () => <Positions /> };
