import React, { useState } from 'react';
import { Overlay, useBaseAuthCoordinator } from 'learn-card-base';
import { RecoveryPinInput } from './RecoveryPinInput';
import { m } from '../../paraglide/messages.js';

interface RecoveryPinSetupOverlayProps {
    onComplete: () => void;
    onSkip: () => void;
}

export const RecoveryPinSetupOverlay: React.FC<RecoveryPinSetupOverlayProps> = ({
    onComplete,
    onSkip,
}) => {
    const coordinator = useBaseAuthCoordinator();
    const [step, setStep] = useState<'enter' | 'confirm' | 'saving' | 'success'>('enter');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');

    const validatePin = (p: string) => {
        if (p.length < 6) return false;
        if (/^(\d)\1+$/.test(p)) return false;
        if (p === '123456' || p === '000000') return false;

        let isAscending = true;
        let isDescending = true;
        for (let i = 1; i < p.length; i++) {
            if (parseInt(p[i]) !== parseInt(p[i - 1]) + 1) isAscending = false;
            if (parseInt(p[i]) !== parseInt(p[i - 1]) - 1) isDescending = false;
        }
        if (isAscending || isDescending) return false;

        return true;
    };

    const handleEnterComplete = (p: string) => {
        if (!validatePin(p)) {
            setError(m['recovery.pin.trivial']());
            return;
        }
        setError('');
        setPin(p);
        setStep('confirm');
    };

    const handleConfirmComplete = async (p: string) => {
        if (p !== pin) {
            setError(m['recovery.pin.mismatch']());
            setConfirmPin('');
            return;
        }
        setError('');
        setConfirmPin(p);
        setStep('saving');

        try {
            if (coordinator.setEscrowPin) {
                await coordinator.setEscrowPin(p);
            }
            setStep('success');
        } catch (e) {
            setError(m['recovery.pin.saveFailed']());
            setStep('confirm');
            setConfirmPin('');
        }
    };

    return (
        <Overlay>
            <div className="p-8 text-center space-y-5">
                {step === 'enter' && (
                    <>
                        <h2 className="text-xl font-semibold text-grayscale-900">
                            {m['recovery.pin.setPin']()}
                        </h2>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {m['recovery.pin.setPinDesc']()}
                        </p>
                        <div className="flex justify-center py-4">
                            <RecoveryPinInput
                                value={pin}
                                onChange={val => {
                                    setPin(val);
                                    setError('');
                                }}
                                onComplete={handleEnterComplete}
                                error={!!error}
                            />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button
                            onClick={onSkip}
                            className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                        >
                            {m['common.skipForNow']()}
                        </button>
                    </>
                )}

                {step === 'confirm' && (
                    <>
                        <h2 className="text-xl font-semibold text-grayscale-900">
                            {m['recovery.pin.confirmPin']()}
                        </h2>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {m['recovery.pin.confirmPinDesc']()}
                        </p>
                        <div className="flex justify-center py-4">
                            <RecoveryPinInput
                                value={confirmPin}
                                onChange={val => {
                                    setConfirmPin(val);
                                    setError('');
                                }}
                                onComplete={handleConfirmComplete}
                                error={!!error}
                            />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button
                            onClick={() => {
                                setStep('enter');
                                setPin('');
                                setConfirmPin('');
                                setError('');
                            }}
                            className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                        >
                            {m['common.back']()}
                        </button>
                    </>
                )}

                {step === 'saving' && (
                    <>
                        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                            <div className="w-7 h-7 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                        </div>
                        <h2 className="text-xl font-semibold text-grayscale-900">
                            {m['recovery.pin.saving']()}
                        </h2>
                    </>
                )}

                {step === 'success' && (
                    <>
                        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                            <svg
                                className="w-7 h-7 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-grayscale-900">
                            {m['recovery.pin.success']()}
                        </h2>
                        <button
                            onClick={onComplete}
                            className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                        >
                            {m['common.done']()}
                        </button>
                    </>
                )}
            </div>
        </Overlay>
    );
};
