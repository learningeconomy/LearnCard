import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// Stub URL methods that don't exist in happy-dom/jsdom
beforeAll(() => {
    if (!URL.createObjectURL) {
        URL.createObjectURL = vi.fn();
    }
    if (!URL.revokeObjectURL) {
        URL.revokeObjectURL = vi.fn();
    }
});

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@learncard/sss-key-manager', () => ({
    isWebAuthnSupported: () => true,
}));

vi.mock('@ionic/react', () => ({
    IonIcon: ({ className }: { className?: string }) => <span className={className} />,
}));

vi.mock('learn-card-base', async () => ({
    getLogger: () => ({ error: vi.fn() }),
    Toggle: (
        await import('../../../../../packages/learn-card-base/src/components/form-inputs/Toggle')
    ).default,
}));

import RecoverySetupModal from './RecoverySetupModal';
import { createRecoverySetupRunner } from '../../../../../packages/learn-card-base/src/auth-coordinator/recoverySetup';
import { createRecoveryPinActions } from '../../providers/recoveryPinActions';

const renderModal = (
    initialMethod: 'passkey' | 'phrase' | 'backup' | 'email',
    onCompleted = vi.fn(),
    overrides: Partial<React.ComponentProps<typeof RecoverySetupModal>> = {}
) => {
    const props: React.ComponentProps<typeof RecoverySetupModal> = {
        initialMethod,
        onCompleted,
        existingMethods: [],
        maskedRecoveryEmail: null,
        onSetupPasskey: vi.fn().mockResolvedValue('credential-id'),
        onGeneratePhrase: vi.fn().mockResolvedValue({
            phrase: 'one two three',
            challengeWordIndices: [0, 2],
        }),
        onConfirmPhrase: vi.fn().mockResolvedValue(undefined),
        onSetupBackup: vi.fn().mockResolvedValue('{}'),
        onConfirmBackup: vi.fn().mockResolvedValue(undefined),
        onAddRecoveryEmail: vi.fn().mockResolvedValue(undefined),
        onVerifyRecoveryEmail: vi.fn().mockResolvedValue({ maskedEmail: 'r***@example.com' }),
        onSetupEmailRecovery: vi.fn().mockResolvedValue(undefined),
        onConfirmEmailRecovery: vi.fn().mockResolvedValue(undefined),
        onClose: vi.fn(),
        ...overrides,
    };

    render(<RecoverySetupModal {...props} />);
    return { onCompleted, props };
};

describe('RecoverySetupModal prompt integration', () => {
    it.each([false, true])(
        'PIN settings (existing PIN: %s) retry activation without re-saving',
        async hasPin => {
            const activate = vi
                .fn()
                .mockRejectedValueOnce(new Error('offline'))
                .mockResolvedValue(undefined);
            const identity = {};
            const runner = createRecoverySetupRunner(
                () => ({ identity, needsActivation: true, activate }),
                vi.fn()
            );
            const save = vi.fn().mockResolvedValue(undefined);
            const actions = createRecoveryPinActions({
                runRecoverySetup: runner.run,
                resetRecoverySetup: runner.reset,
                setEscrowPin: save,
                clearEscrowPin: vi.fn(),
            });
            const getEnrollment = vi.fn().mockResolvedValue({
                state: 'enrolled',
                ...(hasPin ? { escrowPin: { state: 'enabled' } } : {}),
            });
            renderModal('email', vi.fn(), {
                onGetEscrowEnrollmentState: getEnrollment,
                onEnableEscrowRecovery: vi.fn(),
                onDisableEscrowRecovery: vi.fn(),
                onSetEscrowPin: actions.setEscrowPin,
                onClearEscrowPin: actions.clearEscrowPin,
            });
            fireEvent.click(
                await screen.findByRole('button', {
                    name: hasPin ? 'Change' : 'Set a recovery PIN',
                })
            );
            const enterPin = () =>
                fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
                    clipboardData: { getData: () => '135790' },
                });
            enterPin();
            enterPin();
            await waitFor(() => expect(activate).toHaveBeenCalledOnce());
            await waitFor(() =>
                expect(screen.getAllByLabelText(/PIN digit/)[0]).not.toBeDisabled()
            );
            expect(screen.getByText('Confirm your PIN')).toBeInTheDocument();
            expect(getEnrollment).toHaveBeenCalledOnce();
            enterPin();
            await waitFor(() =>
                expect(screen.queryByText('Confirm your PIN')).not.toBeInTheDocument()
            );
            expect(save).toHaveBeenCalledOnce();
            expect(activate).toHaveBeenCalledTimes(2);
            expect(getEnrollment).toHaveBeenCalledTimes(2);
        }
    );

    it('shows Set PIN pill when enrolled without a PIN and opens PIN entry', async () => {
        const onSetEscrowPin = vi.fn().mockResolvedValue(undefined);
        renderModal('email', vi.fn(), {
            onGetEscrowEnrollmentState: vi.fn().mockResolvedValue({ state: 'enrolled' }),
            onDisableEscrowRecovery: vi.fn(),
            onEnableEscrowRecovery: vi.fn(),
            onSetEscrowPin,
        });

        const setPinButton = await screen.findByRole('button', { name: 'Set a recovery PIN' });
        expect(setPinButton).toBeInTheDocument();

        fireEvent.click(setPinButton);
        expect(screen.getByText('Enter a 6-digit PIN')).toBeInTheDocument();
    });

    it('shows Change and Remove buttons when PIN is set', async () => {
        const onClearEscrowPin = vi.fn().mockResolvedValue(undefined);
        renderModal('email', vi.fn(), {
            onGetEscrowEnrollmentState: vi
                .fn()
                .mockResolvedValue({ state: 'enrolled', escrowPin: { state: 'enabled' } }),
            onDisableEscrowRecovery: vi.fn(),
            onEnableEscrowRecovery: vi.fn(),
            onSetEscrowPin: vi.fn(),
            onClearEscrowPin,
        });

        const changeButton = await screen.findByRole('button', { name: 'Change' });
        const removeButton = await screen.findByRole('button', { name: 'Remove PIN' });

        expect(changeButton).toBeInTheDocument();
        expect(removeButton).toBeInTheDocument();

        fireEvent.click(removeButton);
        expect(
            screen.getByText(/Are you sure you want to remove your recovery PIN/)
        ).toBeInTheDocument();
    });

    it.each(['enrolled', 'opted-out'] as const)('renders automatic recovery %s', async state => {
        renderModal('email', vi.fn(), {
            onGetEscrowEnrollmentState: vi.fn().mockResolvedValue(state),
            onDisableEscrowRecovery: vi.fn(),
            onEnableEscrowRecovery: vi.fn(),
        });
        expect(await screen.findByRole('switch')).toHaveAttribute(
            'aria-checked',
            String(state === 'enrolled')
        );
        expect(
            screen.getByText(state === 'enrolled' ? 'Restore after a 7-day wait' : 'Off')
        ).toBeInTheDocument();
    });

    it('confirms before disabling automatic recovery', async () => {
        const onDisableEscrowRecovery = vi.fn().mockResolvedValue(undefined);
        renderModal('email', vi.fn(), {
            onGetEscrowEnrollmentState: vi
                .fn()
                .mockResolvedValueOnce('enrolled')
                .mockResolvedValue('opted-out'),
            onDisableEscrowRecovery,
            onEnableEscrowRecovery: vi.fn(),
        });
        fireEvent.click(await screen.findByRole('switch'));
        expect(onDisableEscrowRecovery).not.toHaveBeenCalled();
        expect(
            screen.getByText(
                'Without automatic recovery, losing every device and every recovery method means losing your account.'
            )
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Turn off' }));
        await waitFor(() =>
            expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
        );
        expect(onDisableEscrowRecovery).toHaveBeenCalledOnce();
    });

    it('keeps automatic recovery on after a precondition failure', async () => {
        renderModal('email', vi.fn(), {
            onGetEscrowEnrollmentState: vi.fn().mockResolvedValue('enrolled'),
            onDisableEscrowRecovery: vi
                .fn()
                .mockRejectedValue(Object.assign(new Error('private details'), { status: 412 })),
            onEnableEscrowRecovery: vi.fn(),
        });
        fireEvent.click(await screen.findByRole('switch'));
        fireEvent.click(screen.getByRole('button', { name: 'Turn off' }));
        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Set up another recovery method first.'
        );
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('switch')).not.toBeDisabled();
        expect(screen.queryByText('private details')).not.toBeInTheDocument();
    });

    it.each(['opted-out', 'not-enrolled'] as const)(
        'enables automatic recovery from %s',
        async state => {
            const onEnableEscrowRecovery = vi.fn().mockResolvedValue({ enrolled: true });
            renderModal('email', vi.fn(), {
                onGetEscrowEnrollmentState: vi
                    .fn()
                    .mockResolvedValueOnce(state)
                    .mockResolvedValue('enrolled'),
                onDisableEscrowRecovery: vi.fn(),
                onEnableEscrowRecovery,
            });
            const toggle = await screen.findByRole('switch');
            fireEvent.click(toggle);
            await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
            expect(onEnableEscrowRecovery).toHaveBeenCalledOnce();
        }
    );
    it('keeps passkey setup open on activation failure and retries activation only', async () => {
        const { onCompleted, props } = renderModal('passkey');
        const activate = vi
            .fn()
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValue(undefined);
        const identity = {};
        const runner = createRecoverySetupRunner(
            () => ({ identity, needsActivation: true, activate }),
            vi.fn()
        );
        const setup = vi.fn().mockResolvedValue('credential-id');
        vi.mocked(props.onSetupPasskey).mockImplementation(() => runner.run('passkey', setup));

        fireEvent.click(screen.getByRole('button', { name: 'Set Up Passkey' }));
        await screen.findByText('Could not finish account setup. Please try again.');
        expect(onCompleted).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Set Up Passkey' }));
        await waitFor(() => expect(onCompleted).toHaveBeenCalledWith('passkey'));
        expect(setup).toHaveBeenCalledOnce();
        expect(activate).toHaveBeenCalledTimes(2);
    });

    it('retries activation after a consumed phrase confirmation without reporting early success', async () => {
        const { onCompleted, props } = renderModal('phrase');
        const activate = vi
            .fn()
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValue(undefined);
        const identity = {};
        const runner = createRecoverySetupRunner(
            () => ({ identity, needsActivation: true, activate }),
            vi.fn()
        );
        const confirm = vi.fn().mockResolvedValue(undefined);
        vi.mocked(props.onConfirmPhrase).mockImplementation(() => runner.run('phrase', confirm));

        fireEvent.click(screen.getByRole('button', { name: 'Generate Recovery Phrase' }));
        fireEvent.click(
            await screen.findByRole('button', { name: "I've Saved It Somewhere Safe" })
        );
        const inputs = screen.getAllByRole('textbox');
        fireEvent.change(inputs[0], { target: { value: 'one' } });
        fireEvent.change(inputs[1], { target: { value: 'three' } });
        fireEvent.click(screen.getByRole('button', { name: 'Confirm Recovery Phrase' }));
        await waitFor(() => expect(activate).toHaveBeenCalledOnce());
        await waitFor(() =>
            expect(
                screen.getByRole('button', { name: 'Confirm Recovery Phrase' })
            ).not.toBeDisabled()
        );
        expect(onCompleted).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Confirm Recovery Phrase' }));
        await waitFor(() => expect(onCompleted).toHaveBeenCalledWith('phrase'));
        expect(confirm).toHaveBeenCalledOnce();
        expect(activate).toHaveBeenCalledTimes(2);
    });

    it('opens on the requested passkey method and reports terminal completion', async () => {
        const { onCompleted, props } = renderModal('passkey');

        fireEvent.click(screen.getByRole('button', { name: 'Set Up Passkey' }));

        await waitFor(() => expect(props.onSetupPasskey).toHaveBeenCalledOnce());
        expect(onCompleted).toHaveBeenCalledWith('passkey');
    });

    it('waits for phrase confirmation before reporting completion', async () => {
        const { onCompleted, props } = renderModal('phrase');

        fireEvent.click(screen.getByRole('button', { name: 'Generate Recovery Phrase' }));
        await waitFor(() => expect(props.onGeneratePhrase).toHaveBeenCalledOnce());
        expect(onCompleted).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: "I've Saved It Somewhere Safe" }));
        expect(onCompleted).not.toHaveBeenCalled();

        const challengeInputs = screen.getAllByRole('textbox');
        expect(challengeInputs).toHaveLength(2);

        fireEvent.click(screen.getByRole('button', { name: 'Passkey' }));
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Phrase' }));

        const phraseInputs = screen.getAllByRole('textbox');
        fireEvent.change(phraseInputs[0], { target: { value: 'one' } });
        fireEvent.change(phraseInputs[1], { target: { value: 'three' } });
        fireEvent.click(screen.getByRole('button', { name: 'Confirm Recovery Phrase' }));

        await waitFor(() => expect(props.onConfirmPhrase).toHaveBeenCalledWith(['one', 'three']));
        expect(onCompleted).toHaveBeenCalledWith('phrase');
    });

    it('waits for backup download confirmation before reporting completion', async () => {
        const createObjectURL = vi.fn().mockReturnValue('blob:backup');
        const revokeObjectURL = vi.fn();
        vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
        const anchorClick = vi
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => {});
        const { onCompleted, props } = renderModal('backup');

        fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), {
            target: { value: 'secure-password' },
        });
        fireEvent.change(screen.getByPlaceholderText('Type it again'), {
            target: { value: 'secure-password' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Generate Backup File' }));

        await waitFor(() => expect(props.onSetupBackup).toHaveBeenCalledWith('secure-password'));
        expect(onCompleted).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Download Backup File' }));
        fireEvent.change(screen.getByPlaceholderText('Type it again'), {
            target: { value: 'secure-password' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Verify Backup File' }));

        expect(onCompleted).not.toHaveBeenCalled();
        await waitFor(() =>
            expect(props.onConfirmBackup).toHaveBeenCalledWith('{}', 'secure-password')
        );
        expect(onCompleted).toHaveBeenCalledWith('backup');
        vi.unstubAllGlobals();
        anchorClick.mockRestore();
    });

    it('reports email completion only after the recovery key is sent', async () => {
        const { onCompleted, props } = renderModal('email');

        fireEvent.change(screen.getByPlaceholderText('personal@gmail.com'), {
            target: { value: 'recovery@example.com' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Send Verification Code' }));
        await waitFor(() =>
            expect(props.onAddRecoveryEmail).toHaveBeenCalledWith('recovery@example.com')
        );
        expect(onCompleted).not.toHaveBeenCalled();

        fireEvent.change(screen.getByPlaceholderText('123456'), {
            target: { value: '123456' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Verify Code' }));
        await waitFor(() => expect(props.onVerifyRecoveryEmail).toHaveBeenCalledWith('123456'));
        expect(onCompleted).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Send Recovery Key' }));
        await waitFor(() => expect(props.onSetupEmailRecovery).toHaveBeenCalledOnce());
        expect(onCompleted).not.toHaveBeenCalled();

        fireEvent.change(screen.getByPlaceholderText('123456'), {
            target: { value: '654321' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Confirm Recovery Key' }));

        await waitFor(() => expect(props.onConfirmEmailRecovery).toHaveBeenCalledWith('654321'));
        expect(onCompleted).toHaveBeenCalledWith('email');
    });

    it('renders a close button that calls onClose even while activation is pending', () => {
        const onClose = vi.fn();
        renderModal('email', vi.fn(), { isActivationPending: true, onClose });

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));

        expect(onClose).toHaveBeenCalledOnce();
    });

    it('shows the update form when clicking Change on a fully protected account', async () => {
        renderModal('email', vi.fn(), {
            existingMethods: [
                { type: 'email', createdAt: '2023-01-01' },
                { type: 'phrase', createdAt: '2023-01-01' },
                { type: 'backup', createdAt: '2023-01-01' },
                { type: 'passkey', createdAt: '2023-01-01' },
            ],
        });

        expect(screen.getByText("You're fully protected.")).toBeInTheDocument();

        const changeButtons = screen.getAllByRole('button', { name: 'Change' });

        // Click Change on phrase (index 1)
        fireEvent.click(changeButtons[1]);
        expect(screen.getByRole('button', { name: 'Generate New Phrase' })).toBeInTheDocument();

        // Click Cancel
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(screen.getByText("You're fully protected.")).toBeInTheDocument();

        // Click Change on backup (index 2)
        fireEvent.click(changeButtons[2]);
        expect(screen.getByRole('button', { name: 'Generate New Backup' })).toBeInTheDocument();
    });
});
