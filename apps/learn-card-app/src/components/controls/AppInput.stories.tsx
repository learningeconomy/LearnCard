import React, { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppInput, type AppInputHandle, type AppInputType } from './AppInput';

const CELLS: {
    name: string;
    initial: string;
    type?: AppInputType;
    disabled?: boolean;
    readonly?: boolean;
    clearInput?: boolean;
    counter?: boolean;
    maxlength?: number;
    helperText?: string;
    errorText?: string;
    invalid?: boolean;
    label?: string;
    labelPlacement?: 'start' | 'stacked';
}[] = [
    { name: 'empty', initial: '' },
    { name: 'filled', initial: 'Filled value' },
    { name: 'disabled', initial: 'Disabled value', disabled: true },
    { name: 'readonly', initial: 'Readonly value', readonly: true },
    { name: 'clearInput', initial: 'Clear me', clearInput: true },
    { name: 'email', initial: 'ada@example.com', type: 'email' },
    { name: 'password', initial: 'secret', type: 'password' },
    { name: 'number', initial: '12', type: 'number' },
    { name: 'counter', initial: 'Twelve chars', counter: true, maxlength: 20 },
    { name: 'helper', initial: '', helperText: 'Helper text' },
    { name: 'error', initial: 'Bad', errorText: 'Error text', invalid: true },
    { name: 'label start', initial: '', label: 'Name*' },
    { name: 'label stacked', initial: 'Ada', label: 'Stacked label', labelPlacement: 'stacked' },
];

const Cell: React.FC<{ cell: (typeof CELLS)[number]; mode: 'ios' | 'md' }> = ({ cell, mode }) => {
    const [value, setValue] = useState(cell.initial);
    return (
        <div className="flex flex-col gap-1">
            <span className="font-mono text-xs">
                {cell.name} {mode}
            </span>
            <AppInput
                mode={mode}
                value={value}
                onValueInput={setValue}
                placeholder="Placeholder"
                type={cell.type}
                disabled={cell.disabled}
                readonly={cell.readonly}
                clearInput={cell.clearInput}
                counter={cell.counter}
                maxlength={cell.maxlength}
                helperText={cell.helperText}
                errorText={cell.errorText}
                label={cell.label}
                labelPlacement={cell.labelPlacement}
                aria-label={cell.label ? undefined : `${cell.name} ${mode}`}
                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding ${
                    cell.invalid ? 'ion-touched ion-invalid' : ''
                }`}
            />
        </div>
    );
};

/**
 * Synthetic AppInput states in both modes (the preview has no Ionic mode switcher, so each
 * column pins `mode`), plus a debounced search with a `ref.setFocus()` clear button.
 */
const InputStates: React.FC = () => {
    const [search, setSearch] = useState('');
    const inputRef = useRef<AppInputHandle>(null);
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
            <div className="flex flex-col gap-2">
                <AppInput
                    ref={inputRef}
                    value={search}
                    onValueInput={setSearch}
                    debounce={500}
                    placeholder="Debounced search (500 ms)"
                    className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium text-base"
                />
                <span className="font-mono text-xs">{JSON.stringify(search)}</span>
                <button
                    type="button"
                    className="self-start rounded-full bg-grayscale-900 text-white px-4 py-1 text-sm"
                    onClick={() => {
                        setSearch('');
                        inputRef.current?.setFocus();
                    }}
                >
                    Clear and focus
                </button>
            </div>
        </div>
    );
};

const meta: Meta<typeof InputStates> = {
    title: 'Controls/AppInput',
    component: InputStates,
};

export default meta;

type Story = StoryObj<typeof InputStates>;

export const States: Story = {};
