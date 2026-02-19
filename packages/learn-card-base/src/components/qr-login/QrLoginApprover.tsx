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

    /** Optional email or phone to send as a login hint to Device B */
    accountHint?: string;

    /** Share version so Device B can fetch the matching auth share */
    shareVersion?: number;

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
    accountHint,
    onDone,
    onCancel,
    onScanQr,
    shareVersion,
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
        await approve(deviceShare, approverDid, accountHint, shareVersion);
        onDone();
    }, [approve, deviceShare, approverDid, accountHint, shareVersion, onDone]);

    const handleBack = useCallback(() => {
        reset();
        setCodeInput('');
        setMode('choose');
    }, [reset]);

    // ── Choose mode ──────────────────────────────────────────────

    if (mode === 'choose' && status === 'idle') {
        return (
            <div className="p-6 max-w-md mx-auto font-poppins">
                <h2 className="text-xl font-semibold text-grayscale-900 mb-1 text-center">Link New Device</h2>

                <p className="text-sm text-grayscale-600 mb-6 text-center leading-relaxed">
                    Authorize another device to sign in to your account.
                </p>

                <div className="space-y-2">
                    {onScanQr && (
                        <button
                            onClick={handleScan}
                            className="w-full p-4 rounded-2xl bg-grayscale-10 hover:bg-grayscale-100 text-grayscale-900 flex items-center gap-4 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-base shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            </div>

                            <div className="flex-1 text-left">
                                <p className="font-medium text-sm">Scan QR Code</p>
                                <p className="text-xs text-grayscale-500 mt-0.5">Scan the code shown on the new device</p>
                            </div>
                        </button>
                    )}

                    <button
                        onClick={() => setMode('code')}
                        className="w-full p-4 rounded-2xl bg-grayscale-10 hover:bg-grayscale-100 text-grayscale-900 flex items-center gap-4 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg font-mono font-bold shrink-0">
                            #
                        </div>

                        <div className="flex-1 text-left">
                            <p className="font-medium text-sm">Enter Code</p>
                            <p className="text-xs text-grayscale-500 mt-0.5">Type the 8-digit code from the new device</p>
                        </div>
                    </button>
                </div>

                <button
                    onClick={onCancel}
                    className="w-full mt-6 py-2.5 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                >
                    Cancel
                </button>
            </div>
        );
    }

    // ── Code entry mode ──────────────────────────────────────────

    if (mode === 'code' && (status === 'idle' || status === 'loading' || status === 'error')) {
        return (
            <div className="p-6 max-w-md mx-auto font-poppins">
                <button onClick={handleBack} className="flex items-center gap-1 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors mb-5">
                    <span className="text-xs">&larr;</span> Back
                </button>

                <h3 className="text-lg font-semibold text-grayscale-900 mb-1">Enter Pairing Code</h3>

                <p className="text-sm text-grayscale-600 mb-5 leading-relaxed">
                    Enter the 8-digit code shown on the device you want to sign in.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
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
                    className="w-full text-center font-mono text-3xl tracking-[0.3em] py-3 px-4 border border-grayscale-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-5 text-grayscale-900 placeholder:text-grayscale-300 bg-white"
                    autoFocus
                />

                <button
                    onClick={handleCodeSubmit}
                    disabled={codeInput.length < 8 || status === 'loading'}
                    className="w-full py-2.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {status === 'loading' ? 'Looking up...' : 'Continue'}
                </button>
            </div>
        );
    }

    // ── Confirmation mode ────────────────────────────────────────

    if (status === 'confirming' && sessionInfo) {
        return (
            <div className="p-6 max-w-md mx-auto font-poppins">
                <button onClick={handleBack} className="flex items-center gap-1 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors mb-5">
                    <span className="text-xs">&larr;</span> Back
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-amber-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>

                    <h3 className="text-lg font-semibold text-grayscale-900 mb-1">Authorize this device?</h3>

                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        A new device is requesting access to your account.
                        This will securely connect it.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleBack}
                        className="flex-1 py-2.5 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                    >
                        Deny
                    </button>

                    <button
                        onClick={handleApprove}
                        className="flex-1 py-2.5 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors"
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
            <div className="p-6 max-w-md mx-auto flex flex-col items-center font-poppins">
                <div className="w-8 h-8 border-2 border-grayscale-200 border-t-emerald-600 rounded-full animate-spin mb-3" />

                <p className="text-sm text-grayscale-500">Securely connecting...</p>
            </div>
        );
    }

    // ── Done ─────────────────────────────────────────────────────

    if (status === 'done') {
        return (
            <div className="p-6 max-w-md mx-auto text-center font-poppins">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>

                <h3 className="text-lg font-semibold text-grayscale-900 mb-1">Device Linked!</h3>

                <p className="text-sm text-grayscale-600 mb-5 leading-relaxed">
                    The new device can now sign in to your account.
                </p>

                <button
                    onClick={onDone}
                    className="w-full py-2.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                >
                    Done
                </button>
            </div>
        );
    }

    // ── Error fallback ───────────────────────────────────────────

    return (
        <div className="p-6 max-w-md mx-auto text-center font-poppins">
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={handleBack}
                    className="flex-1 py-2.5 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                >
                    Back
                </button>

                <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default QrLoginApprover;
