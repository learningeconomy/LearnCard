// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    calls: [] as string[],
    deleteFirebaseUser: vi.fn(),
    deleteMyClassLinkData: vi.fn(),
    removeAllVCsFromWallet: vi.fn(async () => undefined),
    firebaseEmail: 'student@school.org' as string | undefined,
    log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock('learn-card-base', async () => {
    const synthetic = await vi.importActual<
        typeof import('learn-card-base/helpers/syntheticEmail')
    >('learn-card-base/helpers/syntheticEmail');
    return {
        getContactEmail: synthetic.getContactEmail,
        getLogger: () => mocks.log,
        useSignInAdapter: () => ({
            getCurrentUser: () => ({ email: mocks.firebaseEmail, phone: undefined }),
        }),
        useDeleteMyClassLinkData: () => ({ mutateAsync: mocks.deleteMyClassLinkData }),
        useWallet: () => ({
            removeAllVCsFromWallet: mocks.removeAllVCsFromWallet,
            initWallet: async () => ({
                invoke: { getProfile: async () => undefined, deleteProfile: vi.fn() },
            }),
        }),
        useCurrentUser: () => ({ email: '' }),
        useModal: () => ({ newModal: vi.fn() }),
    };
});
vi.mock('../../hooks/useFirebase', () => ({
    default: () => ({ deleteFirebaseUser: mocks.deleteFirebaseUser }),
}));
vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ name: 'LearnCard' }),
}));
vi.mock('learn-card-base/helpers/authHelpers', () => ({ getAuthToken: () => 'real-token' }));
vi.mock('learn-card-base/stores/confirmationStore', () => ({
    default: { set: { showConfirmation: vi.fn() } },
}));
vi.mock('learn-card-base/stores/deletingAccountStore', () => ({
    default: { set: { deletingAccount: vi.fn() } },
}));
vi.mock('./DeleteAccountModal', () => ({ default: () => null }));
vi.mock('../svgs/WarningIcon', () => ({ default: () => null }));
vi.mock('../../i18n/TransP', () => ({ TransP: () => null }));

import DeleteUserConfirmationPrompt from './DeleteUserConfirmationPrompt';

const confirmAndDelete = (phrase: string): void => {
    fireEvent.change(screen.getByRole('textbox'), { target: { value: phrase } });
    fireEvent.click(screen.getByRole('button', { name: /delete forever/i }));
};

describe('DeleteUserConfirmationPrompt', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.calls = [];
        mocks.firebaseEmail = 'student@school.org';
        mocks.deleteFirebaseUser.mockImplementation(async () => {
            mocks.calls.push('firebase');
            return { success: true };
        });
        mocks.deleteMyClassLinkData.mockImplementation(async () => {
            mocks.calls.push('classlink');
            return { deleted: 1 };
        });
    });
    afterEach(cleanup);

    it('removes ClassLink data only after the Firebase user is deleted', async () => {
        render(<DeleteUserConfirmationPrompt handleCloseModal={vi.fn()} handleLogout={vi.fn()} />);
        confirmAndDelete('student@school.org');

        await waitFor(() => expect(mocks.calls).toEqual(['firebase', 'classlink']));
    });

    it('keeps the ClassLink link when Firebase needs a recent login', async () => {
        mocks.deleteFirebaseUser.mockResolvedValue({
            success: false,
            message: 'auth/requires-recent-login',
        });
        render(<DeleteUserConfirmationPrompt handleCloseModal={vi.fn()} handleLogout={vi.fn()} />);
        confirmAndDelete('student@school.org');

        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(mocks.deleteMyClassLinkData).not.toHaveBeenCalled();
    });

    it('logs a ClassLink cleanup failure and still completes deletion', async () => {
        mocks.deleteMyClassLinkData.mockRejectedValue(new Error('offline'));
        render(<DeleteUserConfirmationPrompt handleCloseModal={vi.fn()} handleLogout={vi.fn()} />);
        confirmAndDelete('student@school.org');

        await waitFor(() => expect(mocks.removeAllVCsFromWallet).toHaveBeenCalled());
        expect(mocks.log.error).toHaveBeenCalledWith('classlink.cleanup.failed', expect.any(Error));
    });

    it('never shows a synthetic ClassLink email as the confirmation phrase', () => {
        mocks.firebaseEmail = 'uid-1@users.classlink.invalid';
        render(<DeleteUserConfirmationPrompt handleCloseModal={vi.fn()} handleLogout={vi.fn()} />);

        expect(screen.queryByText(/users\.classlink\.invalid/)).toBeNull();
        expect(screen.getByText('DELETE')).toBeTruthy();
    });
});
