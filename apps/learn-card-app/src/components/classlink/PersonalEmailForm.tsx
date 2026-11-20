import React, { useEffect, useId, useRef, useState } from 'react';
import { useStartPersonalEmail, useVerifyPersonalEmail } from 'learn-card-base';
import type { LCAPluginMethods } from '@learncard/lca-api-plugin';
import * as m from '../../paraglide/messages.js';
import { RecoveryPinInput } from '../recovery/RecoveryPinInput';
import { LINK_BUTTON_CLASS, PRIMARY_BUTTON_CLASS } from './keepAccountStyles';
import { SignInAgainButton } from './SignInAgainButton';

export type PersonalEmailVerifyResult = Awaited<
    ReturnType<LCAPluginMethods['classlinkVerifyPersonalEmail']>
>;

/** Seconds before "Resend code" comes back; lca-api allows 3 sends per 10 minutes. */
export const RESEND_COOLDOWN_SECONDS = 60;

const CODE_LENGTH = 6;
// Only gates the button; the server is the real check.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
    'w-full min-h-[48px] py-3 px-4 border rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:border-transparent bg-white disabled:opacity-50';

/**
 * Wrap an address in Unicode directional isolates, so it reads left to right inside a
 * right-to-left sentence (Arabic) without moving the punctuation around it.
 */
export const isolateLtr = (text: string): string => `\u2068${text}\u2069`;

/** The tRPC error code from an lca-api call, if any. */
export const getTrpcCode = (error: unknown): string | undefined =>
    (error as { data?: { code?: string } } | null)?.data?.code;

/** The stable refusal reason lca-api sends as `error.data.reason`, if any. */
export const getRefusalReason = (error: unknown): string | undefined => {
    const reason = (error as { data?: { reason?: unknown } } | null)?.data?.reason;
    return typeof reason === 'string' ? reason : undefined;
};

/**
 * Changing the sign-in email needs a sign-in in the last 24 hours (`FORBIDDEN`, reason
 * `recent_sign_in_required`): only signing in again helps.
 */
export const isRecentSignInRequired = (error: unknown): boolean =>
    getRefusalReason(error) === 'recent_sign_in_required';

/**
 * Map a start/verify failure to copy by its tRPC code, never by the server's English
 * message. BAD_REQUEST means a school or unusable address when sending, and a wrong or
 * expired code when verifying.
 */
export const personalEmailErrorMessage = (error: unknown, step: 'email' | 'code'): string => {
    if (isRecentSignInRequired(error)) return m['classlinkKeepAccount.recentSignInRequired']();
    switch (getTrpcCode(error)) {
        // Another LearnCard account already signs in with (or recovers by) the address.
        case 'CONFLICT':
            return m['classlinkKeepAccount.sharedEmail']();
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

/** Where `PersonalEmailForm` hands its parts to a host that lays them out itself. */
export type PersonalEmailFormLayout = (parts: {
    /** The fields, wrapped in the `<form>`. */
    form: React.ReactNode;
    /** The submit button (it targets the form by id, so it can sit anywhere) and extras. */
    actions: React.ReactNode;
    step: 'email' | 'code';
    /** "We sent a code to …": on the code step, the host shows it (e.g. as its body). */
    sentTo: string;
}) => React.ReactNode;

export type PersonalEmailFormProps = {
    /** Called after the code is accepted, with the server's result and the address. */
    onVerified: (result: PersonalEmailVerifyResult, email: string) => void;
    /** Shown right under the email field (e.g. what the address is used for). */
    emailNote?: React.ReactNode;
    /** Called once a code has been sent to a newly entered address (not on resend). */
    onCodeSent?: () => void;
    /** The server refused this account (policy); the parent should re-read why. */
    onForbidden?: () => void;
    /** Extra actions below the submit button (for example "Not now"). */
    secondaryAction?: (busy: boolean) => React.ReactNode;
    /**
     * Lays out the fields and the actions, e.g. with the actions in an onboarding step's
     * sticky bottom bar. By default they stack.
     */
    layout?: PersonalEmailFormLayout;
    /** Class for the submit button; defaults to the full-width primary style. */
    submitClassName?: string;
    /** Focus the email field on mount (the user just asked for this form). */
    autoFocus?: boolean;
    /** Keep the email field's label for screen readers only, when the host already shows it. */
    hideEmailLabel?: boolean;
};

const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) => (
    // Always mounted so assistive tech announces each new error.
    <div id={id} role="alert" className="min-h-5 mt-1.5 text-sm text-red-600 leading-snug">
        {message}
    </div>
);

const Spinner: React.FC<{ light?: boolean }> = ({ light = false }) => (
    <span
        aria-hidden="true"
        className={`w-4 h-4 border-2 rounded-full animate-spin ${
            light ? 'border-white/30 border-t-white' : 'border-grayscale-200 border-t-grayscale-600'
        }`}
    />
);

/**
 * Personal email + emailed code for a ClassLink account. The email step sends a code;
 * the code step names the address (with "Use a different email"), takes the 6-digit
 * code in boxes that accept the OS one-time-code autofill and checks it as soon as the
 * last digit is in, and offers "Resend code" after a short countdown. Each error shows
 * under the field it is about. Whether to show the form at all is the parent's call.
 */
export const PersonalEmailForm: React.FC<PersonalEmailFormProps> = ({
    onVerified,
    emailNote,
    onCodeSent,
    onForbidden,
    secondaryAction,
    layout,
    submitClassName = PRIMARY_BUTTON_CLASS,
    autoFocus = false,
    hideEmailLabel = false,
}) => {
    const start = useStartPersonalEmail();
    const verify = useVerifyPersonalEmail();
    const formId = useId();
    const emailId = `${formId}-email`;
    const emailErrorId = `${formId}-email-error`;
    const codeErrorId = `${formId}-code-error`;
    const [email, setEmail] = useState('');
    // The address the current code went to; the email field may be edited after it.
    const [sentTo, setSentTo] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState<'email' | 'code'>('email');
    const [error, setError] = useState<{ field: 'email' | 'code'; message: string } | null>(null);
    // The server wants a recent sign-in: "Sign in again" replaces the send button.
    const [signInAgain, setSignInAgain] = useState(false);
    const [resendAt, setResendAt] = useState(0);
    const [now, setNow] = useState(() => Date.now());
    const busy = start.isPending || verify.isPending;
    const emailRef = useRef<HTMLInputElement>(null);
    const codeRef = useRef<HTMLDivElement>(null);
    // Where focus goes once the fields are enabled again.
    const focusNextRef = useRef<'email' | 'code' | null>(autoFocus ? 'email' : null);

    const resendSeconds = Math.max(0, Math.ceil((resendAt - now) / 1000));
    // Ticks once a second until the countdown ends, then stops.
    useEffect(() => {
        if (step !== 'code' || resendAt <= Date.now()) return;
        const timer = setInterval(() => {
            const current = Date.now();
            setNow(current);
            if (current >= resendAt) clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
    }, [step, resendAt]);

    useEffect(() => {
        if (busy || !focusNextRef.current || focusNextRef.current !== step) return;
        if (step === 'email') emailRef.current?.focus();
        else codeRef.current?.querySelector<HTMLInputElement>('input')?.focus();
        focusNextRef.current = null;
    }, [busy, step]);

    const fail = (err: unknown, during: 'send' | 'verify'): void => {
        const message = personalEmailErrorMessage(err, during === 'verify' ? 'code' : 'email');
        // A taken address is about the email, wherever it surfaced.
        const field = getTrpcCode(err) === 'CONFLICT' ? 'email' : step;
        setError({ field, message });
        if (field !== step) {
            setStep(field);
            setCode('');
        }
        focusNextRef.current = field;
        if (isRecentSignInRequired(err)) {
            // Not a policy refusal: re-reading continuity would not change anything.
            setSignInAgain(true);
            return;
        }
        if (getTrpcCode(err) === 'FORBIDDEN') onForbidden?.();
    };

    const sendCode = async (): Promise<void> => {
        if (busy) return;
        const address = email.trim();
        const resending = step === 'code';
        setError(null);
        try {
            const result = await start.mutateAsync({ email: address });
            if (!result.success) throw new Error();
            setSentTo(address);
            setCode('');
            setStep('code');
            setNow(Date.now());
            setResendAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
            focusNextRef.current = 'code';
            if (!resending) onCodeSent?.();
        } catch (err) {
            fail(err, 'send');
        }
    };

    const verifyCode = async (value: string): Promise<void> => {
        if (busy || value.length !== CODE_LENGTH) return;
        setError(null);
        try {
            const result = await verify.mutateAsync({ email: sentTo, code: value });
            if (!result.success) throw new Error();
            onVerified(result, sentTo);
        } catch (err) {
            // Clear the boxes so the next code can be typed (or autofilled) straight in.
            setCode('');
            fail(err, 'verify');
        }
    };

    const changeEmail = (): void => {
        setError(null);
        setCode('');
        setStep('email');
        focusNextRef.current = 'email';
    };

    const submit = (event: React.FormEvent): void => {
        event.preventDefault();
        if (step === 'email') void sendCode();
        else void verifyCode(code);
    };

    const sentToMessage = m['classlinkPersonalEmail.sentTo']({ email: isolateLtr(sentTo) });
    const emailError = error?.field === 'email' ? error.message : undefined;
    const codeError = error?.field === 'code' ? error.message : undefined;

    const form = (
        <form id={formId} onSubmit={submit} noValidate className="w-full">
            {step === 'email' ? (
                <div className="text-start">
                    <label
                        htmlFor={emailId}
                        className={
                            hideEmailLabel
                                ? 'sr-only'
                                : 'block text-xs font-medium text-grayscale-700 mb-1.5'
                        }
                    >
                        {m['classlinkPersonalEmail.email']()}
                    </label>
                    <input
                        ref={emailRef}
                        id={emailId}
                        data-testid="classlink-email-input"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        // Addresses read left to right in every language.
                        dir="ltr"
                        maxLength={254}
                        value={email}
                        onChange={event => {
                            setEmail(event.target.value);
                            if (emailError) setError(null);
                        }}
                        disabled={busy}
                        aria-invalid={emailError ? true : undefined}
                        aria-describedby={emailErrorId}
                        className={`${inputClass} ${
                            emailError
                                ? 'border-red-300 focus:ring-red-500'
                                : 'border-grayscale-300 focus:ring-emerald-500'
                        }`}
                    />
                    <FieldError id={emailErrorId} message={emailError} />
                    {emailNote}
                </div>
            ) : (
                <div className="flex flex-col items-center text-center">
                    {/* A host layout shows this line itself, as its screen's body. */}
                    {!layout && (
                        <p className="mb-3 text-sm text-grayscale-600 leading-relaxed">
                            {sentToMessage}
                        </p>
                    )}
                    <div
                        ref={codeRef}
                        role="group"
                        aria-label={m['classlinkPersonalEmail.code']()}
                        aria-describedby={codeErrorId}
                        data-testid="classlink-email-code"
                        // Digits run left to right in every language.
                        dir="ltr"
                        className="w-full flex justify-center"
                    >
                        <RecoveryPinInput
                            variant="code"
                            length={CODE_LENGTH}
                            value={code}
                            onChange={value => {
                                setCode(value);
                                if (codeError && value) setError(null);
                            }}
                            onComplete={value => void verifyCode(value)}
                            disabled={busy}
                            error={!!codeError}
                        />
                    </div>
                    {verify.isPending ? (
                        <p
                            role="status"
                            className="min-h-5 mt-1.5 flex items-center gap-2 text-sm text-grayscale-600"
                        >
                            <Spinner />
                            {m['classlinkPersonalEmail.verifying']()}
                        </p>
                    ) : (
                        <FieldError id={codeErrorId} message={codeError} />
                    )}
                    <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4">
                        <button
                            type="button"
                            data-testid="classlink-email-resend"
                            // Plain text while it counts down, so it reads as status.
                            className={`${LINK_BUTTON_CLASS} tabular-nums`}
                            disabled={busy || resendSeconds > 0}
                            onClick={() => void sendCode()}
                        >
                            {start.isPending
                                ? m['classlinkPersonalEmail.sending']()
                                : resendSeconds > 0
                                  ? m['classlinkPersonalEmail.resendIn']({
                                        seconds: String(resendSeconds),
                                    })
                                  : m['classlinkPersonalEmail.resend']()}
                        </button>
                        <button
                            type="button"
                            data-testid="classlink-email-change"
                            className={LINK_BUTTON_CLASS}
                            disabled={busy}
                            onClick={changeEmail}
                        >
                            {m['classlinkPersonalEmail.changeEmail']()}
                        </button>
                    </div>
                </div>
            )}
        </form>
    );

    // The code is checked as soon as it is complete, so its step has no submit button.
    const actions = (
        <>
            {signInAgain && <SignInAgainButton className={submitClassName} />}
            {step === 'email' && !signInAgain && (
                <button
                    type="submit"
                    form={formId}
                    data-testid="classlink-email-submit"
                    disabled={busy || !EMAIL_SHAPE.test(email.trim())}
                    className={submitClassName}
                >
                    {start.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                            <Spinner light />
                            {m['classlinkPersonalEmail.sending']()}
                        </span>
                    ) : (
                        m['classlinkPersonalEmail.send']()
                    )}
                </button>
            )}
            {secondaryAction?.(busy)}
        </>
    );

    if (layout) return <>{layout({ form, actions, step, sentTo: sentToMessage })}</>;
    return (
        <div className="w-full space-y-3">
            {form}
            <div className="space-y-2">{actions}</div>
        </div>
    );
};
