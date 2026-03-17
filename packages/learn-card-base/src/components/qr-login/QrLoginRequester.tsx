/**
 * QrLoginRequester — Device B UI (the new device wanting to log in).
 *
 * Shows a QR code + short code + countdown timer. When approved, calls onApproved
 * with the decrypted device share so the app can complete the auth flow.
 *
 * The QR rendering is delegated to a render-prop so apps can use their own
 * QR library (qrcode.react, native camera, etc.) without coupling this component.
 */

import React, { useEffect } from 'react';

import { useQrLoginRequester } from '../../hooks/useQrLogin';

import type { QrRequesterStatus } from '../../hooks/useQrLogin';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface QrLoginRequesterProps {
    /** Server URL for the QR relay API */
    serverUrl: string;

    /** Called when Device A approves and the device share is decrypted */
    onApproved: (deviceShare: string, approverDid: string, accountHint?: string, shareVersion?: number) => void;

    /** Called when the user cancels */
    onCancel: () => void;

    /** Render the QR code from a JSON string payload. Apps provide their own QR renderer. */
    renderQrCode?: (qrData: string) => React.ReactNode;

    /** Hide the built-in title + description (useful when a parent wrapper already provides them) */
    hideHeader?: boolean;
}

// ---------------------------------------------------------------------------
// Helper: format seconds as M:SS
// ---------------------------------------------------------------------------

const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}:${s.toString().padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const StatusBadge: React.FC<{ status: QrRequesterStatus }> = ({ status }) => {
    const config: Record<QrRequesterStatus, { label: string; bg: string; dot: string } | null> = {
        idle: null,
        creating: { label: 'Creating session...', bg: 'bg-grayscale-100 text-grayscale-700', dot: 'bg-grayscale-400' },
        waiting: { label: 'Waiting for approval', bg: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400 animate-pulse' },
        approved: { label: 'Approved!', bg: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
        expired: { label: 'Session expired', bg: 'bg-red-50 text-red-700', dot: 'bg-red-400' },
        error: { label: 'Connection error', bg: 'bg-red-50 text-red-700', dot: 'bg-red-400' },
    };

    const c = config[status];

    if (!c) return null;

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${c.bg}`}>
            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
            {c.label}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const QrLoginRequester: React.FC<QrLoginRequesterProps> = ({
    serverUrl,
    onApproved,
    onCancel,
    renderQrCode,
    hideHeader,
}) => {
    const {
        status,
        qrPayload,
        shortCode,
        secondsRemaining,
        deviceShare,
        approverDid,
        accountHint,
        shareVersion,
        error,
        start,
        cancel,
        restart,
    } = useQrLoginRequester(serverUrl);

    // Auto-start on mount
    useEffect(() => {
        start();
    }, [start]);

    // Notify parent when approved
    useEffect(() => {
        if (status === 'approved' && deviceShare && approverDid) {
            onApproved(deviceShare, approverDid, accountHint ?? undefined, shareVersion ?? undefined);
        }
    }, [status, deviceShare, approverDid, accountHint, shareVersion, onApproved]);

    const handleCancel = () => {
        cancel();
        onCancel();
    };

    return (
        <div className="p-6 max-w-md mx-auto flex flex-col items-center font-poppins">
            {!hideHeader && (
                <>
                    <h2 className="text-xl font-semibold text-grayscale-900 mb-1 text-center">Sign In from Another Device</h2>

                    <p className="text-sm text-grayscale-600 mb-5 text-center leading-relaxed">
                        Scan this QR code with a device that&apos;s already signed in, or enter the code manually.
                    </p>
                </>
            )}

            {/* QR Code */}
            {status === 'waiting' && qrPayload && (
                <div className="mb-4 p-4 bg-white rounded-2xl border border-grayscale-200 shadow-sm">
                    {renderQrCode ? (
                        renderQrCode(JSON.stringify(qrPayload))
                    ) : (
                        <div className="w-48 h-48 bg-grayscale-100 rounded-xl flex items-center justify-center text-grayscale-400 text-xs text-center p-4">
                            QR renderer not provided
                        </div>
                    )}
                </div>
            )}

            {/* Short code */}
            {status === 'waiting' && shortCode && (
                <div className="mb-4 text-center">
                    <p className="text-xs text-grayscale-500 mb-1">Or enter this code on your other device</p>

                    <div className="font-mono text-3xl font-bold tracking-[0.3em] text-grayscale-900">
                        {shortCode}
                    </div>
                </div>
            )}

            {/* Countdown */}
            {status === 'waiting' && (
                <div className="mb-4 text-sm font-medium text-emerald-600">
                    Expires in {formatTime(secondsRemaining)}
                </div>
            )}

            {/* Creating spinner */}
            {status === 'creating' && (
                <div className="mb-4 flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-grayscale-200 border-t-emerald-600 rounded-full animate-spin" />

                    <span className="text-sm text-grayscale-500">Setting up secure session...</span>
                </div>
            )}

            {/* Status badge */}
            <div className="mb-5">
                <StatusBadge status={status} />
            </div>

            {/* Error message */}
            {error && status === 'error' && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700 w-full text-center">
                    {error}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 w-full">
                {(status === 'expired' || status === 'error') && (
                    <button
                        onClick={restart}
                        className="flex-1 py-2.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                        Try Again
                    </button>
                )}

                <button
                    onClick={handleCancel}
                    className={`${
                        status === 'expired' || status === 'error' ? 'flex-1' : 'w-full'
                    } py-2.5 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors`}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default QrLoginRequester;
