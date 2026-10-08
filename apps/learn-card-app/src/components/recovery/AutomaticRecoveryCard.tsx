import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, shieldCheckmarkOutline, keypadOutline } from 'ionicons/icons';
import { Toggle } from 'learn-card-base';
import type { KeyDerivationStrategy } from '@learncard/types';
import * as m from '../../paraglide/messages.js';
import { RecoveryPinInput } from './RecoveryPinInput';

const pinErrorMessage = (cause: unknown): string => {
    const message = cause instanceof Error ? cause.message : '';
    return [
        'PIN must contain 6–12 digits.',
        'Choose a PIN without trivial or sequential patterns.',
        'Automatic recovery is not available for this account.',
    ].includes(message)
        ? message
        : 'Something went wrong. Please try again.';
};

type EnrollmentState = Awaited<
    ReturnType<NonNullable<KeyDerivationStrategy['getEscrowEnrollmentState']>>
>;

export interface AutomaticRecoveryProps {
    onGetEscrowEnrollmentState: () => Promise<EnrollmentState>;
    onDisableEscrowRecovery: () => Promise<void>;
    onEnableEscrowRecovery: () => Promise<unknown>;
    onSetEscrowPin?: (pin: string) => Promise<void>;
    onClearEscrowPin?: () => Promise<void>;
}

export const AutomaticRecoveryCard: React.FC<AutomaticRecoveryProps> = ({
    onGetEscrowEnrollmentState,
    onDisableEscrowRecovery,
    onEnableEscrowRecovery,
    onSetEscrowPin,
    onClearEscrowPin,
}) => {
    const [state, setState] = useState<EnrollmentState | null>(null);
    const [loading, setLoading] = useState<'enabling' | 'disabling' | 'pin' | null>(null);
    const [confirmOff, setConfirmOff] = useState(false);
    const [error, setError] = useState<'precondition' | 'generic' | string | null>(null);
    const busy = useRef(false);

    const [pinMode, setPinMode] = useState<'none' | 'set' | 'confirm' | 'remove'>('none');
    const [pinInput, setPinInput] = useState('');
    const [pinConfirmInput, setPinConfirmInput] = useState('');

    useEffect(() => {
        let active = true;
        onGetEscrowEnrollmentState().then(
            value => {
                if (active) setState(value);
            },
            () => {
                if (active) setError('generic');
            }
        );
        return () => {
            active = false;
        };
    }, [onGetEscrowEnrollmentState]);

    const update = async (enabled: boolean): Promise<void> => {
        if (busy.current) return;
        busy.current = true;
        setLoading(enabled ? 'enabling' : 'disabling');
        setError(null);
        try {
            if (enabled) await onEnableEscrowRecovery();
            else {
                await onDisableEscrowRecovery();
                setState('opted-out');
            }
            setState(await onGetEscrowEnrollmentState());
        } catch (cause) {
            setError(
                !enabled &&
                    typeof cause === 'object' &&
                    cause !== null &&
                    'status' in cause &&
                    cause.status === 412
                    ? 'precondition'
                    : 'generic'
            );
        } finally {
            setConfirmOff(false);
            setLoading(null);
            busy.current = false;
        }
    };

    const handleSetPin = async (confirmation: string) => {
        if (!onSetEscrowPin) return;
        if (pinInput !== confirmation) {
            setError(m['recovery.pin.mismatch']());
            setPinConfirmInput('');
            setPinMode('confirm');
            return;
        }

        if (busy.current) return;
        busy.current = true;
        setLoading('pin');
        setError(null);
        try {
            await onSetEscrowPin(pinInput);
            setState(await onGetEscrowEnrollmentState());
            setPinMode('none');
            setPinInput('');
            setPinConfirmInput('');
        } catch (e) {
            setError(pinErrorMessage(e));
            setPinConfirmInput('');
            setPinMode('confirm');
        } finally {
            setLoading(null);
            busy.current = false;
        }
    };

    const handleRemovePin = async () => {
        if (!onClearEscrowPin) return;
        if (busy.current) return;
        busy.current = true;
        setLoading('pin');
        setError(null);
        try {
            await onClearEscrowPin();
            setState(await onGetEscrowEnrollmentState());
            setPinMode('none');
        } catch (e) {
            setError(pinErrorMessage(e));
        } finally {
            setLoading(null);
            busy.current = false;
        }
    };

    const enrollmentState = typeof state === 'string' ? state : state?.state;
    const escrowPin = typeof state === 'object' ? state?.escrowPin : undefined;

    const isPinLocked = escrowPin?.state === 'locked';
    const isPinEnabled = escrowPin?.state === 'enabled';

    if (enrollmentState === 'disabled' || (state === null && !error)) return null;

    return (
        <>
            {/* Automatic Recovery Row */}
            <div className="py-3 px-4 flex items-center gap-3">
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        enrollmentState === 'enrolled'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-grayscale-100 text-grayscale-500'
                    }`}
                >
                    <IonIcon icon={shieldCheckmarkOutline} className="text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-grayscale-900">
                        {m['recovery.automatic.title']()}
                    </div>
                    <div className="text-xs text-grayscale-500 truncate">
                        {enrollmentState === 'enrolled'
                            ? m['recovery.automatic.restoreWait']()
                            : m['recovery.automatic.off']()}
                    </div>
                </div>
                <div className="shrink-0">
                    <Toggle
                        checked={enrollmentState === 'enrolled'}
                        disabled={loading !== null || confirmOff}
                        onChange={enabled => {
                            setError(null);
                            if (enabled) void update(true);
                            else setConfirmOff(true);
                        }}
                    />
                </div>
            </div>

            {/* Loading / Confirm Off / Error for Automatic Recovery */}
            {loading && loading !== 'pin' && (
                <div className="py-3 px-4 bg-grayscale-10/50">
                    <span
                        role="status"
                        className="flex items-center gap-2 text-sm text-grayscale-600"
                    >
                        <span className="w-4 h-4 border-2 border-grayscale-200 border-t-grayscale-900 rounded-full animate-spin" />
                        {loading === 'enabling'
                            ? m['recovery.automatic.turningOn']()
                            : m['recovery.automatic.turningOff']()}
                    </span>
                </div>
            )}

            {confirmOff && (
                <div className="py-3 px-4 bg-amber-50 space-y-3">
                    <p className="text-sm text-grayscale-700 leading-relaxed">
                        {m['recovery.automatic.warning']()}
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={loading !== null}
                            onClick={() => void update(false)}
                            className="py-2 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? m['recovery.automatic.updating']()
                                : m['recovery.automatic.turnOff']()}
                        </button>
                        <button
                            type="button"
                            disabled={loading !== null}
                            onClick={() => setConfirmOff(false)}
                            className="py-2 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40"
                        >
                            {m['common.cancel']()}
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div role="alert" className="py-3 px-4 bg-red-50 flex items-start gap-2.5">
                    <IonIcon
                        icon={alertCircleOutline}
                        className="text-red-400 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-red-700 leading-relaxed">
                        {error === 'precondition'
                            ? m['recovery.automatic.precondition']()
                            : error === 'generic'
                              ? m['recovery.somethingWrong']()
                              : error}
                    </span>
                </div>
            )}

            {/* Recovery PIN Row */}
            {enrollmentState === 'enrolled' && (
                <>
                    <div className="py-3 px-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-grayscale-100 text-grayscale-500">
                            <IonIcon icon={keypadOutline} className="text-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-grayscale-900">
                                {m['recovery.pin.title']()}
                            </div>
                            <div className="text-xs text-grayscale-500 truncate">
                                {isPinEnabled || isPinLocked
                                    ? m['recovery.pin.instantRecoveryOn']()
                                    : m['recovery.pin.notSet']()}
                            </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                            {isPinEnabled || isPinLocked ? (
                                <>
                                    <button
                                        onClick={() => setPinMode('set')}
                                        className="text-xs font-medium text-grayscale-500 hover:text-grayscale-900 transition-colors"
                                    >
                                        {m['recovery.pin.change']()}
                                    </button>
                                    <button
                                        onClick={() => setPinMode('remove')}
                                        className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                                    >
                                        {m['recovery.pin.remove']()}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setPinMode('set')}
                                    className="py-1.5 px-3 rounded-full bg-grayscale-900 text-white text-xs font-medium hover:opacity-90 transition-opacity"
                                >
                                    {m['recovery.pin.setPin']()}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* PIN UI */}
                    {pinMode === 'set' && (
                        <div className="py-3 px-4 bg-grayscale-10/50 space-y-4">
                            <p className="text-sm text-grayscale-600">
                                {m['recovery.pin.enterPin']()}
                            </p>
                            <div className="flex justify-center">
                                <RecoveryPinInput
                                    value={pinInput}
                                    onChange={val => {
                                        setPinInput(val);
                                        setError(null);
                                    }}
                                    onComplete={val => {
                                        setPinInput(val);
                                        setPinMode('confirm');
                                    }}
                                    disabled={loading !== null}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setPinMode('none');
                                    setPinInput('');
                                    setError(null);
                                }}
                                className="w-full py-2.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                            >
                                {m['common.cancel']()}
                            </button>
                        </div>
                    )}

                    {pinMode === 'confirm' && (
                        <div className="py-3 px-4 bg-grayscale-10/50 space-y-4">
                            <p className="text-sm text-grayscale-600">
                                {m['recovery.pin.confirmPin']()}
                            </p>
                            <div className="flex justify-center">
                                <RecoveryPinInput
                                    value={pinConfirmInput}
                                    onChange={val => {
                                        setPinConfirmInput(val);
                                        setError(null);
                                    }}
                                    onComplete={val => {
                                        setPinConfirmInput(val);
                                        void handleSetPin(val);
                                    }}
                                    disabled={loading !== null}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setPinMode('set');
                                    setPinConfirmInput('');
                                    setError(null);
                                }}
                                className="w-full py-2.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                            >
                                {m['common.back']()}
                            </button>
                        </div>
                    )}

                    {pinMode === 'remove' && (
                        <div className="py-3 px-4 bg-amber-50 space-y-3">
                            <p className="text-sm text-grayscale-700 leading-relaxed">
                                {m['recovery.pin.removeConfirm']()}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={loading !== null}
                                    onClick={handleRemovePin}
                                    className="py-2 px-4 rounded-[20px] bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {loading === 'pin'
                                        ? m['recovery.pin.removing']()
                                        : m['recovery.pin.remove']()}
                                </button>
                                <button
                                    type="button"
                                    disabled={loading !== null}
                                    onClick={() => setPinMode('none')}
                                    className="py-2 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40"
                                >
                                    {m['common.cancel']()}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
};
