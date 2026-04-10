import React, { useState, useCallback } from 'react';

import type { CredentialFixture } from '@learncard/credential-library';
import { prepareFixture } from '@learncard/credential-library';

import { Badge } from './Badge';
import { SPEC_LABELS, SPEC_COLORS } from '../lib/colors';
import { useWallet } from '../context/WalletContext';

interface SendPanelProps {
    fixtures: CredentialFixture[];
    onClose: () => void;
}

type SendStep = 'configure' | 'sending' | 'success' | 'error';

interface SendResult {
    succeeded: number;
    failed: number;
    errors: string[];
    results: unknown[];
}

export const SendPanel: React.FC<SendPanelProps> = ({ fixtures, onClose }) => {
    const { did, send } = useWallet();

    const [recipient, setRecipient] = useState('');
    const [step, setStep] = useState<SendStep>('configure');
    const [result, setResult] = useState<SendResult>({ succeeded: 0, failed: 0, errors: [], results: [] });
    const [progress, setProgress] = useState(0);

    const isBulk = fixtures.length > 1;

    const handleSend = useCallback(async () => {
        if (!recipient.trim() || !did) return;

        setStep('sending');
        setProgress(0);
        setResult({ succeeded: 0, failed: 0, errors: [], results: [] });

        const errors: string[] = [];
        const results: unknown[] = [];
        let succeeded = 0;
        let failed = 0;

        for (let i = 0; i < fixtures.length; i++) {
            const fixture = fixtures[i];

            try {
                const prepared = prepareFixture(fixture, {
                    issuerDid: did,
                    subjectDid: recipient.trim(),
                });

                const res = await send({
                    recipient: recipient.trim(),
                    credential: prepared as Record<string, unknown>,
                    name: fixture.name,
                    category: 'Achievement',
                });

                results.push(res);
                succeeded++;
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);

                errors.push(`${fixture.id}: ${msg}`);
                failed++;
            }

            setProgress(i + 1);
        }

        setResult({ succeeded, failed, errors, results });
        setStep(failed > 0 && succeeded === 0 ? 'error' : 'success');
    }, [recipient, did, fixtures, send]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-white">
                                Send {isBulk ? `${fixtures.length} Credentials` : 'Credential'}
                            </h3>

                            <p className="text-xs text-gray-400">
                                Send via LearnCard Network
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Fixture list */}
                <div className="px-6 py-3 bg-gray-800/30 border-b border-gray-800/50 max-h-32 overflow-auto">
                    <div className="flex flex-wrap gap-1.5">
                        {fixtures.map(f => {
                            const specColor = SPEC_COLORS[f.spec];

                            return (
                                <Badge key={f.id} bg={specColor.bg} text={specColor.text} border={specColor.border}>
                                    {f.name}
                                </Badge>
                            );
                        })}
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    {step === 'configure' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                    Recipient (Profile ID, DID, Email, or Phone)
                                </label>

                                <input
                                    type="text"
                                    value={recipient}
                                    onChange={e => setRecipient(e.target.value)}
                                    placeholder="e.g. alice-123, did:key:z6Mk..., alice@example.com"
                                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                />

                                <p className="mt-1 text-[10px] text-gray-600">
                                    Recipient type is auto-detected. Creates a boost on-the-fly and sends it.
                                </p>
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={!recipient.trim()}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                                Send {isBulk ? `${fixtures.length} Credentials` : 'Credential'}
                            </button>
                        </div>
                    )}

                    {step === 'sending' && (
                        <div className="flex flex-col items-center py-8 text-gray-400">
                            <svg className="w-8 h-8 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>

                            <p className="text-sm">
                                Sending {progress}/{fixtures.length}...
                            </p>

                            {isBulk && (
                                <div className="w-48 h-1.5 bg-gray-800 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all"
                                        style={{ width: `${(progress / fixtures.length) * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-emerald-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>

                                <span className="text-sm font-medium">
                                    {result.succeeded} sent successfully
                                    {result.failed > 0 && `, ${result.failed} failed`}
                                </span>
                            </div>

                            {result.errors.length > 0 && (
                                <pre className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-300 font-mono overflow-auto max-h-32">
                                    {result.errors.join('\n')}
                                </pre>
                            )}

                            <button
                                onClick={onClose}
                                className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-red-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>

                                <span className="text-sm font-medium">All sends failed</span>
                            </div>

                            <pre className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-300 font-mono whitespace-pre-wrap overflow-auto max-h-40">
                                {result.errors.join('\n')}
                            </pre>

                            <button
                                onClick={() => { setStep('configure'); setResult({ succeeded: 0, failed: 0, errors: [], results: [] }); }}
                                className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors cursor-pointer"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
