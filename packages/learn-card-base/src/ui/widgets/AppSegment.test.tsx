import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppLabel } from '../list/AppLabel';
import { AppSegment, AppSegmentButton } from './AppSegment';

type Tab = 'one' | 'two' | 'three';

const Tabs: React.FC<{ value?: Tab; onValueChange?: (value: Tab) => void }> = ({
    value = 'one',
    onValueChange,
}) => (
    <AppSegment<Tab> value={value} onValueChange={onValueChange} data-testid="segment">
        <AppSegmentButton value="one">
            <AppLabel>One</AppLabel>
        </AppSegmentButton>
        <AppSegmentButton value="two">
            <AppLabel>Two</AppLabel>
        </AppSegmentButton>
        <AppSegmentButton value="three">
            <AppLabel>Three</AppLabel>
        </AppSegmentButton>
    </AppSegment>
);

const tab = (name: string): HTMLElement => screen.getByRole('tab', { name });
const host = (button: HTMLElement): HTMLElement => button.parentElement as HTMLElement;
const selected = (): string[] =>
    screen
        .getAllByRole('tab')
        .filter(t => t.getAttribute('aria-selected') === 'true')
        .map(t => t.textContent ?? '');

/** jsdom has no layout: lay the three buttons out 100px wide, side by side. */
const layOut = (): void => {
    screen.getAllByRole('tab').forEach((t, i) => {
        host(t).getBoundingClientRect = () =>
            ({
                left: i * 100,
                right: i * 100 + 100,
                width: 100,
                top: 0,
                bottom: 40,
                height: 40,
                x: i * 100,
                y: 0,
            }) as DOMRect;
    });
};
/** A document-level pointer event with coordinates (jsdom has no PointerEvent constructor). */
const pointer = (type: string, clientX: number): void => {
    act(() => {
        document.dispatchEvent(new MouseEvent(type, { clientX, clientY: 20, bubbles: true }));
    });
};

afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute('mode');
    vi.restoreAllMocks();
});

describe('AppSegment', () => {
    it('is a tablist of native tab buttons with aria-selected on the checked one', () => {
        render(<Tabs value="two" />);

        expect(screen.getByRole('tablist')).toBeTruthy();
        expect(screen.getAllByRole('tab').map(t => t.tagName)).toEqual([
            'BUTTON',
            'BUTTON',
            'BUTTON',
        ]);
        expect(selected()).toEqual(['Two']);
        expect(host(tab('Two')).classList.contains('app-segment-button-checked')).toBe(true);
        // The separator hides on the button after the checked one, as in Ionic.
        expect(host(tab('Three')).classList.contains('app-segment-button-after-checked')).toBe(
            true
        );
    });

    it('selects on click and calls onValueChange once per change', () => {
        const onValueChange = vi.fn();
        render(<Tabs onValueChange={onValueChange} />);

        fireEvent.click(tab('Three'));
        expect(selected()).toEqual(['Three']);
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange).toHaveBeenCalledWith('three');

        fireEvent.click(tab('Three'));
        expect(onValueChange).toHaveBeenCalledTimes(1);
    });

    it('follows value prop updates without calling onValueChange', () => {
        const onValueChange = vi.fn();
        const { rerender } = render(<Tabs value="one" onValueChange={onValueChange} />);

        rerender(<Tabs value="three" onValueChange={onValueChange} />);
        expect(selected()).toEqual(['Three']);
        expect(onValueChange).not.toHaveBeenCalled();
    });

    it('works as a controlled tab bar', () => {
        const Controlled: React.FC = () => {
            const [value, setValue] = useState<Tab>('one');
            return (
                <>
                    <Tabs value={value} onValueChange={next => setValue(next)} />
                    <output data-testid="value">{value}</output>
                </>
            );
        };
        render(<Controlled />);

        fireEvent.click(tab('Two'));
        expect(screen.getByTestId('value').textContent).toBe('two');
        expect(selected()).toEqual(['Two']);
    });

    it('moves focus with the arrow keys, Home and End (wrapping), and selects with Enter and Space', () => {
        const onValueChange = vi.fn();
        render(<Tabs onValueChange={onValueChange} />);
        tab('One').focus();

        fireEvent.keyDown(tab('One'), { key: 'ArrowRight' });
        expect(document.activeElement).toBe(tab('Two'));
        expect(selected()).toEqual(['One']);

        fireEvent.keyDown(tab('Two'), { key: 'End' });
        expect(document.activeElement).toBe(tab('Three'));
        fireEvent.keyDown(tab('Three'), { key: 'ArrowRight' });
        expect(document.activeElement).toBe(tab('One'));
        fireEvent.keyDown(tab('One'), { key: 'ArrowLeft' });
        expect(document.activeElement).toBe(tab('Three'));
        fireEvent.keyDown(tab('Three'), { key: 'Home' });
        expect(document.activeElement).toBe(tab('One'));
        expect(onValueChange).not.toHaveBeenCalled();

        fireEvent.keyDown(tab('One'), { key: 'ArrowRight' });
        fireEvent.keyDown(tab('Two'), { key: 'Enter' });
        expect(selected()).toEqual(['Two']);
        expect(onValueChange).toHaveBeenLastCalledWith('two');

        fireEvent.keyDown(tab('Two'), { key: 'ArrowRight' });
        fireEvent.keyDown(tab('Three'), { key: ' ' });
        expect(selected()).toEqual(['Three']);
        expect(onValueChange).toHaveBeenCalledTimes(2);
    });

    it('slides the selection while a press on the checked button drags, and emits on release', () => {
        const onValueChange = vi.fn();
        render(<Tabs onValueChange={onValueChange} />);
        layOut();

        fireEvent.pointerDown(tab('One'), { button: 0 });
        expect(screen.getByTestId('segment').classList.contains('app-segment-activated')).toBe(
            true
        );
        expect(host(tab('Two')).classList.contains('app-segment-button-activated')).toBe(true);

        pointer('pointermove', 150);
        expect(selected()).toEqual(['Two']);
        expect(onValueChange).not.toHaveBeenCalled();

        pointer('pointermove', 250);
        pointer('pointerup', 250);
        expect(selected()).toEqual(['Three']);
        expect(screen.getByTestId('segment').classList.contains('app-segment-activated')).toBe(
            false
        );
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange).toHaveBeenCalledWith('three');
    });

    it('selects the button under the release point after a press on an unchecked button', () => {
        const onValueChange = vi.fn();
        render(<Tabs onValueChange={onValueChange} />);
        layOut();
        document.elementFromPoint = vi.fn(() => tab('Three'));

        fireEvent.pointerDown(tab('Two'), { button: 0 });
        expect(screen.getByTestId('segment').classList.contains('app-segment-activated')).toBe(
            false
        );
        pointer('pointerup', 250);

        expect(document.elementFromPoint).toHaveBeenCalledWith(250, 20);
        expect(selected()).toEqual(['Three']);
        expect(onValueChange).toHaveBeenCalledWith('three');
    });

    it('carries the document mode, or the mode prop, as a class', () => {
        document.documentElement.setAttribute('mode', 'ios');
        const { rerender } = render(<AppSegment data-testid="s" className="extra" />);
        expect(screen.getByTestId('s').className).toBe('app-segment app-segment-ios extra');

        rerender(<AppSegment data-testid="s" mode="md" />);
        expect(screen.getByTestId('s').className).toBe('app-segment app-segment-md');
    });
});
