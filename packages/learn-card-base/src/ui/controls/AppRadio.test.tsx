import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppRadio, AppRadioGroup } from './AppRadio';

afterEach(cleanup);

const OPTIONS = ['production', 'staging', 'custom'];

/** The AdminToolsStorageOption / AdminToolsNetwork shape: label text, radio, and an input inside the group. */
const Group: React.FC<{
    value?: string;
    onValueChange?: (value: string) => void;
}> = ({ value, onValueChange }) => (
    <AppRadioGroup value={value} onValueChange={onValueChange} className="w-full">
        {OPTIONS.map(option => (
            <fieldset key={option}>
                <label>{`${option} label`}</label>
                <AppRadio value={option} color="white" mode="ios" className="w-full h-full ml-2" />
            </fieldset>
        ))}
        <input aria-label="endpoint" />
    </AppRadioGroup>
);

const checkedStates = (): string[] =>
    screen.getAllByRole('radio').map(radio => radio.getAttribute('aria-checked') ?? '');
const tabIndexes = (): number[] => screen.getAllByRole('radio').map(radio => radio.tabIndex);

describe('AppRadioGroup / AppRadio', () => {
    it('renders role="radiogroup" and role="radio" with aria-checked from the value', () => {
        render(<Group value="staging" />);

        expect(screen.getByRole('radiogroup').className).toBe('app-radio-group w-full');
        expect(checkedStates()).toEqual(['false', 'true', 'false']);
        expect(screen.getAllByRole('radio')[1].className).toBe(
            'app-radio ios app-radio-checked app-radio-current-color w-full h-full ml-2'
        );
    });

    it('roves the tab stop: the checked radio, else the first one', () => {
        const { rerender } = render(<Group value="custom" />);
        expect(tabIndexes()).toEqual([-1, -1, 0]);

        rerender(<Group value="none-of-them" />);
        expect(tabIndexes()).toEqual([0, -1, -1]);
    });

    it('selects on a radio click and emits the value, only when it changes', () => {
        const onValueChange = vi.fn();
        render(<Group value="production" onValueChange={onValueChange} />);

        fireEvent.click(screen.getAllByRole('radio')[2]);
        expect(onValueChange).toHaveBeenCalledWith('custom');
        expect(checkedStates()).toEqual(['false', 'false', 'true']);
        expect(tabIndexes()).toEqual([-1, -1, 0]);

        fireEvent.click(screen.getAllByRole('radio')[2]);
        expect(onValueChange).toHaveBeenCalledTimes(1);
    });

    it('does not select on label text clicks', () => {
        const onValueChange = vi.fn();
        render(<Group value="production" onValueChange={onValueChange} />);

        fireEvent.click(screen.getByText('custom label'));

        expect(onValueChange).not.toHaveBeenCalled();
        expect(checkedStates()).toEqual(['true', 'false', 'false']);
    });

    it('moves focus and selects with arrow keys, wrapping at both ends', () => {
        const onValueChange = vi.fn();
        render(<Group value="production" onValueChange={onValueChange} />);
        const radios = screen.getAllByRole('radio');

        radios[0].focus();
        fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
        expect(document.activeElement).toBe(radios[1]);
        expect(checkedStates()).toEqual(['false', 'true', 'false']);

        fireEvent.keyDown(radios[1], { key: 'ArrowRight' });
        fireEvent.keyDown(radios[2], { key: 'ArrowDown' });
        expect(document.activeElement).toBe(radios[0]);

        fireEvent.keyDown(radios[0], { key: 'ArrowUp' });
        expect(document.activeElement).toBe(radios[2]);

        fireEvent.keyDown(radios[2], { key: 'ArrowLeft' });
        expect(document.activeElement).toBe(radios[1]);

        expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([
            'staging',
            'custom',
            'production',
            'custom',
            'staging',
        ]);
    });

    it('emits on arrow keys even when the target radio is already selected, like ion-radio-group', () => {
        const onValueChange = vi.fn();
        render(<Group value="production" onValueChange={onValueChange} />);
        const radios = screen.getAllByRole('radio');

        // Focus "staging" without selecting it (e.g. a pointerdown that never became a click).
        radios[1].focus();
        fireEvent.keyDown(radios[1], { key: 'ArrowUp' });

        expect(onValueChange).toHaveBeenCalledWith('production');
    });

    it('selects the focused radio on Space', () => {
        const onValueChange = vi.fn();
        render(<Group value="production" onValueChange={onValueChange} />);
        const radios = screen.getAllByRole('radio');

        expect(fireEvent.keyDown(radios[2], { key: ' ' })).toBe(false);
        expect(onValueChange).toHaveBeenCalledWith('custom');

        fireEvent.keyDown(radios[2], { key: ' ' });
        expect(onValueChange).toHaveBeenCalledTimes(1);
    });

    it('ignores keys pressed in non-radio content of the group', () => {
        const onValueChange = vi.fn();
        render(<Group value="production" onValueChange={onValueChange} />);
        const input = screen.getByRole('textbox', { name: 'endpoint' });

        expect(fireEvent.keyDown(input, { key: 'ArrowDown' })).toBe(true);
        expect(fireEvent.keyDown(input, { key: ' ' })).toBe(true);
        expect(onValueChange).not.toHaveBeenCalled();
    });

    it('keeps a user selection the parent ignores until the parent re-renders (Ionic React)', () => {
        let forceParentRender = (): void => undefined;
        const Parent: React.FC = () => {
            const [, setTick] = useState(0);
            forceParentRender = () => setTick(tick => tick + 1);
            return <Group value="production" />;
        };
        render(<Parent />);

        fireEvent.click(screen.getAllByRole('radio')[1]);
        expect(checkedStates()).toEqual(['false', 'true', 'false']);

        act(() => forceParentRender());
        expect(checkedStates()).toEqual(['true', 'false', 'false']);
    });

    it('works as a controlled group, as at the AdminTools call sites', () => {
        const Controlled: React.FC = () => {
            const [value, setValue] = useState('staging');
            return (
                <>
                    <Group value={value} onValueChange={setValue} />
                    <output>{value}</output>
                </>
            );
        };
        render(<Controlled />);

        fireEvent.click(screen.getAllByRole('radio')[0]);

        expect(screen.getByRole('status').textContent).toBe('production');
        expect(checkedStates()).toEqual(['true', 'false', 'false']);
    });

    it("appends ion-radio-group's hidden form input as the last child, so rows keep their :last-child state", () => {
        render(<Group value="staging" />);
        const group = screen.getByRole('radiogroup');
        const hidden = group.lastElementChild as HTMLInputElement;

        expect(hidden.matches('input.aux-input[type="hidden"]')).toBe(true);
        expect(hidden.name).toMatch(/^app-rg-/);
        expect(hidden.value).toBe('staging');
        expect(group.querySelectorAll('fieldset:last-child')).toHaveLength(0);

        fireEvent.click(screen.getAllByRole('radio')[2]);
        expect(hidden.value).toBe('custom');
    });
});
