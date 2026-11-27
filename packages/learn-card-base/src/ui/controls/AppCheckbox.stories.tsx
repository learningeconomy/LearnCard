import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppCheckbox } from './AppCheckbox';

/**
 * Synthetic AppCheckbox states. The preview has no Ionic mode switcher, so each row pins `mode`
 * (ConsentFlow pins ios; MultiTextInput and BoostCMS follow the document mode).
 */
const CheckboxStates: React.FC = () => {
    const [checked, setChecked] = useState(false);

    return (
        <div className="flex flex-col gap-4 bg-white p-6 font-poppins">
            {(['ios', 'md'] as const).map(mode => (
                <div key={mode} className="flex items-center gap-6">
                    <span className="w-8 font-mono text-xs">{mode}</span>
                    <AppCheckbox mode={mode} color="emerald-700" aria-label={`${mode} unchecked`} />
                    <AppCheckbox
                        mode={mode}
                        color="emerald-700"
                        checked
                        aria-label={`${mode} checked`}
                    />
                    <AppCheckbox
                        mode={mode}
                        color="emerald-700"
                        disabled
                        aria-label={`${mode} disabled`}
                    />
                    <AppCheckbox
                        mode={mode}
                        color="emerald-700"
                        checked
                        disabled
                        aria-label={`${mode} disabled checked`}
                    />
                    <AppCheckbox mode={mode} checked aria-label={`${mode} default color`} />
                </div>
            ))}
            <div className="flex items-center gap-2 text-sm">
                <AppCheckbox
                    color="emerald-700"
                    checked={checked}
                    onCheckedChange={setChecked}
                    aria-label="Controlled"
                />
                <span>Controlled: {String(checked)}</span>
            </div>
        </div>
    );
};

const meta: Meta<typeof CheckboxStates> = {
    title: 'Controls/AppCheckbox',
    component: CheckboxStates,
};

export default meta;

type Story = StoryObj<typeof CheckboxStates>;

export const States: Story = {};
