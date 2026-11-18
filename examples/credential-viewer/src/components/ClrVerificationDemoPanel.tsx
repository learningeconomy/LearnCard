import React, { useRef, useState } from 'react';

import { useWallet } from '../context/WalletContext';
import {
    getClrDemoEnvironmentError,
    sendClrVerificationDemo,
    type ClrDemoDelivery,
} from '../lib/clr-verification-demo';

interface ClrVerificationDemoPanelProps {
    onClose: () => void;
}

export const ClrVerificationDemoPanel: React.FC<ClrVerificationDemoPanelProps> = ({ onClose }) => {
    const { wallet, status, profile, envKey, envConfig } = useWallet();
    const [recipient, setRecipient] = useState('');
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState('');
    const [deliveries, setDeliveries] = useState<ClrDemoDelivery[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [completed, setCompleted] = useState(false);
    const sendingRef = useRef(false);
    const environmentError = getClrDemoEnvironmentError(envKey, envConfig);
    const connected = status === 'connected' && Boolean(wallet && profile);

    const send = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        if (sendingRef.current || completed || !connected || environmentError || !recipient.trim())
            return;

        sendingRef.current = true;
        setSending(true);
        setCompleted(false);
        setError(null);
        setProgress('Preparing signed credentials...');
        try {
            await sendClrVerificationDemo({
                wallet,
                envKey,
                envConfig,
                recipient: recipient.trim(),
                onProgress: update => {
                    setProgress(update.message);
                    if (update.delivery) {
                        const delivery = update.delivery;
                        setDeliveries(previous => [...previous, delivery]);
                    }
                },
            });
            setCompleted(true);
            setProgress('');
        } catch {
            setProgress('');
            setError(
                'The demo could not finish sending. Any deliveries listed below were already sent; supporting course deliveries may also have been sent. Check the recipient before trying again, as a new attempt creates new deliveries.'
            );
        } finally {
            sendingRef.current = false;
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="clr-demo-title"
                className="mx-4 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl"
            >
                <header className="flex items-start justify-between border-b border-gray-800 px-6 py-4">
                    <div>
                        <h2 id="clr-demo-title" className="text-sm font-bold text-white">
                            CLR Verification Demo
                        </h2>
                        <p className="mt-1 text-xs text-gray-400">
                            Send real signed transcripts for verification in LearnCard.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={sending}
                        aria-label="Close CLR verification demo"
                        className="rounded-md px-2 py-1 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Close
                    </button>
                </header>

                <div className="space-y-4 overflow-y-auto px-6 py-5 text-xs text-gray-300">
                    <p>
                        Select Local or Staging in the connection bar, then generate or connect an
                        account and create a profile. Production is disabled. Loopback-only Custom
                        services are also allowed for local verification.
                    </p>
                    <p>
                        This sends five signed transcripts: All verified, Revoked record, Suspended
                        record, Tampered signature, and Mixed signed/unsigned. Their verification
                        outcomes are genuine, not mocked; hosted network status is used instead of a
                        localhost status server.
                    </p>
                    <p className="rounded-xl border border-amber-800/50 bg-amber-950/30 p-3 text-amber-300">
                        Two supporting course credentials are also delivered to the same recipient
                        to establish real revocation and suspension status. Lifecycle notifications
                        may appear in addition to the transcript alerts.
                    </p>
                    {!connected && (
                        <p className="rounded-xl border border-amber-800/50 bg-amber-950/30 p-3 text-amber-300">
                            Connect a network account and create a profile before sending.
                        </p>
                    )}
                    {environmentError && (
                        <p
                            role="alert"
                            className="rounded-xl border border-amber-800/50 bg-amber-950/30 p-3 text-amber-300"
                        >
                            {environmentError}
                        </p>
                    )}
                    <form onSubmit={send} className="space-y-3">
                        <label
                            htmlFor="clr-demo-recipient"
                            className="block font-medium text-gray-200"
                        >
                            Recipient profile ID
                        </label>
                        <input
                            id="clr-demo-recipient"
                            type="text"
                            value={recipient}
                            autoFocus
                            onChange={event => setRecipient(event.target.value)}
                            disabled={sending}
                            autoComplete="off"
                            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500/50 disabled:opacity-40"
                        />
                        <button
                            type="submit"
                            disabled={
                                sending ||
                                completed ||
                                !connected ||
                                Boolean(environmentError) ||
                                !recipient.trim()
                            }
                            className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {sending
                                ? 'Sending demo...'
                                : completed
                                  ? 'Demo sent'
                                  : 'Send verification demo'}
                        </button>
                    </form>
                    {progress && (
                        <p role="status" className="text-blue-300">
                            {progress}
                        </p>
                    )}
                    {error && (
                        <p
                            role="alert"
                            className="rounded-xl border border-red-800/50 bg-red-950/30 p-3 text-red-300"
                        >
                            {error}
                        </p>
                    )}
                    {deliveries.length > 0 && (
                        <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-4">
                            <h3 className="font-semibold text-white">Delivered transcripts</h3>
                            <ul className="mt-2 space-y-2">
                                {deliveries.map((delivery, index) => (
                                    <li key={`${delivery.name}-${index}`}>
                                        <span className="font-medium text-gray-200">
                                            {delivery.name}
                                        </span>
                                        {' — '}
                                        {delivery.expected}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {completed && (
                        <p
                            role="status"
                            className="rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-3 text-emerald-300"
                        >
                            Demo sent. In the recipient app, open Alerts and claim the transcripts,
                            then open Studies. Share anonymously and reload the shared view to
                            review verification.
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
};
