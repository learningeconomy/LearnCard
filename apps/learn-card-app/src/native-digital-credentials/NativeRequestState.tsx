import React from 'react';
import { IonIcon } from '@ionic/react';
import { documentTextOutline, alertCircleOutline } from 'ionicons/icons';
import * as m from '../paraglide/messages.js';

interface NativeRequestStateProps {
    unavailable?: boolean;
    canceling: boolean;
    onCancel?: () => void;
}

/** Keep native loading and expired-request cancellation on the same page surface as consent. */
export const NativeRequestState: React.FC<NativeRequestStateProps> = ({
    unavailable = false,
    canceling,
    onCancel,
}) => (
    <div
        className="min-h-full bg-grayscale-10 font-poppins"
        style={{
            paddingTop: 'var(--ion-safe-area-top, 0px)',
            paddingBottom: 'var(--ion-safe-area-bottom, 0px)',
        }}
    >
        <div className="mx-auto flex min-h-full max-w-md flex-col items-center px-6 py-12 text-center">
            <div
                className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${unavailable ? 'bg-grayscale-100 text-grayscale-600' : 'bg-emerald-50 text-emerald-700'}`}
            >
                <IonIcon icon={documentTextOutline} aria-hidden="true" className="text-2xl" />
            </div>
            <h1 className="mb-2 text-xl font-semibold text-grayscale-900">
                {unavailable
                    ? m['nativeCredentials.unavailableTitle']()
                    : m['nativeCredentials.loadingTitle']()}
            </h1>
            {unavailable ? (
                <div
                    role="alert"
                    className="mt-3 flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-3 text-start"
                >
                    <IonIcon
                        icon={alertCircleOutline}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-lg text-red-400"
                    />
                    <span className="text-sm leading-relaxed text-red-700">
                        {m['nativeCredentials.unavailableDescription']()}
                    </span>
                </div>
            ) : (
                <p className="max-w-xs text-sm leading-relaxed text-grayscale-600">
                    {m['nativeCredentials.loadingDescription']()}
                </p>
            )}
            {!unavailable && (
                <span
                    role="status"
                    aria-label={m['nativeCredentials.loadingTitle']()}
                    className="mt-6 h-6 w-6 animate-spin rounded-full border-2 border-grayscale-200 border-t-emerald-600"
                />
            )}
            {onCancel && (
                <button
                    onClick={onCancel}
                    disabled={canceling}
                    className={`mt-8 w-full rounded-[20px] px-4 py-3 text-sm font-medium transition-opacity focus-visible:outline-emerald-600 disabled:opacity-40 ${unavailable ? 'bg-grayscale-900 text-white hover:opacity-90' : 'border border-grayscale-300 bg-white text-grayscale-700 hover:bg-grayscale-10'}`}
                >
                    <span className="flex items-center justify-center gap-2">
                        {canceling && (
                            <span
                                aria-hidden="true"
                                className={`h-4 w-4 animate-spin rounded-full border-2 ${unavailable ? 'border-white/30 border-t-white' : 'border-grayscale-300 border-t-grayscale-700'}`}
                            />
                        )}
                        {canceling
                            ? m['nativeCredentials.canceling']()
                            : unavailable
                              ? m['nativeCredentials.returnToApp']()
                              : m['common.cancel']()}
                    </span>
                </button>
            )}
        </div>
    </div>
);
