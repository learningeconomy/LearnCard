import React, { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppButton } from '../controls/AppButton';
import { AppButtons } from '../controls/AppButtons';
import { AppDatetime, type AppDatetimeHandle, type AppDatetimeProps } from './AppDatetime';

/** AppDatetime (ion-datetime port) in the presentations and button setups learn-card-app uses. */
const MODES = ['md', 'ios'] as const;

const WithLog: React.FC<AppDatetimeProps> = props => {
    const [log, setLog] = useState('no change yet');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AppDatetime
                {...props}
                onIonChange={e => setLog(`ionChange ${String(e.detail.value)}`)}
                onIonCancel={() => setLog('ionCancel')}
            />
            <output style={{ fontFamily: 'monospace', fontSize: 12 }}>{log}</output>
        </div>
    );
};

const Row: React.FC<{ render: (mode: (typeof MODES)[number]) => React.ReactNode }> = ({
    render,
}) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, padding: 24, background: '#f4f5f8' }}>
        {MODES.map(mode => (
            <div key={mode} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <strong>{mode}</strong>
                {render(mode)}
            </div>
        ))}
    </div>
);

const SlotButtons: React.FC = () => {
    const ref = useRef<AppDatetimeHandle>(null);
    return (
        <WithLog
            mode="ios"
            presentation="date"
            value="2026-12-05"
            buttons={
                <AppButtons slot="buttons" mode="ios">
                    <AppButton color="primary" mode="ios" onClick={() => void ref.current?.reset()}>
                        Clear
                    </AppButton>
                    <AppButton
                        color="primary"
                        mode="ios"
                        onClick={() => void ref.current?.confirm()}
                    >
                        Done
                    </AppButton>
                </AppButtons>
            }
        />
    );
};

const meta: Meta<typeof AppDatetime> = {
    title: 'Controls/AppDatetime',
    component: AppDatetime,
};
export default meta;

type Story = StoryObj<typeof AppDatetime>;

export const DateOnly: Story = {
    render: () => (
        <Row render={mode => <WithLog mode={mode} presentation="date" value="2026-12-05" />} />
    ),
};

export const DateTime: Story = {
    render: () => (
        <Row
            render={mode => (
                <WithLog
                    mode={mode}
                    presentation="date-time"
                    value="2026-12-05T14:45"
                    color="indigo-500"
                />
            )}
        />
    ),
};

export const MinMax: Story = {
    render: () => (
        <Row
            render={mode => (
                <WithLog
                    mode={mode}
                    presentation="date"
                    value="2026-12-05"
                    min="2026-12-03"
                    max="2027-02-15"
                />
            )}
        />
    ),
};

export const DefaultButtons: Story = {
    render: () => (
        <Row
            render={mode => (
                <WithLog
                    mode={mode}
                    presentation="date"
                    value="2026-12-05"
                    showDefaultButtons
                    showClearButton
                />
            )}
        />
    ),
};

export const CustomButtons: Story = { render: () => <SlotButtons /> };

export const Disabled: Story = {
    render: () => (
        <Row
            render={mode => (
                <WithLog mode={mode} presentation="date-time" value="2026-12-05T09:30" disabled />
            )}
        />
    ),
};
