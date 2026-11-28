import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppProgressBar, type AppProgressBarProps } from './AppProgressBar';

/**
 * Synthetic matrix of AppProgressBar states. The preview has no Ionic mode switcher (the document mode
 * comes from the browser UA), so each row pins `mode` to show md and ios side by side.
 */
const CELLS: { label: string; props: AppProgressBarProps; dark?: boolean }[] = [
    { label: 'value 0 (default)', props: {} },
    { label: 'value 0.25', props: { value: 0.25 } },
    { label: 'value 1', props: { value: 1 } },
    { label: 'buffer 0.6, value 0.3', props: { value: 0.3, buffer: 0.6 } },
    { label: 'reversed 0.3', props: { value: 0.3, reversed: true } },
    { label: 'indeterminate', props: { type: 'indeterminate' } },
    { label: 'grayscale-800 0.42', props: { color: 'grayscale-800', value: 0.42 } },
    { label: 'danger buffer', props: { color: 'danger', value: 0.3, buffer: 0.6 } },
    { label: 'light', props: { color: 'light', value: 0.6 }, dark: true },
    {
        label: '--progress-background / --background',
        props: {
            value: 0.5,
            style: { '--progress-background': '#16a34a', '--background': '#fde68a' },
        },
    },
    { label: 'h-2 rounded-full', props: { value: 0.7, className: 'h-2 rounded-full' } },
];

const ProgressMatrix: React.FC = () => (
    <div className="flex flex-col gap-4 p-4 bg-grayscale-100">
        {(['md', 'ios'] as const).map(mode => (
            <div key={mode} className="flex flex-wrap gap-3">
                {CELLS.map(({ label, props, dark }) => (
                    <div
                        key={label}
                        className={`flex flex-col gap-2 rounded-xl p-3 w-[200px] ${
                            dark ? 'bg-grayscale-900 text-white' : 'bg-white text-grayscale-900'
                        }`}
                    >
                        <AppProgressBar mode={mode} {...props} />
                        <span className="text-[10px] font-mono">
                            {mode} · {label}
                        </span>
                    </div>
                ))}
            </div>
        ))}
    </div>
);

const meta: Meta<typeof ProgressMatrix> = {
    title: 'Feedback/AppProgressBar',
    component: ProgressMatrix,
};

export default meta;

type Story = StoryObj<typeof ProgressMatrix>;

export const Variants: Story = {};
