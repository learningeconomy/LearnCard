import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppPopover } from './AppPopover';

/** AppPopover from its trigger id and from a click event, in both modes and alignments. */
const MODES = ['md', 'ios'] as const;

const Menu: React.FC<{ label: string }> = ({ label }) => (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <strong>{label}</strong>
        <button type="button">Alphabetical</button>
        <button type="button">Newest first</button>
    </div>
);

const Triggers: React.FC = () => {
    const [log, setLog] = useState('closed');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
            <output style={{ fontFamily: 'monospace', fontSize: 12 }}>{log}</output>
            {MODES.map(mode => (
                <div key={mode} style={{ display: 'flex', gap: 16 }}>
                    <button type="button" id={`story-pop-${mode}`}>
                        Sort ({mode}, trigger)
                    </button>
                    <AppPopover
                        trigger={`story-pop-${mode}`}
                        mode={mode}
                        dismissOnSelect
                        onDidDismiss={e =>
                            setLog(`${mode} dismissed role=${e.detail.role ?? 'none'}`)
                        }
                    >
                        <Menu label={`Sort (${mode})`} />
                    </AppPopover>
                </div>
            ))}
        </div>
    );
};

const FromEvent: React.FC = () => {
    const [state, setState] = useState<{ open: boolean; event?: Event }>({ open: false });
    return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 24 }}>
            <button type="button" onClick={e => setState({ open: true, event: e.nativeEvent })}>
                Share (event, bottom / end)
            </button>
            <AppPopover
                isOpen={state.open}
                event={state.event}
                reference="event"
                side="bottom"
                alignment="end"
                style={{ '--width': '304px' } as React.CSSProperties}
                onDidDismiss={() => setState({ open: false })}
            >
                <Menu label="Sharing" />
            </AppPopover>
        </div>
    );
};

const meta: Meta<typeof AppPopover> = {
    title: 'Overlays/AppPopover',
    component: AppPopover,
};

export default meta;

type Story = StoryObj<typeof AppPopover>;

export const Trigger: Story = { render: () => <Triggers /> };

export const Event: Story = { render: () => <FromEvent /> };
