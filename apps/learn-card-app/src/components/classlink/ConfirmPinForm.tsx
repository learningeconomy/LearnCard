import React, { useEffect, useId, useRef, useState } from 'react';
import { isEscrowContactNotConfirmedError, isSameEscrowPinError } from 'learn-card-base';
import { isPinChangeRequiredError } from '@learncard/types';

import * as m from '../../paraglide/messages.js';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import { RecoveryPinInput } from '../recovery/RecoveryPinInput';
import { RecoveryPinStep, type RecoveryPinStepState } from '../onboarding/v2/RecoveryPinStep';
import { isolateLtr } from './PersonalEmailForm';
import { LINK_BUTTON_CLASS } from './keepAccountStyles';

const PIN_LENGTH = 6;

/** Matched by name: these classes can come from another bundle copy of sss-key-manager. */
const errorName = (error: unknown): string | undefined =>
    error instanceof Error ? error.name : undefined;

export type ConfirmPinFormProps = {
    /** The login that holds the sign-in email; the coordinator refuses any other session. */
    primaryUid: string;
    /**
     * The server already knows a confirm would be refused (`pinChangeRequired`): start at
     * "choose a new PIN".
     */
    pinChangeRequired?: boolean;
    /** The re-seal is done: the current PIN was confirmed, or a new one was set. */
    onDone: (how: 'confirmed' | 'newPin') => void;
    /** Called when the form moves between entering the PIN and choosing a new one. */
    onModeChange?: (mode: 'confirm' | 'new') => void;
    /**
     * Called when the form starts or stops asking the user to type the sign-in email, so
     * the host can leave the address out of its body while it does (the user must type it,
     * not copy it from the screen).
     */
    onRetypeChange?: (retype: boolean) => void;
    /** "Choose a new PIN" only: called whenever its PIN step moves on. */
    onNewPinStepChange?: (step: RecoveryPinStepState) => void;
    /** Focus the first field on mount. */
    autoFocus?: boolean;
    /** Heading level of the "choose a new PIN" step's title. */
    headingLevel?: 'h1' | 'h2' | 'h3';
};

/**
 * LC-2409: re-seal the escrow backup to the sign-in email by entering the current PIN once
 * (`confirmEscrowPin`: `replace` + keep the PIN). A wrong PIN keeps the entry open. When
 * the address was never typed or proved on this device, the user types it first (the PIN
 * boxes wait for it). "Forgot it? Choose a new PIN" (and a PIN that can no longer be
 * confirmed) switch to setting a new PIN, which seals the sign-in email too and runs the
 * same gates (`setEscrowPin` with `contact`); it names the address only when it needs no
 * re-type, and offers the way back to the current PIN unless that PIN can no longer be
 * confirmed. The host shows the confirm's title and body.
 */
export const ConfirmPinForm: React.FC<ConfirmPinFormProps> = ({
    primaryUid,
    pinChangeRequired = false,
    onDone,
    onModeChange,
    onRetypeChange,
    onNewPinStepChange,
    autoFocus = false,
    headingLevel = 'h2',
}) => {
    const { confirmEscrowPin, setEscrowPin, getConfirmedContact, state } = useAppAuth();
    const sessionEmail =
        state.status === 'ready' ? state.authUser?.email?.trim().toLowerCase() : undefined;
    const [mode, setMode] = useState<'confirm' | 'new'>(pinChangeRequired ? 'new' : 'confirm');
    // The current PIN can no longer be confirmed: "choose a new PIN" has no way back.
    const [confirmBlocked, setConfirmBlocked] = useState(pinChangeRequired);
    const [pin, setPin] = useState('');
    const [busy, setBusy] = useState(false);
    // Confirmed: stay disabled until the host moves on (it re-reads the server's answer).
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');
    // Only an address typed or proved on this device is sealed; otherwise type it now.
    const [retype, setRetype] = useState(
        () => !sessionEmail || getConfirmedContact() !== sessionEmail
    );
    const [retyped, setRetyped] = useState('');
    const retypedRef = useRef(retyped);
    retypedRef.current = retyped;
    const fieldsRef = useRef<HTMLDivElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const emailId = useId();
    const needsEmail = retype && !retyped.trim();

    useEffect(() => {
        onModeChange?.(mode);
    }, [mode, onModeChange]);

    useEffect(() => {
        onRetypeChange?.(retype);
    }, [retype, onRetypeChange]);

    // Focus the first thing to fill in: the email when it must be typed (on mount, when it
    // becomes required mid-flow, or on the new-PIN entry), else the PIN boxes (on mount).
    const focusRunRef = useRef(false);
    useEffect(() => {
        const firstRun = !focusRunRef.current;
        focusRunRef.current = true;
        if (firstRun && !autoFocus) return;
        if (retype && !retypedRef.current.trim()) {
            emailRef.current?.focus();
            return;
        }
        if (firstRun && mode === 'confirm')
            fieldsRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    }, [retype, mode, autoFocus]);

    const contactGate = (): { primaryUid: string; retypedEmail?: string } => ({
        primaryUid,
        ...(retype ? { retypedEmail: retypedRef.current } : {}),
    });

    const submit = async (value: string): Promise<void> => {
        if (busy || done || value.length !== PIN_LENGTH) return;
        if (retype && !retyped.trim()) {
            setError(m['classlinkKeepAccount.confirmRetypeEmail']());
            setPin('');
            emailRef.current?.focus();
            return;
        }
        setBusy(true);
        setError('');
        try {
            await confirmEscrowPin({ pin: value, ...contactGate(), pinChangeRequired });
            setDone(true);
            onDone('confirmed');
            return;
        } catch (err) {
            if (errorName(err) === 'EscrowPinMismatchError') {
                setError(m['classlinkKeepAccount.pinMismatch']());
            } else if (isPinChangeRequiredError(err)) {
                setConfirmBlocked(true);
                setMode('new');
            } else if (isEscrowContactNotConfirmedError(err) && err.reason === 'unconfirmed') {
                setError(
                    retype
                        ? m['classlinkKeepAccount.confirmRetypeEmailMismatch']()
                        : m['classlinkKeepAccount.confirmRetypeEmail']()
                );
                setRetype(true);
            } else if (errorName(err) === 'EscrowPinThrottledError') {
                setError(m['classlinkKeepAccount.confirmPinThrottled']());
            } else {
                setError(m['classlinkPersonalEmail.error']());
            }
            setPin('');
        } finally {
            setBusy(false);
        }
    };

    const emailField = retype && (
        <div className="mb-4 w-full text-start">
            <label
                htmlFor={emailId}
                className="block text-xs font-medium text-grayscale-700 mb-1.5"
            >
                {m['classlinkKeepAccount.confirmRetypeEmail']()}
            </label>
            <input
                ref={emailRef}
                id={emailId}
                data-testid="keep-account-confirm-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                // Addresses read left to right in every language.
                dir="ltr"
                value={retyped}
                disabled={busy || done}
                onChange={event => {
                    setError('');
                    setRetyped(event.target.value);
                }}
                className="w-full min-h-[48px] py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white disabled:opacity-50"
            />
        </div>
    );

    if (mode === 'new') {
        return (
            <div data-testid="keep-account-confirm-new-pin" className="w-full">
                <RecoveryPinStep
                    embedded
                    autoFocus
                    headingLevel={headingLevel}
                    title={m['classlinkKeepAccount.pinTitle']()}
                    // Name the address the backup will be sealed to, unless it must be typed.
                    body={
                        retype || !sessionEmail
                            ? m['classlinkKeepAccount.samePinRejected']()
                            : m['classlinkKeepAccount.newPinBody']({
                                  email: isolateLtr(sessionEmail),
                              })
                    }
                    beforeInput={emailField || undefined}
                    inputDisabled={needsEmail}
                    setPin={value => setEscrowPin(value, contactGate())}
                    saveErrorMessage={err => {
                        // The same PIN cannot re-seal: ask for another one, and say why.
                        if (isSameEscrowPinError(err)) return m['recovery.pin.samePin']();
                        if (isEscrowContactNotConfirmedError(err) && err.reason === 'unconfirmed') {
                            const message = retype
                                ? m['classlinkKeepAccount.confirmRetypeEmailMismatch']()
                                : m['classlinkKeepAccount.confirmRetypeEmail']();
                            setRetype(true);
                            return message;
                        }
                        return undefined;
                    }}
                    onComplete={() => onDone('newPin')}
                    onStepChange={onNewPinStepChange}
                    // The way out is back to the current PIN (below), not "skip".
                    allowSkip={false}
                    onSkip={() => undefined}
                />
                {!confirmBlocked && (
                    <div className="mt-2 flex justify-center">
                        <button
                            type="button"
                            data-testid="keep-account-confirm-use-current"
                            className={LINK_BUTTON_CLASS}
                            onClick={() => {
                                setError('');
                                setPin('');
                                setMode('confirm');
                            }}
                        >
                            {m['classlinkKeepAccount.useCurrentPin']()}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div ref={fieldsRef} data-testid="keep-account-confirm-pin" className="w-full text-start">
            {emailField}
            <RecoveryPinInput
                value={pin}
                onChange={value => {
                    setError('');
                    setPin(value);
                }}
                onComplete={value => void submit(value)}
                // Type the email first: the PIN boxes wait for it.
                disabled={busy || done || needsEmail}
                error={!!error}
            />
            <div role="alert" className="min-h-5 mt-2 text-sm text-red-600 text-center">
                {error}
            </div>
            <div className="mt-2 flex justify-center">
                <button
                    type="button"
                    data-testid="keep-account-confirm-new-instead"
                    className={LINK_BUTTON_CLASS}
                    disabled={busy || done}
                    onClick={() => {
                        setError('');
                        setMode('new');
                    }}
                >
                    {m['classlinkKeepAccount.confirmPinNewInstead']()}
                </button>
            </div>
        </div>
    );
};
