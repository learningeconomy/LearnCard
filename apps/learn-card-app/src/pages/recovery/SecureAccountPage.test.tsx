import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
const auth = vi.hoisted(() => ({ openSecureAccount: vi.fn(), isReady: true }));

vi.mock('react-router-dom', () => ({ useHistory: () => ({ replace }) }));
vi.mock('../../providers/AuthCoordinatorProvider', () => ({ useAppAuth: () => auth }));

import SecureAccountPage from './SecureAccountPage';

describe('SecureAccountPage', () => {
    it('opens the secure flow once and leaves the link route', () => {
        const { rerender } = render(<SecureAccountPage />);
        rerender(<SecureAccountPage />);

        expect(auth.openSecureAccount).toHaveBeenCalledOnce();
        expect(replace).toHaveBeenCalledWith('/');
    });

    it('waits until the account is ready', () => {
        auth.openSecureAccount.mockClear();
        replace.mockClear();
        auth.isReady = false;
        render(<SecureAccountPage />);

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(auth.openSecureAccount).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
    });
});
