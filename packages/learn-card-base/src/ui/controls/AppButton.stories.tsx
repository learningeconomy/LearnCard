import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppButton, type AppButtonProps } from './AppButton';

/**
 * Synthetic matrix of the AppButton variants the app uses. The preview has no Ionic mode
 * switcher (the document mode comes from the browser UA), so each row pins `mode` to show the
 * md (desktop web / Android) and ios looks side by side.
 */
const VARIANTS: { name: string; props: AppButtonProps }[] = [
    { name: 'Default', props: {} },
    { name: 'Light', props: { color: 'light' } },
    { name: 'Light outline', props: { color: 'light', fill: 'outline' } },
    { name: 'Medium outline', props: { color: 'medium', fill: 'outline' } },
];

const ButtonMatrix: React.FC<{ disabled?: boolean }> = ({ disabled }) => (
    <div className="flex flex-col gap-4 p-6" style={{ backgroundColor: '#047857' }}>
        {(['md', 'ios'] as const).map(mode => (
            <div key={mode} className="flex flex-col gap-2">
                <span className="font-mono text-xs text-white">{mode}</span>
                <div className="flex flex-wrap items-start gap-2">
                    {VARIANTS.map(({ name, props }) => (
                        <AppButton
                            key={name}
                            color={props.color}
                            fill={props.fill}
                            mode={mode}
                            disabled={disabled}
                        >
                            {name}
                        </AppButton>
                    ))}
                </div>
                <div className="w-[260px]">
                    <AppButton expand="block" color="light" mode={mode} disabled={disabled}>
                        Block light
                    </AppButton>
                </div>
            </div>
        ))}
    </div>
);

const meta: Meta<typeof ButtonMatrix> = {
    title: 'Controls/AppButton',
    component: ButtonMatrix,
};

export default meta;

type Story = StoryObj<typeof ButtonMatrix>;

export const Variants: Story = {};

export const Disabled: Story = { args: { disabled: true } };
