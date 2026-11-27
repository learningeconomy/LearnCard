import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppButton } from './AppButton';
import { AppButtons } from './AppButtons';

const host = (button: HTMLElement): HTMLElement => button.parentElement as HTMLElement;

afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute('mode');
    vi.useRealTimers();
});

describe('AppButton', () => {
    it('renders a native button with type="button" by default', () => {
        render(<AppButton>Go</AppButton>);
        const button = screen.getByRole('button', { name: 'Go' });

        expect(button.tagName).toBe('BUTTON');
        expect(button.getAttribute('type')).toBe('button');
    });

    it('does not submit an enclosing form', () => {
        const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
        render(
            <form onSubmit={onSubmit}>
                <AppButton>Go</AppButton>
            </form>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Go' }));

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('calls onClick when clicked', () => {
        const onClick = vi.fn();
        render(<AppButton onClick={onClick}>Go</AppButton>);

        fireEvent.click(screen.getByRole('button', { name: 'Go' }));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('disables the native button and marks the host like ion-button', () => {
        const onClick = vi.fn();
        render(
            <AppButton disabled onClick={onClick}>
                Go
            </AppButton>
        );
        const button = screen.getByRole('button', { name: 'Go' });

        fireEvent.click(button);

        expect((button as HTMLButtonElement).disabled).toBe(true);
        expect(host(button).getAttribute('aria-disabled')).toBe('true');
        expect(host(button).classList.contains('app-button-disabled')).toBe(true);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('puts className, color, fill and expand classes on the host span', () => {
        render(
            <AppButton className="mt-2" color="light" fill="outline" expand="block">
                Go
            </AppButton>
        );
        const classes = host(screen.getByRole('button', { name: 'Go' })).classList;

        expect(classes.contains('mt-2')).toBe(true);
        expect(classes.contains('app-color')).toBe(true);
        expect(classes.contains('app-color-light')).toBe(true);
        expect(classes.contains('app-button-outline')).toBe(true);
        expect(classes.contains('app-button-block')).toBe(true);
    });

    it('defaults to solid outside AppButtons and clear inside, like ion-buttons', () => {
        render(
            <>
                <AppButton>Outside</AppButton>
                <AppButtons slot="start">
                    <AppButton>Inside</AppButton>
                    <AppButton fill="solid">Explicit</AppButton>
                </AppButtons>
            </>
        );

        expect(
            host(screen.getByRole('button', { name: 'Outside' })).classList.contains(
                'app-button-solid'
            )
        ).toBe(true);
        expect(
            host(screen.getByRole('button', { name: 'Inside' })).classList.contains(
                'app-button-clear'
            )
        ).toBe(true);
        expect(
            host(screen.getByRole('button', { name: 'Explicit' })).classList.contains(
                'app-button-solid'
            )
        ).toBe(true);
    });

    it('follows the document mode: md with a ripple container, ios without', () => {
        const { unmount } = render(<AppButton>Md</AppButton>);
        const md = screen.getByRole('button', { name: 'Md' });
        expect(host(md).classList.contains('md')).toBe(true);
        expect(md.querySelector('.app-ripple-effect')).not.toBeNull();
        unmount();

        document.documentElement.setAttribute('mode', 'ios');
        render(<AppButton>Ios</AppButton>);
        const ios = screen.getByRole('button', { name: 'Ios' });
        expect(host(ios).classList.contains('ios')).toBe(true);
        expect(ios.querySelector('.app-ripple-effect')).toBeNull();
    });

    it('lets the mode prop override the document mode', () => {
        render(<AppButton mode="ios">Pinned</AppButton>);

        expect(host(screen.getByRole('button', { name: 'Pinned' })).classList.contains('ios')).toBe(
            true
        );
    });

    it('activates 100ms after pointerdown, adds an md ripple, and clears 150ms after release', async () => {
        vi.useFakeTimers();
        render(<AppButton>Tap</AppButton>);
        const button = screen.getByRole('button', { name: 'Tap' });

        fireEvent.pointerDown(button, { button: 0, clientX: 5, clientY: 5 });
        expect(host(button).hasAttribute('data-activated')).toBe(false);

        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(host(button).hasAttribute('data-activated')).toBe(true);
        expect(button.querySelectorAll('.app-ripple')).toHaveLength(1);

        fireEvent.pointerUp(document);
        expect(host(button).hasAttribute('data-activated')).toBe(true);

        act(() => {
            vi.advanceTimersByTime(150);
        });
        expect(host(button).hasAttribute('data-activated')).toBe(false);

        // The ripple fades out once its 325ms expand has run, then is removed 200ms later.
        await act(async () => {
            await vi.advanceTimersByTimeAsync(325 + 200);
        });
        expect(button.querySelectorAll('.app-ripple')).toHaveLength(0);
    });

    it('keeps a second press activated when it starts within the previous 150ms clear', () => {
        vi.useFakeTimers();
        render(<AppButton>Tap</AppButton>);
        const button = screen.getByRole('button', { name: 'Tap' });

        fireEvent.pointerDown(button, { button: 0 });
        act(() => {
            vi.advanceTimersByTime(100);
        });
        fireEvent.pointerUp(document); // first press: clear scheduled for t=250

        act(() => {
            vi.advanceTimersByTime(20);
        });
        fireEvent.pointerDown(button, { button: 0 }); // second press at t=120
        act(() => {
            vi.advanceTimersByTime(140); // t=260: past the first press's clear
        });

        expect(host(button).hasAttribute('data-activated')).toBe(true);
    });

    it('cancels activation on pointercancel (scroll gestures) and ignores right clicks', () => {
        vi.useFakeTimers();
        render(<AppButton>Tap</AppButton>);
        const button = screen.getByRole('button', { name: 'Tap' });

        // jsdom has no PointerEvent constructor, so `button` only survives on a MouseEvent.
        fireEvent(button, new MouseEvent('pointerdown', { bubbles: true, button: 2 }));
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(host(button).hasAttribute('data-activated')).toBe(false);

        fireEvent.pointerDown(button, { button: 0 });
        fireEvent.pointerCancel(document);
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(host(button).hasAttribute('data-activated')).toBe(false);
    });
});

describe('AppButtons', () => {
    it('renders a div with the toolbar slot attribute and the mode class', () => {
        const { container } = render(
            <AppButtons slot="end" className="mr-[10px]">
                <span>child</span>
            </AppButtons>
        );
        const group = container.firstElementChild as HTMLElement;

        expect(group.tagName).toBe('DIV');
        expect(group.getAttribute('slot')).toBe('end');
        expect(group.className).toBe('app-buttons md mr-[10px]');
    });

    it('omits the slot attribute when no slot is given', () => {
        const { container } = render(<AppButtons />);

        expect((container.firstElementChild as HTMLElement).hasAttribute('slot')).toBe(false);
    });
});

describe('AppButton in AppDatetime', () => {
    it('takes an id on the host and an aria-label on the native button', () => {
        render(
            <AppButton id="confirm-button" aria-label="Next month">
                <span slot="icon-only" />
            </AppButton>
        );
        const button = screen.getByRole('button', { name: 'Next month' });

        expect(host(button).id).toBe('confirm-button');
        expect(host(button).classList.contains('app-button-has-icon-only')).toBe(true);
    });

    it('color="inherit" reads the palette an ancestor sets, adding no palette entry of its own', () => {
        render(<AppButton color="inherit">Done</AppButton>);
        const classes = Array.from(host(screen.getByRole('button', { name: 'Done' })).classList);

        expect(classes).toContain('app-color');
        expect(classes.filter(c => c.startsWith('app-color-'))).toEqual([]);
    });

    it('AppButtons takes an explicit mode for its buttons', () => {
        document.documentElement.setAttribute('mode', 'md');
        render(
            <AppButtons slot="buttons" mode="ios">
                <AppButton>Done</AppButton>
            </AppButtons>
        );
        const button = screen.getByRole('button', { name: 'Done' });

        expect(host(button).parentElement?.classList.contains('ios')).toBe(true);
        expect(host(button).classList.contains('app-button-clear')).toBe(true);
    });
});
