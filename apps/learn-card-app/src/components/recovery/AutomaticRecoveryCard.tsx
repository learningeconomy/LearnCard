import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { Toggle } from 'learn-card-base';
import type { KeyDerivationStrategy } from '@learncard/types';
import * as m from '../../paraglide/messages.js';

type EnrollmentState = Awaited<
    ReturnType<NonNullable<KeyDerivationStrategy['getEscrowEnrollmentState']>>
>;

export interface AutomaticRecoveryProps {
    onGetEscrowEnrollmentState: () => Promise<EnrollmentState>;
    onDisableEscrowRecovery: () => Promise<void>;
    onEnableEscrowRecovery: () => Promise<unknown>;
}

export const AutomaticRecoveryCard: React.FC<AutomaticRecoveryProps> = ({
    onGetEscrowEnrollmentState,
    onDisableEscrowRecovery,
    onEnableEscrowRecovery,
}) => {
    const [state, setState] = useState<EnrollmentState | null>(null);
    const [loading, setLoading] = useState(false);
    const [confirmOff, setConfirmOff] = useState(false);
    const [error, setError] = useState<'precondition' | 'generic' | null>(null);
    const busy = useRef(false);

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
        setLoading(true);
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
            setLoading(false);
            busy.current = false;
        }
    };

    if (state === 'disabled' || (state === null && !error)) return null;

    return (
        <section
            aria-label={m['recovery.automatic.title']()}
            className="mb-6 p-4 border border-grayscale-200 rounded-[20px] font-poppins bg-white space-y-4"
        >
            <h3 className="text-sm font-semibold text-grayscale-900">
                {m['recovery.automatic.title']()}
            </h3>
            <p role="status" className="text-sm text-grayscale-600 leading-relaxed">
                {loading
                    ? m['recovery.automatic.settingUp']()
                    : state === 'enrolled'
                      ? m['recovery.automatic.on']()
                      : state === 'not-enrolled'
                        ? m['recovery.automatic.settingUp']()
                        : state === 'opted-out'
                          ? m['recovery.automatic.off']()
                          : null}
            </p>
            {state !== null && (
                <label className="flex items-center justify-between gap-3 text-sm text-grayscale-900">
                    <span>{m['recovery.automatic.title']()}</span>
                    <Toggle
                        checked={state === 'enrolled'}
                        disabled={loading || confirmOff}
                        onChange={enabled => {
                            setError(null);
                            if (enabled) void update(true);
                            else setConfirmOff(true);
                        }}
                    />
                </label>
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
            {loading && (
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
                            disabled={loading}
                            onClick={() => void update(false)}
                            className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? m['recovery.automatic.updating']()
                                : m['recovery.automatic.turnOff']()}
                        </button>
                        <button
                            type="button"
                            disabled={loading}
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
                            : m['recovery.somethingWrong']()}
                    </span>
                </div>
            )}
        </section>
    );
};
