// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as m from '../../paraglide/messages.js';

type Continuity = {
    personalEmail: { allowed: boolean; reason?: string };
    emailVerified: boolean;
    maskedEmail?: string;
    recoveryEmailVerified: boolean;
    hasServerConfirmedMethod: boolean;
    hasUserRecoveryMethod: boolean;
    pinState: 'none' | 'enabled' | 'locked' | 'stale';
    pinRecoverable: boolean;
    nextStep: 'email' | 'pin' | 'method' | 'done';
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
    useClassLinkAccountContinuity: () => ({
        data: mocks.continuity,
        isLoading: mocks.loading,
        isFetching: mocks.fetching,
    }),
    useSchoolConnection: () => ({
        data: mocks.isStudent === undefined ? undefined : { isStudent: mocks.isStudent },
        isLoading: false,
    }),
    useStartPersonalEmail: () => ({ mutateAsync: mocks.start, isPending: false }),
    useVerifyPersonalEmail: () => ({ mutateAsync: mocks.verify, isPending: false }),
    useRemovePersonalEmail: () => ({ mutateAsync: mocks.remove, isPending: false }),
}));
vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({
        state: { status: 'ready', did: 'did:key:z6MkKeep' },
        openRecoverySetup: mocks.openRecoverySetup,
        openPinSetup: mocks.openPinSetup,
        setEscrowPin: mocks.setEscrowPin,
    }),
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
    type KeepAccountStepProps,
} from './KeepAccountStep';
import { RESEND_COOLDOWN_SECONDS, isolateLtr } from './PersonalEmailForm';

const state = (overrides: Partial<Continuity> = {}): Continuity => ({
    personalEmail: { allowed: true },
    emailVerified: false,
    recoveryEmailVerified: false,
    hasServerConfirmedMethod: false,
    hasUserRecoveryMethod: false,
    pinState: 'enabled',
    pinRecoverable: true,
    nextStep: 'email',
    ...overrides,
});
const VERIFIED = {
    emailVerified: true,
    maskedEmail: 'm***@example.org',
    recoveryEmailVerified: true,
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
    mocks.continuity = state();
    mocks.webAuthn = true;
    mocks.loading = false;
    mocks.pinStep = undefined;
    mocks.fetching = false;
    mocks.isStudent = true;
    mocks.refetch.mockResolvedValue(undefined);
    mocks.start.mockResolvedValue({ success: true });
    mocks.verify.mockResolvedValue({ success: true, recoveryEmailSet: true });
    mocks.remove.mockResolvedValue({ success: true });
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
        // Recovery framing only: no promise of signing in with this email.
        expect(screen.queryByText(/sign in with/i)).toBeNull();
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

    it('asks for a different email when another account already recovers with it', async () => {
        mocks.verify.mockResolvedValue({
            success: true,
            recoveryEmailSet: false,
            recoveryEmailSkipped: 'shared',
        });
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

    it('explains the PIN path while adding the email, or just the code without escrow', () => {
        renderStep();
        expect(screen.getByText(m['classlinkKeepAccount.body']())).toBeTruthy();
        cleanup();
        mocks.continuity = state({ pinState: 'none', pinRecoverable: false });
        renderStep();
        expect(screen.getByText(m['classlinkKeepAccount.bodyNoPin']())).toBeTruthy();
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
        expect(screen.getByText(m['recovery.pin.pinLocked.body']())).toBeTruthy();
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

    it('is done only when the server says so, with nothing to undo on the success screen', () => {
        mocks.continuity = DONE;
        const { onComplete } = renderStep();
        expect(screen.getByTestId('keep-account-step').dataset.step).toBe('done');
        // Names where the code goes and that the PIN follows.
        expect(
            screen.getByText(
                m['classlinkKeepAccount.doneBody']({
                    option: m['recovery.identity.lostSchoolLogin'](),
                    email: MASKED,
                })
            )
        ).toBeTruthy();

        fireEvent.click(screen.getByTestId('keep-account-continue'));
        expect(screen.getByTestId('keep-account-continue').textContent).toBe(
            m['classlinkKeepAccount.done']()
        );
        expect(onComplete).toHaveBeenCalledWith(DONE);
        // Removing lives in School Connect, beside the address it removes.
        expect(screen.queryByTestId('keep-account-remove')).toBeNull();
    });

    it('describes the passkey or phrase path when done without a PIN', () => {
        mocks.continuity = DONE_METHOD;
        renderStep();
        expect(
            screen.getByText(
                m['classlinkKeepAccount.doneBodyMethod']({
                    option: m['recovery.identity.lostSchoolLogin'](),
                    email: MASKED,
                })
            )
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
            mocks.verify.mockResolvedValue({
                success: true,
                recoveryEmailSet: false,
                recoveryEmailSkipped: 'shared',
            });
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

        it('shows the saved address as a compact row with Remove', async () => {
            mocks.continuity = DONE;
            renderStep({ variant: 'inline' });
            expect(
                screen.getByText(`${MASKED} · ${m['classlinkKeepAccount.rowStatus']()}`)
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
            expect(mocks.invalidate).toHaveBeenCalled();
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
