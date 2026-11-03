import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { Overlay, isSameEscrowPinError } from 'learn-card-base';
import { validatePin } from '@learncard/sss-key-manager';
import { RecoveryPinInput } from './RecoveryPinInput';
import * as m from '../../paraglide/messages.js';

/** Thrown by the caller when the login session cannot be restored for the revoke. */
export class SecureAccountSessionError extends Error {
    constructor() {
        super('Sign in again to secure your account.');
        this.name = 'SecureAccountSessionError';
    }
}

export interface SecureAccountOutcome {
    escrowEnrolled: boolean;
    pinKept: boolean;
}

interface SecureAccountFlowProps {
    /** The account has a recovery PIN today; the flow offers to keep or change it. */
    hasPin: boolean;
    /**
     * The current PIN has recorded wrong entries, so it is not offered for keeping: the
     * user picks a different PIN (the coordinator rejects the one just used with
     * SameEscrowPinError) or continues without one.
     */
    newPinRequired?: boolean;
    /** Passkeys can be set up here (web with WebAuthn); otherwise offer any method. */
    passkeyAvailable: boolean;
    /**
     * Stops other devices and logins from signing in again and turns off the old recovery
     * methods (devices already holding the key are not evicted). `pin` re-arms
     * the recovery PIN on the new key; `null` leaves it off. The PIN is not kept here.
     */
    onSecure: (pin: string | null) => Promise<SecureAccountOutcome>;
    /** Continue into recovery setup after securing. */
    onSetUpRecovery: (method?: 'passkey') => void;
    onClose: () => void;
}

type Step = 'explain' | 'pin' | 'confirm' | 'working' | 'done';

const describeSecureError = (cause: unknown): string => {
    if (cause instanceof SecureAccountSessionError)
        return m['recovery.secureAccount.sessionExpired']();
    const err = cause instanceof Error ? cause : new Error();
    // A CONFLICT from the server: another change landed first; nothing half-applied.
    if (err.name === 'ShareWriteRejectedError' && /changed/i.test(err.message)) {
        return m['recovery.secureAccount.conflict']();
    }
    return m['recovery.secureAccount.failed']();
};

/**
 * "Secure my account", shared by the post-PIN-sign-in review, the settings row and the
 * emailed link. Explains plainly what happens, asks for the PIN again (to keep or change
 * it, without holding it since sign-in), runs the revoke, then leads into new recovery
 * methods, passkey first.
 */
export const SecureAccountFlow: React.FC<SecureAccountFlowProps> = ({
    hasPin,
    newPinRequired = false,
    passkeyAvailable,
    onSecure,
    onSetUpRecovery,
    onClose,
}) => {
    const [step, setStep] = useState<Step>('explain');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [error, setError] = useState('');
    const [outcome, setOutcome] = useState<SecureAccountOutcome | null>(null);
    const [pinRequested, setPinRequested] = useState(false);

    const primary =
        'w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed';
    const secondary =
        'w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors';
    // The confirm screen's action is the destructive one ("Sign out of other devices"
    // in settings leads here and relies on this screen for the full explanation).
    const destructive =
        'w-full py-3 px-4 rounded-[20px] bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
    const link =
        'w-full py-2.5 min-h-[44px] text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors';

    const run = async (chosenPin: string | null) => {
        setStep('working');
        setError('');
        setPinRequested(chosenPin !== null);
        try {
            setOutcome(await onSecure(chosenPin));
            setStep('done');
        } catch (cause) {
            // Nothing ran: ask for a different PIN instead of failing the whole flow.
            if (isSameEscrowPinError(cause)) {
                setPinError(m['recovery.pin.samePin']());
                setStep('pin');
                return;
            }
            setError(describeSecureError(cause));
            setStep('explain');
        } finally {
            // Never keep the PIN for a retry; the user enters it again.
            setPin('');
            setConfirmPin('');
        }
    };

    const handlePinComplete = (value: string) => {
        if (!validatePin(value).ok) {
            setPinError(m['recovery.pin.trivial']());
            return;
        }
        setPinError('');
        setPin(value);
        setStep('confirm');
    };

    const handleConfirmComplete = (value: string) => {
        if (value !== pin) {
            setPinError(m['recovery.pin.mismatch']());
            setConfirmPin('');
            return;
        }
        setPinError('');
        void run(value);
    };

    const content = (() => {
        if (step === 'working') {
            return (
                <div role="status" className="space-y-v3-4">
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                        <div className="w-7 h-7 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                    </div>
                    <h2 className="text-xl font-semibold text-grayscale-900">
                        {m['recovery.secureAccount.working']()}
                    </h2>
                    <p className="text-sm text-grayscale-600">
                        {m['recovery.secureAccount.workingHint']()}
                    </p>
                </div>
            );
        }

        if (step === 'done') {
            return (
                <div className="space-y-v3-5">
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                        <IonIcon
                            icon={checkmarkCircleOutline}
                            className="text-emerald-600 text-3xl"
                        />
                    </div>
                    <h2 className="text-xl font-semibold text-grayscale-900">
                        {m['recovery.secureAccount.doneTitle']()}
                    </h2>
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {m['recovery.secureAccount.doneBody']()}
                    </p>
                    {hasPin && (
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {pinRequested && outcome?.pinKept
                                ? m['recovery.secureAccount.pinKept']()
                                : m['recovery.secureAccount.pinNotKept']()}
                        </p>
                    )}
                    <p className="text-sm font-medium text-grayscale-900">
                        {m['recovery.secureAccount.nextStep']()}
                    </p>
                    <div className="space-y-v3-3">
                        <button
                            autoFocus
                            onClick={() =>
                                onSetUpRecovery(passkeyAvailable ? 'passkey' : undefined)
                            }
                            className={primary}
                        >
                            {passkeyAvailable
                                ? m['recovery.secureAccount.setUpPasskey']()
                                : m['recovery.secureAccount.setUpRecovery']()}
                        </button>
                        <button onClick={onClose} className={secondary}>
                            {m['common.done']()}
                        </button>
                    </div>
                </div>
            );
        }

        if (step === 'pin' || step === 'confirm') {
            const confirming = step === 'confirm';
            return (
                <div className="space-y-v3-5">
                    <h2 className="text-xl font-semibold text-grayscale-900">
                        {confirming
                            ? m['recovery.pin.confirmPin']()
                            : m['recovery.secureAccount.pinTitle']()}
                    </h2>
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {confirming
                            ? m['recovery.pin.confirmPinDesc']()
                            : newPinRequired
                              ? m['recovery.secureAccount.pinDescNewPin']()
                              : m['recovery.secureAccount.pinDesc']()}
                    </p>
                    <div className="flex justify-center py-2">
                        <RecoveryPinInput
                            key={step}
                            value={confirming ? confirmPin : pin}
                            onChange={value => {
                                if (confirming) setConfirmPin(value);
                                else setPin(value);
                                setPinError('');
                            }}
                            onComplete={confirming ? handleConfirmComplete : handlePinComplete}
                            error={!!pinError}
                        />
                    </div>
                    {pinError && (
                        <p role="alert" className="text-sm text-red-600">
                            {pinError}
                        </p>
                    )}
                    {confirming ? (
                        <button
                            onClick={() => {
                                setStep('pin');
                                setPin('');
                                setConfirmPin('');
                                setPinError('');
                            }}
                            className={link}
                        >
                            {m['common.back']()}
                        </button>
                    ) : (
                        <div>
                            <button onClick={() => void run(null)} className={link}>
                                {m['recovery.secureAccount.skipPin']()}
                            </button>
                            <p className="text-xs text-grayscale-500">
                                {m['recovery.secureAccount.skipPinNote']()}
                            </p>
                        </div>
                    )}
                    {/* Touch devices have no Escape key: always offer a way out that
                        does not run the revoke. */}
                    <button onClick={onClose} className={secondary}>
                        {m['common.cancel']()}
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-v3-5">
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                    <IonIcon icon={shieldCheckmarkOutline} className="text-3xl" />
                </div>
                <h2 className="text-xl font-semibold text-grayscale-900">
                    {m['recovery.secureAccount.title']()}
                </h2>
                {error && (
                    <div
                        role="alert"
                        className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-start"
                    >
                        <IonIcon
                            icon={alertCircleOutline}
                            className="text-red-400 text-lg mt-0.5 shrink-0"
                        />
                        <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                    </div>
                )}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-start">
                    <p className="text-sm font-medium text-amber-900 mb-2">
                        {m['recovery.secureAccount.intro']()}
                    </p>
                    <ul className="text-sm text-amber-800 space-y-v3-1.5 list-disc ps-4">
                        <li>{m['recovery.secureAccount.signOut']()}</li>
                        <li>{m['recovery.secureAccount.turnOff']()}</li>
                        <li>{m['recovery.secureAccount.stayHere']()}</li>
                    </ul>
                    {/* The revoke re-splits the same key; it cannot evict a device that
                        already holds it (see SECURITY.md D19). Say so plainly. */}
                    <p className="text-xs text-amber-800 mt-2 leading-relaxed">
                        {m['recovery.secureAccount.openDevices']()}
                    </p>
                </div>
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {m['recovery.secureAccount.afterwards']()}
                </p>
                <div className="space-y-v3-3">
                    <button
                        onClick={() => {
                            setError('');
                            if (hasPin) setStep('pin');
                            else void run(null);
                        }}
                        className={destructive}
                    >
                        {error ? m['common.tryAgain']() : m['recovery.secureAccount.continue']()}
                    </button>
                    {/* Cancel takes initial focus so the destructive revoke is never the
                        default action (one Enter from the settings row must not run it). */}
                    <button autoFocus onClick={onClose} className={secondary}>
                        {m['common.cancel']()}
                    </button>
                </div>
            </div>
        );
    })();

    return (
        <Overlay onDismiss={step === 'working' ? undefined : onClose}>
            <div className="p-8 text-center">{content}</div>
        </Overlay>
    );
};

export default SecureAccountFlow;
