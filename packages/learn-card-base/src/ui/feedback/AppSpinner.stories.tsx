import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppSpinner, type AppSpinnerName, type AppSpinnerProps } from './AppSpinner';

/**
 * Synthetic matrix of AppSpinner names, colors and sizes. The preview has no Ionic mode switcher (the
 * document mode comes from the browser UA), so each row pins `mode` to show md and ios side by side;
 * this only changes the default name (`circular` in md, `lines` in ios).
 */
const NAMES: (AppSpinnerName | undefined)[] = [
    undefined,
    'crescent',
    'lines',
    'dots',
    'circular',
    'lines-small',
    'lines-sharp',
    'lines-sharp-small',
    'bubbles',
    'circles',
];

const COLORS: { label: string; props: AppSpinnerProps; dark?: boolean }[] = [
    { label: 'dark', props: { name: 'crescent', color: 'dark' } },
    { label: 'grayscale-900', props: { name: 'crescent', color: 'grayscale-900' } },
    { label: 'indigo-600', props: { name: 'crescent', color: 'indigo-600' } },
    { label: 'light', props: { name: 'crescent', color: 'light' }, dark: true },
    { label: 'grayscale-100', props: { name: 'crescent', color: 'grayscale-100' }, dark: true },
    { label: 'text-cyan-500', props: { name: 'crescent', className: 'text-cyan-500' } },
];

const SIZES: { label: string; props: AppSpinnerProps }[] = [
    { label: 'h-3 w-3', props: { name: 'crescent', className: 'h-3 w-3' } },
    { label: 'w-4 h-4', props: { name: 'crescent', className: 'w-4 h-4' } },
    { label: '28px (default)', props: { name: 'crescent' } },
    { label: 'w-12 h-12', props: { name: 'crescent', className: 'w-12 h-12' } },
    { label: 'scale-[1.75]', props: { name: 'crescent', className: 'scale-[1.75]' } },
];

const Cell: React.FC<{ label: string; dark?: boolean; children: React.ReactNode }> = ({
    label,
    dark,
    children,
}) => (
    <div
        className={`flex flex-col items-center gap-2 rounded-xl p-3 min-w-[90px] ${
            dark ? 'bg-grayscale-900 text-white' : 'bg-white text-grayscale-900'
        }`}
    >
        <div className="flex items-center justify-center min-h-[52px]">{children}</div>
        <span className="font-mono text-[10px]">{label}</span>
    </div>
);

const SpinnerMatrix: React.FC<{ paused?: boolean }> = ({ paused }) => (
    <div className="flex flex-col gap-6 p-6 bg-grayscale-100">
        {(['md', 'ios'] as const).map(mode => (
            <div key={mode} className="flex flex-col gap-2">
                <span className="font-mono text-xs">{mode}</span>
                <div className="flex flex-wrap gap-2">
                    {NAMES.map(name => (
                        <Cell key={name ?? 'default'} label={name ?? '(default)'}>
                            <AppSpinner name={name} mode={mode} paused={paused} />
                        </Cell>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2">
                    {COLORS.map(({ label, props, dark }) => (
                        <Cell key={label} label={label} dark={dark}>
                            <AppSpinner {...props} mode={mode} paused={paused} />
                        </Cell>
                    ))}
                    {SIZES.map(({ label, props }) => (
                        <Cell key={label} label={label}>
                            <AppSpinner {...props} mode={mode} paused={paused} />
                        </Cell>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

const meta: Meta<typeof SpinnerMatrix> = {
    title: 'Feedback/AppSpinner',
    component: SpinnerMatrix,
};

export default meta;

type Story = StoryObj<typeof SpinnerMatrix>;

export const Variants: Story = {};

/** The first frame, as reduced-motion users see it. */
export const Paused: Story = { args: { paused: true } };
