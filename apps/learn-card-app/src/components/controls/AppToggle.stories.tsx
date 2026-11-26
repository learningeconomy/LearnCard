import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppToggle } from './AppToggle';
// `ds-toggle` lives in the privacy page's lazily loaded stylesheet; load it so that row matches.
import '../../pages/privacy-settings/dataSharingCenter.scss';

const VARIANTS: { name: string; color?: string; className?: string }[] = [
    { name: 'emerald-700', color: 'emerald-700' },
    { name: 'indigo-700', color: 'indigo-700' },
    { name: 'indigo-500 (colorful)', color: 'indigo-500' },
    { name: 'blue-500 (formal)', color: 'blue-500' },
    { name: 'baltic-blue-500 (vetpass)', color: 'baltic-blue-500' },
    { name: 'emerald-500 + family-cms', color: 'emerald-500', className: 'family-cms-toggle' },
    { name: 'family-cms', className: 'family-cms-toggle' },
    { name: 'ds-toggle', className: 'ds-toggle' },
    { name: 'default' },
];

/**
 * Synthetic AppToggle states: off, on, disabled off, disabled on, for every color / class a call
 * site uses. The preview has no Ionic mode switcher, so each block pins `mode` (ios: every colored
 * call site; md: the unpinned T-J/K/L sites on desktop and Android).
 */
const ToggleStates: React.FC = () => {
    const [checked, setChecked] = useState(false);

    return (
        <div className="flex flex-col gap-3 bg-white p-6 font-poppins">
            {(['ios', 'md'] as const).flatMap(mode =>
                VARIANTS.map(variant => (
                    <div key={`${mode}-${variant.name}`} className="flex items-center gap-5">
                        <span className="w-[220px] font-mono text-xs">
                            {variant.name} {mode}
                        </span>
                        {[
                            { state: 'off', checked: false, disabled: false },
                            { state: 'on', checked: true, disabled: false },
                            { state: 'disabled off', checked: false, disabled: true },
                            { state: 'disabled on', checked: true, disabled: true },
                        ].map(cell => (
                            <AppToggle
                                key={cell.state}
                                mode={mode}
                                color={variant.color}
                                className={variant.className}
                                checked={cell.checked}
                                disabled={cell.disabled}
                                aria-label={`${variant.name} ${mode} ${cell.state}`}
                            />
                        ))}
                    </div>
                ))
            )}
            <div className="flex items-center gap-2 text-sm">
                <AppToggle
                    mode="ios"
                    color="emerald-700"
                    checked={checked}
                    onCheckedChange={setChecked}
                    aria-label="Controlled"
                />
                <span>Controlled (click, Space or drag): {String(checked)}</span>
            </div>
        </div>
    );
};

const meta: Meta<typeof ToggleStates> = {
    title: 'Controls/AppToggle',
    component: ToggleStates,
};

export default meta;

type Story = StoryObj<typeof ToggleStates>;

export const States: Story = {};
