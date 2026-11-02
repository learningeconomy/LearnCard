import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PinSignInReviewSheet } from './PinSignInReviewSheet';

vi.mock('learn-card-base', () => ({
    Overlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const fine = () => screen.getByRole('button', { name: "No, everything's fine" });
const secure = () => screen.getByRole('button', { name: 'Yes, secure my account' });
const isPrimary = (el: HTMLElement) => el.className.includes('bg-grayscale-900');

describe('PinSignInReviewSheet', () => {
    it('asks once, defaulting to "everything is fine"', () => {
        render(<PinSignInReviewSheet onFine={vi.fn()} onSecure={vi.fn()} />);

        expect(screen.getByRole('heading', { name: "You're in!" })).toBeInTheDocument();
        expect(
            screen.getByText('Did you lose a device, or think someone else knows your PIN?')
        ).toBeInTheDocument();
        expect(document.activeElement).toBe(fine());
        expect(isPrimary(fine())).toBe(true);
        expect(isPrimary(secure())).toBe(false);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('treats an unknown or zero count as no warning', () => {
        render(<PinSignInReviewSheet priorWrongAttempts={0} onFine={vi.fn()} onSecure={vi.fn()} />);

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(isPrimary(secure())).toBe(false);
    });

    it('warns about earlier wrong entries and promotes securing, without preselecting it', () => {
        render(<PinSignInReviewSheet priorWrongAttempts={3} onFine={vi.fn()} onSecure={vi.fn()} />);

        expect(screen.getByRole('alert').textContent).toBe(
            "Your PIN was entered incorrectly 3 times before this sign-in. If that wasn't you, secure your account."
        );
        expect(isPrimary(secure())).toBe(true);
        expect(isPrimary(fine())).toBe(false);
        // The default answer is still "No, everything's fine".
        expect(document.activeElement).toBe(fine());
    });

    it('uses the singular for a single earlier wrong entry', () => {
        render(<PinSignInReviewSheet priorWrongAttempts={1} onFine={vi.fn()} onSecure={vi.fn()} />);

        expect(screen.getByRole('alert').textContent).toMatch(/incorrectly once before/);
    });

    it('reports the answer', () => {
        const onFine = vi.fn();
        const onSecure = vi.fn();
        render(<PinSignInReviewSheet onFine={onFine} onSecure={onSecure} />);

        fireEvent.click(secure());
        expect(onSecure).toHaveBeenCalledOnce();
        fireEvent.click(fine());
        expect(onFine).toHaveBeenCalledOnce();
    });
});
