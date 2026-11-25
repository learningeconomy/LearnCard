import React, { useState, useEffect, useRef } from 'react';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import * as m from '../../../paraglide/messages.js';
import { RecoveryPinInput } from '../../recovery/RecoveryPinInput';
import { EscrowPinNotice } from '../../recovery/EscrowPinNotice';
import { validatePin } from '@learncard/sss-key-manager';
import {
    canSkipRequiredPin,
    saveRequiredPin,
    REQUIRED_PIN_SAVE_TIMEOUT_MS,
} from './requiredPinStep';

type RecoveryPinStepProps = {
    onComplete: () => void;
    /** Continue onboarding without a PIN; offered only after repeated save failures. */
    onSkip: () => void;
    setPin: (pin: string) => Promise<void>;
    /** Longest a save may take before it counts as a failure (tests override it). */
    saveTimeoutMs?: number;
};

type StepState = 'enter' | 'confirm' | 'saving' | 'success';

/**
 * "Create your PIN" at sign-up. The PIN is required, so there is no skip at first, but
 * it fails open: a save that errors or hangs (see `saveRequiredPin`) shows the error and
 * lets the user retry, and from the second failed save "Skip for now" appears, so an
 * outage never blocks account creation. The step is only shown when escrow is confirmed
 * available (`decideOnboardingPinStep`).
 */
export const RecoveryPinStep: React.FC<RecoveryPinStepProps> = ({
    onComplete,
    onSkip,
    setPin,
    saveTimeoutMs = REQUIRED_PIN_SAVE_TIMEOUT_MS,
}) => {
    const [step, setStep] = useState<StepState>('enter');
    const [pin, setPinValue] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    // Failed saves only; typing mistakes (trivial PIN, mismatch) never unlock the skip.
    const [saveErrors, setSaveErrors] = useState(0);
    const canSkip = canSkipRequiredPin(saveErrors);
    // The PIN boxes unmount while saving and between steps; put focus back on the
    // first box whenever they return, so keyboard and screen-reader users are not
    // left on <body> after a failed save.
    const inputAreaRef = useRef<HTMLDivElement>(null);
    const mountedRef = useRef(false);
    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true;
            return;
        }
        if (step === 'enter' || step === 'confirm')
            inputAreaRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    }, [step]);

    useEffect(() => {
        if (step === 'success') {
            const timer = setTimeout(() => {
                onComplete();
            }, 900);
            return () => clearTimeout(timer);
        }
    }, [step, onComplete]);

    const handlePinChange = (value: string) => {
        setError('');
        setPinValue(value);
        if (value.length === 6) {
            if (!validatePin(value).ok) {
                setError(m['recovery.pin.trivial']());
                return;
            }
            setStep('confirm');
        }
    };

    const handleConfirmPinChange = async (value: string) => {
        setError('');
        setConfirmPin(value);
        if (value.length === 6) {
            if (value !== pin) {
                setError(m['recovery.pin.mismatch']());
                return;
            }

            setStep('saving');
            try {
                await saveRequiredPin(setPin, value, saveTimeoutMs);
                setStep('success');
            } catch {
                const failures = saveErrors + 1;
                setSaveErrors(failures);
                // Once the skip is offered, say so in the (announced) error itself.
                setError(
                    canSkipRequiredPin(failures)
                        ? m['onboarding.v2.pin.saveFailedSkip']()
                        : m['recovery.pin.saveFailed']()
                );
                setStep('confirm');
                setConfirmPin('');
            }
        }
    };

    const handleStartOver = () => {
        setStep('enter');
        setPinValue('');
        setConfirmPin('');
        setError('');
    };

    return (
        <div className="relative z-10 max-w-[600px] mx-auto pt-[calc(var(--ion-safe-area-top,0px)+2.5rem)] px-4 w-full h-full flex flex-col justify-center-safe items-center animate-pop-in pb-[calc(var(--ion-safe-area-bottom,0px)+1.5rem)] font-poppins">
            <div className="w-full max-w-[360px] md:max-w-[440px] bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 p-8 md:px-12 md:py-10 flex flex-col items-center relative overflow-hidden">
                <div className="w-16 h-16 mx-auto mb-6 bg-emerald-50 rounded-full flex items-center justify-center shadow-xs border border-emerald-100/50">
                    {step === 'success' ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" strokeWidth={1.5} />
                    ) : (
                        <Lock className="w-8 h-8 text-emerald-600" strokeWidth={1.5} />
                    )}
                </div>

                <div className="text-center mb-8 w-full">
                    <h1 className="text-3xl font-semibold text-grayscale-900 mb-3">
                        {step === 'enter'
                            ? m['onboarding.v2.pin.title']()
                            : m['onboarding.v2.pin.confirmTitle']()}
                    </h1>
                    <p className="text-base text-grayscale-600 leading-relaxed">
                        {step === 'enter'
                            ? m['onboarding.v2.pin.body']()
                            : m['onboarding.v2.pin.confirmBody']()}
                    </p>
                </div>

                <div
                    ref={inputAreaRef}
                    className="w-full flex flex-col items-center min-h-[120px] px-2 md:px-4"
                >
                    {step === 'enter' && (
                        <RecoveryPinInput
                            value={pin}
                            onChange={handlePinChange}
                            disabled={false}
                            error={!!error}
                        />
                    )}

                    {step === 'confirm' && (
                        <RecoveryPinInput
                            value={confirmPin}
                            onChange={handleConfirmPinChange}
                            disabled={false}
                            error={!!error}
                        />
                    )}

                    {step === 'saving' && (
                        <div className="flex flex-col items-center justify-center h-[64px] space-y-v3-3">
                            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                            <p className="text-sm font-medium text-grayscale-700">
                                {m['onboarding.v2.pin.saving']()}
                            </p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center h-[64px]">
                            <p className="text-lg font-medium text-emerald-600">
                                {m['onboarding.v2.pin.success']()}
                            </p>
                        </div>
                    )}

                    {/* Always mounted so assistive tech announces each new error. */}
                    <div role="alert" className="min-h-6 mt-4 w-full text-center">
                        {error && (
                            <p className="text-sm text-red-600 animate-fade-in-up">{error}</p>
                        )}
                    </div>
                </div>

                <div className="mt-6 w-full flex flex-col items-center gap-4">
                    {step === 'enter' && (
                        <div className="w-full max-w-[300px] mx-auto flex flex-col items-center gap-1.5">
                            <p className="text-xs text-grayscale-500 leading-relaxed text-center text-balance">
                                {m['onboarding.v2.pin.hint']()}
                            </p>
                            <EscrowPinNotice />
                        </div>
                    )}

                    {step === 'confirm' && (
                        <button
                            type="button"
                            onClick={handleStartOver}
                            className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors font-medium"
                        >
                            {m['onboarding.v2.pin.startOver']()}
                        </button>
                    )}

                    {canSkip && (step === 'enter' || step === 'confirm') && (
                        <button
                            type="button"
                            onClick={onSkip}
                            className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors font-medium"
                        >
                            {m['onboarding.v2.pin.skip']()}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
