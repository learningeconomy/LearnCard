import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PinSignInReviewSheet } from './PinSignInReviewSheet';

vi.mock('learn-card-base', () => ({
    Overlay: ({
        children,
        'aria-describedby': describedBy,
    }: {
        children: React.ReactNode;
        'aria-describedby'?: string;
    }) => (
        <div role="dialog" aria-describedby={describedBy}>
            {children}
        </div>
    ),
}));

const done = () => screen.getByRole('button', { name: 'Done' });
const secureLink = () => screen.getByRole('button', { name: 'Lost a device? Secure your account' });
const choose = () => screen.getByRole('button', { name: 'Choose a new PIN' });
const notNow = () => screen.getByRole('button', { name: 'Not now' });
const isPrimary = (el: HTMLElement) => el.className.includes('bg-grayscale-900');

describe('PinSignInReviewSheet', () => {
    describe('normal (no wrong entries other than own typos)', () => {
        it('confirms the sign-in with a green check and "Done"', () => {
            render(<PinSignInReviewSheet onFine={vi.fn()} onSecure={vi.fn()} />);

            expect(screen.getByRole('heading', { name: "You're signed in" })).toBeInTheDocument();
            expect(screen.getByText('Your other devices stay signed in too.')).toBeInTheDocument();
            expect(screen.getByTestId('pin-review-success-icon')).toBeInTheDocument();
            expect(screen.queryByTestId('pin-review-warning-icon')).not.toBeInTheDocument();
            expect(document.activeElement).toBe(done());
            expect(isPrimary(done())).toBe(true);
            expect(isPrimary(secureLink())).toBe(false);
            // The old question, yes/no answers and footnote are gone.
            expect(screen.queryByText(/Did you lose a device/)).not.toBeInTheDocument();
            expect(screen.queryByText(/everything's fine/)).not.toBeInTheDocument();
            expect(screen.queryByText(/do this later in Account Recovery/)).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Not now' })).not.toBeInTheDocument();
        });

        it('treats a zero count without a required new PIN as normal', () => {
            render(
                <PinSignInReviewSheet priorWrongAttempts={0} onFine={vi.fn()} onSecure={vi.fn()} />
            );

            expect(screen.getByRole('heading', { name: "You're signed in" })).toBeInTheDocument();
        });

        it('describes the dialog with its body', () => {
            render(<PinSignInReviewSheet onFine={vi.fn()} onSecure={vi.fn()} />);

            expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
                'Your other devices stay signed in too.'
            );
        });

        it('reports "Done" and the secure link', () => {
            const onFine = vi.fn();
            const onSecure = vi.fn();
            render(<PinSignInReviewSheet onFine={onFine} onSecure={onSecure} />);

            fireEvent.click(secureLink());
            expect(onSecure).toHaveBeenCalledOnce();
            fireEvent.click(done());
            expect(onFine).toHaveBeenCalledOnce();
        });
    });

    describe('warning (wrong entries before this sign-in)', () => {
        const renderWarning = (priorWrongAttempts?: number) => {
            const handlers = { onFine: vi.fn(), onChooseNewPin: vi.fn(), onSecure: vi.fn() };
            render(
                <PinSignInReviewSheet
                    priorWrongAttempts={priorWrongAttempts}
                    newPinRequired
                    {...handlers}
                />
            );
            return handlers;
        };

        it('warns with an amber icon and leads with "Choose a new PIN"', () => {
            const handlers = renderWarning(3);

            expect(
                screen.getByRole('heading', { name: 'Someone may have tried your PIN' })
            ).toBeInTheDocument();
            expect(
                screen.getByText(
                    'It was entered incorrectly 3 times before you signed in. Choose a new PIN to stay protected.'
                )
            ).toBeInTheDocument();
            expect(screen.getByTestId('pin-review-warning-icon')).toBeInTheDocument();
            expect(screen.queryByTestId('pin-review-success-icon')).not.toBeInTheDocument();
            expect(isPrimary(choose())).toBe(true);
            expect(isPrimary(secureLink())).toBe(false);
            expect(isPrimary(notNow())).toBe(false);
            // The revoke is never the default.
            expect(document.activeElement).toBe(choose());
            expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
            expect(screen.queryByText(/do this later in Account Recovery/)).not.toBeInTheDocument();

            fireEvent.click(choose());
            expect(handlers.onChooseNewPin).toHaveBeenCalledOnce();
            fireEvent.click(secureLink());
            expect(handlers.onSecure).toHaveBeenCalledOnce();
            fireEvent.click(notNow());
            expect(handlers.onFine).toHaveBeenCalledOnce();
        });

        it('describes the dialog with the reason and the count', () => {
            renderWarning(3);

            // Screen readers hear why, not just the title and the focused button.
            expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
                'It was entered incorrectly 3 times before you signed in. Choose a new PIN to stay protected.'
            );
        });

        it('uses a separate message for two (dual form in some languages)', () => {
            renderWarning(2);

            expect(
                screen.getByText(
                    'It was entered incorrectly 2 times before you signed in. Choose a new PIN to stay protected.'
                )
            ).toBeInTheDocument();
        });

        it('uses the singular for one earlier wrong entry', () => {
            renderWarning(1);

            expect(
                screen.getByText(
                    'It was entered incorrectly 1 time before you signed in. Choose a new PIN to stay protected.'
                )
            ).toBeInTheDocument();
        });

        it('falls back to count-free copy when the count is unknown or zero', () => {
            renderWarning(undefined);
            expect(
                screen.getByText(/Your PIN may have been entered incorrectly before you signed in/)
            ).toBeInTheDocument();
            expect(screen.queryByText(/\d+ times?/)).not.toBeInTheDocument();
        });

        it('warns for a foreign entry during the flow (count 0, new PIN required)', () => {
            renderWarning(0);
            expect(
                screen.getByRole('heading', { name: 'Someone may have tried your PIN' })
            ).toBeInTheDocument();
            expect(screen.queryByText(/0 times/)).not.toBeInTheDocument();
        });

        it('offers "Done" when no new-PIN handler is wired', () => {
            render(
                <PinSignInReviewSheet
                    priorWrongAttempts={2}
                    newPinRequired
                    onFine={vi.fn()}
                    onSecure={vi.fn()}
                />
            );

            expect(done()).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Not now' })).not.toBeInTheDocument();
        });
    });
});
