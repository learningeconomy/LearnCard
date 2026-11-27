import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppSelect } from './AppSelect';

let appRoot: HTMLElement;

beforeEach(() => {
    appRoot = Object.assign(document.createElement('div'), { className: 'app-root' });
    document.body.appendChild(appRoot);
});

afterEach(() => {
    cleanup();
    appRoot.remove();
    document.body.className = '';
});

const options = [
    { value: 'social', label: 'Social Badge' },
    { value: 'merit', label: 'Merit Badge' },
    { value: 'id', label: 'ID' },
];

const Harness: React.FC<{ onValueChange?: (value: string) => void; selectedText?: string }> = ({
    onValueChange,
    selectedText,
}) => {
    const [value, setValue] = useState('merit');
    return (
        <AppSelect
            value={value}
            options={options}
            selectedText={selectedText}
            aria-label="Category"
            mode="md"
            onValueChange={next => {
                setValue(next);
                onValueChange?.(next);
            }}
        />
    );
};

describe('AppSelect', () => {
    it('shows the selected label and opens a radio list with the value checked', async () => {
        render(<Harness />);
        const trigger = screen.getByRole('button', { name: 'Category' });
        expect(trigger).toHaveTextContent('Merit Badge');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(trigger);
        const group = await screen.findByRole('radiogroup', { name: 'Category' });
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(trigger).toHaveAttribute('aria-controls', group.id);
        expect(screen.getByRole('radio', { name: 'Merit Badge' })).toHaveAttribute(
            'aria-checked',
            'true'
        );
        expect(screen.getByRole('radio', { name: 'ID' })).toHaveAttribute('tabindex', '-1');
    });

    it('reports a different pick, closes, and ignores re-picking the current value', async () => {
        const onValueChange = vi.fn();
        render(<Harness onValueChange={onValueChange} />);
        const trigger = screen.getByRole('button', { name: 'Category' });

        fireEvent.click(trigger);
        fireEvent.click(await screen.findByRole('radio', { name: 'Merit Badge' }));
        await waitFor(() => expect(screen.queryByRole('radiogroup')).toBeNull());
        expect(onValueChange).not.toHaveBeenCalled();

        fireEvent.click(trigger);
        fireEvent.click(await screen.findByRole('radio', { name: 'ID' }));
        await waitFor(() => expect(screen.queryByRole('radiogroup')).toBeNull());
        expect(onValueChange).toHaveBeenCalledWith('id');
        expect(trigger).toHaveTextContent('ID');
    });

    it('moves focus between options with the arrow keys, wrapping at the ends', async () => {
        render(<Harness />);
        fireEvent.click(screen.getByRole('button', { name: 'Category' }));
        const merit = await screen.findByRole('radio', { name: 'Merit Badge' });
        merit.focus();
        fireEvent.keyDown(merit, { key: 'ArrowDown' });
        expect(screen.getByRole('radio', { name: 'ID' })).toHaveFocus();
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
        expect(screen.getByRole('radio', { name: 'Social Badge' })).toHaveFocus();
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
        expect(screen.getByRole('radio', { name: 'ID' })).toHaveFocus();
    });

    it('shows selectedText instead of the label, and the placeholder when nothing is selected', () => {
        const { rerender } = render(<Harness selectedText=" " />);
        expect(screen.getByRole('button', { name: 'Category' })).not.toHaveTextContent(
            'Merit Badge'
        );
        rerender(
            <AppSelect options={options} placeholder="Pick one" aria-label="Empty" mode="ios" />
        );
        const trigger = screen.getByRole('button', { name: 'Empty' });
        expect(trigger).toHaveTextContent('Pick one');
        expect(trigger).toHaveClass('app-select-ios');
    });

    it('does not open while disabled', () => {
        render(<AppSelect options={options} value="id" aria-label="Locked" disabled />);
        const trigger = screen.getByRole('button', { name: 'Locked' });
        expect(trigger).toBeDisabled();
        fireEvent.click(trigger);
        expect(screen.queryByRole('radiogroup')).toBeNull();
    });
});
