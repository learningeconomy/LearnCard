import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, shieldHalfOutline, checkmarkCircleOutline } from 'ionicons/icons';
import * as m from '../../paraglide/messages.js';

const getRelativeTime = (dateStr: string, locale: string = 'en') => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    const absDiff = Math.abs(diffInSeconds);
    if (absDiff < 60) return rtf.format(Math.round(diffInSeconds), 'second');
    if (absDiff < 3600) return rtf.format(Math.round(diffInSeconds / 60), 'minute');
    if (absDiff < 86400) return rtf.format(Math.round(diffInSeconds / 3600), 'hour');
    if (absDiff < 2592000) return rtf.format(Math.round(diffInSeconds / 86400), 'day');
    if (absDiff < 31536000) return rtf.format(Math.round(diffInSeconds / 2592000), 'month');
    return rtf.format(Math.round(diffInSeconds / 31536000), 'year');
};

const getRemainingTime = (dateStr: string, locale: string = 'en') => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

    if (diffInSeconds <= 0) return 'soon';

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'always', style: 'long' });

    if (diffInSeconds < 60) return rtf.format(diffInSeconds, 'second').replace('in ', '');
    if (diffInSeconds < 3600)
        return rtf.format(Math.round(diffInSeconds / 60), 'minute').replace('in ', '');
    if (diffInSeconds < 86400)
        return rtf.format(Math.round(diffInSeconds / 3600), 'hour').replace('in ', '');
    if (diffInSeconds < 2592000)
        return rtf.format(Math.round(diffInSeconds / 86400), 'day').replace('in ', '');
    if (diffInSeconds < 31536000)
        return rtf.format(Math.round(diffInSeconds / 2592000), 'month').replace('in ', '');
    return rtf.format(Math.round(diffInSeconds / 31536000), 'year').replace('in ', '');
};

export const EscrowRecoveryHoldBanner = ({
    requestedAt,
    releaseAfter,
    onCancel,
}: {
    requestedAt: string;
    releaseAfter?: string;
    onCancel: () => Promise<unknown>;
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [success, setSuccess] = useState(false);

    // Force re-render every minute to update relative times
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(interval);
    }, []);

    if (dismissed) return null;

    // We can use navigator.language or fallback to 'en'
    const locale = typeof navigator !== 'undefined' ? navigator.language : 'en';
    const timeAgo = getRelativeTime(requestedAt, locale);
    const timeRemaining = releaseAfter ? getRemainingTime(releaseAfter, locale) : '';

    return (
        <section
            role="alert"
            aria-labelledby="escrow-hold-title"
            aria-describedby="escrow-hold-desc"
            className="font-poppins p-5 bg-white/80 backdrop-blur-xl border border-grayscale-200 shadow-lg rounded-[24px] space-y-4 animate-fade-in-up transition-all duration-300 ease-in-out"
        >
            {success ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3 animate-fade-in-up">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <IonIcon
                            icon={checkmarkCircleOutline}
                            className="text-emerald-600 text-2xl"
                        />
                    </div>
                    <p className="text-sm font-medium text-emerald-700 text-center">
                        {m['recovery.escrowHold.success']()}
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <IonIcon icon={shieldHalfOutline} className="text-amber-600 text-xl" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <h3
                                id="escrow-hold-title"
                                className="text-base font-semibold text-grayscale-900"
                            >
                                {m['recovery.escrowHold.title']()}
                            </h3>
                            <p
                                id="escrow-hold-desc"
                                className="text-sm text-grayscale-600 leading-relaxed"
                                title={new Date(requestedAt).toLocaleString()}
                            >
                                {m['recovery.escrowHold.body']({ timeAgo })}
                            </p>
                            {releaseAfter && (
                                <p
                                    className="text-xs text-grayscale-500"
                                    title={new Date(releaseAfter).toLocaleString()}
                                >
                                    {m['recovery.escrowHold.finishesIn']({ timeRemaining })}
                                </p>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                            <IonIcon
                                icon={alertCircleOutline}
                                className="text-red-400 text-lg mt-0.5 shrink-0"
                            />
                            <span className="text-sm text-red-700 leading-relaxed">
                                {m['recovery.error.default']()}
                            </span>
                        </div>
                    )}

                    <div className="flex flex-col gap-2 pt-1">
                        <button
                            disabled={loading}
                            onClick={async () => {
                                setLoading(true);
                                setError(false);
                                try {
                                    await onCancel();
                                    setSuccess(true);
                                    setTimeout(() => {
                                        setDismissed(true);
                                    }, 2500);
                                } catch {
                                    setError(true);
                                    setLoading(false);
                                }
                            }}
                            className="w-full py-3 px-4 rounded-[20px] bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {m['recovery.escrowHold.stopping']()}
                                </span>
                            ) : (
                                m['recovery.escrowHold.stop']()
                            )}
                        </button>
                        <button
                            disabled={loading}
                            onClick={() => setDismissed(true)}
                            className="w-full py-3 px-4 rounded-[20px] text-grayscale-600 font-medium text-sm hover:bg-grayscale-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grayscale-500 focus-visible:ring-offset-2"
                        >
                            {m['recovery.escrowHold.dismiss']()}
                        </button>
                    </div>
                </>
            )}
        </section>
    );
};
