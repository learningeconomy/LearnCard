import React, { useEffect, useId, useRef, useState } from 'react';
import { isEscrowContactNotConfirmedError, isSameEscrowPinError } from 'learn-card-base';
import { isPinChangeRequiredError } from '@learncard/types';

import * as m from '../../paraglide/messages.js';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import { RecoveryPinInput } from '../recovery/RecoveryPinInput';
import { RecoveryPinStep } from '../onboarding/v2/RecoveryPinStep';
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
    /** Focus the first field on mount. */
    autoFocus?: boolean;
    /** Heading level of the "choose a new PIN" step's title. */
    headingLevel?: 'h1' | 'h2' | 'h3';
};

/**
 * LC-2409: re-seal the escrow backup to the sign-in email by entering the current PIN once
 * (`confirmEscrowPin`: `replace` + keep the PIN). A wrong PIN keeps the entry open. When
 * the address was never typed or proved on this device, the user types it first. "Forgot
 * it? Choose a new PIN" (and a PIN that can no longer be confirmed) switch to setting a
 * new PIN, which seals the sign-in email too. The host shows the title and body.
 */
export const ConfirmPinForm: React.FC<ConfirmPinFormProps> = ({
    primaryUid,
    pinChangeRequired = false,
    onDone,
    onModeChange,
    autoFocus = false,
    headingLevel = 'h2',
}) => {
    const { confirmEscrowPin, setEscrowPin, getConfirmedContact, state } = useAppAuth();
    const sessionEmail =
        state.status === 'ready' ? state.authUser?.email?.trim().toLowerCase() : undefined;
    const [mode, setMode] = useState<'confirm' | 'new'>(pinChangeRequired ? 'new' : 'confirm');
    const [pin, setPin] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    // Only an address typed or proved on this device is sealed; otherwise type it now.
    const [retype, setRetype] = useState(
        () => !sessionEmail || getConfirmedContact() !== sessionEmail
    );
    const [retyped, setRetyped] = useState('');
    const fieldsRef = useRef<HTMLDivElement>(null);
    const emailId = useId();

    useEffect(() => {
        onModeChange?.(mode);
    }, [mode, onModeChange]);

    useEffect(() => {
        if (!autoFocus) return;
        fieldsRef.current?.querySelector<HTMLInputElement>('input')?.focus();
        // Mount only: later focus follows the user's own input.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const submit = async (value: string): Promise<void> => {
        if (busy || value.length !== PIN_LENGTH) return;
        if (retype && !retyped.trim()) {
            setError(m['classlinkKeepAccount.confirmRetypeEmail']());
            setPin('');
            return;
        }
        setBusy(true);
        setError('');
        try {
            await confirmEscrowPin({
                pin: value,
                primaryUid,
                ...(retype ? { retypedEmail: retyped } : {}),
                pinChangeRequired,
            });
            onDone('confirmed');
            return;
        } catch (err) {
            if (errorName(err) === 'EscrowPinMismatchError') {
                setError(m['classlinkKeepAccount.pinMismatch']());
            } else if (isPinChangeRequiredError(err)) {
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

    if (mode === 'new') {
        return (
            <div data-testid="keep-account-confirm-new-pin" className="w-full">
                <RecoveryPinStep
                    embedded
                    autoFocus
                    headingLevel={headingLevel}
                    title={m['classlinkKeepAccount.pinTitle']()}
                    body={m['classlinkKeepAccount.samePinRejected']()}
                    setPin={setEscrowPin}
                    // The same PIN cannot re-seal: ask for another one.
                    saveErrorMessage={err =>
                        isSameEscrowPinError(err)
                            ? m['classlinkKeepAccount.samePinRejected']()
                            : undefined
                    }
                    onComplete={() => onDone('newPin')}
                    // Offered only after repeated save failures: back to the PIN entry.
                    onSkip={() => setMode('confirm')}
                />
            </div>
        );
    }

    return (
        <div ref={fieldsRef} data-testid="keep-account-confirm-pin" className="w-full text-start">
            {retype && (
                <div className="mb-4">
                    <label
                        htmlFor={emailId}
                        className="block text-xs font-medium text-grayscale-700 mb-1.5"
                    >
                        {m['classlinkKeepAccount.confirmRetypeEmail']()}
                    </label>
                    <input
                        id={emailId}
                        data-testid="keep-account-confirm-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        // Addresses read left to right in every language.
                        dir="ltr"
                        value={retyped}
                        disabled={busy}
                        onChange={event => {
                            setError('');
                            setRetyped(event.target.value);
                        }}
                        className="w-full min-h-[48px] py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white disabled:opacity-50"
                    />
                </div>
            )}
            <RecoveryPinInput
                value={pin}
                onChange={value => {
                    setError('');
                    setPin(value);
                }}
                onComplete={value => void submit(value)}
                disabled={busy}
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
                    disabled={busy}
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
