import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppTextarea } from './AppTextarea';

const LONG =
    'Led a six-week community garden project with twelve volunteers, coordinated weekly schedules and tracked the harvest donated to the local food bank.';

const CELLS: {
    name: string;
    initial: string;
    disabled?: boolean;
    readonly?: boolean;
    autoGrow?: boolean;
    counter?: boolean;
    maxlength?: number;
    rows?: number;
}[] = [
    { name: 'empty', initial: '' },
    { name: 'filled', initial: 'Filled value' },
    { name: 'disabled', initial: 'Disabled value', disabled: true },
    { name: 'readonly', initial: 'Readonly value', readonly: true },
    { name: 'counter', initial: 'Twelve chars', counter: true, maxlength: 20 },
    { name: 'autoGrow rows 1', initial: LONG, autoGrow: true, rows: 1 },
    { name: 'rows 2, overflowing', initial: `${LONG}\n\n${LONG}`, rows: 2 },
];

const Cell: React.FC<{ cell: (typeof CELLS)[number]; mode: 'ios' | 'md' }> = ({ cell, mode }) => {
    const [value, setValue] = useState(cell.initial);
    return (
        <div className="flex flex-col gap-1">
            <span className="font-mono text-xs">
                {cell.name} {mode}
            </span>
            <AppTextarea
                mode={mode}
                value={value}
                onValueInput={setValue}
                placeholder="Placeholder"
                disabled={cell.disabled}
                readonly={cell.readonly}
                autoGrow={cell.autoGrow}
                counter={cell.counter}
                maxlength={cell.maxlength}
                rows={cell.rows}
                aria-label={`${cell.name} ${mode}`}
                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] px-[16px]"
            />
        </div>
    );
};

/**
 * Synthetic AppTextarea states in both modes (the preview has no Ionic mode switcher, so each
 * column pins `mode`), plus the X-C dark title with its `end` counter.
 */
const TextareaStates: React.FC = () => {
    const [title, setTitle] = useState('');
    return (
        <div className="flex flex-col gap-6 bg-white p-6 font-poppins">
            <div className="grid grid-cols-2 gap-4">
                {(['ios', 'md'] as const).map(mode => (
                    <div key={mode} className="flex flex-col gap-3">
                        {CELLS.map(cell => (
                            <Cell key={cell.name} cell={cell} mode={mode} />
                        ))}
                    </div>
                ))}
            </div>
            <div className="bg-grayscale-800 p-4 rounded-[20px]">
                <AppTextarea
                    autocapitalize="on"
                    value={title}
                    onValueInput={setTitle}
                    placeholder="Boost title"
                    className="relative bg-grayscale-900 text-grayscale-400 rounded-[15px] px-[16px] py-[4px] font-medium tracking-widest text-base"
                    rows={3}
                    maxlength={100}
                    end={
                        <p className="absolute right-[10px] bottom-[10px] text-xs">
                            {title.length}/100
                        </p>
                    }
                />
            </div>
        </div>
    );
};

const meta: Meta<typeof TextareaStates> = {
    title: 'Controls/AppTextarea',
    component: TextareaStates,
};

export default meta;

type Story = StoryObj<typeof TextareaStates>;

export const States: Story = {};
