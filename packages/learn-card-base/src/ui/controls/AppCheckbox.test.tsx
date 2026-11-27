import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppCheckbox } from './AppCheckbox';

afterEach(cleanup);

const isChecked = (checkbox: HTMLElement): boolean =>
    checkbox.getAttribute('aria-checked') === 'true';

describe('AppCheckbox', () => {
    it('renders role="checkbox" with aria-checked and a tab stop, and no labelable native input', () => {
        const { container } = render(<AppCheckbox checked aria-label="Share" />);
        const checkbox = screen.getByRole('checkbox', { name: 'Share' });

        expect(isChecked(checkbox)).toBe(true);
        expect(checkbox.getAttribute('tabindex')).toBe('0');
        expect(checkbox.hasAttribute('aria-disabled')).toBe(false);
        expect(container.querySelector('input:not([type="hidden"])')).toBeNull();
    });

    it('keeps ion-checkbox\'s hidden form input in sync: "on" when checked, "" otherwise', () => {
        const { container } = render(<AppCheckbox />);
        const hidden = container.querySelector<HTMLInputElement>('input.aux-input');

        expect(hidden?.type).toBe('hidden');
        expect(hidden?.name).toMatch(/^app-cb-/);
        expect(hidden?.value).toBe('');

        fireEvent.click(screen.getByRole('checkbox'));
        expect(hidden?.value).toBe('on');
    });

    it('is not focusable and marked aria-disabled when disabled', () => {
        render(<AppCheckbox disabled />);
        const checkbox = screen.getByRole('checkbox');

        expect(checkbox.hasAttribute('tabindex')).toBe(false);
        expect(checkbox.getAttribute('aria-disabled')).toBe('true');
        expect(checkbox.classList.contains('app-checkbox-disabled')).toBe(true);
    });

    it('toggles on click, emitting onCheckedChange before onClick', () => {
        const calls: string[] = [];
        render(
            <AppCheckbox
                onCheckedChange={checked => calls.push(`change:${checked}`)}
                onClick={event => calls.push(`click:${event.defaultPrevented}`)}
            />
        );
        const checkbox = screen.getByRole('checkbox');

        fireEvent.click(checkbox);
        expect(isChecked(checkbox)).toBe(true);
        fireEvent.click(checkbox);
        expect(isChecked(checkbox)).toBe(false);

        // ion-checkbox's host click handler (toggle + preventDefault + ionChange) ran before React's onClick.
        expect(calls).toEqual(['change:true', 'click:true', 'change:false', 'click:true']);
    });

    it('toggles on Space without calling onClick, and ignores Enter', () => {
        const onClick = vi.fn();
        const onCheckedChange = vi.fn();
        render(<AppCheckbox onClick={onClick} onCheckedChange={onCheckedChange} />);
        const checkbox = screen.getByRole('checkbox');

        const space = fireEvent.keyDown(checkbox, { key: ' ' });
        expect(space).toBe(false); // default prevented: no page scroll
        expect(isChecked(checkbox)).toBe(true);
        expect(onCheckedChange).toHaveBeenCalledWith(true);

        fireEvent.keyDown(checkbox, { key: 'Enter' });
        expect(isChecked(checkbox)).toBe(true);
        expect(onCheckedChange).toHaveBeenCalledTimes(1);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('does not toggle when disabled', () => {
        const onCheckedChange = vi.fn();
        render(<AppCheckbox disabled onCheckedChange={onCheckedChange} />);
        const checkbox = screen.getByRole('checkbox');

        fireEvent.click(checkbox);
        fireEvent.keyDown(checkbox, { key: ' ' });

        expect(isChecked(checkbox)).toBe(false);
        expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it('applies checked prop changes and never emits onCheckedChange for them', () => {
        const onCheckedChange = vi.fn();
        const { rerender } = render(
            <AppCheckbox checked={false} onCheckedChange={onCheckedChange} />
        );

        rerender(<AppCheckbox checked onCheckedChange={onCheckedChange} />);

        expect(isChecked(screen.getByRole('checkbox'))).toBe(true);
        expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it('keeps a click-toggled state until the parent re-renders, then re-applies checked (Ionic React)', () => {
        // ConsentFlowReadSharingModal's "Live syncing": the handler returns early when already
        // checked, so nothing re-renders and the box shows unchecked; any later parent render
        // writes `checked` back.
        let forceParentRender = (): void => undefined;
        const Parent: React.FC = () => {
            const [, setTick] = useState(0);
            forceParentRender = () => setTick(tick => tick + 1);
            return <AppCheckbox checked onClick={() => undefined} />;
        };
        render(<Parent />);
        const checkbox = screen.getByRole('checkbox');

        fireEvent.click(checkbox);
        expect(isChecked(checkbox)).toBe(false);

        act(() => forceParentRender());
        expect(isChecked(checkbox)).toBe(true);
    });

    it('is uncontrolled without a checked prop, across parent re-renders', () => {
        const { rerender } = render(<AppCheckbox />);
        const checkbox = screen.getByRole('checkbox');

        fireEvent.click(checkbox);
        rerender(<AppCheckbox />);

        expect(isChecked(checkbox)).toBe(true);
    });

    it('is not toggled or labelled by a <label htmlFor> (label onClick runs once, as before)', () => {
        const labelClick = vi.fn();
        const checkboxClick = vi.fn();
        render(
            <>
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- ConsentFlowReadSharingModal's markup under test. */}
                <label htmlFor="share-all" onClick={labelClick}>
                    Live syncing
                </label>
                <AppCheckbox id="share-all" checked onClick={checkboxClick} />
            </>
        );
        const checkbox = screen.getByRole('checkbox');

        fireEvent.click(screen.getByText('Live syncing'));

        expect(labelClick).toHaveBeenCalledTimes(1);
        expect(checkboxClick).not.toHaveBeenCalled();
        expect(isChecked(checkbox)).toBe(true);
        expect(screen.queryByRole('checkbox', { name: 'Live syncing' })).toBeNull();
    });

    it('is not toggled by clicking the text of a wrapping <label>', () => {
        const onCheckedChange = vi.fn();
        render(
            // eslint-disable-next-line jsx-a11y/label-has-associated-control -- MultiTextInput's markup under test.
            <label>
                Required
                <AppCheckbox onCheckedChange={onCheckedChange} />
            </label>
        );

        fireEvent.click(screen.getByText('Required'));

        expect(onCheckedChange).not.toHaveBeenCalled();
        expect(isChecked(screen.getByRole('checkbox'))).toBe(false);
    });

    it('renders the mode-specific checkmark and color classes', () => {
        render(
            <>
                <AppCheckbox mode="ios" color="emerald-700" aria-label="ios" />
                <AppCheckbox mode="md" aria-label="md" />
            </>
        );
        const ios = screen.getByRole('checkbox', { name: 'ios' });
        const md = screen.getByRole('checkbox', { name: 'md' });

        expect(ios.className).toBe('app-checkbox ios app-color app-color-emerald-700');
        expect(ios.querySelector('path')?.getAttribute('d')).toBe('M5.9,12.5l3.8,3.8l8.8-8.8');
        expect(md.className).toBe('app-checkbox md');
        expect(md.querySelector('path')?.getAttribute('d')).toBe(
            'M1.73,12.91 8.1,19.28 22.79,4.59'
        );
    });
});
