// @vitest-environment jsdom

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Overlay } from './Overlay';

let animationFrameCallback: FrameRequestCallback | undefined;

const flushInitialFocus = (): void => {
    act(() => animationFrameCallback?.(0));
};

describe('Overlay accessibility', () => {
    beforeEach(() => {
        animationFrameCallback = undefined;
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            animationFrameCallback = callback;
            return 1;
        });
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        animationFrameCallback = undefined;
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
        flushInitialFocus();

        const dialog = screen.getByRole('dialog', { name: 'Recovery options' });
        const first = screen.getByRole('button', { name: 'First action' });
        const last = screen.getByRole('button', { name: 'Last action' });

        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(dialog.classList.contains('lc-surface')).toBe(true);
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

        flushInitialFocus();

        expect(document.activeElement).toBe(screen.getByRole('dialog', { name: 'Loading' }));
    });

    it('derives its accessible name from a contained heading', () => {
        render(
            <Overlay>
                <h2>Account recovery</h2>
                <button type="button">Continue</button>
            </Overlay>
        );

        flushInitialFocus();

        const dialog = screen.getByRole('dialog', { name: 'Account recovery' });
        const heading = screen.getByRole('heading', { name: 'Account recovery' });

        expect(dialog.getAttribute('aria-labelledby')).toBe(heading.id);
        expect(dialog.hasAttribute('aria-label')).toBe(false);
    });

    it('updates its accessible name when a child swaps headings', async () => {
        const RecoveryStep = (): React.ReactElement => {
            const [showPassword, setShowPassword] = React.useState(false);

            return showPassword ? (
                <h3>Enter recovery password</h3>
            ) : (
                <>
                    <h2>Recovery options</h2>
                    <button type="button" onClick={() => setShowPassword(true)}>
                        Use password
                    </button>
                </>
            );
        };

        render(
            <Overlay>
                <RecoveryStep />
            </Overlay>
        );

        const dialog = screen.getByRole('dialog', { name: 'Recovery options' });
        fireEvent.click(screen.getByRole('button', { name: 'Use password' }));

        await waitFor(() => {
            const heading = screen.getByRole('heading', { name: 'Enter recovery password' });
            expect(screen.getByRole('dialog', { name: 'Enter recovery password' })).toBe(dialog);
            expect(dialog.getAttribute('aria-labelledby')).toBe(heading.id);
        });
    });

    it('moves focus into replacement content after a child transition', () => {
        const SteppedOverlay = (): React.ReactElement => {
            const [showSecondStep, setShowSecondStep] = React.useState(false);

            return (
                <Overlay>
                    {showSecondStep ? (
                        <div key="second">
                            <h2>Second step</h2>
                            <button type="button">Second action</button>
                        </div>
                    ) : (
                        <div key="first">
                            <h2>First step</h2>
                            <button type="button" onClick={() => setShowSecondStep(true)}>
                                Continue
                            </button>
                        </div>
                    )}
                </Overlay>
            );
        };

        render(<SteppedOverlay />);
        flushInitialFocus();

        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Second action' }));
    });

    it('moves its generated title id when a child prepends a heading', async () => {
        const HeadingList = (): React.ReactElement => {
            const [showPrimaryHeading, setShowPrimaryHeading] = React.useState(false);

            return (
                <>
                    {showPrimaryHeading && <h2>Primary heading</h2>}
                    <h3>Secondary heading</h3>
                    <button type="button" onClick={() => setShowPrimaryHeading(true)}>
                        Add primary heading
                    </button>
                </>
            );
        };

        render(
            <Overlay>
                <HeadingList />
            </Overlay>
        );

        const dialog = screen.getByRole('dialog', { name: 'Secondary heading' });
        const secondaryHeading = screen.getByRole('heading', { name: 'Secondary heading' });
        const generatedTitleId = secondaryHeading.id;

        fireEvent.click(screen.getByRole('button', { name: 'Add primary heading' }));

        await waitFor(() => {
            const primaryHeading = screen.getByRole('heading', { name: 'Primary heading' });
            expect(screen.getByRole('dialog', { name: 'Primary heading' })).toBe(dialog);
            expect(primaryHeading.id).toBe(generatedTitleId);
            expect(secondaryHeading.hasAttribute('id')).toBe(false);
        });
    });

    it('preserves focus chosen by a child before the animation frame runs', () => {
        const SelfFocusingChild = (): React.ReactElement => {
            const preferredRef = React.useRef<HTMLButtonElement>(null);

            React.useEffect(() => {
                preferredRef.current?.focus();
            }, []);

            return (
                <>
                    <button type="button">First action</button>
                    <button ref={preferredRef} type="button">
                        Preferred action
                    </button>
                </>
            );
        };

        render(
            <Overlay aria-label="Choose an action">
                <SelfFocusingChild />
            </Overlay>
        );

        const preferred = screen.getByRole('button', { name: 'Preferred action' });
        expect(document.activeElement).toBe(preferred);

        flushInitialFocus();

        expect(document.activeElement).toBe(preferred);
    });

    it('does not intercept keyboard events from a shared modal above it', () => {
        const onDismiss = vi.fn();
        render(
            <Overlay aria-label="Recovery" onDismiss={onDismiss}>
                <button type="button">Overlay action</button>
            </Overlay>
        );
        flushInitialFocus();

        const modalPortal = document.createElement('div');
        modalPortal.id = 'modal-mid-root';
        const modalAction = document.createElement('button');
        modalAction.textContent = 'Modal action';
        modalPortal.appendChild(modalAction);
        document.body.appendChild(modalPortal);
        modalAction.focus();

        fireEvent.keyDown(document, { key: 'Tab' });
        fireEvent.keyDown(document, { key: 'Escape' });

        expect(document.activeElement).toBe(modalAction);
        expect(onDismiss).not.toHaveBeenCalled();
        modalPortal.remove();
    });
});
