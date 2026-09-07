import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@learncard/sss-key-manager', () => ({
    isWebAuthnSupported: () => true,
}));

vi.mock('@ionic/react', () => ({
    IonIcon: ({ className }: { className?: string }) => <span className={className} />,
}));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ error: vi.fn() }),
}));

import RecoverySetupModal from './RecoverySetupModal';

const renderModal = (
    initialMethod: 'passkey' | 'phrase' | 'backup' | 'email',
    onCompleted = vi.fn()
) => {
    const props: React.ComponentProps<typeof RecoverySetupModal> = {
        initialMethod,
        onCompleted,
        existingMethods: [],
        maskedRecoveryEmail: null,
        onSetupPasskey: vi.fn().mockResolvedValue('credential-id'),
        onGeneratePhrase: vi.fn().mockResolvedValue('one two three'),
        onSetupBackup: vi.fn().mockResolvedValue('{}'),
        onAddRecoveryEmail: vi.fn().mockResolvedValue(undefined),
        onVerifyRecoveryEmail: vi.fn().mockResolvedValue({ maskedEmail: 'r***@example.com' }),
        onSetupEmailRecovery: vi.fn().mockResolvedValue(undefined),
        onClose: vi.fn(),
    };

    render(<RecoverySetupModal {...props} />);
    return { onCompleted, props };
};

describe('RecoverySetupModal prompt integration', () => {
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
        expect(onCompleted).toHaveBeenCalledWith('phrase');
    });

    it('waits for backup download confirmation before reporting completion', async () => {
        const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:backup');
        const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
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
        fireEvent.click(screen.getByRole('button', { name: "I've Saved It Somewhere Safe" }));

        expect(onCompleted).toHaveBeenCalledWith('backup');
        createObjectURL.mockRestore();
        revokeObjectURL.mockRestore();
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
        expect(onCompleted).toHaveBeenCalledWith('email');
    });
});
