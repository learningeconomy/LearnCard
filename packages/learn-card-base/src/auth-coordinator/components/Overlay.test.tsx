// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Overlay } from './Overlay';

describe('Overlay accessibility', () => {
    beforeEach(() => {
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            callback(0);
            return 1;
        });
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('announces the dialog, traps focus, dismisses on Escape, and restores focus', () => {
        const trigger = document.createElement('button');
        document.body.appendChild(trigger);
        trigger.focus();
        const onDismiss = vi.fn();

        const { unmount } = render(
            <Overlay aria-labelledby="dialog-title" onDismiss={onDismiss}>
                <h2 id="dialog-title">Recovery options</h2>
                <button type="button">First action</button>
                <button type="button">Last action</button>
            </Overlay>
        );

        const dialog = screen.getByRole('dialog', { name: 'Recovery options' });
        const first = screen.getByRole('button', { name: 'First action' });
        const last = screen.getByRole('button', { name: 'Last action' });

        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(document.activeElement).toBe(first);

        last.focus();
        fireEvent.keyDown(document, { key: 'Tab' });
        expect(document.activeElement).toBe(first);

        fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
        expect(document.activeElement).toBe(last);

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onDismiss).toHaveBeenCalledOnce();

        unmount();
        expect(document.activeElement).toBe(trigger);
        trigger.remove();
    });

    it('focuses the dialog surface when it has no interactive children', () => {
        render(
            <Overlay aria-label="Loading">
                <p>Preparing secure link</p>
            </Overlay>
        );

        expect(document.activeElement).toBe(screen.getByRole('dialog', { name: 'Loading' }));
    });
});
