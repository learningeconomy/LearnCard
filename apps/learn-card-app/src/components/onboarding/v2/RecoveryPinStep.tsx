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
    /**
     * Render only the card's content, at sheet sizes (smaller icon and title), for a
     * host that already supplies the surface (a sheet or a section) instead of the full
     * onboarding page.
     */
    embedded?: boolean;
    /** Replaces the "Create your PIN" title on the first entry. */
    title?: string;
    /** Replaces the body under the title on the first entry. */
    body?: string;
    /** Heading level for the title; an embedded step inside a section uses `h2` or `h3`. */
    headingLevel?: 'h1' | 'h2' | 'h3';
    /**
     * Focus the first PIN box on mount, for a host that swaps this step in after another
     * screen (so the keyboard stays up and focus does not fall to the page).
     */
    autoFocus?: boolean;
    /** Called whenever the step moves on (enter, confirm, saving, success). */
    onStepChange?: (step: RecoveryPinStepState) => void;
    /**
     * A save error the user can fix by choosing another PIN (e.g. the same PIN refused):
     * return its message, and the step starts over at the first entry with it, without
     * counting it as a failed save.
     */
    saveErrorMessage?: (error: unknown) => string | undefined;
    /**
     * Offer "Skip for now" after repeated save failures (default). A host with its own
     * way out (e.g. back to entering the current PIN) turns it off.
     */
    allowSkip?: boolean;
    /** Shown above the first PIN entry (e.g. a field the save also needs). */
    beforeInput?: React.ReactNode;
    /** Keep the first PIN entry disabled (e.g. until `beforeInput` is filled in). */
    inputDisabled?: boolean;
};

export type RecoveryPinStepState = 'enter' | 'confirm' | 'saving' | 'success';
type StepState = RecoveryPinStepState;

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
    embedded = false,
    title,
    body,
    headingLevel = 'h1',
    autoFocus = false,
    onStepChange,
    saveErrorMessage,
    allowSkip = true,
    beforeInput,
    inputDisabled = false,
}) => {
    const Heading = headingLevel;
    const [step, setStep] = useState<StepState>('enter');
    const [pin, setPinValue] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    // Failed saves only; typing mistakes (trivial PIN, mismatch) never unlock the skip.
    const [saveErrors, setSaveErrors] = useState(0);
    const canSkip = allowSkip && canSkipRequiredPin(saveErrors);
    // The PIN boxes unmount while saving and between steps; put focus back on the
    // first box whenever they return, so keyboard and screen-reader users are not
    // left on <body> after a failed save.
    const inputAreaRef = useRef<HTMLDivElement>(null);
    const mountedRef = useRef(false);
    // `autoFocus` matters on mount alone; later, only the step decides focus.
    const autoFocusRef = useRef(autoFocus);
    useEffect(() => {
        const firstRun = !mountedRef.current;
        mountedRef.current = true;
        if (firstRun && !autoFocusRef.current) return;
        if (step === 'enter' || step === 'confirm')
            inputAreaRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    }, [step]);

    const onStepChangeRef = useRef(onStepChange);
    onStepChangeRef.current = onStepChange;
    useEffect(() => {
        onStepChangeRef.current?.(step);
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
            } catch (err) {
                const retype = saveErrorMessage?.(err);
                if (retype) {
                    setError(retype);
                    setPinValue('');
                    setConfirmPin('');
                    setStep('enter');
                    return;
                }
                const failures = saveErrors + 1;
                setSaveErrors(failures);
                // Once the skip is offered, say so in the (announced) error itself.
                setError(
                    allowSkip && canSkipRequiredPin(failures)
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

    // Embedded hosts (sheets, page sections) use the sheet sizes of their other steps.
    const iconClass = embedded ? 'w-6 h-6 text-emerald-600' : 'w-8 h-8 text-emerald-600';
    const card = (
        <>
            <div
                className={`${
                    embedded ? 'w-12 h-12 mb-4' : 'w-16 h-16 mb-6'
                } mx-auto bg-emerald-50 rounded-full flex items-center justify-center shadow-xs border border-emerald-100/50`}
            >
                {step === 'success' ? (
                    <CheckCircle2 className={iconClass} strokeWidth={1.5} />
                ) : (
                    <Lock className={iconClass} strokeWidth={1.5} />
                )}
            </div>

            <div className={`text-center w-full ${embedded ? 'mb-5' : 'mb-8'}`}>
                <Heading
                    className={`font-semibold text-grayscale-900 ${
                        embedded ? 'text-xl mb-1' : 'text-3xl mb-3'
                    }`}
                >
                    {step === 'enter'
                        ? (title ?? m['onboarding.v2.pin.title']())
                        : m['onboarding.v2.pin.confirmTitle']()}
                </Heading>
                <p
                    className={`text-grayscale-600 leading-relaxed ${
                        embedded ? 'text-sm' : 'text-base'
                    }`}
                >
                    {step === 'enter'
                        ? (body ?? m['onboarding.v2.pin.body']())
                        : m['onboarding.v2.pin.confirmBody']()}
                </p>
            </div>

            {step === 'enter' && beforeInput}
            <div
                ref={inputAreaRef}
                className={`w-full flex flex-col items-center px-2 md:px-4 ${
                    embedded ? 'min-h-[96px]' : 'min-h-[120px]'
                }`}
            >
                {step === 'enter' && (
                    <RecoveryPinInput
                        value={pin}
                        onChange={handlePinChange}
                        disabled={inputDisabled}
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
                    {error && <p className="text-sm text-red-600 animate-fade-in-up">{error}</p>}
                </div>
            </div>

            <div
                className={`w-full flex flex-col items-center gap-4 ${embedded ? 'mt-2' : 'mt-6'}`}
            >
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
        </>
    );

    if (embedded) {
        return (
            <div className="w-full flex flex-col items-center font-poppins" data-testid="pin-step">
                {card}
            </div>
        );
    }

    return (
        <div className="relative z-10 max-w-[600px] mx-auto pt-[calc(var(--ion-safe-area-top,0px)+2.5rem)] px-4 w-full h-full flex flex-col justify-center-safe items-center animate-pop-in pb-[calc(var(--ion-safe-area-bottom,0px)+1.5rem)] font-poppins">
            <div className="w-full max-w-[360px] md:max-w-[440px] bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 p-8 md:px-12 md:py-10 flex flex-col items-center relative overflow-hidden">
                {card}
            </div>
        </div>
    );
};
