import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppSkeletonText, type AppSkeletonTextProps } from './AppSkeletonText';

/** Synthetic matrix of the AppSkeletonText shapes the app's loaders use. */
const CELLS: { label: string; props: AppSkeletonTextProps; dark?: boolean }[] = [
    { label: 'static (default)', props: {} },
    { label: 'animated', props: { animated: true } },
    {
        label: 'w 70% h 20px r 4px',
        props: { style: { width: '70%', height: '20px', borderRadius: '4px' } },
    },
    { label: 'circle 35px', props: { style: { width: 35, height: 35, borderRadius: 999 } } },
    { label: 'margin 0', props: { style: { width: '90%', height: '22px', margin: '0' } } },
    {
        label: 'className w-[85%] h-[14px] rounded-sm',
        props: { className: 'w-[85%] h-[14px] rounded-sm' },
    },
    {
        label: 'pill h-[45px] rounded-[25px]',
        props: { className: 'h-[45px] w-full rounded-[25px]' },
    },
    {
        label: '--background',
        props: { style: { '--background': 'rgba(255, 0, 0, 0.3)', height: '16px' } },
    },
    {
        label: '--background-rgb',
        props: { style: { '--background-rgb': '0, 0, 255', height: '16px' } },
    },
    { label: '--border-radius', props: { style: { '--border-radius': '8px', height: '16px' } } },
    { label: 'dark background', props: { style: { width: '80%', height: '14px' } }, dark: true },
];

const SkeletonMatrix: React.FC<{ animated?: boolean }> = ({ animated = true }) => (
    <div className="flex flex-wrap gap-3 p-4 bg-grayscale-100">
        {CELLS.map(({ label, props, dark }) => (
            <div
                key={label}
                className={`flex flex-col gap-2 rounded-xl p-3 w-[200px] ${
                    dark ? 'bg-grayscale-900 text-white' : 'bg-white text-grayscale-900'
                }`}
            >
                <div className="w-full min-h-[24px]">
                    <AppSkeletonText animated={props.animated ?? animated} {...props} />
                </div>
                <span className="text-[10px] font-mono">{label}</span>
            </div>
        ))}
    </div>
);

const meta: Meta<typeof SkeletonMatrix> = {
    title: 'Feedback/AppSkeletonText',
    component: SkeletonMatrix,
};

export default meta;

type Story = StoryObj<typeof SkeletonMatrix>;

export const Variants: Story = {};

/** Without the shimmer. */
export const Static: Story = { args: { animated: false } };
