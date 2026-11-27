import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppPicker, AppPickerColumn } from './AppPicker';
import { installDatetimeTestEnv } from './testEnv';

const ITEMS = Array.from({ length: 12 }, (_, i) => ({ text: `Item ${i + 1}`, value: i + 1 }));

let env: ReturnType<typeof installDatetimeTestEnv>;

beforeEach(() => {
    env = installDatetimeTestEnv();
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

const Harness: React.FC<{
    onChange: (v: unknown) => void;
    initial?: number;
    disabled?: boolean;
}> = ({ onChange, initial = 3, disabled }) => {
    const [value, setValue] = useState<number | string | undefined>(initial);
    return (
        <AppPicker mode="md">
            <AppPickerColumn
                mode="md"
                aria-label="Select an item"
                items={ITEMS.map(item => (item.value === 6 ? { ...item, disabled: true } : item))}
                value={value}
                disabled={disabled}
                onIonChange={ev => {
                    setValue(ev.detail.value);
                    onChange(ev.detail.value);
                }}
            />
        </AppPicker>
    );
};

describe('AppPickerColumn', () => {
    it('renders an ion-picker-column-like slider with the active option as its value text', () => {
        render(<Harness onChange={vi.fn()} />);
        env.showAll();
        const slider = screen.getByRole('slider', { name: 'Select an item' });

        expect(slider.getAttribute('aria-valuetext')).toBe('Item 3');
        expect(slider.getAttribute('tabindex')).toBe('0');
        expect(document.querySelector('.option-active')?.textContent).toBe('Item 3');
        expect(document.querySelectorAll('.picker-item-empty')).toHaveLength(6);
    });

    it('moves with the arrow, page and Home / End keys, skipping disabled options', () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);
        env.showAll();
        const slider = screen.getByRole('slider', { name: 'Select an item' });

        fireEvent.keyDown(slider, { key: 'ArrowDown' });
        expect(onChange).toHaveBeenLastCalledWith(4);
        fireEvent.keyDown(slider, { key: 'ArrowDown' });
        fireEvent.keyDown(slider, { key: 'ArrowDown' });
        expect(onChange).toHaveBeenLastCalledWith(7);
        fireEvent.keyDown(slider, { key: 'ArrowUp' });
        expect(onChange).toHaveBeenLastCalledWith(5);
        fireEvent.keyDown(slider, { key: 'PageDown' });
        expect(onChange).toHaveBeenLastCalledWith(10);
        fireEvent.keyDown(slider, { key: 'Home' });
        expect(onChange).toHaveBeenLastCalledWith(1);
        fireEvent.keyDown(slider, { key: 'End' });
        expect(onChange).toHaveBeenLastCalledWith(12);
        expect(slider.getAttribute('aria-valuetext')).toBe('Item 12');
    });

    it('stays on the last / first option at the ends of the column', () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} initial={12} />);
        env.showAll();
        const slider = screen.getByRole('slider', { name: 'Select an item' });

        fireEvent.keyDown(slider, { key: 'ArrowDown' });
        fireEvent.keyDown(slider, { key: 'PageDown' });
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.keyDown(slider, { key: 'Home' });
        fireEvent.keyDown(slider, { key: 'ArrowUp' });
        fireEvent.keyDown(slider, { key: 'PageUp' });
        expect(onChange.mock.calls).toEqual([[1]]);
        expect(slider.getAttribute('aria-valuetext')).toBe('Item 1');
    });

    it('selects an option on click', () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);
        env.showAll();

        fireEvent.click(screen.getByText('Item 8'));

        expect(onChange).toHaveBeenCalledWith(8);
        expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('Item 8');
    });

    it('ignores input when disabled', () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} disabled />);
        env.showAll();
        const slider = screen.getByRole('slider', { name: 'Select an item' });

        fireEvent.keyDown(slider, { key: 'ArrowDown' });
        fireEvent.click(screen.getByText('Item 8'));

        expect(onChange).not.toHaveBeenCalled();
        expect(slider.hasAttribute('tabindex')).toBe(false);
    });
});
