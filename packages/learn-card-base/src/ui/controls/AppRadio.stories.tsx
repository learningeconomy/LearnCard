import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppRadio, AppRadioGroup } from './AppRadio';

const OPTIONS = [
    { label: 'Production', type: 'production' },
    { label: 'Staging', type: 'staging' },
    { label: 'Custom', type: 'custom' },
];

/**
 * The AdminTools radio pattern: an ios AppRadio with `color="white"` (checkmark in the wrapper's
 * text color) inside a 32px circle, and a plain md AppRadio group for comparison. Arrow keys move
 * focus and select; Space selects; label text does not select.
 */
const RadioPreview: React.FC = () => {
    const [selected, setSelected] = useState('staging');
    const [plain, setPlain] = useState('production');

    return (
        <div className="flex flex-col gap-6 bg-white p-6 font-poppins">
            <AppRadioGroup value={selected} onValueChange={setSelected} className="w-full">
                {OPTIONS.map(opt => {
                    const isSelected = selected === opt.type;
                    return (
                        <div
                            key={opt.type}
                            className="flex items-center justify-between gap-3 py-3"
                        >
                            <span className="text-lg text-grayscale-900">{opt.label}</span>
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 ${
                                    isSelected
                                        ? 'bg-emerald-700 text-white'
                                        : 'bg-grayscale-100 text-transparent'
                                }`}
                            >
                                <AppRadio
                                    value={opt.type}
                                    className="w-full h-full ml-2"
                                    color="white"
                                    mode="ios"
                                />
                            </div>
                        </div>
                    );
                })}
            </AppRadioGroup>

            <AppRadioGroup value={plain} onValueChange={setPlain} className="flex gap-6">
                {OPTIONS.map(opt => (
                    <div key={opt.type} className="flex items-center gap-2">
                        <AppRadio value={opt.type} mode="md" />
                        <span>{opt.label}</span>
                    </div>
                ))}
            </AppRadioGroup>
        </div>
    );
};

const meta: Meta<typeof RadioPreview> = {
    title: 'Controls/AppRadio',
    component: RadioPreview,
};

export default meta;

type Story = StoryObj<typeof RadioPreview>;

export const AdminToolsPattern: Story = {};
