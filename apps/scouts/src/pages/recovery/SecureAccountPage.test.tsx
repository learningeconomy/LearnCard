// @vitest-environment jsdom
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    openSecureAccount: vi.fn(),
    replace: vi.fn(),
    configured: false,
    auth: {
        isReady: true,
        canUseAutomaticRecovery: false,
        state: { status: 'ready', escrowEnrollment: undefined as string | undefined },
    },
}));
vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({ ...mocks.auth, openSecureAccount: mocks.openSecureAccount }),
    isEscrowRecoveryConfigured: () => mocks.configured,
}));
vi.mock('react-router-dom', () => ({ useHistory: () => ({ replace: mocks.replace }) }));
import SecureAccountPage from './SecureAccountPage';

beforeEach(() => {
    vi.clearAllMocks();
    mocks.configured = false;
    mocks.auth = {
        isReady: true,
        canUseAutomaticRecovery: false,
        state: { status: 'ready', escrowEnrollment: undefined },
    };
});
afterEach(cleanup);

it('returns home without opening recovery while disabled', () => {
    render(<SecureAccountPage />);
    expect(mocks.openSecureAccount).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith('/');
});

it('waits for server availability then opens once', () => {
    mocks.configured = true;
    const view = render(<SecureAccountPage />);
    expect(mocks.replace).not.toHaveBeenCalled();
    mocks.auth.canUseAutomaticRecovery = true;
    mocks.auth.state.escrowEnrollment = 'enrolled';
    view.rerender(<SecureAccountPage />);
    view.rerender(<SecureAccountPage />);
    expect(mocks.openSecureAccount).toHaveBeenCalledOnce();
});

it('does not open when the server reports unavailable', () => {
    mocks.configured = true;
    mocks.auth.state.escrowEnrollment = 'disabled';
    render(<SecureAccountPage />);
    expect(mocks.openSecureAccount).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith('/');
});

it('waits for sign-in', () => {
    mocks.auth.isReady = false;
    render(<SecureAccountPage />);
    expect(mocks.openSecureAccount).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
});
