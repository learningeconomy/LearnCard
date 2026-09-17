import React, { useState, useEffect } from 'react';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import * as m from '../../../paraglide/messages.js';
import { RecoveryPinInput } from '../../recovery/RecoveryPinInput';
import { validatePin } from '@learncard/sss-key-manager';

type RecoveryPinStepProps = {
    onComplete: () => void;
    onSkip: () => void;
    setPin: (pin: string) => Promise<void>;
};

type StepState = 'enter' | 'confirm' | 'saving' | 'success';

export const RecoveryPinStep: React.FC<RecoveryPinStepProps> = ({ onComplete, onSkip, setPin }) => {
    const [step, setStep] = useState<StepState>('enter');
    const [pin, setPinValue] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');

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
                await setPin(value);
                setStep('success');
            } catch (err) {
                setError(m['recovery.pin.saveFailed']());
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
        <div className="relative z-10 max-w-[600px] mx-auto pt-[calc(var(--ion-safe-area-top,0px)_+_2.5rem)] px-4 w-full h-full flex flex-col justify-center items-center animate-pop-in pb-[calc(var(--ion-safe-area-bottom,0px)_+_1.5rem)] font-poppins">
            <div className="w-full max-w-[360px] md:max-w-[440px] bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 p-8 md:px-12 md:py-10 flex flex-col items-center relative overflow-hidden">
                <div className="w-16 h-16 mx-auto mb-6 bg-emerald-50 rounded-full flex items-center justify-center shadow-sm border border-emerald-100/50">
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

                <div className="w-full flex flex-col items-center min-h-[120px] px-2 md:px-4">
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
                        <div className="flex flex-col items-center justify-center h-[64px] space-y-3">
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

                    <div className="h-6 mt-4 w-full text-center">
                        {error && (
                            <p className="text-sm text-red-600 animate-fade-in-up">{error}</p>
                        )}
                    </div>
                </div>

                <div className="mt-6 w-full flex flex-col items-center gap-4">
                    {step === 'enter' && (
                        <>
                            <p className="text-xs text-grayscale-500 text-center">
                                {m['onboarding.v2.pin.hint']()}
                            </p>
                            <button
                                type="button"
                                onClick={onSkip}
                                className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors font-medium"
                            >
                                {m['onboarding.v2.pin.skip']()}
                            </button>
                        </>
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
                </div>
            </div>
        </div>
    );
};
