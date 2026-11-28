import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppPicker, AppPickerColumn } from './AppPicker';

/** AppPicker / AppPickerColumn (ion-picker port): scroll, click, arrow / Page / Home / End keys, typed digits. */
const HOURS = Array.from({ length: 12 }, (_, i) => ({ text: String(i + 1), value: i + 1 }));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({
    text: String(i).padStart(2, '0'),
    value: i,
}));
const PERIODS = [
    { text: 'AM', value: 'am' },
    { text: 'PM', value: 'pm' },
];

const Wheels: React.FC<{ mode: 'md' | 'ios' }> = ({ mode }) => {
    const [hour, setHour] = useState<string | number | undefined>(2);
    const [minute, setMinute] = useState<string | number | undefined>(45);
    const [period, setPeriod] = useState<string | number | undefined>('pm');
    return (
        <div
            className="app-datetime-scope"
            style={{ width: 250, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
            <strong>{mode}</strong>
            <AppPicker mode={mode}>
                <AppPickerColumn
                    mode={mode}
                    aria-label="Select an hour"
                    items={HOURS}
                    value={hour}
                    numericInput
                    onIonChange={e => setHour(e.detail.value)}
                />
                <AppPickerColumn
                    mode={mode}
                    aria-label="Select a minute"
                    items={MINUTES}
                    value={minute}
                    numericInput
                    onIonChange={e => setMinute(e.detail.value)}
                />
                <AppPickerColumn
                    mode={mode}
                    aria-label="Select a day period"
                    items={PERIODS}
                    value={period}
                    onIonChange={e => setPeriod(e.detail.value)}
                />
            </AppPicker>
            <output style={{ fontFamily: 'monospace', fontSize: 12 }}>
                {String(hour)}:{String(minute).padStart(2, '0')} {String(period)}
            </output>
        </div>
    );
};

const meta: Meta<typeof AppPicker> = {
    title: 'Controls/AppPicker',
    component: AppPicker,
};
export default meta;

type Story = StoryObj<typeof AppPicker>;

export const Time: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: 32, padding: 24 }}>
            <Wheels mode="md" />
            <Wheels mode="ios" />
        </div>
    ),
};
