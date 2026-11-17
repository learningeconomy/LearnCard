import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { useStartPersonalEmail, useVerifyPersonalEmail } from 'learn-card-base';
import type { LCAPluginMethods } from '@learncard/lca-api-plugin';
import * as m from '../../paraglide/messages.js';

export type PersonalEmailVerifyResult = Awaited<
    ReturnType<LCAPluginMethods['classlinkVerifyPersonalEmail']>
>;

const inputClass =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white';

/** The tRPC error code from an lca-api call, if any. */
export const getTrpcCode = (error: unknown): string | undefined =>
    (error as { data?: { code?: string } } | null)?.data?.code;

/**
 * Map a start/verify failure to copy by its tRPC code, never by the server's English
 * message. BAD_REQUEST means a school or unusable address when sending, and a wrong or
 * expired code when verifying.
 */
export const personalEmailErrorMessage = (error: unknown, step: 'email' | 'code'): string => {
    switch (getTrpcCode(error)) {
        case 'CONFLICT':
            return m['classlinkPersonalEmail.conflictError']();
        case 'TOO_MANY_REQUESTS':
            return m['classlinkPersonalEmail.limitError']();
        case 'FORBIDDEN':
            return m['classlinkKeepAccount.notAllowed']();
        case 'BAD_REQUEST':
            return step === 'code'
                ? m['classlinkPersonalEmail.codeError']()
                : m['classlinkKeepAccount.emailRejected']();
        default:
            return m['classlinkPersonalEmail.error']();
    }
};

export type PersonalEmailFormProps = {
    /** Called after the code is accepted, with the server's result. */
    onVerified: (result: PersonalEmailVerifyResult) => void;
    /** Called once a code has been sent to the address. */
    onCodeSent?: () => void;
    /** The server refused this account (policy); the parent should re-read why. */
    onForbidden?: () => void;
    /** Extra actions beside the submit button (for example "Skip for now"). */
    secondaryAction?: (busy: boolean) => React.ReactNode;
};

/**
 * Personal email + 6-digit code form for a ClassLink account. Owns only the two-step
 * entry and its errors; whether to show it at all is the parent's decision.
 */
export const PersonalEmailForm: React.FC<PersonalEmailFormProps> = ({
    onVerified,
    onCodeSent,
    onForbidden,
    secondaryAction,
}) => {
    const start = useStartPersonalEmail();
    const verify = useVerifyPersonalEmail();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [codeStep, setCodeStep] = useState(false);
    const [error, setError] = useState('');
    const busy = start.isPending || verify.isPending;

    const submit = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        if (busy) return;
        setError('');
        try {
            if (codeStep) {
                const result = await verify.mutateAsync({ email: email.trim(), code });
                if (!result.success) throw new Error();
                onVerified(result);
            } else {
                const result = await start.mutateAsync({ email: email.trim() });
                if (!result.success) throw new Error();
                setCodeStep(true);
                onCodeSent?.();
            }
        } catch (err) {
            setError(personalEmailErrorMessage(err, codeStep ? 'code' : 'email'));
            if (getTrpcCode(err) === 'FORBIDDEN') onForbidden?.();
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            {error && (
                <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5"
                >
                    <IonIcon
                        icon={alertCircleOutline}
                        className="text-red-400 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                </div>
            )}
            <div>
                <label
                    htmlFor="classlink-personal-email"
                    className="block text-xs font-medium text-grayscale-700 mb-1.5"
                >
                    {m['classlinkPersonalEmail.email']()}
                </label>
                <input
                    id="classlink-personal-email"
                    data-testid="classlink-email-input"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    disabled={busy || codeStep}
                    className={inputClass}
                />
            </div>
            {codeStep && (
                <div>
                    <label
                        htmlFor="classlink-personal-code"
                        className="block text-xs font-medium text-grayscale-700 mb-1.5"
                    >
                        {m['classlinkPersonalEmail.code']()}
                    </label>
                    <input
                        id="classlink-personal-code"
                        data-testid="classlink-email-code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        required
                        value={code}
                        onChange={event =>
                            setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        disabled={busy}
                        className={inputClass}
                    />
                </div>
            )}
            <div className="flex flex-wrap gap-3">
                <button
                    type="submit"
                    data-testid="classlink-email-submit"
                    disabled={busy || (codeStep && code.length !== 6)}
                    className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {busy ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {codeStep
                                ? m['classlinkPersonalEmail.verifying']()
                                : m['classlinkPersonalEmail.sending']()}
                        </span>
                    ) : codeStep ? (
                        m['classlinkPersonalEmail.verify']()
                    ) : (
                        m['classlinkPersonalEmail.send']()
                    )}
                </button>
                {secondaryAction?.(busy)}
            </div>
        </form>
    );
};
