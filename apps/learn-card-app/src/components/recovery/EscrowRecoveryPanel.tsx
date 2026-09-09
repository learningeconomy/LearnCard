import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import type { KeyDerivationStrategy } from '@learncard/types';
import {
    clearPendingEscrowRecovery,
    loadPendingEscrowRecovery,
    savePendingEscrowRecovery,
    isEscrowRecoveryStorageAvailable,
} from './escrowRecoveryStorage';
import type { PendingEscrowRecovery } from './escrowRecoveryStorage';

export interface EscrowRecoveryPanelProps {
    scope?: string;
    available: boolean;
    canResumeCompleted?: () => boolean;
    onStart: () => ReturnType<NonNullable<KeyDerivationStrategy['startEscrowRecovery']>>;
    onStatus: (proof: {
        holdId: string;
        resumeToken: string;
    }) => ReturnType<NonNullable<KeyDerivationStrategy['getEscrowRecoveryStatus']>>;
    onRecover: (
        input: Omit<PendingEscrowRecovery, 'releaseAfter'> & { method: 'escrow' }
    ) => Promise<void>;
}

export const EscrowRecoveryPanel = ({
    scope = 'default',
    available,
    onStart,
    onStatus,
    onRecover,
    canResumeCompleted,
}: EscrowRecoveryPanelProps) => {
    const active = useRef(true);
    const [pending, setPending] = useState<PendingEscrowRecovery>();
    const [loaded, setLoaded] = useState(false);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [saved, setSaved] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [now, setNow] = useState(Date.now());
    const storageAvailable = isEscrowRecoveryStorageAvailable();
    useEffect(() => {
        active.current = true;
        return () => {
            active.current = false;
        };
    }, []);
    useEffect(() => {
        let active = true;
        setLoaded(false);
        loadPendingEscrowRecovery(scope)
            .then(value => {
                if (active) {
                    setPending(value);
                    setLoaded(true);
                    setError('');
                }
            })
            .catch(() => {
                if (active) setError('Recovery details could not be loaded. Please try again.');
            });
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            active = false;
            clearInterval(timer);
        };
    }, [scope, loadAttempt]);
    if (!available && !pending && !error) return null;
    const run = async (action: () => Promise<void>) => {
        setLoading(true);
        setError('');
        try {
            await action();
        } catch (cause) {
            const message = cause instanceof Error ? cause.message.toLowerCase() : '';
            setError(
                message.includes('cancelled')
                    ? 'This recovery request was cancelled.'
                    : message.includes('expired')
                      ? 'This recovery request expired. Start a new one.'
                      : 'Something went wrong. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };
    const button =
        'w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed';
    const spinner = (text: string) => (
        <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {text}
        </span>
    );
    const checkStatus = async (): Promise<boolean> => {
        if (!pending) return false;
        const hold = await onStatus({ holdId: pending.holdId, resumeToken: pending.resumeToken });
        if (
            !hold ||
            hold.status === 'cancelled' ||
            hold.status === 'expired' ||
            (hold.status === 'completed' && !canResumeCompleted?.())
        ) {
            await clearPendingEscrowRecovery(pending.holdId, scope);
            setPending(undefined);
            setError(
                hold?.status === 'cancelled'
                    ? 'This recovery request was cancelled.'
                    : hold?.status === 'completed'
                      ? 'This recovery request has already finished. Start a new one.'
                      : 'This recovery request expired. Start a new one.'
            );
            return false;
        }
        return true;
    };
    return (
        <section className="font-poppins space-y-4 my-5" aria-label="Account recovery request">
            {!storageAvailable && (
                <p role="alert" className="text-sm text-grayscale-600 leading-relaxed">
                    Use an up-to-date browser on a personal device, with public-computer mode off,
                    for a 7-day recovery.
                </p>
            )}
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
            {notice && (
                <p role="status" className="text-sm text-grayscale-600 leading-relaxed">
                    {notice}
                </p>
            )}
            {!loaded && error && (
                <button className={button} onClick={() => setLoadAttempt(attempt => attempt + 1)}>
                    Try Again
                </button>
            )}
            {pending ? (
                <>
                    <h3 className="text-xl font-semibold text-grayscale-900">Recovery requested</h3>
                    {!saved && (
                        <>
                            <p role="alert" className="text-sm text-red-700 leading-relaxed">
                                Your request has not been saved. Keep this page open and try saving
                                again.
                            </p>
                            <button
                                className={button}
                                disabled={loading}
                                onClick={() =>
                                    void run(async () => {
                                        await savePendingEscrowRecovery(pending, scope);
                                        setSaved(true);
                                    })
                                }
                            >
                                {loading ? spinner('Saving...') : 'Save recovery request'}
                            </button>
                        </>
                    )}
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        You can restore your account after{' '}
                        {new Date(pending.releaseAfter).toLocaleString()}.
                    </p>
                    {now >= Date.parse(pending.releaseAfter) && (
                        <button
                            className={button}
                            disabled={loading}
                            onClick={() =>
                                void run(async () => {
                                    if (!(await checkStatus())) return;
                                    await onRecover({
                                        method: 'escrow',
                                        holdId: pending.holdId,
                                        resumeToken: pending.resumeToken,
                                        clientEphemeralPrivateKey:
                                            pending.clientEphemeralPrivateKey,
                                    });
                                    await clearPendingEscrowRecovery(pending.holdId, scope);
                                    setPending(undefined);
                                })
                            }
                        >
                            {loading ? spinner('Recovering...') : 'Finish recovery'}
                        </button>
                    )}
                    <p className="text-xs text-grayscale-600 leading-relaxed">
                        To cancel this request, use a device where you are already signed in.
                    </p>
                    <button
                        className={button}
                        disabled={loading}
                        onClick={() =>
                            void run(async () => {
                                if (await checkStatus())
                                    setNotice('Your recovery request is still waiting.');
                            })
                        }
                    >
                        {loading ? spinner('Checking...') : 'Check request status'}
                    </button>
                    <button
                        className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40"
                        disabled={loading}
                        onClick={() =>
                            setNotice(
                                'Open your account on a signed-in device and choose Cancel recovery request.'
                            )
                        }
                    >
                        Cancel request
                    </button>
                </>
            ) : (
                available && (
                    <>
                        <button
                            className={button}
                            disabled={!loaded || loading || !storageAvailable}
                            onClick={() =>
                                void run(async () => {
                                    const result = await onStart();
                                    if (!active.current) return;
                                    if (!result.resumeToken) {
                                        setNotice(
                                            'A recovery request is already waiting. Continue on the device where you started it, or cancel it from a signed-in device.'
                                        );
                                        return;
                                    }
                                    const record = {
                                        holdId: result.holdId,
                                        resumeToken: result.resumeToken,
                                        clientEphemeralPrivateKey: result.clientEphemeralPrivateKey,
                                        releaseAfter: result.releaseAfter,
                                    };
                                    setPending(record);
                                    setSaved(false);
                                    await savePendingEscrowRecovery(record, scope);
                                    setSaved(true);
                                })
                            }
                        >
                            {loading ? spinner('Starting recovery...') : 'Start a 7-day recovery'}
                        </button>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Wait 7 days, then return to this browser to restore your account.
                        </p>
                    </>
                )
            )}
        </section>
    );
};
