import React, { useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    Copy,
    ExternalLink,
    Loader2,
    X,
} from 'lucide-react';
import QRCode from 'qrcode';

import { fetchStatus, type LaunchSuccess } from '../api';
import type { ProviderId, Scenario } from '../scenarios';

export interface LaunchPanelProps {
    launch: LaunchSuccess;
    scenario: Scenario;
    providerId: ProviderId;
    onClose: () => void;
}

type StatusState =
    | { kind: 'idle' }
    | { kind: 'pending'; detail?: string }
    | { kind: 'success' }
    | { kind: 'fail'; detail?: string }
    | { kind: 'error'; message: string };

/**
 * Side panel surfaced after a scenario is launched. Shows the QR
 * code, the raw URI, an "Open in LearnCard" deep link, and a live
 * status indicator polled from the server.
 */
const LaunchPanel: React.FC<LaunchPanelProps> = ({
    launch,
    scenario,
    providerId,
    onClose,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [copied, setCopied] = useState(false);
    const [status, setStatus] = useState<StatusState>({ kind: 'idle' });

    /* Render QR. */
    useEffect(() => {
        if (!canvasRef.current) return;
        QRCode.toCanvas(canvasRef.current, launch.uri, {
            width: 240,
            margin: 1,
            color: { dark: '#18224E', light: '#FFFFFF' },
        }).catch((err) => {
            // eslint-disable-next-line no-console
            console.error('QR render failed', err);
        });
    }, [launch.uri]);

    /* Poll status. VCI is fire-and-forget so we hide the spinner
       after the first response telling us the verifier doesn\u2019t
       expose status. VP polls every 1.5s until success/fail. */
    useEffect(() => {
        let cancelled = false;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const poll = async () => {
            if (cancelled) return;
            try {
                const result = await fetchStatus(providerId, launch.kind, launch.state);
                if (cancelled) return;

                if (result.status === 'success') {
                    setStatus({ kind: 'success' });
                    return;
                }
                if (result.status === 'fail') {
                    setStatus({ kind: 'fail', detail: result.detail });
                    return;
                }
                setStatus({ kind: 'pending', detail: result.detail });

                // VCI scenarios get one poll; the server reports
                // they have no status surface and we leave the user
                // to confirm visually in the wallet.
                if (launch.kind === 'vp') {
                    timeoutId = setTimeout(poll, 1500);
                }
            } catch (err) {
                if (!cancelled) {
                    setStatus({
                        kind: 'error',
                        message: err instanceof Error ? err.message : 'Status check failed',
                    });
                }
            }
        };

        poll();

        return () => {
            cancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [launch.kind, launch.state, providerId]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(launch.uri);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Clipboard write failed', err);
        }
    };

    return (
        <aside className="bg-white rounded-2xl shadow-xl border border-grayscale-200 p-6 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                        {scenario.kind === 'vci' ? 'Issuance' : 'Verification'}
                    </p>
                    <h2 className="text-lg font-semibold text-grayscale-900 mt-0.5">
                        {scenario.name}
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    aria-label="Close launch panel"
                    className="text-grayscale-500 hover:text-grayscale-900 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {scenario.note && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800 leading-relaxed">
                    {scenario.note}
                </div>
            )}

            <div className="flex flex-col items-center gap-3 mb-4">
                <canvas ref={canvasRef} className="qr rounded-lg border border-grayscale-200" />
                <p className="text-xs text-grayscale-500 text-center">
                    Scan from a wallet on a phone, or open the deep link below on this device.
                </p>
            </div>

            <div className="space-y-2 mb-4">
                <a
                    href={launch.deepLink}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    Open in LearnCard
                </a>
                <button
                    onClick={handleCopy}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy URI'}
                </button>
            </div>

            <details className="mb-4">
                <summary className="text-xs text-grayscale-600 cursor-pointer hover:text-grayscale-900">
                    View raw URI
                </summary>
                <pre className="mt-2 p-2 bg-grayscale-100 rounded text-[10px] text-grayscale-700 break-all whitespace-pre-wrap font-mono">
                    {launch.uri}
                </pre>
            </details>

            <StatusBadge state={status} kind={launch.kind} />
        </aside>
    );
};

const StatusBadge: React.FC<{ state: StatusState; kind: 'vci' | 'vp' }> = ({
    state,
    kind,
}) => {
    const baseClass =
        'p-3 rounded-xl border flex items-start gap-2 text-xs leading-relaxed';

    if (state.kind === 'success') {
        return (
            <div className={`${baseClass} bg-emerald-50 border-emerald-100 text-emerald-800`}>
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                <span>Verifier accepted the presentation.</span>
            </div>
        );
    }

    if (state.kind === 'fail') {
        return (
            <div className={`${baseClass} bg-red-50 border-red-100 text-red-800`}>
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                <span>{state.detail ?? 'Verifier rejected the presentation.'}</span>
            </div>
        );
    }

    if (state.kind === 'error') {
        return (
            <div className={`${baseClass} bg-red-50 border-red-100 text-red-800`}>
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                <span>{state.message}</span>
            </div>
        );
    }

    return (
        <div className={`${baseClass} bg-grayscale-100 border-grayscale-200 text-grayscale-700`}>
            <Loader2 className="w-4 h-4 mt-0.5 shrink-0 text-grayscale-500 animate-spin" />
            <span>
                {state.kind === 'pending' && state.detail
                    ? state.detail
                    : kind === 'vp'
                      ? 'Waiting for the wallet to present\u2026'
                      : 'Watch the wallet to confirm issuance.'}
            </span>
        </div>
    );
};

export default LaunchPanel;
