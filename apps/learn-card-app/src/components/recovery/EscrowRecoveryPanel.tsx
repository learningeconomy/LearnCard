import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    alertCircleOutline,
    timeOutline,
    checkmarkCircleOutline,
    shieldCheckmarkOutline,
    mailOutline,
} from 'ionicons/icons';
import type { KeyDerivationStrategy } from '@learncard/types';
import {
    EscrowHoldRestartThrottledError,
    type EscrowRecoveryExpectations,
    type EscrowRecoveryStart,
} from '@learncard/sss-key-manager';
import { escrowPinMismatchMessage } from '@learncard/types';
import {
    clearPendingEscrowRecovery,
    loadPendingEscrowRecovery,
    savePendingEscrowRecovery,
    isEscrowRecoveryStorageAvailable,
} from './escrowRecoveryStorage';
import type { PendingEscrowRecovery } from './escrowRecoveryStorage';
import { RecoveryPinInput } from './RecoveryPinInput';
import * as m from '../../paraglide/messages.js';

export const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return 'Ready';
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days >= 1) return `Ready in ${days} day${days > 1 ? 's' : ''} ${hours} hr`;
    if (hours >= 1) return `Ready in ${hours} hr ${minutes} min`;
    if (minutes >= 1) return `Ready in ${minutes} min`;
    return `Ready in ${seconds} sec`;
};

export interface EscrowRecoveryPanelProps {
    view: 'status' | 'start';
    scope?: string;
    available: boolean;
    pinAvailable?: boolean;
    canResumeCompleted?: () => boolean;
    onStart: (options?: { restart?: boolean }) => Promise<EscrowRecoveryStart>;
    onStatus: (proof: {
        holdId: string;
        resumeToken: string;
        /** Retained from the hold's start response; required for a Nitro hold. */
        expectations?: EscrowRecoveryExpectations;
    }) => ReturnType<NonNullable<KeyDerivationStrategy['getEscrowRecoveryStatus']>>;
    onRecover: (
        input:
            | (Omit<PendingEscrowRecovery, 'releaseAfter'> & { method: 'escrow' })
            | { method: 'escrow-pin'; pin: string }
    ) => Promise<void>;
    /**
     * Only meaningful when a hold's status reports `requiresConfirmation: true`.
     * An optional `releaseAfter` is an immediate hint; the panel always
     * follows up with an authoritative status fetch regardless.
     */
    onConfirmCode: (params: {
        holdId: string;
        resumeToken: string;
        code: string;
        /** Retained from the hold's start response; required for a Nitro hold. */
        expectations?: EscrowRecoveryExpectations;
    }) => Promise<{ success: true; releaseAfter?: string }>;
    onResendCode: (params: { holdId: string; resumeToken: string }) => Promise<{ success: true }>;
}

/** lca-api answers 403 when the code or resend was refused; anything else is transport/service. */
const isEscrowRefusal = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status: unknown }).status === 403;

export const EscrowRecoveryPanel = ({
    scope = 'default',
    available,
    pinAvailable = false,
    onStart,
    onStatus,
    onRecover,
    onConfirmCode,
    onResendCode,
    canResumeCompleted,
    view,
}: EscrowRecoveryPanelProps) => {
    const active = useRef(true);
    const [pending, setPending] = useState<PendingEscrowRecovery>();
    // [P2] Status reads (mount effect, checkStatus, and the confirmation
    // flow) are async and can resolve out of order. `statusGenerationRef`
    // increments on every new read -- and when confirmation starts -- so a
    // response that's been superseded can be detected and ignored instead of
    // clobbering fresher state (e.g. reverting `confirmed` back to false).
    // `activeHoldIdRef` mirrors `pending?.holdId` on every render so even a
    // stale closure can tell whether it's still talking about the hold
    // currently on screen.
    const statusGenerationRef = useRef(0);
    const activeHoldIdRef = useRef(pending?.holdId);
    activeHoldIdRef.current = pending?.holdId;
    const beginStatusRead = () => {
        statusGenerationRef.current += 1;
        return statusGenerationRef.current;
    };
    const [existingHold, setExistingHold] = useState<{
        holdId: string;
        requestedAt: string;
        releaseAfter: string;
    } | null>(null);
    const [restartError, setRestartError] = useState<{
        message: string;
        retryAfter?: string;
    } | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [saved, setSaved] = useState(true);
    const [loading, setLoading] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [now, setNow] = useState(Date.now());
    const storageAvailable = isEscrowRecoveryStorageAvailable();

    // P9.1 (attack C): tracks whether this hold's emailed code has been
    // confirmed. Reset on a fresh hold; refreshed from the server (never
    // trusted purely from local storage) on load and on every status check.
    const [confirmed, setConfirmed] = useState(false);
    const [codeInput, setCodeInput] = useState('');
    const [codeError, setCodeError] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendNotice, setResendNotice] = useState('');

    const handleStarted = async (result: EscrowRecoveryStart) => {
        if (!result.resumeToken) {
            if (!active.current) return;
            setExistingHold({
                holdId: result.holdId,
                requestedAt: result.requestedAt,
                releaseAfter: result.releaseAfter,
            });
            return;
        }
        const record = {
            holdId: result.holdId,
            resumeToken: result.resumeToken,
            clientEphemeralPrivateKey: result.clientEphemeralPrivateKey,
            releaseAfter: result.releaseAfter,
            requestedAt: result.requestedAt,
            requiresConfirmation: result.requiresConfirmation,
            expectations: result.expectations,
        };
        if (active.current) {
            setPending(record);
            setConfirmed(false);
            setCodeInput('');
            setCodeError('');
            setResendNotice('');
            setSaved(false);
            setExistingHold(null);
        }
        await savePendingEscrowRecovery(record, scope);
        if (!active.current) return;
        setSaved(true);
    };

    const [showPinFlow, setShowPinFlow] = useState(pinAvailable);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');
    // Locked or unavailable PINs must not be offered again from the wait view.
    const [pinBlocked, setPinBlocked] = useState(false);

    useEffect(() => {
        if (pinAvailable) setShowPinFlow(true);
    }, [pinAvailable]);

    useEffect(() => {
        active.current = true;
        return () => {
            active.current = false;
        };
    }, []);
    useEffect(() => {
        let cancelled = false;
        setLoaded(false);
        loadPendingEscrowRecovery(scope)
            .then(value => {
                if (cancelled) return;
                // A hold awaiting email confirmation only ever comes from
                // authority (Nitro) mode, which always returns `expectations`
                // alongside it (see EscrowRecoveryStart) -- status/confirm calls
                // cannot prove this client started the hold without them. A
                // record missing them predates this requirement and can never
                // be completed: drop it and let the start view take over,
                // rather than reconstructing bindings from a status response.
                if (value?.requiresConfirmation !== undefined && !value.expectations) {
                    setPending(undefined);
                    setLoaded(true);
                    setError(m['recovery.invalidRequest']());
                    void clearPendingEscrowRecovery(value.holdId, scope).catch(() => {});
                    return;
                }
                setPending(value);
                setLoaded(true);
                setError('');
            })
            .catch(() => {
                if (!cancelled) setError('Recovery details could not be loaded. Please try again.');
            });
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [scope, loadAttempt]);

    // [B] `releaseAfter` can advance after the start-time estimate (a late
    // release-warning send pushes the enclave's real release gate later, see
    // EscrowHold.ts's `computeEffectiveReleaseAfter`) or move earlier (hold
    // confirmation replaces the creation-time estimate) — both callers below
    // must adopt the server's current value instead of keeping the one
    // captured when the hold was started. `hold` is a status response and
    // never carries `expectations`, so spreading `...pending` below always
    // preserves the initiating-client bindings captured at start.
    const refreshHoldStatus = async (
        hold: { confirmed?: boolean; releaseAfter?: string } | null | undefined,
        { generation, holdId }: { generation: number; holdId: string }
    ): Promise<void> => {
        if (!hold) return;
        // [P2] Ignore a read superseded by a newer one (or by a confirmation
        // that started after this read began): the mount-time status read
        // stays alive for the whole life of a hold (it only re-runs if
        // `holdId` changes), so a slow response can otherwise land after
        // confirmation already moved the UI forward and drag it back.
        if (generation !== statusGenerationRef.current || holdId !== activeHoldIdRef.current) {
            return;
        }
        // Monotonic for a given hold: once confirmed locally, never let a
        // stale confirmed: false revert it. Independent of the generation
        // check above as a second guard on the field a race would most
        // visibly break.
        setConfirmed(prev => prev || Boolean(hold.confirmed));
        // Guard against a missing/malformed value (e.g. a terminal-status
        // response that omits it): never adopt a releaseAfter that would
        // render as an invalid date.
        if (
            pending &&
            hold.releaseAfter &&
            !Number.isNaN(Date.parse(hold.releaseAfter)) &&
            hold.releaseAfter !== pending.releaseAfter
        ) {
            const updated = { ...pending, releaseAfter: hold.releaseAfter };
            setPending(updated);
            await savePendingEscrowRecovery(updated, scope);
        }
    };

    // Confirmation state lives only on the server; a reload must re-derive it
    // rather than trust whatever was last persisted locally. Must stay above
    // every early return below so hook call order never varies between renders.
    useEffect(() => {
        if (!pending?.requiresConfirmation) return;
        let cancelled = false;
        const holdId = pending.holdId;
        const generation = beginStatusRead();
        onStatus({
            holdId: pending.holdId,
            resumeToken: pending.resumeToken,
            expectations: pending.expectations,
        })
            .then(hold => {
                if (!cancelled) void refreshHoldStatus(hold, { generation, holdId });
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pending?.holdId]);

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

    const handlePinRecover = async (pin: string) => {
        setLoading(true);
        setPinError('');
        try {
            await onRecover({ method: 'escrow-pin', pin });
        } catch (cause) {
            const err = cause instanceof Error ? cause : new Error();
            if (err.name === 'EscrowPinMismatchError') {
                const attempts = 'attemptsRemaining' in err ? Number(err.attemptsRemaining) : 0;
                setPinError(escrowPinMismatchMessage(attempts));
                setPinInput('');
            } else if (err.name === 'EscrowPinThrottledError') {
                setPinError(m['recovery.pin.throttled']());
                setPinInput('');
            } else if (err.name === 'EscrowPinLockedError') {
                setPinError('Too many attempts. You can still recover by waiting 7 days.');
                setPinBlocked(true);
                setShowPinFlow(false);
            } else {
                if (
                    err.name === 'EscrowPinUnavailableError' ||
                    (err.name === 'EscrowRequestError' && 'status' in err && err.status === 403)
                ) {
                    setPinError(
                        "PIN sign-in isn't available for this account. Start a 7-day recovery instead."
                    );
                    setPinBlocked(true);
                    setShowPinFlow(false);
                } else {
                    setPinError('Something went wrong. Please try again.');
                }
                setPinInput('');
            }
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
    // [P2] `ok` mirrors the old boolean (hold still valid / UI should keep
    // showing it); `ready` is the *refreshed* availability. Restore must gate
    // on the `hold` object's own releaseAfter here rather than re-read
    // `pending` after this resolves: `refreshHoldStatus`'s `setPending` is a
    // separate state update that hasn't flushed into this closure yet.
    const checkStatus = async (): Promise<{ ok: boolean; ready: boolean }> => {
        if (!pending) return { ok: false, ready: false };
        const holdId = pending.holdId;
        const generation = beginStatusRead();
        const hold = await onStatus({
            holdId: pending.holdId,
            resumeToken: pending.resumeToken,
            expectations: pending.expectations,
        });
        // [P2] A newer read (or a confirmation) may have started, and even
        // finished, while this one was in flight. Report not-ready instead
        // of acting on it: acting here could mean clearing a hold (below)
        // that a newer read has already moved past.
        if (generation !== statusGenerationRef.current || holdId !== activeHoldIdRef.current) {
            return { ok: false, ready: false };
        }
        if (
            !hold ||
            hold.status === 'cancelled' ||
            hold.status === 'expired' ||
            (hold.status === 'completed' && !canResumeCompleted?.())
        ) {
            await clearPendingEscrowRecovery(holdId, scope);
            setPending(undefined);
            setError(
                hold?.status === 'cancelled'
                    ? 'This recovery request was cancelled.'
                    : hold?.status === 'completed'
                      ? 'This recovery request has already finished. Start a new one.'
                      : 'This recovery request expired. Start a new one.'
            );
            return { ok: false, ready: false };
        }
        await refreshHoldStatus(hold, { generation, holdId });
        const effectiveReleaseAfter =
            hold.releaseAfter && !Number.isNaN(Date.parse(hold.releaseAfter))
                ? hold.releaseAfter
                : pending.releaseAfter;
        return { ok: true, ready: Date.parse(effectiveReleaseAfter) <= Date.now() };
    };

    const handleConfirmCode = async (code: string) => {
        if (!pending) return;
        setConfirming(true);
        setCodeError('');
        // [P2] Confirmation is about to become authoritative for this hold's
        // confirmed/releaseAfter. Bump the generation before awaiting
        // anything so a status read already in flight (e.g. the mount-time
        // check above) is treated as superseded even if it resolves after
        // this whole flow completes.
        const holdId = pending.holdId;
        const generation = beginStatusRead();
        try {
            const result = await onConfirmCode({
                holdId: pending.holdId,
                resumeToken: pending.resumeToken,
                code,
                expectations: pending.expectations,
            });
            setConfirmed(true);
            setCodeInput('');
            // [P2] Confirmation recomputes the deadline server-side, but the
            // load effect above only re-runs when `holdId` changes (it never
            // does here), so without this a delayed confirmation would keep
            // showing the creation-time countdown until a manual "Check
            // status" click or a remount. Adopt an immediate value if the
            // confirm response carries one, then treat a status refresh as
            // authoritative -- best-effort (like the load effect above), so
            // a transient refresh failure doesn't surface as a confirmation
            // error the user can't act on.
            if (result.releaseAfter) {
                await refreshHoldStatus(
                    { confirmed: true, releaseAfter: result.releaseAfter },
                    { generation, holdId }
                );
            }
            await checkStatus().catch(() => {});
        } catch (e) {
            const isRefusal = isEscrowRefusal(e);
            setCodeError(
                isRefusal ? m['recovery.confirmCode.error']() : m['recovery.confirmCode.failed']()
            );
            setCodeInput('');
        } finally {
            setConfirming(false);
        }
    };

    const handleResendCode = async () => {
        if (!pending) return;
        setResending(true);
        setResendNotice('');
        setCodeError('');
        try {
            await onResendCode({ holdId: pending.holdId, resumeToken: pending.resumeToken });
            setResendNotice(m['recovery.confirmCode.resent']());
        } catch (e) {
            const isRefusal = isEscrowRefusal(e);
            setCodeError(
                isRefusal
                    ? m['recovery.confirmCode.resendError']()
                    : m['recovery.confirmCode.resendFailed']()
            );
        } finally {
            setResending(false);
        }
    };
    // Screen 1 only surfaces a recovery already underway; starting one lives on Screen 2.
    if (view === 'status' && !pending && !existingHold && !error && !notice) return null;
    return (
        <section className="font-poppins space-y-4 my-5" aria-label="Account recovery request">
            {view === 'start' && !storageAvailable && (
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
            {notice && !pending && (
                <p role="status" className="text-sm text-grayscale-600 leading-relaxed">
                    {notice}
                </p>
            )}

            {existingHold && !pending && (
                <div className="space-y-5 animate-fade-in-up">
                    <div className="rounded-2xl border border-grayscale-200 bg-white p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-50 text-amber-600">
                                <IonIcon icon={timeOutline} className="text-xl" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-grayscale-900">
                                    A recovery request is already waiting
                                </h3>
                                <p className="text-sm text-grayscale-600">
                                    Started{' '}
                                    {new Intl.DateTimeFormat(undefined, {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                    }).format(new Date(existingHold.requestedAt))}{' '}
                                    · ready{' '}
                                    {new Intl.DateTimeFormat(undefined, {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                    }).format(new Date(existingHold.releaseAfter))}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-grayscale-500">
                            To finish, return to the browser where you started it. If you're signed
                            in elsewhere, you can cancel it there.
                        </p>

                        <hr className="border-grayscale-200" />

                        <div className="space-y-1">
                            <p className="text-sm font-medium text-grayscale-900">
                                Lost that browser?
                            </p>
                            <p className="text-xs text-grayscale-600">
                                You can start over. This restarts the 7-day wait and replaces the
                                earlier request.
                            </p>
                        </div>

                        {restartError && (
                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5">
                                <IonIcon
                                    icon={alertCircleOutline}
                                    className="text-amber-500 text-lg mt-0.5 shrink-0"
                                />
                                <span className="text-sm text-amber-800 leading-relaxed">
                                    {restartError.retryAfter
                                        ? `A request was started recently. You can start over after ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(restartError.retryAfter))}.`
                                        : 'A request was started recently. Please try again later.'}
                                </span>
                            </div>
                        )}

                        <button
                            className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={loading}
                            onClick={() => {
                                void run(async () => {
                                    setRestartError(null);
                                    try {
                                        const result = await onStart({ restart: true });
                                        await handleStarted(result);
                                    } catch (cause) {
                                        if (cause instanceof EscrowHoldRestartThrottledError) {
                                            setRestartError({
                                                message: 'A request was started recently.',
                                                retryAfter: cause.retryAfter,
                                            });
                                            return;
                                        }
                                        throw cause;
                                    }
                                });
                            }}
                        >
                            {loading ? spinner('Starting over...') : 'Start over'}
                        </button>
                    </div>

                    <div className="flex justify-center">
                        <button
                            className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors disabled:opacity-50"
                            disabled={loading}
                            onClick={() => {
                                setExistingHold(null);
                                setRestartError(null);
                            }}
                        >
                            Back
                        </button>
                    </div>
                </div>
            )}

            {!loaded && error && (
                <button className={button} onClick={() => setLoadAttempt(attempt => attempt + 1)}>
                    Try Again
                </button>
            )}
            {pending
                ? (() => {
                      if (pending.requiresConfirmation && !confirmed) {
                          return (
                              <div className="space-y-5 animate-fade-in-up">
                                  <div className="rounded-2xl border border-grayscale-200 bg-white p-5 space-y-5">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-50 text-amber-600">
                                              <IonIcon icon={mailOutline} className="text-xl" />
                                          </div>
                                          <div>
                                              <h3 className="text-base font-semibold text-grayscale-900">
                                                  {m['recovery.confirmCode.title']()}
                                              </h3>
                                              <p className="text-sm text-grayscale-600">
                                                  {m['recovery.confirmCode.description']()}
                                              </p>
                                          </div>
                                      </div>

                                      <div className="flex justify-center py-2">
                                          <RecoveryPinInput
                                              length={8}
                                              value={codeInput}
                                              onChange={val => {
                                                  setCodeInput(val);
                                                  setCodeError('');
                                              }}
                                              onComplete={code => void handleConfirmCode(code)}
                                              disabled={confirming}
                                              error={!!codeError}
                                          />
                                      </div>

                                      {codeError && (
                                          <p className="text-sm text-red-600 text-center">
                                              {codeError}
                                          </p>
                                      )}
                                      {confirming && (
                                          <div className="flex justify-center">
                                              {spinner(m['recovery.confirmCode.confirming']())}
                                          </div>
                                      )}
                                      {resendNotice && !codeError && (
                                          <p className="text-sm text-emerald-600 text-center">
                                              {resendNotice}
                                          </p>
                                      )}

                                      <button
                                          onClick={() => void handleResendCode()}
                                          disabled={resending || confirming}
                                          className="w-full py-2.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors disabled:opacity-40"
                                      >
                                          {resending
                                              ? m['recovery.confirmCode.resending']()
                                              : m['recovery.confirmCode.resend']()}
                                      </button>
                                  </div>
                              </div>
                          );
                      }
                      const releaseTime = Date.parse(pending.releaseAfter);
                      const isReady = now >= releaseTime;
                      const timeRemaining = Math.max(0, releaseTime - now);

                      let progressPercent = 0;
                      let showProgress = false;
                      if (pending.requestedAt) {
                          const requestedTime = Date.parse(pending.requestedAt);
                          const totalDuration = releaseTime - requestedTime;
                          if (totalDuration > 0) {
                              showProgress = true;
                              const elapsed = now - requestedTime;
                              progressPercent = Math.min(
                                  100,
                                  Math.max(0, (elapsed / totalDuration) * 100)
                              );
                          }
                      }

                      return (
                          <div className="space-y-5 animate-fade-in-up">
                              <div className="rounded-2xl border border-grayscale-200 bg-white p-5 space-y-5">
                                  <div className="flex items-center gap-3">
                                      <div
                                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isReady ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}
                                      >
                                          <IonIcon
                                              icon={isReady ? checkmarkCircleOutline : timeOutline}
                                              className="text-xl"
                                          />
                                      </div>
                                      <div>
                                          <h3 className="text-base font-semibold text-grayscale-900">
                                              {isReady
                                                  ? 'Ready to restore'
                                                  : 'Recovery in progress'}
                                          </h3>
                                          <p className="text-sm text-grayscale-600">
                                              {isReady
                                                  ? 'Your account is ready to be recovered.'
                                                  : 'Your request is on track.'}
                                          </p>
                                      </div>
                                  </div>

                                  {!isReady && (
                                      <div className="space-y-2" aria-live="polite">
                                          <p className="text-lg font-medium text-grayscale-900">
                                              {formatTimeRemaining(timeRemaining)}
                                          </p>
                                          <p className="text-sm text-grayscale-500">
                                              {new Intl.DateTimeFormat(undefined, {
                                                  dateStyle: 'medium',
                                                  timeStyle: 'short',
                                              }).format(new Date(pending.releaseAfter))}
                                          </p>
                                          {showProgress && (
                                              <div className="h-1.5 w-full rounded-full bg-grayscale-100 overflow-hidden mt-3">
                                                  <div
                                                      className="h-full bg-emerald-500 transition-[width] duration-1000 ease-linear"
                                                      style={{ width: `${progressPercent}%` }}
                                                  />
                                              </div>
                                          )}
                                      </div>
                                  )}

                                  {notice && (
                                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
                                          <IonIcon
                                              icon={checkmarkCircleOutline}
                                              className="text-emerald-500 text-lg mt-0.5 shrink-0"
                                          />
                                          <span className="text-sm text-emerald-700 leading-relaxed">
                                              {notice}
                                          </span>
                                      </div>
                                  )}

                                  {!saved && (
                                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-3">
                                          <div className="flex items-start gap-2.5">
                                              <IonIcon
                                                  icon={alertCircleOutline}
                                                  className="text-amber-500 text-lg mt-0.5 shrink-0"
                                              />
                                              <span className="text-sm text-amber-800 leading-relaxed">
                                                  Your request has not been saved. Keep this page
                                                  open and try saving again.
                                              </span>
                                          </div>
                                          <button
                                              className={button}
                                              disabled={loading}
                                              onClick={() =>
                                                  void run(async () => {
                                                      await savePendingEscrowRecovery(
                                                          pending,
                                                          scope
                                                      );
                                                      setSaved(true);
                                                  })
                                              }
                                          >
                                              {loading
                                                  ? spinner('Saving...')
                                                  : 'Save recovery request'}
                                          </button>
                                      </div>
                                  )}

                                  {isReady && (
                                      <div className="pt-2">
                                          <button
                                              className={button}
                                              disabled={loading}
                                              onClick={() =>
                                                  void run(async () => {
                                                      // [P2] Gate on the freshly refreshed
                                                      // availability, not the pre-click one:
                                                      // confirmation or a release-warning send
                                                      // can push releaseAfter into the future
                                                      // between render and this click.
                                                      const { ok, ready } = await checkStatus();
                                                      if (!ok || !ready) return;
                                                      setFinishing(true);
                                                      try {
                                                          await onRecover({
                                                              method: 'escrow',
                                                              holdId: pending.holdId,
                                                              resumeToken: pending.resumeToken,
                                                              clientEphemeralPrivateKey:
                                                                  pending.clientEphemeralPrivateKey,
                                                              expectations: pending.expectations,
                                                          });
                                                      } finally {
                                                          setFinishing(false);
                                                      }
                                                      await clearPendingEscrowRecovery(
                                                          pending.holdId,
                                                          scope
                                                      );
                                                      setPending(undefined);
                                                  })
                                              }
                                          >
                                              {loading
                                                  ? spinner('Restoring...')
                                                  : 'Restore my account'}
                                          </button>
                                          {finishing && (
                                              <p
                                                  role="status"
                                                  className="text-xs text-grayscale-500 leading-relaxed text-center mt-3"
                                              >
                                                  Keep this page open until your account is
                                                  restored.
                                              </p>
                                          )}
                                      </div>
                                  )}
                              </div>

                              <div className="flex items-center justify-center gap-6">
                                  <button
                                      className="text-sm font-medium text-grayscale-700 hover:text-grayscale-900 transition-colors flex items-center gap-2 disabled:opacity-50"
                                      disabled={loading}
                                      onClick={() =>
                                          void run(async () => {
                                              const { ok } = await checkStatus();
                                              if (ok) setNotice('Your request is on track.');
                                          })
                                      }
                                  >
                                      {loading && (
                                          <span className="w-3 h-3 border-2 border-grayscale-300 border-t-grayscale-700 rounded-full animate-spin" />
                                      )}
                                      Check status
                                  </button>
                                  <button
                                      className="text-sm text-grayscale-500 hover:text-grayscale-700 transition-colors disabled:opacity-50"
                                      disabled={loading}
                                      onClick={() =>
                                          setNotice(
                                              'Open your account on a signed-in device and choose Cancel recovery request.'
                                          )
                                      }
                                  >
                                      Cancel request
                                  </button>
                              </div>

                              <p className="text-xs text-grayscale-500 leading-relaxed text-center px-4">
                                  Come back to this browser to finish. To cancel, use a device where
                                  you're already signed in.
                              </p>
                          </div>
                      );
                  })()
                : available &&
                  !existingHold &&
                  view === 'start' && (
                      <>
                          {showPinFlow ? (
                              <div className="space-y-4">
                                  <h3 className="text-xl font-semibold text-grayscale-900">
                                      Enter my recovery PIN
                                  </h3>
                                  <p className="text-sm text-grayscale-600 leading-relaxed">
                                      Enter your 6-digit PIN for instant recovery.
                                  </p>
                                  <div className="flex justify-center py-2">
                                      <RecoveryPinInput
                                          value={pinInput}
                                          onChange={val => {
                                              setPinInput(val);
                                              setPinError('');
                                          }}
                                          onComplete={handlePinRecover}
                                          disabled={loading}
                                          error={!!pinError}
                                      />
                                  </div>
                                  {pinError && (
                                      <p className="text-sm text-red-600 text-center">{pinError}</p>
                                  )}
                                  {loading && (
                                      <div className="flex justify-center">
                                          {spinner('Verifying...')}
                                      </div>
                                  )}
                                  <button
                                      onClick={() => setShowPinFlow(false)}
                                      className="w-full py-2.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                                      disabled={loading}
                                  >
                                      I don't have a PIN
                                  </button>
                              </div>
                          ) : (
                              <>
                                  {pinError && (
                                      <div
                                          role="alert"
                                          className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 mb-4"
                                      >
                                          <IonIcon
                                              icon={alertCircleOutline}
                                              className="text-red-400 text-lg mt-0.5 shrink-0"
                                          />
                                          <span className="text-sm text-red-700 leading-relaxed">
                                              {pinError}
                                          </span>
                                      </div>
                                  )}
                                  <div className="p-4 bg-grayscale-10 border border-grayscale-200 rounded-2xl flex items-start gap-3 mb-5">
                                      <IonIcon
                                          icon={shieldCheckmarkOutline}
                                          className="text-grayscale-900 text-xl mt-0.5 shrink-0"
                                      />
                                      <p className="text-sm text-grayscale-700 leading-relaxed">
                                          Wait 7 days, then return to this browser to restore your
                                          account.
                                      </p>
                                  </div>
                                  <button
                                      className={button}
                                      disabled={!loaded || loading || !storageAvailable}
                                      onClick={() =>
                                          void run(async () => {
                                              const result = await onStart();
                                              await handleStarted(result);
                                          })
                                      }
                                  >
                                      {loading
                                          ? spinner('Starting recovery...')
                                          : 'Start a 7-day recovery'}
                                  </button>
                                  {pinAvailable && !pinBlocked && (
                                      <button
                                          onClick={() => {
                                              setPinError('');
                                              setPinInput('');
                                              setShowPinFlow(true);
                                          }}
                                          disabled={loading}
                                          className="w-full mt-1 py-2.5 min-h-[44px] text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors disabled:opacity-40"
                                      >
                                          {m['recovery.pin.useInstead']()}
                                      </button>
                                  )}
                              </>
                          )}
                      </>
                  )}
        </section>
    );
};
