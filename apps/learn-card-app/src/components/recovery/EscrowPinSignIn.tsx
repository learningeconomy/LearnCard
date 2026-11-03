import React, { useState } from 'react';
import { RecoveryPinInput } from './RecoveryPinInput';
import * as m from '../../paraglide/messages.js';

/** How a failed PIN attempt should be handled by the caller. */
export interface PinSignInFailure {
    message: string;
    /** Locked or unavailable: the PIN must not be offered again in this flow. */
    blocked: boolean;
}

/**
 * Maps a PIN sign-in error to localized copy. Never surfaces the raw message,
 * which can carry server details.
 */
export const describePinSignInError = (cause: unknown): PinSignInFailure => {
    const err = cause instanceof Error ? cause : new Error();
    if (err.name === 'EscrowPinMismatchError') {
        const attempts = 'attemptsRemaining' in err ? Number(err.attemptsRemaining) : 0;
        return {
            message:
                attempts === 1
                    ? m['recovery.pinSignIn.incorrectOne']()
                    : m['recovery.pin.incorrect']({ attempts: String(attempts) }),
            blocked: false,
        };
    }
    // Another recovery is still running; this attempt was rejected before it changed anything.
    if (err.name === 'RecoveryInProgressError') {
        return { message: m['recovery.inProgress'](), blocked: false };
    }
    if (err.name === 'EscrowPinThrottledError') {
        return { message: m['recovery.pin.throttled'](), blocked: false };
    }
    if (err.name === 'EscrowPinLockedError') {
        return { message: m['recovery.pin.locked'](), blocked: true };
    }
    if (
        err.name === 'EscrowPinUnavailableError' ||
        (err.name === 'EscrowRequestError' && 'status' in err && err.status === 403)
    ) {
        return { message: m['recovery.pinSignIn.unavailable'](), blocked: true };
    }
    return { message: m['recovery.pinSignIn.failed'](), blocked: false };
};

export interface EscrowPinSignInProps {
    /** Runs the PIN sign-in; rejects with the strategy's typed PIN errors. */
    onRecover: (pin: string) => Promise<void>;
    /** Called when the PIN is locked or unavailable, with the message to show instead. */
    onBlocked: (message: string) => void;
    /** Reports an in-flight attempt so the parent can hold off dismissal. */
    onBusyChange?: (busy: boolean) => void;
}

/**
 * PIN entry for signing in on a new device. A correct PIN keeps the account as it is
 * (no reset, other devices stay signed in), so this view carries none of the
 * "sign you out" warnings that belong to the 7-day wait.
 */
export const EscrowPinSignIn: React.FC<EscrowPinSignInProps> = ({
    onRecover,
    onBlocked,
    onBusyChange,
}) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleComplete = async (value: string) => {
        setLoading(true);
        onBusyChange?.(true);
        setError('');
        try {
            await onRecover(value);
        } catch (cause) {
            const failure = describePinSignInError(cause);
            setPin('');
            if (failure.blocked) {
                onBlocked(failure.message);
            } else {
                setError(failure.message);
            }
        } finally {
            setLoading(false);
            onBusyChange?.(false);
        }
    };

    return (
        <section
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-v3-3"
            aria-label={m['recovery.pin.title']()}
        >
            <div className="flex justify-center py-1">
                <RecoveryPinInput
                    value={pin}
                    onChange={value => {
                        setPin(value);
                        setError('');
                    }}
                    onComplete={value => void handleComplete(value)}
                    disabled={loading}
                    error={!!error}
                />
            </div>
            {error && (
                <p role="alert" className="text-sm text-red-600 text-center">
                    {error}
                </p>
            )}
            {loading && (
                <p
                    role="status"
                    className="flex items-center justify-center gap-2 text-sm text-grayscale-600"
                >
                    <span className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-700 rounded-full animate-spin" />
                    {m['recovery.pinSignIn.verifying']()}
                </p>
            )}
        </section>
    );
};

export default EscrowPinSignIn;
