import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { Toggle } from 'learn-card-base';
import type { KeyDerivationStrategy } from '@learncard/types';
import * as m from '../../paraglide/messages.js';
import { RecoveryPinInput } from './RecoveryPinInput';

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

    const handleSetPin = async () => {
        if (!onSetEscrowPin) return;
        if (pinInput !== pinConfirmInput) {
            setError(m['recovery.passwordsDontMatch']());
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
            setError(e instanceof Error ? e.message : 'generic');
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
            setError(e instanceof Error ? e.message : 'generic');
        } finally {
            setLoading(null);
            busy.current = false;
        }
    };

    const enrollmentState = typeof state === 'string' ? state : state?.state;
    const escrowPin = typeof state === 'object' ? state?.escrowPin : undefined;

    const isPinLocked = escrowPin && !escrowPin.enabled && escrowPin.attemptsRemaining === 0;
    const pinStatusText = isPinLocked ? 'Locked' : escrowPin?.enabled ? 'On' : 'Not set';

    if (enrollmentState === 'disabled' || (state === null && !error)) return null;

    return (
        <section
            aria-label={m['recovery.automatic.title']()}
            className="mb-6 p-4 border border-grayscale-200 rounded-[20px] font-poppins bg-white space-y-4"
        >
            <h3 className="text-sm font-semibold text-grayscale-900">
                {m['recovery.automatic.title']()}
            </h3>
            <p role="status" className="text-sm text-grayscale-600 leading-relaxed">
                {loading === 'enabling'
                    ? m['recovery.automatic.turningOn']()
                    : loading === 'disabling'
                      ? m['recovery.automatic.turningOff']()
                      : enrollmentState === 'enrolled'
                        ? m['recovery.automatic.on']()
                        : enrollmentState === 'not-enrolled'
                          ? m['recovery.automatic.notOn']()
                          : enrollmentState === 'opted-out'
                            ? m['recovery.automatic.off']()
                            : null}
            </p>
            {state !== null && (
                <label className="flex items-center justify-between gap-3 text-sm text-grayscale-900">
                    <span>{m['recovery.automatic.title']()}</span>
                    <Toggle
                        checked={enrollmentState === 'enrolled'}
                        disabled={loading !== null || confirmOff}
                        onChange={enabled => {
                            setError(null);
                            if (enabled) void update(true);
                            else setConfirmOff(true);
                        }}
                    />
                </label>
            )}
            {enrollmentState === 'enrolled' && (
                <div className="pt-4 border-t border-grayscale-100 space-y-4">
                    <div className="flex items-center justify-between gap-3 text-sm text-grayscale-900">
                        <div>
                            <span className="block">Recovery PIN</span>
                            <span className="text-xs text-grayscale-500">
                                Instant recovery with PIN: {pinStatusText}
                            </span>
                        </div>
                        {pinMode === 'none' && onSetEscrowPin && (
                            <div className="flex gap-2">
                                {escrowPin?.enabled || isPinLocked ? (
                                    <>
                                        <button
                                            onClick={() => setPinMode('set')}
                                            className="text-xs font-medium text-grayscale-500 hover:text-grayscale-900 transition-colors"
                                        >
                                            Change
                                        </button>
                                        <button
                                            onClick={() => setPinMode('remove')}
                                            className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setPinMode('set')}
                                        className="text-xs font-medium text-grayscale-500 hover:text-grayscale-900 transition-colors"
                                    >
                                        Set
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {pinMode === 'set' && (
                        <div className="space-y-4">
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
                        <div className="space-y-4">
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
                                        handleSetPin();
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
                        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 space-y-4">
                            <p className="text-sm text-grayscale-700 leading-relaxed">
                                {m['recovery.pin.removeConfirm']()}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={loading !== null}
                                    onClick={handleRemovePin}
                                    className="py-3 px-4 rounded-[20px] bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {loading === 'pin'
                                        ? m['recovery.pin.removing']()
                                        : m['recovery.pin.remove']()}
                                </button>
                                <button
                                    type="button"
                                    disabled={loading !== null}
                                    onClick={() => setPinMode('none')}
                                    className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40"
                                >
                                    {m['common.cancel']()}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {state === 'not-enrolled' && !loading && (
                <button
                    type="button"
                    onClick={() => void update(true)}
                    className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                >
                    {m['recovery.automatic.turnOn']()}
                </button>
            )}
            {loading && loading !== 'pin' && (
                <span role="status" className="flex items-center gap-2 text-sm text-grayscale-600">
                    <span className="w-4 h-4 border-2 border-grayscale-200 border-t-grayscale-900 rounded-full animate-spin" />
                    {m['recovery.automatic.updating']()}
                </span>
            )}
            {confirmOff && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 space-y-4">
                    <p className="text-sm text-grayscale-700 leading-relaxed">
                        {m['recovery.automatic.warning']()}
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={loading !== null}
                            onClick={() => void update(false)}
                            className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? m['recovery.automatic.updating']()
                                : m['recovery.automatic.turnOff']()}
                        </button>
                        <button
                            type="button"
                            disabled={loading !== null}
                            onClick={() => setConfirmOff(false)}
                            className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40"
                        >
                            {m['common.cancel']()}
                        </button>
                    </div>
                </div>
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
                    <span className="text-sm text-red-700 leading-relaxed">
                        {error === 'precondition'
                            ? m['recovery.automatic.precondition']()
                            : error === 'generic'
                              ? m['recovery.somethingWrong']()
                              : error}
                    </span>
                </div>
            )}
        </section>
    );
};
