// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as m from '../../paraglide/messages.js';

type Continuity = {
    personalEmail: { allowed: boolean; reason?: string };
    emailVerified: boolean;
    maskedEmail?: string;
    maskedSignInEmail?: string;
    emailPrimary: boolean;
    signInEmailSource?: 'personal' | 'account';
    primaryUid?: string;
    hasSchoolEmail: boolean;
    contactStale: boolean;
    canRemove: boolean;
    hasServerConfirmedMethod: boolean;
    hasUserRecoveryMethod: boolean;
    pinState: 'none' | 'enabled' | 'locked' | 'stale';
    pinRecoverable: boolean;
    nextStep: 'confirmPin' | 'email' | 'pin' | 'method' | 'done';
    pinChangeRequired?: boolean;
};
type SetupOptions = {
    initialMethod: string;
    autoStart?: boolean;
    onCompleted: (method: string) => void;
    onClosed: () => void;
};
type PinStepProps = {
    title?: string;
    body?: string;
    embedded?: boolean;
    autoFocus?: boolean;
    setPin: (pin: string) => Promise<void>;
    onComplete: () => void;
    onSkip: () => void;
    onStepChange?: (step: 'enter' | 'confirm' | 'saving' | 'success') => void;
    saveErrorMessage?: (error: unknown) => string | undefined;
    allowSkip?: boolean;
    beforeInput?: React.ReactNode;
    inputDisabled?: boolean;
};

const mocks = vi.hoisted(() => ({
    continuity: undefined as Continuity | undefined,
    start: vi.fn(),
    verify: vi.fn(),
    remove: vi.fn(),
    invalidate: vi.fn(),
    refetch: vi.fn(),
    fetching: false,
    isStudent: true as boolean | undefined,
    openRecoverySetup: vi.fn(),
    openPinSetup: vi.fn(),
    setEscrowPin: vi.fn(),
    writeFlag: vi.fn(),
    pinStep: undefined as PinStepProps | undefined,
    track: vi.fn(),
    webAuthn: true,
    loading: false,
    presentAlert: vi.fn(),
    uid: 'uid-t',
    sessionEmail: 'me@example.org' as string | undefined,
    escrowEnrollment: 'enrolled' as string | undefined,
    confirmedContact: 'me@example.org' as string | undefined,
    refreshAccountContact: vi.fn(),
    resealEscrowContact: vi.fn(),
    rememberConfirmedContact: vi.fn(),
    confirmEscrowPin: vi.fn(),
    pendingContact: undefined as
        { expectedEmail?: string; customToken: string; primaryUid: string } | undefined,
    logout: vi.fn(),
    continuityOptions: undefined as { enabled?: boolean; applySignInToken?: unknown } | undefined,
    dataUpdatedAt: 1,
    authProvider: null as {
        getProviderType: () => string;
        getIdToken: () => Promise<string>;
    } | null,
    mutationOptions: {} as Record<string, { getIdToken?: () => Promise<string> } | undefined>,
}));

type AlertOptions = {
    message: string;
    buttons: { text: string; role?: string; handler?: () => void }[];
};

vi.mock('@ionic/react', () => ({ useIonAlert: () => [mocks.presentAlert] }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@learncard/sss-key-manager', () => ({ isWebAuthnSupported: () => mocks.webAuthn }));
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({
        invalidateQueries: mocks.invalidate,
        refetchQueries: mocks.refetch,
    }),
}));
vi.mock('learn-card-base', () => ({
    useClassLinkAccountContinuity: (options: { enabled?: boolean; applySignInToken?: unknown }) => {
        mocks.continuityOptions = options;
        return {
            data: mocks.continuity,
            isLoading: mocks.loading,
            isFetching: mocks.fetching,
            isSuccess: !mocks.loading && !!mocks.continuity,
            dataUpdatedAt: mocks.dataUpdatedAt,
        };
    },
    useSchoolConnection: () => ({
        data: mocks.isStudent === undefined ? undefined : { isStudent: mocks.isStudent },
        isLoading: false,
    }),
    useStartPersonalEmail: (options?: { getIdToken?: () => Promise<string> }) => {
        mocks.mutationOptions.start = options;
        return { mutateAsync: mocks.start, isPending: false };
    },
    useVerifyPersonalEmail: (options?: { getIdToken?: () => Promise<string> }) => {
        mocks.mutationOptions.verify = options;
        return { mutateAsync: mocks.verify, isPending: false };
    },
    useRemovePersonalEmail: (options?: { getIdToken?: () => Promise<string> }) => {
        mocks.mutationOptions.remove = options;
        return { mutateAsync: mocks.remove, isPending: false };
    },
    getSSSConfig: () => ({ escrowEnclaveMode: 'nitro' }),
    isSameEscrowPinError: (error: unknown) =>
        error instanceof Error && error.name === 'SameEscrowPinError',
    isEscrowContactNotConfirmedError: (error: unknown) =>
        error instanceof Error && error.name === 'EscrowContactNotConfirmedError',
}));
vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({
        state: {
            status: 'ready',
            did: 'did:key:z6MkKeep',
            authUser: { id: mocks.uid, email: mocks.sessionEmail },
            escrowEnrollment: mocks.escrowEnrollment,
        },
        openRecoverySetup: mocks.openRecoverySetup,
        openPinSetup: mocks.openPinSetup,
        setEscrowPin: mocks.setEscrowPin,
        refreshAccountContact: mocks.refreshAccountContact,
        resealEscrowContact: mocks.resealEscrowContact,
        rememberConfirmedContact: mocks.rememberConfirmedContact,
        confirmEscrowPin: mocks.confirmEscrowPin,
        getConfirmedContact: () => mocks.confirmedContact,
        getPendingAccountContact: () => mocks.pendingContact,
        authProvider: mocks.authProvider,
    }),
}));
vi.mock('../../hooks/useLogout', () => ({
    default: () => ({ handleLogout: mocks.logout }),
}));
vi.mock('../recovery/recoveryPinPromptFlag', () => ({
    writeRecoveryPinPromptFlag: mocks.writeFlag,
}));
vi.mock('../onboarding/v2/RecoveryPinStep', () => ({
    RecoveryPinStep: (props: PinStepProps) => {
        mocks.pinStep = props;
        return (
            <div data-testid="pin-step">
                <h2>{props.title}</h2>
                <p>{props.body}</p>
                {props.beforeInput}
            </div>
        );
    },
}));
vi.mock('@analytics', () => ({
    useAnalytics: () => ({ track: mocks.track }),
    AnalyticsEvents: {
        KEEP_ACCOUNT_SHOWN: 'shown',
        KEEP_ACCOUNT_STEP_COMPLETED: 'completed',
        KEEP_ACCOUNT_DISMISSED: 'dismissed',
    },
}));

import {
    KeepAccountStep,
    KEEP_ACCOUNT_SAVED_MS,
    resetKeepAccountSilentReseal,
    type KeepAccountStepProps,
} from './KeepAccountStep';
import { RESEND_COOLDOWN_SECONDS, isolateLtr } from './PersonalEmailForm';

const state = (overrides: Partial<Continuity> = {}): Continuity => ({
    personalEmail: { allowed: true },
    emailVerified: false,
    emailPrimary: false,
    primaryUid: 'uid-t',
    hasSchoolEmail: true,
    contactStale: false,
    canRemove: true,
    hasServerConfirmedMethod: false,
    hasUserRecoveryMethod: false,
    pinState: 'enabled',
    pinRecoverable: true,
    nextStep: 'email',
    ...overrides,
});
const VERIFIED = {
    emailVerified: true,
    emailPrimary: true,
    maskedEmail: 'm***@example.org',
};
/** No escrow (e.g. a placeholder-email account): a passkey or phrase is the only way. */
const METHOD = state({
    ...VERIFIED,
    pinState: 'none',
    pinRecoverable: false,
    nextStep: 'method',
});
const PIN = state({
    ...VERIFIED,
    hasServerConfirmedMethod: true,
    pinState: 'none',
    pinRecoverable: false,
    nextStep: 'pin',
});
/** Escrow + an enabled PIN: email code + PIN recovers it. */
const DONE = state({ ...VERIFIED, hasServerConfirmedMethod: true, nextStep: 'done' });
const DONE_METHOD = { ...METHOD, hasUserRecoveryMethod: true, nextStep: 'done' as const };
/**
 * T already signs in with its own real email (`signInEmailSource: 'account'`): done with no
 * stored personal email, so only `maskedSignInEmail` names an address.
 */
const ACCOUNT_DONE = state({
    emailVerified: false,
    emailPrimary: false,
    maskedSignInEmail: 'a***@example.com',
    signInEmailSource: 'account',
    canRemove: false,
    hasSchoolEmail: false,
    hasServerConfirmedMethod: true,
    nextStep: 'done',
});
/** The same, with no address the server can name at all. */
const NO_ADDRESS_DONE = { ...ACCOUNT_DONE, maskedSignInEmail: undefined };
const SIGN_IN_MASKED = isolateLtr('a***@example.com');
/** A PIN account whose backup still names the old contact. */
const CONFIRM = state({
    ...VERIFIED,
    hasServerConfirmedMethod: true,
    contactStale: true,
    nextStep: 'confirmPin',
});
const VERIFY_RESULT = {
    success: true,
    verified: true,
    primary: true,
    primaryUid: 'uid-t',
    customToken: 'token-t',
};
const named = (name: string, extra: Record<string, unknown> = {}): Error =>
    Object.assign(new Error(name), { name, ...extra });

/** Types a whole PIN into the confirm's boxes (the last digit submits). */
const enterPin = async (pin: string): Promise<void> => {
    await act(async () => {
        for (let i = 0; i < pin.length; i += 1) {
            fireEvent.change(screen.getByLabelText(`PIN digit ${i + 1}`), {
                target: { value: pin[i] },
            });
        }
    });
};

const renderStep = (props: Partial<KeepAccountStepProps> = {}) => {
    const callbacks = {
        onComplete: vi.fn(),
        onDismiss: vi.fn(),
        onBeforeOverlay: vi.fn(),
        onOverlayComplete: vi.fn(),
    };
    const view = render(
        <KeepAccountStep variant="sheet" source="dashboard" {...callbacks} {...props} />
    );
    return { ...callbacks, ...view };
};

const sendCode = async (email = 'me@example.org'): Promise<void> => {
    fireEvent.change(screen.getByTestId('classlink-email-input'), { target: { value: email } });
    await act(async () => {
        fireEvent.click(screen.getByTestId('classlink-email-submit'));
    });
};

/** Types a whole code the way OS one-time-code autofill does; it submits itself. */
const enterCode = async (code = '123456'): Promise<void> => {
    await act(async () => {
        fireEvent.change(screen.getByLabelText('Code digit 1'), { target: { value: code } });
    });
};

const verifyEmail = async (): Promise<void> => {
    await sendCode();
    await enterCode();
};

const lastAlert = (): AlertOptions => mocks.presentAlert.mock.calls.at(-1)?.[0] as AlertOptions;
const MASKED = isolateLtr('m***@example.org');

beforeEach(() => {
    vi.clearAllMocks();
    mocks.authProvider = null;
    mocks.mutationOptions = {};
    mocks.continuity = state();
    mocks.webAuthn = true;
    mocks.loading = false;
    mocks.pinStep = undefined;
    mocks.fetching = false;
    mocks.isStudent = true;
    mocks.uid = 'uid-t';
    mocks.sessionEmail = 'me@example.org';
    mocks.escrowEnrollment = 'enrolled';
    mocks.confirmedContact = 'me@example.org';
    mocks.pendingContact = undefined;
    mocks.continuityOptions = undefined;
    mocks.dataUpdatedAt = 1;
    mocks.refetch.mockResolvedValue(undefined);
    mocks.start.mockResolvedValue({ success: true });
    mocks.verify.mockResolvedValue(VERIFY_RESULT);
    mocks.remove.mockResolvedValue({ success: true, removed: true, customToken: 'token-r' });
    mocks.refreshAccountContact.mockResolvedValue('ok');
    mocks.resealEscrowContact.mockResolvedValue(undefined);
    mocks.confirmEscrowPin.mockResolvedValue(undefined);
    resetKeepAccountSilentReseal();
});
afterEach(cleanup);

describe('KeepAccountStep', () => {
    it('starts at the email step with a note on what is stored', () => {
        renderStep();
        expect(screen.getByTestId('keep-account-step').dataset.step).toBe('email');
        // The note sits right under the field it is about, before any button.
        const note = screen.getByText(m['classlinkKeepAccount.storedNote']());
        expect(document.querySelector('form')?.contains(note)).toBe(true);
        // Not a live region: the resend countdown must not be read out every second.
        expect(screen.getByTestId('keep-account-step').getAttribute('aria-live')).toBeNull();
        // The address becomes the sign-in email, and the copy says so.
        expect(screen.getByText(m['classlinkKeepAccount.body']())).toBeTruthy();
        expect(mocks.track).toHaveBeenCalledWith('shown', { source: 'dashboard', step: 'email' });
    });

    it('verifies the email with one code and tracks no address', async () => {
        renderStep();
        await verifyEmail();
        expect(mocks.start).toHaveBeenCalledWith({ email: 'me@example.org' });
        expect(mocks.verify).toHaveBeenCalledWith({ email: 'me@example.org', code: '123456' });
        expect(mocks.track).toHaveBeenCalledWith('completed', {
            source: 'dashboard',
            step: 'code',
        });
        expect(JSON.stringify(mocks.track.mock.calls)).not.toContain('me@example.org');
    });

    it('asks for a different email when another account already uses it', async () => {
        mocks.verify.mockRejectedValueOnce(
            Object.assign(new Error('x'), { data: { code: 'CONFLICT' } })
        );
        renderStep();
        await verifyEmail();
        // Like any other email error: under the field, with the address kept.
        const input = screen.getByTestId('classlink-email-input') as HTMLInputElement;
        expect(input.value).toBe('me@example.org');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(
            document.getElementById(input.getAttribute('aria-describedby') ?? '')?.textContent
        ).toBe(m['classlinkKeepAccount.sharedEmail']());
        expect(document.activeElement).toBe(input);
    });

    it('shows Finishing… and signs back in with the custom token before anything else', async () => {
        let settle: (value: 'ok') => void = () => undefined;
        mocks.refreshAccountContact.mockReturnValueOnce(
            new Promise<'ok'>(resolve => (settle = resolve))
        );
        mocks.continuity = state();
        const { rerender } = renderStep();
        await verifyEmail();
        // The address is remembered as confirmed on this device first.
        expect(mocks.rememberConfirmedContact).toHaveBeenCalledWith('me@example.org');
        expect(mocks.refreshAccountContact).toHaveBeenCalledWith({
            expectedEmail: 'me@example.org',
            customToken: 'token-t',
            primaryUid: 'uid-t',
        });
        expect(screen.getByTestId('keep-account-step').dataset.step).toBe('finishing');
        expect(
            screen.getByRole('heading', { name: m['classlinkKeepAccount.finishing']() })
        ).toBeTruthy();
        // Still working: a spinner, not a check mark.
        expect(screen.getByTestId('keep-account-busy-icon')).toBeTruthy();
        // The server's next answer is in, but no PIN screen until the session is back.
        mocks.continuity = PIN;
        rerender(<KeepAccountStep variant="sheet" source="dashboard" />);
        expect(screen.queryByTestId('pin-step')).toBeNull();
        expect(mocks.refetch).not.toHaveBeenCalled();
        await act(async () => settle('ok'));
        expect(mocks.refetch).toHaveBeenCalledWith({ queryKey: ['classlinkAccountContinuity'] });
        expect(screen.getByTestId('pin-step')).toBeTruthy();
    });

    it('a mismatch after verify shows the error with Try again, and never an escrow call', async () => {
        mocks.refreshAccountContact.mockResolvedValueOnce('mismatch');
        renderStep();
        await verifyEmail();
        expect(screen.getByTestId('keep-account-step').dataset.step).toBe('finishFailed');
        // Says the change was made, and offers no "Not now": this login was signed out.
        expect(screen.getByTestId('keep-account-finish-failed').textContent).toBe(
            m['classlinkKeepAccount.finishFailed']()
        );
        expect(screen.queryByTestId('keep-account-not-now')).toBeNull();
        expect(screen.getByTestId('keep-account-finish-sign-out')).toBeTruthy();
        expect(mocks.refetch).not.toHaveBeenCalled();
        expect(mocks.setEscrowPin).not.toHaveBeenCalled();
        expect(mocks.resealEscrowContact).not.toHaveBeenCalled();
        await act(async () => {
            fireEvent.click(screen.getByTestId('keep-account-finish-retry'));
        });
        expect(mocks.refreshAccountContact).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId('keep-account-step').dataset.step).not.toBe('finishFailed');
    });

    it('does not sign another login of the account back in after verify', async () => {
        mocks.uid = 'uid-other';
        renderStep();
        await verifyEmail();
        expect(mocks.refreshAccountContact).not.toHaveBeenCalled();
        expect(mocks.refetch).toHaveBeenCalled();
    });

    it('asks for a PIN in place after the email when escrow has none, never a passkey', async () => {
        mocks.continuity = PIN;
        const { onBeforeOverlay } = renderStep();
        expect(screen.getByTestId('keep-account-step').dataset.step).toBe('pin');
        expect(screen.getByText(m['classlinkKeepAccount.pinTitle']())).toBeTruthy();
        expect(screen.getByText(m['classlinkKeepAccount.pinBody']())).toBeTruthy();
        expect(screen.queryByTestId('keep-account-method')).toBeNull();
        expect(mocks.pinStep?.embedded).toBe(true);
        // The boxes take focus as the screen swaps in, so the keyboard stays up.
        expect(mocks.pinStep?.autoFocus).toBe(true);
        expect(mocks.pinStep?.setPin).toBe(mocks.setEscrowPin);
        // One way out at a time: "Not now" goes once the PIN is being confirmed.
        expect(screen.getByTestId('keep-account-not-now')).toBeTruthy();
        act(() => mocks.pinStep?.onStepChange?.('confirm'));
        expect(screen.queryByTestId('keep-account-not-now')).toBeNull();

        act(() => mocks.pinStep?.onComplete());
        expect(mocks.writeFlag).toHaveBeenCalledWith('did:key:z6MkKeep', 'set');
        expect(mocks.track).toHaveBeenCalledWith('completed', { source: 'dashboard', step: 'pin' });
        expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ['classlinkAccountContinuity'] });
        // Inline: the host sheet stays open and no overlay opens.
        expect(onBeforeOverlay).not.toHaveBeenCalled();
        expect(mocks.openPinSetup).not.toHaveBeenCalled();
        expect(mocks.openRecoverySetup).not.toHaveBeenCalled();
    });

    it.each(['stale', 'none'] as const)('creates a new PIN in place when it is %s', pinState => {
        mocks.continuity = { ...PIN, pinState };
        renderStep();
        expect(screen.getByTestId('pin-step')).toBeTruthy();
    });

    it('says a locked PIN is locked, and opens the new-PIN overlay with the same words', async () => {
        mocks.continuity = { ...PIN, pinState: 'locked' as const };
        const { onBeforeOverlay, onOverlayComplete } = renderStep();
        expect(screen.queryByTestId('pin-step')).toBeNull();
        expect(
            screen.getByRole('heading', { name: m['recovery.pin.pinLocked.title']() })
        ).toBeTruthy();
        // The banner's words: the PIN is for signing in on a new device.
        expect(screen.getByText(m['classlinkKeepAccount.banner.pinLockedBody']())).toBeTruthy();
        expect(screen.getByTestId('keep-account-pin-reset').textContent).toBe(
            m['recovery.pin.pinLocked.action']()
        );
        fireEvent.click(screen.getByTestId('keep-account-pin-reset'));
        expect(onBeforeOverlay).toHaveBeenCalledTimes(1);
        expect(mocks.openPinSetup).toHaveBeenCalledTimes(1);
        const options = mocks.openPinSetup.mock.calls[0][0];
        expect(options.reason).toBe('pin-locked');
        expect(onBeforeOverlay.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.openPinSetup.mock.invocationCallOrder[0]
        );

        // The host reopens only once the server's new answer is in.
        let settle: () => void = () => undefined;
        mocks.refetch.mockReturnValueOnce(new Promise<void>(resolve => (settle = resolve)));
        await act(async () => options.onComplete());
        expect(mocks.refetch).toHaveBeenCalledWith({ queryKey: ['classlinkAccountContinuity'] });
        expect(onOverlayComplete).not.toHaveBeenCalled();
        await act(async () => settle());
        expect(onOverlayComplete).toHaveBeenCalledTimes(1);
    });

    it('without escrow, starts the passkey prompt directly after closing the host sheet', async () => {
        mocks.continuity = METHOD;
        const { onBeforeOverlay, onOverlayComplete } = renderStep();
        fireEvent.click(screen.getByTestId('keep-account-method'));
        expect(onBeforeOverlay).toHaveBeenCalledTimes(1);
        expect(mocks.openRecoverySetup).toHaveBeenCalledTimes(1);
        const options = mocks.openRecoverySetup.mock.calls[0][0] as SetupOptions;
        expect(options.initialMethod).toBe('passkey');
        expect(options.autoStart).toBe(true);
        expect(onBeforeOverlay.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.openRecoverySetup.mock.invocationCallOrder[0]
        );

        await act(async () => options.onCompleted('passkey'));
        expect(mocks.refetch).toHaveBeenCalledWith({ queryKey: ['classlinkAccountContinuity'] });
        expect(mocks.track).toHaveBeenCalledWith('completed', {
            source: 'dashboard',
            step: 'method',
        });
        // The host reopens the step, which then confirms in place.
        expect(onOverlayComplete).toHaveBeenCalledTimes(1);
    });

    it('falls back to a recovery phrase where passkeys are unavailable', () => {
        mocks.continuity = METHOD;
        mocks.webAuthn = false;
        renderStep();
        expect(screen.getByText(m['classlinkKeepAccount.addPhrase']())).toBeTruthy();
        fireEvent.click(screen.getByTestId('keep-account-method'));
        expect(mocks.openRecoverySetup.mock.calls[0][0].initialMethod).toBe('phrase');
    });

    it('asks for a passkey or phrase instead of a PIN where escrow cannot enroll', () => {
        mocks.continuity = PIN;
        mocks.escrowEnrollment = 'not-enrolled';
        renderStep();
        expect(screen.getByTestId('keep-account-step').dataset.step).toBe('method');
        expect(screen.queryByTestId('pin-step')).toBeNull();
    });

    describe('confirm the current PIN', () => {
        it('is a single PIN entry naming the session address; a wrong PIN keeps it open', async () => {
            mocks.continuity = CONFIRM;
            renderStep();
            expect(screen.getByTestId('keep-account-step').dataset.step).toBe('confirmPin');
            expect(
                screen.getByRole('heading', { name: m['classlinkKeepAccount.confirmPinTitle']() })
            ).toBeTruthy();
            expect(
                screen.getByText(
                    m['classlinkKeepAccount.confirmPinBody']({
                        email: isolateLtr('me@example.org'),
                    })
                )
            ).toBeTruthy();
            // The device already confirmed the address: no re-type.
            expect(screen.queryByTestId('keep-account-confirm-email')).toBeNull();
            mocks.confirmEscrowPin.mockRejectedValueOnce(named('EscrowPinMismatchError'));
            await enterPin('482915');
            expect(mocks.confirmEscrowPin).toHaveBeenCalledWith({
                pin: '482915',
                primaryUid: 'uid-t',
                pinChangeRequired: false,
            });
            expect(screen.getByText(m['classlinkKeepAccount.pinMismatch']())).toBeTruthy();
            expect(screen.getByTestId('keep-account-confirm-pin')).toBeTruthy();
            expect(mocks.pinStep).toBeUndefined();

            let settle: () => void = () => undefined;
            mocks.refetch.mockReturnValueOnce(new Promise<void>(resolve => (settle = resolve)));
            await enterPin('593827');
            expect(mocks.confirmEscrowPin).toHaveBeenCalledTimes(2);
            expect(mocks.track).toHaveBeenCalledWith('completed', {
                source: 'dashboard',
                step: 'confirmPin',
            });
            expect(mocks.refetch).toHaveBeenCalledWith({
                queryKey: ['classlinkAccountContinuity'],
            });
            // Until the server's next answer is in, the filled boxes stay disabled.
            expect((screen.getByLabelText('PIN digit 1') as HTMLInputElement).disabled).toBe(true);
            await act(async () => settle());
        });

        it('choose a new PIN sets one with setEscrowPin, and the same PIN asks again', async () => {
            mocks.continuity = CONFIRM;
            renderStep();
            fireEvent.click(screen.getByTestId('keep-account-confirm-new-instead'));
            expect(screen.getByTestId('keep-account-confirm-new-pin')).toBeTruthy();
            // Names the address the new PIN's backup is sealed to.
            expect(mocks.pinStep?.body).toBe(
                m['classlinkKeepAccount.newPinBody']({ email: isolateLtr('me@example.org') })
            );
            // The new PIN runs the same gates as the confirm (T's session, confirmed address).
            await act(async () => {
                await mocks.pinStep?.setPin('111111');
            });
            expect(mocks.setEscrowPin).toHaveBeenCalledWith('111111', { primaryUid: 'uid-t' });
            // The same PIN is refused with the reason, not the body again.
            expect(mocks.pinStep?.saveErrorMessage?.(named('SameEscrowPinError'))).toBe(
                m['recovery.pin.samePin']()
            );
            expect(mocks.pinStep?.saveErrorMessage?.(new Error('down'))).toBeUndefined();
            // "Skip for now" would only go back: the way back is its own action.
            expect(mocks.pinStep?.allowSkip).toBe(false);
            act(() => mocks.pinStep?.onComplete());
            expect(mocks.writeFlag).toHaveBeenCalledWith('did:key:z6MkKeep', 'set');
        });

        it('choose a new PIN can go back to the current PIN, and hides "Not now" once typing', () => {
            mocks.continuity = CONFIRM;
            renderStep();
            fireEvent.click(screen.getByTestId('keep-account-confirm-new-instead'));
            expect(screen.getByTestId('keep-account-not-now')).toBeTruthy();
            act(() => mocks.pinStep?.onStepChange?.('confirm'));
            expect(screen.queryByTestId('keep-account-not-now')).toBeNull();
            fireEvent.click(screen.getByTestId('keep-account-confirm-use-current'));
            expect(screen.getByTestId('keep-account-confirm-pin')).toBeTruthy();
            // A PIN that can no longer be confirmed has no way back.
            cleanup();
            mocks.continuity = { ...CONFIRM, pinChangeRequired: true };
            renderStep();
            expect(screen.getByTestId('keep-account-confirm-new-pin')).toBeTruthy();
            expect(screen.queryByTestId('keep-account-confirm-use-current')).toBeNull();
        });

        it('choose a new PIN asks for the sign-in email first when this device never confirmed it', async () => {
            mocks.continuity = { ...CONFIRM, pinChangeRequired: true };
            mocks.confirmedContact = undefined;
            renderStep();
            // The address is not shown: the user types it.
            expect(mocks.pinStep?.body).toBe(m['classlinkKeepAccount.samePinRejected']());
            expect(screen.queryByText('me@example.org', { exact: false })).toBeNull();
            const email = screen.getByTestId('keep-account-confirm-email');
            expect(document.activeElement).toBe(email);
            expect(mocks.pinStep?.inputDisabled).toBe(true);
            fireEvent.change(email, { target: { value: 'Me@Example.org' } });
            expect(mocks.pinStep?.inputDisabled).toBe(false);
            await act(async () => {
                await mocks.pinStep?.setPin('111111');
            });
            expect(mocks.setEscrowPin).toHaveBeenCalledWith('111111', {
                primaryUid: 'uid-t',
                retypedEmail: 'Me@Example.org',
            });
            // A wrong address is refused by the coordinator and said so.
            expect(
                mocks.pinStep?.saveErrorMessage?.(
                    named('EscrowContactNotConfirmedError', { reason: 'unconfirmed' })
                )
            ).toBe(m['classlinkKeepAccount.confirmRetypeEmailMismatch']());
        });

        it('a PIN that can no longer be confirmed goes straight to a new PIN', async () => {
            mocks.continuity = CONFIRM;
            renderStep();
            mocks.confirmEscrowPin.mockRejectedValueOnce(named('PinChangeRequiredError'));
            await enterPin('593827');
            expect(screen.getByTestId('keep-account-confirm-new-pin')).toBeTruthy();
            cleanup();
            mocks.continuity = { ...CONFIRM, pinChangeRequired: true };
            renderStep();
            expect(screen.getByTestId('keep-account-confirm-new-pin')).toBeTruthy();
        });

        it('asks to re-type the sign-in email when this device never confirmed it', async () => {
            mocks.continuity = CONFIRM;
            mocks.confirmedContact = undefined;
            renderStep();
            const email = screen.getByTestId('keep-account-confirm-email');
            expect(email.getAttribute('dir')).toBe('ltr');
            fireEvent.change(email, { target: { value: 'Me@Example.org' } });
            await enterPin('593827');
            expect(mocks.confirmEscrowPin).toHaveBeenCalledWith({
                pin: '593827',
                primaryUid: 'uid-t',
                retypedEmail: 'Me@Example.org',
                pinChangeRequired: false,
            });
        });

        it('says the hourly limit was reached', async () => {
            mocks.continuity = CONFIRM;
            renderStep();
            mocks.confirmEscrowPin.mockRejectedValueOnce(named('EscrowPinThrottledError'));
            await enterPin('593827');
            expect(screen.getByText(m['classlinkKeepAccount.confirmPinThrottled']())).toBeTruthy();
        });

        it('on another login of the account, asks to sign in with the sign-in email instead', () => {
            mocks.continuity = CONFIRM;
            mocks.uid = 'uid-other';
            mocks.confirmedContact = undefined;
            renderStep();
            expect(screen.getByTestId('keep-account-step').dataset.step).toBe('otherUid');
            expect(screen.getByTestId('keep-account-other-uid').textContent).toBe(
                m['classlinkKeepAccount.finishOnSignInEmail']({ email: MASKED })
            );
            expect(screen.queryByTestId('keep-account-confirm-pin')).toBeNull();
            expect(mocks.confirmEscrowPin).not.toHaveBeenCalled();
        });

        it("names T's sign-in email, not a stored alias, on another login", () => {
            mocks.continuity = { ...CONFIRM, maskedSignInEmail: 'a***@example.com' };
            mocks.uid = 'uid-other';
            mocks.confirmedContact = undefined;
            renderStep();
            expect(screen.getByTestId('keep-account-other-uid').textContent).toBe(
                m['classlinkKeepAccount.finishOnSignInEmail']({ email: SIGN_IN_MASKED })
            );
        });

        it('names the full sign-in email on another login when this device typed it', () => {
            mocks.continuity = CONFIRM;
            mocks.uid = 'uid-other';
            mocks.confirmedContact = 'me@example.org';
            renderStep({ variant: 'inline' });
            expect(screen.getByTestId('keep-account-other-uid').textContent).toBe(
                m['classlinkKeepAccount.finishOnSignInEmail']({
                    email: isolateLtr('me@example.org'),
                })
            );
            // The row's title says what it finishes, not "Enter your PIN".
            expect(screen.getByText(m['classlinkKeepAccount.finishRowTitle']())).toBeTruthy();
            expect(screen.queryByText(m['classlinkKeepAccount.confirmPinTitle']())).toBeNull();
        });

        it('leaves the address out of the body while it must be typed, and waits for it', async () => {
            mocks.continuity = CONFIRM;
            mocks.confirmedContact = undefined;
            renderStep();
            expect(screen.getByText(m['classlinkKeepAccount.confirmPinBodyRetype']())).toBeTruthy();
            expect(screen.queryByText('me@example.org', { exact: false })).toBeNull();
            const email = screen.getByTestId('keep-account-confirm-email');
            expect(document.activeElement).toBe(email);
            // The PIN boxes wait for the email.
            expect((screen.getByLabelText('PIN digit 1') as HTMLInputElement).disabled).toBe(true);
            fireEvent.change(email, { target: { value: 'me@example.org' } });
            expect((screen.getByLabelText('PIN digit 1') as HTMLInputElement).disabled).toBe(false);
        });
    });

    it('re-seals an account without a PIN silently, once per session, on the sign-in login only', () => {
        mocks.continuity = { ...DONE, pinState: 'none', contactStale: true };
        const { rerender } = renderStep();
        expect(mocks.resealEscrowContact).toHaveBeenCalledWith({ primaryUid: 'uid-t' });
        rerender(<KeepAccountStep variant="sheet" source="dashboard" />);
        cleanup();
        renderStep();
        expect(mocks.resealEscrowContact).toHaveBeenCalledTimes(1);

        resetKeepAccountSilentReseal();
        cleanup();
        mocks.uid = 'uid-other';
        renderStep();
        expect(mocks.resealEscrowContact).toHaveBeenCalledTimes(1);
    });

    it('re-seals silently again when the sign-in email changes', () => {
        mocks.continuity = { ...DONE, pinState: 'none', contactStale: true };
        renderStep();
        expect(mocks.resealEscrowContact).toHaveBeenCalledTimes(1);
        cleanup();
        mocks.sessionEmail = 'new@example.org';
        mocks.confirmedContact = 'new@example.org';
        renderStep();
        expect(mocks.resealEscrowContact).toHaveBeenCalledTimes(2);
    });

    describe('no PIN, and this device never confirmed the sign-in email', () => {
        // After a removal: the school email is back, but this device never typed it.
        const STALE_NO_PIN = {
            ...DONE,
            pinState: 'none' as const,
            pinRecoverable: false,
            hasUserRecoveryMethod: true,
            contactStale: true,
        };

        beforeEach(() => {
            mocks.sessionEmail = 'student@school.edu';
            mocks.confirmedContact = 'me@example.org';
        });

        it('asks to type the sign-in email instead of failing silently', async () => {
            mocks.continuity = STALE_NO_PIN;
            const { rerender } = renderStep();
            expect(screen.getByTestId('keep-account-step').dataset.step).toBe('confirmEmail');
            expect(mocks.resealEscrowContact).not.toHaveBeenCalled();
            // The address is never shown: the user types it.
            expect(screen.queryByText('student@school.edu', { exact: false })).toBeNull();
            const input = screen.getByTestId('keep-account-confirm-email');
            expect(document.activeElement).toBe(input);

            mocks.resealEscrowContact.mockRejectedValueOnce(
                named('EscrowContactNotConfirmedError', { reason: 'unconfirmed' })
            );
            fireEvent.change(input, { target: { value: 'me@example.org' } });
            await act(async () => {
                fireEvent.click(screen.getByTestId('keep-account-confirm-email-submit'));
            });
            expect(mocks.resealEscrowContact).toHaveBeenCalledWith({
                primaryUid: 'uid-t',
                retypedEmail: 'me@example.org',
            });
            expect(screen.getByRole('alert').textContent).toBe(
                m['classlinkKeepAccount.confirmRetypeEmailMismatch']()
            );

            fireEvent.change(input, { target: { value: 'Student@School.edu' } });
            await act(async () => {
                fireEvent.click(screen.getByTestId('keep-account-confirm-email-submit'));
            });
            expect(mocks.resealEscrowContact).toHaveBeenLastCalledWith({
                primaryUid: 'uid-t',
                retypedEmail: 'Student@School.edu',
            });
            // Now confirmed on this device, but no second (silent) rotation follows.
            mocks.confirmedContact = 'student@school.edu';
            mocks.continuity = { ...STALE_NO_PIN };
            rerender(<KeepAccountStep variant="sheet" source="dashboard" />);
            expect(mocks.resealEscrowContact).toHaveBeenCalledTimes(2);
            expect(mocks.track).toHaveBeenCalledWith('completed', {
                source: 'dashboard',
                step: 'confirmEmail',
            });
            expect(mocks.refetch).toHaveBeenCalledWith({
                queryKey: ['classlinkAccountContinuity'],
            });
        });

        it('after a removal in School Connect, the row asks for the restored address', async () => {
            mocks.sessionEmail = 'me@example.org';
            mocks.continuity = DONE;
            const { rerender } = renderStep({ variant: 'inline' });
            fireEvent.click(screen.getByTestId('keep-account-remove'));
            mocks.sessionEmail = 'student@school.edu';
            // lca-api's answer after a removal: the email step, with the backup still
            // sealed to the removed address.
            mocks.continuity = {
                ...STALE_NO_PIN,
                emailVerified: false,
                emailPrimary: false,
                maskedEmail: undefined,
                canRemove: false,
                nextStep: 'email',
            };
            await act(async () => {
                lastAlert().buttons[1].handler?.();
            });
            rerender(<KeepAccountStep variant="inline" source="dashboard" />);
            expect(screen.getByTestId('keep-account-step').dataset.step).toBe('confirmEmail');
            expect(mocks.resealEscrowContact).not.toHaveBeenCalled();
            fireEvent.click(screen.getByTestId('keep-account-confirm-email-open'));
            fireEvent.change(screen.getByTestId('keep-account-confirm-email'), {
                target: { value: 'student@school.edu' },
            });
            await act(async () => {
                fireEvent.click(screen.getByTestId('keep-account-confirm-email-submit'));
            });
            expect(mocks.resealEscrowContact).toHaveBeenCalledWith({
                primaryUid: 'uid-t',
                retypedEmail: 'student@school.edu',
            });
        });

        it('is not asked on another login of the account', () => {
            mocks.continuity = STALE_NO_PIN;
            mocks.uid = 'uid-other';
            renderStep();
            expect(screen.getByTestId('keep-account-step').dataset.step).toBe('done');
        });
    });

    it('a sign-in email change this device has not applied yet can be retried after a remount', async () => {
        mocks.pendingContact = {
            expectedEmail: 'me@example.org',
            customToken: 'token-t',
            primaryUid: 'uid-t',
        };
        mocks.continuity = PIN;
        const { onDismiss } = renderStep({ variant: 'onboarding', emailOnly: true });
        // No PIN on a signed-out login: only Try again or Sign out.
        expect(screen.getByTestId('keep-account-step').dataset.step).toBe('finishFailed');
        expect(screen.queryByTestId('pin-step')).toBeNull();
        expect(screen.queryByTestId('keep-account-not-now')).toBeNull();
        fireEvent.click(screen.getByTestId('keep-account-finish-sign-out'));
        expect(mocks.logout).toHaveBeenCalledTimes(1);
        expect(onDismiss).not.toHaveBeenCalled();
        await act(async () => {
            fireEvent.click(screen.getByTestId('keep-account-finish-retry'));
        });
        expect(mocks.refreshAccountContact).toHaveBeenCalledWith({
            expectedEmail: 'me@example.org',
            customToken: 'token-t',
            primaryUid: 'uid-t',
        });
    });

    it('applies a reconcile token while loading through refreshAccountContact', () => {
        renderStep();
        expect(mocks.continuityOptions?.applySignInToken).toBe(mocks.refreshAccountContact);
    });

    it('offers Try again when a reconcile token could not be applied while loading', async () => {
        mocks.continuity = DONE;
        const { rerender } = renderStep();
        expect(screen.getByTestId('keep-account-step').dataset.step).toBe('done');
        // The load undid an interrupted change; signing back in failed, so the coordinator
        // kept the token.
        mocks.pendingContact = { customToken: 'token-r', primaryUid: 'uid-t' };
        mocks.dataUpdatedAt = 2;
        rerender(<KeepAccountStep variant="sheet" source="dashboard" />);
        expect(screen.getByTestId('keep-account-step').dataset.step).toBe('finishFailed');
        await act(async () => {
            fireEvent.click(screen.getByTestId('keep-account-finish-retry'));
        });
        // The restored address was never typed here: no expected email.
        expect(mocks.refreshAccountContact).toHaveBeenCalledWith({
            customToken: 'token-r',
            primaryUid: 'uid-t',
        });
    });

    describe('a recent sign-in is required', () => {
        const RECENT = (): Error =>
            Object.assign(new Error('x'), {
                data: { code: 'FORBIDDEN', reason: 'recent_sign_in_required' },
            });

        it('sending a code explains it and offers Sign in again instead of Send', async () => {
            mocks.start.mockRejectedValueOnce(RECENT());
            renderStep();
            await sendCode();
            const input = screen.getByTestId('classlink-email-input');
            expect(
                document.getElementById(input.getAttribute('aria-describedby') ?? '')?.textContent
            ).toBe(m['classlinkKeepAccount.recentSignInRequired']());
            expect(screen.queryByTestId('classlink-email-submit')).toBeNull();
            // Not a policy refusal: nothing to re-read.
            expect(mocks.invalidate).not.toHaveBeenCalled();
            const again = screen.getByTestId('keep-account-sign-in-again');
            expect(again.textContent).toBe(m['classlinkKeepAccount.signInAgain']());
            fireEvent.click(again);
            expect(mocks.logout).toHaveBeenCalledTimes(1);
        });

        it('editing the address keeps the reason, and Enter does not ask again', async () => {
            mocks.start.mockRejectedValueOnce(RECENT());
            renderStep();
            await sendCode();
            const input = screen.getByTestId('classlink-email-input');
            fireEvent.change(input, { target: { value: 'other@example.org' } });
            expect(
                document.getElementById(input.getAttribute('aria-describedby') ?? '')?.textContent
            ).toBe(m['classlinkKeepAccount.recentSignInRequired']());
            expect(screen.queryByTestId('classlink-email-submit')).toBeNull();
            expect(screen.getByTestId('keep-account-sign-in-again')).toBeTruthy();
            // Implicit submission (Enter in the only field) must not spend another check.
            await act(async () => {
                fireEvent.submit(input.closest('form')!);
            });
            expect(mocks.start).toHaveBeenCalledTimes(1);
        });

        it("passes this device's Firebase ID token to the email mutations", async () => {
            const getIdToken = vi.fn(async () => 'id-token');
            mocks.authProvider = { getProviderType: () => 'firebase', getIdToken };
            renderStep();
            expect(screen.getByTestId('classlink-email-input')).toBeTruthy();
            await expect(mocks.mutationOptions.start?.getIdToken?.()).resolves.toBe('id-token');
            await expect(mocks.mutationOptions.verify?.getIdToken?.()).resolves.toBe('id-token');
            await expect(mocks.mutationOptions.remove?.getIdToken?.()).resolves.toBe('id-token');
        });

        it('passes no token source without a Firebase session', () => {
            mocks.authProvider = {
                getProviderType: () => 'keycloak',
                getIdToken: vi.fn(async () => 'kc'),
            };
            renderStep();
            expect(mocks.mutationOptions.start?.getIdToken).toBeUndefined();
            expect(mocks.mutationOptions.verify?.getIdToken).toBeUndefined();
        });

        it('verifying the code explains it under the code and offers Sign in again', async () => {
            mocks.verify.mockRejectedValueOnce(RECENT());
            renderStep();
            await verifyEmail();
            expect(screen.getByTestId('classlink-email-code')).toBeTruthy();
            expect(screen.getByText(m['classlinkKeepAccount.recentSignInRequired']())).toBeTruthy();
            fireEvent.click(screen.getByTestId('keep-account-sign-in-again'));
            expect(mocks.logout).toHaveBeenCalledTimes(1);
        });

        it('removing explains it in the row and offers Sign in again', async () => {
            mocks.continuity = DONE;
            mocks.remove.mockRejectedValueOnce(RECENT());
            renderStep({ variant: 'inline' });
            fireEvent.click(screen.getByTestId('keep-account-remove'));
            await act(async () => {
                lastAlert().buttons[1].handler?.();
            });
            expect(screen.getByRole('alert').textContent).toBe(
                m['classlinkKeepAccount.recentSignInRequired']()
            );
            fireEvent.click(screen.getByTestId('keep-account-sign-in-again'));
            expect(mocks.logout).toHaveBeenCalledTimes(1);
            expect(mocks.refreshAccountContact).not.toHaveBeenCalled();
        });
    });

    it('is done only when the server says so, with nothing to undo on the success screen', () => {
        mocks.continuity = DONE;
        const { onComplete } = renderStep();
        expect(screen.getByTestId('keep-account-step').dataset.step).toBe('done');
        // Names the sign-in email and that the PIN follows on a new device.
        expect(
            screen.getByText(m['classlinkKeepAccount.doneBody']({ email: MASKED }))
        ).toBeTruthy();

        fireEvent.click(screen.getByTestId('keep-account-continue'));
        expect(screen.getByTestId('keep-account-continue').textContent).toBe(
            m['classlinkKeepAccount.done']()
        );
        expect(onComplete).toHaveBeenCalledWith(DONE);
        // Removing lives in School Connect, beside the address it removes.
        expect(screen.queryByTestId('keep-account-remove')).toBeNull();
    });

    it('names the account sign-in email when done with no stored personal email', () => {
        mocks.continuity = ACCOUNT_DONE;
        renderStep();
        expect(
            screen.getByText(m['classlinkKeepAccount.doneBody']({ email: SIGN_IN_MASKED }))
        ).toBeTruthy();
    });

    it('names no blank address when done with neither address', () => {
        mocks.continuity = NO_ADDRESS_DONE;
        renderStep();
        expect(screen.getByText(m['classlinkKeepAccount.doneBodyNoEmail']())).toBeTruthy();
        expect(
            screen.queryByText(m['classlinkKeepAccount.doneBody']({ email: isolateLtr('') }))
        ).toBeNull();
    });

    it('names no blank address when done with neither address and no PIN', () => {
        mocks.continuity = { ...NO_ADDRESS_DONE, pinRecoverable: false, pinState: 'none' };
        renderStep();
        expect(screen.getByText(m['classlinkKeepAccount.doneBodyMethodNoEmail']())).toBeTruthy();
    });

    it('names the recovery method when done without a PIN', () => {
        mocks.continuity = DONE_METHOD;
        renderStep();
        expect(
            screen.getByText(m['classlinkKeepAccount.doneBodyMethod']({ email: MASKED }))
        ).toBeTruthy();
    });

    it('explains why when the server does not allow a personal email', () => {
        mocks.continuity = state({
            personalEmail: { allowed: false, reason: 'students_excluded' },
        });
        const { onDismiss } = renderStep();
        expect(screen.getByTestId('keep-account-blocked').textContent).toBe(
            m['classlinkKeepAccount.reason.studentsExcluded']()
        );
        expect(screen.queryByTestId('classlink-email-input')).toBeNull();
        // Nothing continues from a refusal: the only answer is OK.
        expect(screen.queryByTestId('keep-account-add-birth-date')).toBeNull();
        fireEvent.click(screen.getByTestId('keep-account-blocked-ok'));
        expect(screen.getByTestId('keep-account-blocked-ok').textContent).toBe(
            m['classlinkKeepAccount.blockedOk']()
        );
        expect(onDismiss).toHaveBeenCalled();
        expect(mocks.track).toHaveBeenCalledWith('dismissed', {
            source: 'dashboard',
            step: 'blocked',
        });
    });

    it('renders nothing while the feature is switched off on the server', () => {
        mocks.continuity = state({ personalEmail: { allowed: false, reason: 'disabled' } });
        const { onDismiss } = renderStep({ variant: 'inline' });
        expect(screen.queryByTestId('keep-account-step')).toBeNull();
        expect(onDismiss).not.toHaveBeenCalled();
    });

    it.each(['sheet', 'onboarding'] as const)(
        'leaves a %s host once, instead of sitting empty, when there is nothing to show',
        variant => {
            mocks.continuity = state({ personalEmail: { allowed: false, reason: 'disabled' } });
            const { onDismiss, rerender } = renderStep({ variant });
            expect(screen.queryByTestId('keep-account-step')).toBeNull();
            mocks.continuity = undefined;
            rerender(
                <KeepAccountStep variant={variant} source="dashboard" onDismiss={onDismiss} />
            );
            expect(onDismiss).toHaveBeenCalledTimes(1);
            expect(mocks.track).not.toHaveBeenCalled();
        }
    );

    it('names the loading state for screen readers', () => {
        mocks.loading = true;
        mocks.continuity = undefined;
        const { onDismiss } = renderStep();
        expect(screen.getByRole('status', { name: m['common.loading']() })).toBeTruthy();
        expect(onDismiss).not.toHaveBeenCalled();
    });

    it('uses h3 rows inside a page section, an h2 in a sheet and an h1 in onboarding', () => {
        renderStep({ variant: 'inline' });
        expect(
            screen.getByRole('heading', { level: 3, name: m['classlinkKeepAccount.rowLabel']() })
        ).toBeTruthy();
        cleanup();
        renderStep();
        expect(
            screen.getByRole('heading', { level: 2, name: m['classlinkKeepAccount.title']() })
        ).toBeTruthy();
        cleanup();
        // Staff and other adults: no "after school".
        mocks.isStudent = false;
        renderStep();
        expect(
            screen.getByRole('heading', { level: 2, name: m['classlinkKeepAccount.titleLogin']() })
        ).toBeTruthy();
        cleanup();
        renderStep({ variant: 'onboarding', title: 'Keep your transcript' });
        expect(
            screen.getByRole('heading', { level: 1, name: 'Keep your transcript' })
        ).toBeTruthy();
    });

    it.each([
        ['done', DONE],
        ['pin', PIN],
        ['method', METHOD],
        ['confirmPin', CONFIRM],
    ] as const)(
        'hands back to an email-only host once the email is verified (%s)',
        (_, continuity) => {
            mocks.continuity = continuity;
            const { onComplete } = renderStep({ variant: 'onboarding', emailOnly: true });
            expect(screen.queryByTestId('keep-account-step')).toBeNull();
            expect(onComplete).toHaveBeenCalledTimes(1);
            expect(onComplete).toHaveBeenCalledWith(continuity);
            expect(mocks.openRecoverySetup).not.toHaveBeenCalled();
            expect(mocks.openPinSetup).not.toHaveBeenCalled();
        }
    );

    it('lets the user leave with Not now', () => {
        const { onDismiss } = renderStep();
        fireEvent.click(screen.getByTestId('keep-account-not-now'));
        expect(onDismiss).toHaveBeenCalledTimes(1);
        expect(mocks.track).toHaveBeenCalledWith('dismissed', {
            source: 'dashboard',
            step: 'email',
        });
    });
    describe('email and code', () => {
        afterEach(() => {
            vi.useRealTimers();
        });

        it('sends only a plausible address, with left-to-right fields', async () => {
            renderStep();
            const input = screen.getByTestId('classlink-email-input');
            expect(input.getAttribute('dir')).toBe('ltr');
            const send = screen.getByTestId('classlink-email-submit') as HTMLButtonElement;
            expect(send.textContent).toBe(m['classlinkPersonalEmail.send']());
            expect(send.disabled).toBe(true);
            fireEvent.change(input, { target: { value: 'me@' } });
            expect(send.disabled).toBe(true);
            fireEvent.change(input, { target: { value: 'me@example.org' } });
            expect(send.disabled).toBe(false);
        });

        it('names the address, checks the code at 6 digits and can go back to change it', async () => {
            renderStep();
            await sendCode();
            expect(
                screen.getByRole('heading', { name: m['classlinkPersonalEmail.checkEmail']() })
            ).toBeTruthy();
            expect(
                screen.getByText(
                    m['classlinkPersonalEmail.sentTo']({ email: isolateLtr('me@example.org') })
                )
            ).toBeTruthy();
            expect(screen.getByTestId('classlink-email-code').getAttribute('dir')).toBe('ltr');
            // No Verify button: the last digit submits.
            expect(screen.queryByTestId('classlink-email-submit')).toBeNull();
            expect(screen.queryByText(m['classlinkKeepAccount.storedNote']())).toBeNull();

            fireEvent.click(screen.getByTestId('classlink-email-change'));
            const input = screen.getByTestId('classlink-email-input') as HTMLInputElement;
            expect(input.value).toBe('me@example.org');
            expect(document.activeElement).toBe(input);
            expect(mocks.verify).not.toHaveBeenCalled();
        });

        it('puts a wrong code error under the code and clears the boxes', async () => {
            mocks.verify.mockRejectedValueOnce(
                Object.assign(new Error('x'), { data: { code: 'BAD_REQUEST' } })
            );
            renderStep();
            await sendCode();
            await enterCode('999999');
            const group = screen.getByTestId('classlink-email-code');
            const errorId = group.getAttribute('aria-describedby') ?? '';
            expect(document.getElementById(errorId)?.textContent).toBe(
                m['classlinkPersonalEmail.codeError']()
            );
            expect((screen.getByLabelText('Code digit 1') as HTMLInputElement).value).toBe('');

            await enterCode('123456');
            expect(mocks.verify).toHaveBeenLastCalledWith({
                email: 'me@example.org',
                code: '123456',
            });
        });

        it('puts a refused address error under the email field', async () => {
            mocks.start.mockRejectedValueOnce(
                Object.assign(new Error('x'), { data: { code: 'BAD_REQUEST' } })
            );
            renderStep();
            await sendCode('me@school.example');
            const input = screen.getByTestId('classlink-email-input');
            expect(input.getAttribute('aria-invalid')).toBe('true');
            expect(
                document.getElementById(input.getAttribute('aria-describedby') ?? '')?.textContent
            ).toBe(m['classlinkKeepAccount.emailRejected']());
        });

        it('offers Resend code after the countdown, without counting a new address', async () => {
            vi.useFakeTimers({ shouldAdvanceTime: false });
            renderStep();
            await sendCode();
            const resend = screen.getByTestId('classlink-email-resend') as HTMLButtonElement;
            expect(resend.disabled).toBe(true);
            expect(resend.textContent).toBe(
                m['classlinkPersonalEmail.resendIn']({ seconds: String(RESEND_COOLDOWN_SECONDS) })
            );
            act(() => {
                vi.advanceTimersByTime(RESEND_COOLDOWN_SECONDS * 1000);
            });
            expect(resend.disabled).toBe(false);
            expect(resend.textContent).toBe(m['classlinkPersonalEmail.resend']());

            await act(async () => {
                fireEvent.click(resend);
            });
            expect(mocks.start).toHaveBeenCalledTimes(2);
            expect(mocks.start).toHaveBeenLastCalledWith({ email: 'me@example.org' });
            expect(
                mocks.track.mock.calls.filter(
                    ([event, payload]) => event === 'completed' && payload?.step === 'email'
                )
            ).toHaveLength(1);
            expect(
                (screen.getByTestId('classlink-email-resend') as HTMLButtonElement).disabled
            ).toBe(true);
        });

        it('keeps a shared address in onboarding, with the reason under the field', async () => {
            mocks.verify.mockRejectedValueOnce(
                Object.assign(new Error('x'), { data: { code: 'CONFLICT' } })
            );
            const { onComplete } = renderStep({ variant: 'onboarding', emailOnly: true });
            await verifyEmail();
            expect(screen.getByTestId('keep-account-step').dataset.step).toBe('email');
            const input = screen.getByTestId('classlink-email-input') as HTMLInputElement;
            expect(input.value).toBe('me@example.org');
            expect(input.getAttribute('aria-invalid')).toBe('true');
            expect(onComplete).not.toHaveBeenCalled();
        });

        it('stops the resend countdown once it reaches zero', async () => {
            vi.useFakeTimers({ shouldAdvanceTime: false });
            renderStep();
            await sendCode();
            act(() => {
                vi.advanceTimersByTime(RESEND_COOLDOWN_SECONDS * 1000);
            });
            expect(vi.getTimerCount()).toBe(0);
        });
    });

    it('shows a brief Saved check in onboarding before handing back', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: false });
        const { onComplete } = renderStep({ variant: 'onboarding', emailOnly: true });
        await verifyEmail();
        expect(screen.getByTestId('keep-account-step').dataset.step).toBe('saved');
        const heading = screen.getByRole('heading', { name: m['classlinkKeepAccount.saved']() });
        // Focus follows the screen instead of falling to the page.
        expect(document.activeElement).toBe(heading);
        // Names the address it saved.
        expect(screen.getByText(isolateLtr('me@example.org'))).toBeTruthy();
        expect(onComplete).not.toHaveBeenCalled();

        mocks.continuity = DONE;
        act(() => {
            vi.advanceTimersByTime(KEEP_ACCOUNT_SAVED_MS);
        });
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onComplete).toHaveBeenCalledWith(DONE);
        vi.useRealTimers();
    });

    it('puts the onboarding actions in a sticky bar below the card', () => {
        renderStep({ variant: 'onboarding', emailOnly: true });
        const send = screen.getByTestId('classlink-email-submit');
        const form = document.querySelector('form');
        expect(form?.contains(send)).toBe(false);
        expect(send.getAttribute('form')).toBe(form?.id);
        expect(screen.getByTestId('keep-account-not-now')).toBeTruthy();
    });

    describe('inline (School Connect)', () => {
        it('is an Add row that opens the form in place', () => {
            renderStep({ variant: 'inline', onDismiss: undefined });
            expect(screen.queryByTestId('classlink-email-input')).toBeNull();
            fireEvent.click(screen.getByTestId('keep-account-add'));
            expect(document.activeElement).toBe(screen.getByTestId('classlink-email-input'));
            fireEvent.click(screen.getByText(m['common.cancel']()));
            expect(screen.queryByTestId('classlink-email-input')).toBeNull();
        });

        it('shows the sign-in address as a compact row with Remove', async () => {
            mocks.continuity = DONE;
            renderStep({ variant: 'inline' });
            expect(
                screen.getByText(`${MASKED} · ${m['classlinkKeepAccount.rowSchoolAlsoWorks']()}`)
            ).toBeTruthy();
            expect(screen.queryByTestId('keep-account-continue')).toBeNull();

            // A system-style confirm that names the address; nothing is removed before it.
            fireEvent.click(screen.getByTestId('keep-account-remove'));
            expect(mocks.remove).not.toHaveBeenCalled();
            const alert = lastAlert();
            expect(alert.message).toBe(m['classlinkKeepAccount.removeConfirm']({ email: MASKED }));
            expect(alert.buttons.map(({ text, role }) => ({ text, role }))).toEqual([
                { text: m['classlinkKeepAccount.removeCancel'](), role: 'cancel' },
                { text: m['classlinkKeepAccount.removeAction'](), role: 'destructive' },
            ]);
            await act(async () => {
                alert.buttons[1].handler?.();
            });
            expect(mocks.remove).toHaveBeenCalledTimes(1);
            // Signed back in with the restored address, which this device never typed.
            expect(mocks.refreshAccountContact).toHaveBeenCalledWith({
                customToken: 'token-r',
                primaryUid: 'uid-t',
            });
            expect(mocks.rememberConfirmedContact).not.toHaveBeenCalled();
            expect(mocks.refetch).toHaveBeenCalledWith({
                queryKey: ['classlinkAccountContinuity'],
            });
        });

        it('leaves out "school email also works" without a school email', () => {
            mocks.continuity = { ...DONE, hasSchoolEmail: false };
            renderStep({ variant: 'inline' });
            expect(screen.getByText(MASKED)).toBeTruthy();
            expect(
                screen.queryByText(m['classlinkKeepAccount.rowSchoolAlsoWorks'](), {
                    exact: false,
                })
            ).toBeNull();
        });

        it('offers only a different email when the address cannot be removed', () => {
            mocks.continuity = { ...DONE, hasSchoolEmail: false, canRemove: false };
            renderStep({ variant: 'inline' });
            expect(screen.queryByTestId('keep-account-remove')).toBeNull();
            // The pill already says it can only be changed: no sentence repeating it.
            expect(screen.getByText(MASKED)).toBeTruthy();
            expect(
                screen.queryByText(m['classlinkKeepAccount.cannotRemovePlaceholder'](), {
                    exact: false,
                })
            ).toBeNull();
            fireEvent.click(screen.getByTestId('keep-account-change'));
            expect(screen.getByTestId('classlink-email-input')).toBeTruthy();
        });

        it('shows the account sign-in email when no personal email is stored', () => {
            mocks.continuity = ACCOUNT_DONE;
            renderStep({ variant: 'inline' });
            expect(screen.getByText(m['classlinkKeepAccount.rowLabel']())).toBeTruthy();
            expect(screen.getByText(SIGN_IN_MASKED)).toBeTruthy();
            // Nothing stored to remove or replace: the action adds a personal email.
            expect(screen.queryByTestId('keep-account-remove')).toBeNull();
            expect(screen.queryByTestId('keep-account-change')).toBeNull();
            expect(screen.queryByText(m['classlinkKeepAccount.rowDifferent']())).toBeNull();
            const add = screen.getByTestId('keep-account-add');
            expect(add.textContent).toBe(m['classlinkPersonalEmail.title']());
            fireEvent.click(add);
            expect(screen.getByTestId('classlink-email-input')).toBeTruthy();
        });

        it('renders no blank sign-in row when the server names no address', () => {
            mocks.continuity = NO_ADDRESS_DONE;
            renderStep({ variant: 'inline' });
            const step = screen.getByTestId('keep-account-step');
            // The row says why to add one instead of an empty address.
            expect(screen.getByText(m['classlinkKeepAccount.banner.emailBody']())).toBeTruthy();
            expect(step.textContent).not.toContain(m['classlinkKeepAccount.rowDifferent']());
            expect(screen.getByTestId('keep-account-add').textContent).toBe(
                m['classlinkPersonalEmail.title']()
            );
            // No row whose subtitle is empty.
            for (const p of Array.from(step.querySelectorAll('p'))) {
                expect(p.textContent?.replace(/[\u2066-\u2069]/g, '').trim()).not.toBe('');
            }
        });

        it('explains a placeholder refusal instead of a generic error', async () => {
            mocks.continuity = DONE;
            mocks.remove.mockRejectedValueOnce(
                Object.assign(new Error('x'), {
                    data: { code: 'PRECONDITION_FAILED', reason: 'placeholder_escrow' },
                })
            );
            renderStep({ variant: 'inline' });
            fireEvent.click(screen.getByTestId('keep-account-remove'));
            await act(async () => {
                lastAlert().buttons[1].handler?.();
            });
            expect(screen.getByRole('alert').textContent).toBe(
                m['classlinkKeepAccount.cannotRemovePlaceholder']()
            );
        });

        it('opens the PIN confirm in place', () => {
            mocks.continuity = CONFIRM;
            renderStep({ variant: 'inline' });
            // Says what it finishes once; "Enter PIN" is the action.
            expect(screen.getByText(m['classlinkKeepAccount.finishRowTitle']())).toBeTruthy();
            expect(
                screen.queryByText(m['classlinkKeepAccount.banner.confirmPinBody']())
            ).toBeNull();
            expect(screen.queryByTestId('keep-account-confirm-pin')).toBeNull();
            fireEvent.click(screen.getByTestId('keep-account-confirm'));
            expect(screen.getByTestId('keep-account-confirm-pin')).toBeTruthy();
            expect(mocks.openPinSetup).not.toHaveBeenCalled();
        });

        it('confirms Saved in place after the PIN confirm', async () => {
            vi.useFakeTimers({ shouldAdvanceTime: false });
            mocks.continuity = CONFIRM;
            const { rerender } = renderStep({ variant: 'inline' });
            fireEvent.click(screen.getByTestId('keep-account-confirm'));
            await enterPin('593827');
            expect(screen.getByTestId('keep-account-step').dataset.step).toBe('saved');
            expect(screen.getByTestId('keep-account-saved').textContent).toBe(
                m['classlinkKeepAccount.saved']()
            );
            mocks.continuity = DONE;
            act(() => {
                vi.advanceTimersByTime(KEEP_ACCOUNT_SAVED_MS);
            });
            rerender(<KeepAccountStep variant="inline" source="dashboard" />);
            expect(screen.getByTestId('keep-account-step').dataset.step).toBe('done');
            vi.useRealTimers();
        });

        it.each([
            [
                'no longer the sign-in email',
                state({ emailVerified: true, maskedEmail: 'm***@example.org' }),
            ],
            [
                'refused by policy',
                state({
                    emailVerified: true,
                    maskedEmail: 'm***@example.org',
                    personalEmail: { allowed: false, reason: 'students_excluded' },
                }),
            ],
            [
                'switched off',
                state({
                    emailVerified: true,
                    maskedEmail: 'm***@example.org',
                    personalEmail: { allowed: false, reason: 'disabled' },
                }),
            ],
        ])('keeps a stored address removable when %s', async (_label, continuity) => {
            mocks.continuity = continuity;
            renderStep({ variant: 'inline', onDismiss: undefined });
            expect(screen.getByText(MASKED, { exact: false })).toBeTruthy();
            fireEvent.click(screen.getByTestId('keep-account-remove'));
            await act(async () => {
                lastAlert().buttons[1].handler?.();
            });
            expect(mocks.remove).toHaveBeenCalledTimes(1);
        });

        it('offers a different address when the stored one is not the sign-in email', () => {
            mocks.continuity = state({ emailVerified: true, maskedEmail: 'm***@example.org' });
            renderStep({ variant: 'inline', onDismiss: undefined });
            expect(screen.getByText(m['classlinkKeepAccount.rowDifferent']())).toBeTruthy();
            expect(screen.getByTestId('keep-account-add')).toBeTruthy();
        });

        it('confirms Saved in place, then folds into the address row', async () => {
            vi.useFakeTimers({ shouldAdvanceTime: false });
            const { rerender } = renderStep({ variant: 'inline', onDismiss: undefined });
            fireEvent.click(screen.getByTestId('keep-account-add'));
            await verifyEmail();
            expect(screen.getByTestId('keep-account-step').dataset.step).toBe('saved');
            expect(screen.getByTestId('keep-account-saved').textContent).toBe(
                m['classlinkKeepAccount.saved']()
            );
            expect(document.activeElement).toBe(screen.getByTestId('keep-account-saved'));
            expect(screen.queryByTestId('classlink-email-input')).toBeNull();

            mocks.continuity = DONE;
            act(() => {
                vi.advanceTimersByTime(KEEP_ACCOUNT_SAVED_MS);
            });
            rerender(<KeepAccountStep variant="inline" source="dashboard" />);
            expect(screen.getByTestId('keep-account-step').dataset.step).toBe('done');
            expect(document.activeElement).toBe(
                screen.getByRole('heading', {
                    level: 3,
                    name: m['classlinkKeepAccount.rowLabel'](),
                })
            );
            vi.useRealTimers();
        });

        it.each([
            ['none', 'first-time'],
            ['locked', 'pin-locked'],
        ] as const)('opens the PIN prompt for a %s PIN', (pinState, reason) => {
            mocks.continuity = { ...PIN, pinState };
            renderStep({ variant: 'inline', onBeforeOverlay: undefined });
            expect(screen.queryByTestId('pin-step')).toBeNull();
            fireEvent.click(screen.getByTestId('keep-account-pin'));
            expect(mocks.openPinSetup.mock.calls[0][0].reason).toBe(reason);
        });

        it('offers Add date of birth when that is what is missing', () => {
            const onAddBirthDate = vi.fn();
            mocks.continuity = state({ personalEmail: { allowed: false, reason: 'age_unknown' } });
            renderStep({ variant: 'inline', onAddBirthDate });
            // Short in the row: the subtitle says why, the pill says Add.
            expect(screen.getByTestId('keep-account-blocked').textContent).toBe(
                m['classlinkKeepAccount.rowNeedsBirthDate']()
            );
            const add = screen.getByTestId('keep-account-add-birth-date');
            expect(add.textContent).toBe(m['classlinkKeepAccount.rowAdd']());
            expect(add.getAttribute('aria-label')).toBe(m['classlinkKeepAccount.addBirthDate']());
            fireEvent.click(add);
            expect(onAddBirthDate).toHaveBeenCalledTimes(1);
        });
    });

    it('offers Add date of birth beside OK in a sheet', () => {
        const onAddBirthDate = vi.fn();
        mocks.continuity = state({ personalEmail: { allowed: false, reason: 'age_unknown' } });
        const { onDismiss } = renderStep({ onAddBirthDate });
        fireEvent.click(screen.getByTestId('keep-account-add-birth-date'));
        expect(onAddBirthDate).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByTestId('keep-account-blocked-ok'));
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });
});
