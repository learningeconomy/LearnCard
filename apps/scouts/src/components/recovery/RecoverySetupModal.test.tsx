// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';

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

// Mock paraglide messages
vi.mock('../../paraglide/messages.js', () => ({
    'recovery.setup.tabEmail': () => 'Email',
    'recovery.setup.tabPhrase': () => 'Phrase',
    'recovery.setup.tabBackup': () => 'Backup',
    'recovery.setup.tabPasskey': () => 'Passkey',
    'recovery.setup.passkey.setupBtn': () => 'Set Up Passkey',
    'recovery.setup.passkey.settingUp': () => 'Setting Up...',
    'recovery.setup.passkey.replaceBtn': () => 'Replace Passkey',
    'recovery.setup.passkey.replacing': () => 'Replacing...',
    'recovery.setup.backup.downloadAgain': () => 'Download Again',
    'recovery.setup.phrase.genNewBtn': () => 'Generate New Phrase',
    'recovery.setup.backup.genNewBtn': () => 'Generate New Backup',
    'recovery.setup.email.replaceBtn': () => 'Replace Email',
    'recovery.setup.email.replacing': () => 'Replacing...',
    'recovery.setup.phrase.genBtn': () => 'Generate Recovery Phrase',
    'recovery.setup.phrase.confirmBtn': () => 'Confirm Recovery Phrase',
    'recovery.setup.backup.genBtn': () => 'Generate Backup File',
    'recovery.setup.backup.downloadBtn': () => 'Download Backup File',
    'recovery.setup.backup.confirmBtn': () => 'Verify Backup File',
    'recovery.setup.email.sendCodeBtn': () => 'Send Verification Code',
    'recovery.setup.email.verifyCodeBtn': () => 'Verify Code',
    'recovery.setup.email.sendKeyBtn': () => 'Send Recovery Key',
    'recovery.setup.email.confirmKeyBtn': () => 'Confirm Recovery Key',
    'recovery.setup.phrase.verifyTitle': () => 'Verify your phrase',
    'recovery.setup.phrase.verifyDesc': () =>
        'Please enter the requested words from your recovery phrase to confirm you have saved it.',
    'recovery.setup.phrase.wordNumber': ({ number }: { number: number }) => `Word #${number}`,
    'recovery.setup.backup.reenterPassword': () => 'Re-enter password',
    'recovery.setup.backup.verifyDesc': () =>
        'Enter the password you just created to verify your backup file.',
    'recovery.setup.email.confirmationCodeSent': ({ email }: { email: string }) =>
        `We sent a confirmation code to ${email}. Please enter it below to verify you received the recovery key.`,
    'recovery.setup.email.codeLabel': () => 'Verification Code',
    'recovery.setup.email.codePlaceholder': () => '123456',
    'recovery.setup.backup.passPlaceholder': () => 'At least 8 characters',
    'recovery.setup.backup.confirmPlaceholder': () => 'Type it again',
    'recovery.setup.email.emailPlaceholder': () => 'personal@gmail.com',
    'recovery.setup.phrase.generating': () => 'Generating...',
    'recovery.setup.backup.generating': () => 'Generating...',
    'recovery.setup.email.sending': () => 'Sending...',
    'common.verifying': () => 'Verifying...',
    'recovery.setup.success.passkey': () => 'Passkey setup successful',
    'recovery.setup.success.phrase': () => 'Phrase setup successful',
    'recovery.setup.success.backup': () => 'Backup setup successful',
    'recovery.setup.success.email': () => 'Email setup successful',
    'recovery.setup.titleNew': () => 'Protect Your Account',
    'recovery.setup.descNew': () => 'Set up recovery methods',
    'recovery.setup.titleExisting': () => 'Account Recovery',
    'recovery.setup.descMethodsActive': ({ count }: { count: number }) => `${count} methods active`,
    'common.done': () => 'Done',
    'common.skipForNow': () => 'Skip for Now',
    'recovery.setup.phrase.savedRow': () => 'Phrase saved',
    'recovery.setup.backup.createdRow': () => 'Backup created',
    'recovery.setup.email.recoveryRow': ({ email }: { email: string }) =>
        `Recovery email: ${email}`,
    'recovery.setup.passkey.setUpRow': () => 'Passkey set up',
    'recovery.setup.changeBtn': () => 'Change',
    'recovery.setup.email.verifiedTitle': () => 'Email Verified',
    'recovery.setup.email.sendKeyDesc': () => 'Send recovery key description',
    'recovery.setup.email.keySentTitle': () => 'Recovery Key Sent',
    'recovery.setup.email.keySentDesc': ({ email }: { email: string }) =>
        `Recovery key sent to ${email}`,
    'recovery.setup.email.codeSent': () => 'Code sent',
    'recovery.setup.email.differentEmail': () => 'Use a different email',
    'recovery.setup.email.desc': () => 'Email description',
    'recovery.setup.email.recommended': () => 'Recommended',
    'recovery.setup.email.emailLabel': () => 'Recovery Email',
    'recovery.setup.backup.readyTitle': () => 'Backup Ready',
    'recovery.setup.backup.readyDesc': () => 'Backup ready description',
    'recovery.setup.backup.passLabel': () => 'Backup Password',
    'recovery.setup.backup.confirmLabel': () => 'Confirm Password',
    'recovery.setup.backup.desc': () => 'Backup description',
    'recovery.setup.phrase.yourPhrase': () => 'Your Recovery Phrase',
    'recovery.setup.phrase.copied': () => 'Copied!',
    'recovery.setup.phrase.copyBtn': () => 'Copy to Clipboard',
    'recovery.setup.phrase.keepSafe': () => 'Keep it safe',
    'recovery.setup.phrase.warningWritePaper': () => 'Write it on paper',
    'recovery.setup.phrase.warningNeverShare': () => 'Never share it',
    'recovery.setup.phrase.desc': () => 'Phrase description',
    'recovery.setup.passkey.bulletBiometric': () => 'Biometric',
    'recovery.setup.passkey.bulletNoPassword': () => 'No password',
    'recovery.setup.passkey.chromeOnly': () => 'Chrome only',
    'recovery.setup.passkey.desc': () => 'Passkey description',
    'recovery.setup.passkey.notSupported': () => 'Passkey not supported',
    'recovery.setup.hintOneMissing': () => 'One missing',
    'recovery.setup.hintMore': () => 'More missing',
    'common.cancel': () => 'Cancel',
}));

vi.mock('../../i18n/TransP', () => ({
    TransP: () => <span>TransP</span>,
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
    };

    render(<RecoverySetupModal {...props} />);
    return { onCompleted, props };
};

describe('RecoverySetupModal prompt integration', () => {
    afterEach(cleanup);
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

        fireEvent.click(screen.getByRole('button', { name: 'Confirm Recovery Phrase' }));
        expect(onCompleted).not.toHaveBeenCalled();

        const challengeInputs = screen.getAllByRole('textbox');
        expect(challengeInputs).toHaveLength(2);

        fireEvent.click(screen.getByRole('button', { name: 'Passkey' }));
        expect(screen.queryByRole('textbox')).toBeNull();

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
});
