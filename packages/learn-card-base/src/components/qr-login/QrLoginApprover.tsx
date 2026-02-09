/**
 * QrLoginApprover — Device A UI (the logged-in device granting access).
 *
 * Two modes:
 *   1. QR scan — parses the QR payload to extract sessionId + serverUrl
 *   2. Manual code — user types the 6-digit short code
 *
 * After lookup, shows a confirmation prompt. On approve, encrypts and pushes
 * the device share, then calls onDone.
 */

import React, { useState, useCallback } from 'react';

import { useQrLoginApprover } from '../../hooks/useQrLogin';

import type { QrPayload } from '@learncard/sss-key-manager';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface QrLoginApproverProps {
    /** Server URL for the QR relay API (fallback if not in QR payload) */
    serverUrl: string;

    /** The device share to send to the new device */
    deviceShare: string;

    /** The DID of this (approving) device */
    approverDid: string;

    /** Called when approval is complete */
    onDone: () => void;

    /** Called when the user cancels */
    onCancel: () => void;

    /** Optional: called when QR scan is requested — app provides the scanner */
    onScanQr?: () => Promise<string | null>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const QrLoginApprover: React.FC<QrLoginApproverProps> = ({
    serverUrl,
    deviceShare,
    approverDid,
    onDone,
    onCancel,
    onScanQr,
}) => {
    const { status, sessionInfo, error, lookupSession, approve, reset } = useQrLoginApprover(serverUrl);

    const [codeInput, setCodeInput] = useState('');
    const [mode, setMode] = useState<'choose' | 'scan' | 'code'>('choose');

    const handleScan = useCallback(async () => {
        if (!onScanQr) return;

        setMode('scan');

        try {
            const rawData = await onScanQr();

            if (!rawData) {
                setMode('choose');
                return;
            }

            // Try to parse as QrPayload JSON
            const parsed = JSON.parse(rawData) as QrPayload;

            if (parsed.sessionId) {
                await lookupSession(parsed.sessionId);
            }
        } catch {
            // If QR data isn't valid JSON, treat it as a session ID / short code
            setMode('code');
        }
    }, [onScanQr, lookupSession]);

    const handleCodeSubmit = useCallback(async () => {
        const trimmed = codeInput.trim();

        if (!trimmed) return;

        await lookupSession(trimmed);
    }, [codeInput, lookupSession]);

    const handleApprove = useCallback(async () => {
        await approve(deviceShare, approverDid);
        onDone();
    }, [approve, deviceShare, approverDid, onDone]);

    const handleBack = useCallback(() => {
        reset();
        setCodeInput('');
        setMode('choose');
    }, [reset]);

    // ── Choose mode ──────────────────────────────────────────────

    if (mode === 'choose' && status === 'idle') {
        return (
            <div className="p-6 max-w-md mx-auto">
                <h2 className="text-xl font-bold mb-1 text-center">Link New Device</h2>

                <p className="text-sm text-gray-500 mb-6 text-center">
                    Authorize another device to sign in to your account.
                </p>

                <div className="space-y-3">
                    {onScanQr && (
                        <button
                            onClick={handleScan}
                            className="w-full p-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-4 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg">
                                &#x1F4F7;
                            </div>

                            <div className="flex-1 text-left">
                                <p className="font-medium">Scan QR Code</p>
                                <p className="text-xs text-gray-500">Scan the code shown on the new device</p>
                            </div>
                        </button>
                    )}

                    <button
                        onClick={() => setMode('code')}
                        className="w-full p-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-4 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-lg font-mono font-bold">
                            #
                        </div>

                        <div className="flex-1 text-left">
                            <p className="font-medium">Enter Code</p>
                            <p className="text-xs text-gray-500">Type the 8-digit code from the new device</p>
                        </div>
                    </button>
                </div>

                <button
                    onClick={onCancel}
                    className="w-full mt-6 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        );
    }

    // ── Code entry mode ──────────────────────────────────────────

    if (mode === 'code' && (status === 'idle' || status === 'loading' || status === 'error')) {
        return (
            <div className="p-6 max-w-md mx-auto">
                <button onClick={handleBack} className="text-sm text-purple-600 mb-4">
                    &larr; Back
                </button>

                <h3 className="text-lg font-semibold mb-1">Enter Pairing Code</h3>

                <p className="text-sm text-gray-500 mb-4">
                    Enter the 8-digit code shown on the device you want to sign in.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {error}
                    </div>
                )}

                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="00000000"
                    className="w-full text-center font-mono text-3xl tracking-[0.3em] py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-4"
                    autoFocus
                />

                <button
                    onClick={handleCodeSubmit}
                    disabled={codeInput.length < 8 || status === 'loading'}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {status === 'loading' ? 'Looking up...' : 'Continue'}
                </button>
            </div>
        );
    }

    // ── Confirmation mode ────────────────────────────────────────

    if (status === 'confirming' && sessionInfo) {
        return (
            <div className="p-6 max-w-md mx-auto">
                <button onClick={handleBack} className="text-sm text-purple-600 mb-4">
                    &larr; Back
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center text-3xl">
                        &#x1F50F;
                    </div>

                    <h3 className="text-lg font-semibold mb-1">Authorize Login?</h3>

                    <p className="text-sm text-gray-500">
                        A new device is requesting access to your account.
                        This will share your device key securely.
                    </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Session</span>
                        <span className="font-mono text-gray-700">{sessionInfo.sessionId.slice(0, 8)}...</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleBack}
                        className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
                    >
                        Deny
                    </button>

                    <button
                        onClick={handleApprove}
                        className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors"
                    >
                        Approve
                    </button>
                </div>
            </div>
        );
    }

    // ── Approving spinner ────────────────────────────────────────

    if (status === 'approving') {
        return (
            <div className="p-6 max-w-md mx-auto flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin mb-3" />

                <p className="text-sm text-gray-500">Securely transferring key...</p>
            </div>
        );
    }

    // ── Done ─────────────────────────────────────────────────────

    if (status === 'done') {
        return (
            <div className="p-6 max-w-md mx-auto text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center text-3xl">
                    &#x2705;
                </div>

                <h3 className="text-lg font-semibold mb-1">Device Linked!</h3>

                <p className="text-sm text-gray-500 mb-5">
                    The new device can now sign in to your account.
                </p>

                <button
                    onClick={onDone}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors"
                >
                    Done
                </button>
            </div>
        );
    }

    // ── Error fallback ───────────────────────────────────────────

    return (
        <div className="p-6 max-w-md mx-auto text-center">
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={handleBack}
                    className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                    Back
                </button>

                <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default QrLoginApprover;
