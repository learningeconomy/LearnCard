import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';

export const EscrowRecoveryHoldBanner = ({
    requestedAt,
    onCancel,
}: {
    requestedAt: string;
    onCancel: () => Promise<unknown>;
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;
    return (
        <section
            role="alert"
            className="font-poppins p-6 bg-amber-50 border border-amber-200 rounded-[20px] space-y-4"
        >
            <p className="text-sm text-grayscale-900 leading-relaxed">
                Someone started an account recovery on {new Date(requestedAt).toLocaleString()}. If
                this wasn't you, cancel it.
            </p>
            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon
                        icon={alertCircleOutline}
                        className="text-red-400 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-red-700 leading-relaxed">
                        Something went wrong. Please try again.
                    </span>
                </div>
            )}
            <button
                disabled={loading}
                onClick={async () => {
                    setLoading(true);
                    setError(false);
                    try {
                        await onCancel();
                        setDismissed(true);
                    } catch {
                        setError(true);
                    } finally {
                        setLoading(false);
                    }
                }}
                className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Cancelling...
                    </span>
                ) : (
                    'Cancel recovery request'
                )}
            </button>
        </section>
    );
};
