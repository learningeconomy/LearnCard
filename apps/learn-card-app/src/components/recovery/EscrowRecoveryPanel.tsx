import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    alertCircleOutline,
    timeOutline,
    checkmarkCircleOutline,
    shieldCheckmarkOutline,
} from 'ionicons/icons';
import type { KeyDerivationStrategy } from '@learncard/types';
import {
    EscrowHoldRestartThrottledError,
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
    scope?: string;
    available: boolean;
    pinAvailable?: boolean;
    canResumeCompleted?: () => boolean;
    onStart: (options?: { restart?: boolean }) => Promise<EscrowRecoveryStart>;
    onStatus: (proof: {
        holdId: string;
        resumeToken: string;
    }) => ReturnType<NonNullable<KeyDerivationStrategy['getEscrowRecoveryStatus']>>;
    onRecover: (
        input:
            | (Omit<PendingEscrowRecovery, 'releaseAfter'> & { method: 'escrow' })
            | { method: 'escrow-pin'; pin: string }
    ) => Promise<void>;
}

export const EscrowRecoveryPanel = ({
    scope = 'default',
    available,
    pinAvailable = false,
    onStart,
    onStatus,
    onRecover,
    canResumeCompleted,
}: EscrowRecoveryPanelProps) => {
    const active = useRef(true);
    const [pending, setPending] = useState<PendingEscrowRecovery>();
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
        };
        if (active.current) {
            setPending(record);
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
                if (!cancelled) {
                    setPending(value);
                    setLoaded(true);
                    setError('');
                }
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
                setShowPinFlow(false);
            } else {
                if (
                    err.name === 'EscrowPinUnavailableError' ||
                    (err.name === 'EscrowRequestError' && 'status' in err && err.status === 403)
                ) {
                    setPinError(
                        "PIN sign-in isn't available for this account. Start a 7-day recovery instead."
                    );
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
                                                      if (!(await checkStatus())) return;
                                                      setFinishing(true);
                                                      try {
                                                          await onRecover({
                                                              method: 'escrow',
                                                              holdId: pending.holdId,
                                                              resumeToken: pending.resumeToken,
                                                              clientEphemeralPrivateKey:
                                                                  pending.clientEphemeralPrivateKey,
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
                                              if (await checkStatus())
                                                  setNotice('Your request is on track.');
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
                  !existingHold && (
                      <>
                          {showPinFlow ? (
                              <div className="space-y-4">
                                  <h3 className="text-xl font-semibold text-grayscale-900">
                                      Do you have a recovery PIN?
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
                              </>
                          )}
                      </>
                  )}
        </section>
    );
};
