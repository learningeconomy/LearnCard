import React, { useEffect, useId, useRef, useState } from 'react';
import { isEscrowContactNotConfirmedError } from 'learn-card-base';

import * as m from '../../paraglide/messages.js';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import { PRIMARY_BUTTON_CLASS } from './keepAccountStyles';

export type ConfirmEmailFormProps = {
    /** The login that holds the sign-in email; the coordinator refuses any other session. */
    primaryUid: string;
    /** The backup now names the sign-in email. */
    onDone: () => void;
    /** Focus the field on mount. */
    autoFocus?: boolean;
    /** Class of the submit button (onboarding uses its own). */
    submitClassName?: string;
};

/**
 * LC-2409: an account without a PIN whose backup still names another address (after a
 * removal, or on a device that never typed the sign-in email) re-seals it to the sign-in
 * email once the user types that address (`resealEscrowContact` with `retypedEmail`). The
 * coordinator only seals an address typed or proved on this device, so the silent re-seal
 * cannot run there; this asks instead of failing silently.
 */
export const ConfirmEmailForm: React.FC<ConfirmEmailFormProps> = ({
    primaryUid,
    onDone,
    autoFocus = false,
    submitClassName = PRIMARY_BUTTON_CLASS,
}) => {
    const { resealEscrowContact } = useAppAuth();
    const [email, setEmail] = useState('');
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const inputId = useId();

    useEffect(() => {
        if (autoFocus) inputRef.current?.focus();
        // Mount only.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const submit = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        if (busy || done || !email.trim()) return;
        setBusy(true);
        setError('');
        try {
            await resealEscrowContact({ primaryUid, retypedEmail: email });
            setDone(true);
            onDone();
        } catch (err) {
            setError(
                isEscrowContactNotConfirmedError(err) && err.reason === 'unconfirmed'
                    ? m['classlinkKeepAccount.confirmRetypeEmailMismatch']()
                    : m['classlinkPersonalEmail.error']()
            );
            inputRef.current?.focus();
        } finally {
            setBusy(false);
        }
    };

    return (
        <form
            data-testid="keep-account-confirm-email-form"
            className="w-full text-start"
            onSubmit={event => void submit(event)}
            noValidate
        >
            <label
                htmlFor={inputId}
                className="block text-xs font-medium text-grayscale-700 mb-1.5"
            >
                {m['classlinkKeepAccount.confirmRetypeEmail']()}
            </label>
            <input
                ref={inputRef}
                id={inputId}
                data-testid="keep-account-confirm-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                // Addresses read left to right in every language.
                dir="ltr"
                value={email}
                disabled={busy || done}
                aria-invalid={!!error}
                onChange={event => {
                    setError('');
                    setEmail(event.target.value);
                }}
                className="w-full min-h-[48px] py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white disabled:opacity-50"
            />
            <div role="alert" className="min-h-5 mt-2 text-sm text-red-600 text-start">
                {error}
            </div>
            <button
                type="submit"
                data-testid="keep-account-confirm-email-submit"
                className={`mt-2 ${submitClassName}`}
                disabled={busy || done || !email.trim()}
            >
                {m['classlinkKeepAccount.confirmEmailAction']()}
            </button>
        </form>
    );
};
