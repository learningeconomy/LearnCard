import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import {
    useClassLinkPersonalEmail,
    useStartPersonalEmail,
    useVerifyPersonalEmail,
} from 'learn-card-base';
import * as m from '../../paraglide/messages.js';

const DISMISSED_KEY = 'classlink-personal-email-dismissed-at';
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;
const inputClass =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white';

const friendlyError = (error: unknown): string => {
    const message = error instanceof Error ? error.message : '';
    if (message === 'Use a personal email, not your school email')
        return m['classlinkPersonalEmail.schoolError']();
    if (message === 'This email is already used by another account.')
        return m['classlinkPersonalEmail.conflictError']();
    if (message === 'Invalid or expired code. Please try again.')
        return m['classlinkPersonalEmail.codeError']();
    if (message === 'Too many codes requested. Please try again later.')
        return m['classlinkPersonalEmail.limitError']();
    return m['classlinkPersonalEmail.error']();
};

export const PersonalEmailPrompt: React.FC = () => {
    const status = useClassLinkPersonalEmail();
    const start = useStartPersonalEmail();
    const verify = useVerifyPersonalEmail();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [codeStep, setCodeStep] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [dismissed, setDismissed] = useState(() => {
        try {
            const timestamp = Number(localStorage.getItem(DISMISSED_KEY));
            return timestamp > 0 && Date.now() - timestamp < DISMISS_MS;
        } catch {
            return false;
        }
    });
    const busy = start.isPending || verify.isPending;

    // Only an affirmative, unverified ClassLink response shows this invitation.
    // In particular, FORBIDDEN for other sign-in methods stays invisible.
    if (dismissed || status.isError || !status.data || (status.data.verified && !success))
        return null;

    const submit = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        if (busy) return;
        setError('');
        try {
            if (codeStep) {
                const result = await verify.mutateAsync({ email: email.trim(), code });
                if (!result.success) throw new Error();
                setSuccess(true);
            } else {
                const result = await start.mutateAsync({ email: email.trim() });
                if (!result.success) throw new Error();
                setCodeStep(true);
            }
        } catch (err) {
            setError(friendlyError(err));
        }
    };

    return (
        <section
            data-testid="classlink-email-prompt"
            className="w-full max-w-md mx-auto mb-5 p-6 bg-white rounded-[20px] font-poppins space-y-5"
        >
            {success ? (
                <div
                    role="status"
                    className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5"
                >
                    <IonIcon
                        icon={checkmarkCircleOutline}
                        className="text-emerald-500 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-emerald-700 leading-relaxed">
                        {m['classlinkPersonalEmail.success']()}
                    </span>
                </div>
            ) : (
                <>
                    <div>
                        <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                            {m['classlinkPersonalEmail.title']()}
                        </h2>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {m['classlinkPersonalEmail.body']()}
                        </p>
                    </div>
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
                    <form onSubmit={submit} className="space-y-4">
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
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                    try {
                                        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
                                    } catch {
                                        /* Still dismiss for this session when storage is unavailable. */
                                    }
                                    setDismissed(true);
                                }}
                                className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40"
                            >
                                {m['classlinkPersonalEmail.skip']()}
                            </button>
                        </div>
                    </form>
                </>
            )}
        </section>
    );
};
