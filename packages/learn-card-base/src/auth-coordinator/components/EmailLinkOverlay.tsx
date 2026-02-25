/**
 * Email link overlay — shown when a phone-only user needs to add an email
 * to their account before proceeding.
 *
 * Two-step flow:
 *   1. User enters an email → a verification code is sent
 *   2. User enters the 6-digit code → server verifies ownership, links the
 *      email to the auth account (passwordless), and upgrades the UserKey
 *
 * Both callbacks should throw errors with user-friendly messages — the overlay
 * displays `err.message` directly without any provider-specific parsing.
 */

import React, { useState } from 'react';

import { Overlay } from './Overlay';

export interface EmailLinkOverlayProps {
    /** Send a verification code to the given email address. */
    onSendCode: (email: string) => Promise<void>;

    /** Verify the code and upgrade the contact method (server-side). */
    onVerifyCode: (email: string, code: string) => Promise<void>;

    /** Called after verification and upgrade succeed. */
    onComplete: () => void;

    /** Log out instead of adding an email. */
    onLogout: () => void;
}

export const EmailLinkOverlay: React.FC<EmailLinkOverlayProps> = ({
    onSendCode,
    onVerifyCode,
    onComplete,
    onLogout,
}) => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'email' | 'code' | 'success'>('email');

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setError('Please enter an email address.');
            return;
        }

        setLoading(true);

        try {
            await onSendCode(trimmedEmail);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong sending the code. Please try again.');
            setLoading(false);
            return;
        }

        setLoading(false);
        setStep('code');
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const trimmedCode = code.trim();

        if (!trimmedCode || trimmedCode.length !== 6) {
            setError('Please enter the 6-digit code from your email.');
            return;
        }

        setLoading(true);

        try {
            await onVerifyCode(email.trim(), trimmedCode);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong verifying your email. Please try again.');
            setLoading(false);
            return;
        }

        setLoading(false);
        setStep('success');
    };

    const handleResendCode = async () => {
        setError(null);
        setLoading(true);

        try {
            await onSendCode(email.trim());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong sending the code. Please try again.');
            setLoading(false);
            return;
        }

        setLoading(false);
        setError(null);
    };

    if (step === 'success') {
        return (
            <Overlay>
                <div className="p-8 text-center space-y-5">
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                        <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-grayscale-900">Email Added</h2>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Your account is now secured with <strong className="text-grayscale-900">{email.trim()}</strong>.
                            You can use this email to sign in going forward.
                        </p>
                    </div>

                    <button
                        onClick={onComplete}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                        Continue
                    </button>
                </div>
            </Overlay>
        );
    }

    if (step === 'code') {
        return (
            <Overlay>
                <form onSubmit={handleVerifyCode} className="p-8 space-y-5">
                    <div className="text-center space-y-2">
                        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                            <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>

                        <h2 className="text-xl font-semibold text-grayscale-900">Check Your Email</h2>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            We sent a 6-digit code to <strong className="text-grayscale-900">{email.trim()}</strong>.
                            Enter it below to verify your email.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                            <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                            Verification Code
                        </label>

                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={code}
                            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            autoComplete="one-time-code"
                            disabled={loading}
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900
                                       text-center tracking-[0.3em] font-medium
                                       placeholder:text-grayscale-400 placeholder:tracking-[0.3em]
                                       focus:outline-none focus:ring-2 focus:ring-emerald-500
                                       focus:border-transparent bg-white disabled:opacity-50"
                        />
                    </div>

                    <div className="space-y-3 pt-1">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm
                                       hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verifying...
                                </span>
                            ) : 'Verify Email'}
                        </button>

                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => { setStep('email'); setCode(''); setError(null); }}
                                disabled={loading}
                                className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                            >
                                Change Email
                            </button>

                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={loading}
                                className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                            >
                                Resend Code
                            </button>
                        </div>
                    </div>
                </form>
            </Overlay>
        );
    }

    return (
        <Overlay>
            <form onSubmit={handleSendCode} className="p-8 space-y-5">
                <div className="text-center space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                        <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <h2 className="text-xl font-semibold text-grayscale-900">Add an Email Address</h2>

                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        To keep your account secure, please add an email address.
                        This lets us send you a recovery key in case you lose access to your device.
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                        <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                        Email Address
                    </label>

                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        disabled={loading}
                        className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900
                                   placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500
                                   focus:border-transparent bg-white disabled:opacity-50"
                    />
                </div>

                <div className="space-y-3 pt-1">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm
                                   hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Sending Code...
                            </span>
                        ) : 'Send Verification Code'}
                    </button>

                    <button
                        type="button"
                        onClick={onLogout}
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm
                                   hover:bg-grayscale-10 transition-colors disabled:opacity-40"
                    >
                        Log Out
                    </button>
                </div>
            </form>
        </Overlay>
    );
};
