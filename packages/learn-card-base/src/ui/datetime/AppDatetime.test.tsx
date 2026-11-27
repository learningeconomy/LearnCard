import React, { useRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppButton } from '../controls/AppButton';
import { AppButtons } from '../controls/AppButtons';
import { AppPopover } from '../overlays/AppPopover';
import { getPresentedOverlays } from '../overlays/overlayStack';
import { AppDatetime, type AppDatetimeHandle } from './AppDatetime';
import { installDatetimeTestEnv } from './testEnv';

let env: ReturnType<typeof installDatetimeTestEnv>;
let ionApp: HTMLElement;

beforeEach(() => {
    env = installDatetimeTestEnv();
    ionApp = Object.assign(document.createElement('div'), { className: 'app-root' });
    document.body.appendChild(ionApp);
});

afterEach(() => {
    cleanup();
    ionApp.remove();
    vi.unstubAllGlobals();
});

const day = (d: number, month = 12) =>
    document.querySelector<HTMLButtonElement>(
        `.calendar-day[data-month="${month}"][data-day="${d}"]`
    ) as HTMLButtonElement;

describe('AppDatetime', () => {
    it('renders the month of its value with the selected day, like ion-datetime', () => {
        render(<AppDatetime value="2026-12-05" presentation="date" />);
        env.showAll();

        const toggle = screen.getByRole('button', { name: 'Show year picker' });
        expect(toggle.textContent).toBe('December 2026');
        expect(day(5).getAttribute('aria-selected')).toBe('true');
        expect(day(5).classList.contains('calendar-day-active')).toBe(true);
        expect(document.querySelector<HTMLInputElement>('input.aux-input')?.value).toBe(
            '2026-12-05'
        );
    });

    it('emits ionChange with the ISO value on each pick when it has no buttons', () => {
        const onIonChange = vi.fn();
        render(<AppDatetime value="2026-12-05" presentation="date" onIonChange={onIonChange} />);
        env.showAll();

        fireEvent.click(day(20));

        expect(onIonChange).toHaveBeenCalledTimes(1);
        expect(onIonChange.mock.calls[0][0].detail.value).toBe('2026-12-20');
        expect(day(20).getAttribute('aria-selected')).toBe('true');
    });

    it('keeps the time of a date-time value and shows it on the time button', () => {
        const onIonChange = vi.fn();
        render(
            <AppDatetime
                value="2026-12-05T14:45"
                presentation="date-time"
                onIonChange={onIonChange}
            />
        );
        env.showAll();

        expect(document.querySelector('.time-body')?.textContent).toBe('2:45 PM');
        fireEvent.click(day(18));

        expect(onIonChange.mock.calls[0][0].detail.value).toBe('2026-12-18T14:45:00');
    });

    it('disables days and month navigation outside min / max', () => {
        render(
            <AppDatetime value="2026-12-05" presentation="date" min="2026-12-03" max="2026-12-28" />
        );
        env.showAll();

        expect(day(2).disabled).toBe(true);
        expect(day(3).disabled).toBe(false);
        expect(day(29).disabled).toBe(true);
        expect(
            screen.getByRole('button', { name: 'Previous month' }).hasAttribute('disabled')
        ).toBe(true);
        expect(screen.getByRole('button', { name: 'Next month' }).hasAttribute('disabled')).toBe(
            true
        );
    });

    it('with default buttons, commits only on Done; Cancel emits ionCancel and keeps the value', () => {
        const onIonChange = vi.fn();
        const onIonCancel = vi.fn();
        render(
            <AppDatetime
                value="2026-12-05"
                presentation="date"
                showDefaultButtons
                onIonChange={onIonChange}
                onIonCancel={onIonCancel}
            />
        );
        env.showAll();

        fireEvent.click(day(20));
        expect(onIonChange).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onIonCancel).toHaveBeenCalledTimes(1);
        expect(onIonChange).not.toHaveBeenCalled();
        expect(document.querySelector<HTMLInputElement>('input.aux-input')?.value).toBe(
            '2026-12-05'
        );

        fireEvent.click(day(21));
        fireEvent.click(screen.getByRole('button', { name: 'Done' }));
        expect(onIonChange).toHaveBeenCalledTimes(1);
        expect(onIonChange.mock.calls[0][0].detail.value).toBe('2026-12-21');
    });

    it('clears to an undefined value with the clear button', () => {
        const onIonChange = vi.fn();
        render(
            <AppDatetime
                value="2026-12-05"
                presentation="date"
                showClearButton
                onIonChange={onIonChange}
            />
        );
        env.showAll();

        fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

        expect(onIonChange).toHaveBeenCalledTimes(1);
        expect(onIonChange.mock.calls[0][0].detail.value).toBeUndefined();
    });

    it('renders `buttons` in place of the defaults and exposes confirm / reset', async () => {
        const onIonChange = vi.fn();
        const Harness = () => {
            const ref = useRef<AppDatetimeHandle>(null);
            return (
                <AppDatetime
                    ref={ref}
                    value="2026-12-05"
                    presentation="date"
                    onIonChange={onIonChange}
                    buttons={
                        <AppButtons slot="buttons" mode="ios">
                            <AppButton onClick={() => void ref.current?.reset()}>
                                Start over
                            </AppButton>
                            <AppButton onClick={() => void ref.current?.confirm()}>Save</AppButton>
                        </AppButtons>
                    }
                />
            );
        };
        render(<Harness />);
        env.showAll();

        expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
        fireEvent.click(day(9));
        expect(onIonChange).not.toHaveBeenCalled();
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        });
        expect(onIonChange.mock.calls[0][0].detail.value).toBe('2026-12-09');
    });

    it('moves between months with the header buttons', () => {
        render(<AppDatetime value="2026-12-05" presentation="date" />);
        env.showAll();

        fireEvent.click(screen.getByRole('button', { name: 'Next month' }));

        expect(day(1, 1)).toBeTruthy();
    });

    it('Done closes the app popover it sits in, with the confirm role', async () => {
        const onDidDismiss = vi.fn();
        const Harness = () => {
            const [open, setOpen] = useState(true);
            return (
                <AppPopover
                    isOpen={open}
                    onDidDismiss={e => {
                        setOpen(false);
                        onDidDismiss(e.detail.role);
                    }}
                >
                    <AppDatetime value="2026-12-05" presentation="date" showDefaultButtons />
                </AppPopover>
            );
        };
        render(<Harness />);
        env.showAll();

        await waitFor(() => expect(getPresentedOverlays()).toHaveLength(1));
        fireEvent.click(await screen.findByRole('button', { name: 'Done' }));

        await waitFor(() => expect(onDidDismiss).toHaveBeenCalledWith('confirm'), {
            timeout: 3000,
        });
    });
});
