import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppFab, AppFabButton } from './AppFab';

const host = (button: HTMLElement): HTMLElement => button.parentElement as HTMLElement;

afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute('mode');
    vi.useRealTimers();
});

describe('AppFab', () => {
    it('pins to the given edges', () => {
        render(<AppFab vertical="bottom" horizontal="end" slot="fixed" data-testid="fab" />);
        const fab = screen.getByTestId('fab');

        expect(fab.className).toBe('app-fab app-fab-horizontal-end app-fab-vertical-bottom');
        expect(fab.getAttribute('slot')).toBe('fixed');
    });
});

describe('AppFabButton', () => {
    it('renders a labelled native type="button" and runs the host onClick', () => {
        const onClick = vi.fn();
        render(
            <AppFabButton aria-label="Open settings" onClick={onClick}>
                <svg />
            </AppFabButton>
        );
        const button = screen.getByRole('button', { name: 'Open settings' });

        expect(button.getAttribute('type')).toBe('button');
        fireEvent.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('carries mode, color, size and caller classes', () => {
        render(
            <AppFabButton
                mode="ios"
                color="indigo-500"
                size="small"
                className="extra"
                aria-label="Go"
            />
        );

        expect(host(screen.getByRole('button', { name: 'Go' })).className).toBe(
            'app-fab-button app-fab-button-ios app-color app-color-indigo-500 app-fab-button-small extra'
        );
    });

    it('follows the document mode: md with a ripple container, ios without', () => {
        const { unmount } = render(<AppFabButton aria-label="md" />);
        expect(host(screen.getByRole('button')).classList.contains('app-fab-button-md')).toBe(true);
        expect(screen.getByRole('button').querySelector('.app-ripple-effect')).not.toBeNull();
        unmount();

        document.documentElement.setAttribute('mode', 'ios');
        render(<AppFabButton aria-label="ios" />);
        expect(host(screen.getByRole('button')).classList.contains('app-fab-button-ios')).toBe(
            true
        );
        expect(screen.getByRole('button').querySelector('.app-ripple-effect')).toBeNull();
    });

    it('activates 100ms after pointerdown with an md ripple, and clears after release', () => {
        vi.useFakeTimers();
        render(<AppFabButton aria-label="Tap" />);
        const button = screen.getByRole('button', { name: 'Tap' });

        fireEvent.pointerDown(button, { button: 0, clientX: 5, clientY: 5 });
        expect(host(button).hasAttribute('data-activated')).toBe(false);
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(host(button).hasAttribute('data-activated')).toBe(true);
        expect(button.querySelectorAll('.app-ripple')).toHaveLength(1);

        fireEvent.pointerUp(document);
        act(() => {
            vi.advanceTimersByTime(150);
        });
        expect(host(button).hasAttribute('data-activated')).toBe(false);
    });

    it('disables the native button', () => {
        const onClick = vi.fn();
        render(<AppFabButton aria-label="Off" disabled onClick={onClick} />);
        const button = screen.getByRole('button', { name: 'Off' }) as HTMLButtonElement;

        expect(button.disabled).toBe(true);
        expect(host(button).getAttribute('aria-disabled')).toBe('true');
        expect(host(button).classList.contains('app-fab-button-disabled')).toBe(true);
    });
});
