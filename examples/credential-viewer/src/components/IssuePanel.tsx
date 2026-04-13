import React, { useState, useCallback } from 'react';

import type { CredentialFixture } from '@learncard/credential-library';
import { prepareFixture } from '@learncard/credential-library';

import { Badge } from './Badge';
import { SPEC_LABELS, SPEC_COLORS, CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../lib/colors';
import { useWallet } from '../context/WalletContext';
import { getCategoryForCredential, ALL_CATEGORIES, type CredentialCategory } from '../lib/category';

interface IssuePanelProps {
    fixtures: CredentialFixture[];
    onClose: () => void;
}

type IssueStep = 'confirm' | 'issuing' | 'success' | 'error';

interface IssueResult {
    succeeded: number;
    failed: number;
    uris: string[];
    errors: string[];
}

export const IssuePanel: React.FC<IssuePanelProps> = ({ fixtures, onClose }) => {
    const { did, issueAndStore } = useWallet();

    const [step, setStep] = useState<IssueStep>('confirm');
    const [result, setResult] = useState<IssueResult>({ succeeded: 0, failed: 0, uris: [], errors: [] });
    const [progress, setProgress] = useState(0);

    // Per-fixture category overrides: empty string = use auto-detected
    const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});

    // Global override applied to all fixtures at once
    const [globalOverride, setGlobalOverride] = useState<string>('');

    const isBulk = fixtures.length > 1;

    const handleIssue = useCallback(async () => {
        if (!did) return;

        setStep('issuing');
        setProgress(0);
        setResult({ succeeded: 0, failed: 0, uris: [], errors: [] });

        const uris: string[] = [];
        const errors: string[] = [];
        let succeeded = 0;
        let failed = 0;

        for (let i = 0; i < fixtures.length; i++) {
            const fixture = fixtures[i];

            try {
                const unsigned = prepareFixture(fixture, {
                    issuerDid: did,
                    subjectDid: did,
                });

                const override = categoryOverrides[fixture.id] || undefined;

                const { uri } = await issueAndStore(unsigned as Record<string, unknown>, override);

                uris.push(uri);
                succeeded++;
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);

                errors.push(`${fixture.id}: ${msg}`);
                failed++;
            }

            setProgress(i + 1);
        }

        setResult({ succeeded, failed, uris, errors });
        setStep(failed > 0 && succeeded === 0 ? 'error' : 'success');
    }, [did, fixtures, issueAndStore, categoryOverrides]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-white">
                                Issue {isBulk ? `${fixtures.length} Credentials` : 'Credential'} to Self
                            </h3>

                            <p className="text-xs text-gray-400">
                                Sign, upload encrypted, and index in LearnCloud
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
                <div className="px-6 py-3 bg-gray-800/30 border-b border-gray-800/50 max-h-52 overflow-auto">
                    {isBulk && step === 'confirm' && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-800/50">
                            <span className="text-[11px] text-gray-500">Override all:</span>

                            <select
                                value={globalOverride}
                                onChange={e => {
                                    const val = e.target.value;

                                    setGlobalOverride(val);

                                    if (val) {
                                        const overrides: Record<string, string> = {};

                                        fixtures.forEach(f => { overrides[f.id] = val; });

                                        setCategoryOverrides(overrides);
                                    } else {
                                        setCategoryOverrides({});
                                    }
                                }}
                                className="bg-gray-800 border border-gray-700 text-xs text-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            >
                                <option value="">Auto-detect</option>

                                {ALL_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        {fixtures.map(f => {
                            const specColor = SPEC_COLORS[f.spec];
                            const detectedCategory = getCategoryForCredential(f.credential as Record<string, unknown>);
                            const effectiveCategory = (categoryOverrides[f.id] || detectedCategory) as CredentialCategory;
                            const catColor = CATEGORY_COLORS[effectiveCategory] ?? DEFAULT_CATEGORY_COLOR;
                            const isOverridden = Boolean(categoryOverrides[f.id]);

                            return (
                                <div key={f.id} className="flex items-center gap-1.5">
                                    <Badge bg={specColor.bg} text={specColor.text} border={specColor.border}>
                                        {f.name}
                                    </Badge>

                                    {step === 'confirm' ? (
                                        <select
                                            value={categoryOverrides[f.id] || ''}
                                            onChange={e => {
                                                const val = e.target.value;

                                                setCategoryOverrides(prev => {
                                                    const next = { ...prev };

                                                    if (val) {
                                                        next[f.id] = val;
                                                    } else {
                                                        delete next[f.id];
                                                    }

                                                    return next;
                                                });

                                                setGlobalOverride('');
                                            }}
                                            className={`bg-gray-800 border text-[11px] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${
                                                isOverridden
                                                    ? 'border-blue-600/50 text-blue-300'
                                                    : 'border-gray-700 text-gray-400'
                                            }`}
                                        >
                                            <option value="">{detectedCategory} (auto)</option>

                                            {ALL_CATEGORIES.filter(c => c !== detectedCategory).map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <Badge bg={catColor.bg} text={catColor.text}>
                                            {effectiveCategory}
                                        </Badge>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    {step === 'confirm' && (
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-800/50 rounded-lg space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Issuer / Recipient</span>
                                    <span className="text-gray-300 font-mono text-[11px] max-w-[280px] truncate" title={did ?? ''}>
                                        {did}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Credentials</span>
                                    <span className="text-gray-300">{fixtures.length}</span>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Action</span>
                                    <span className="text-gray-300">Sign → Upload Encrypted → Index</span>
                                </div>
                            </div>

                            <button
                                onClick={handleIssue}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
                            >
                                Issue {isBulk ? `All ${fixtures.length}` : ''} to Self
                            </button>

                            <p className="text-[11px] text-gray-600 leading-relaxed">
                                Each fixture will be prepared with your DID, signed via{' '}
                                <code className="text-gray-500">issueCredential()</code>, uploaded encrypted to
                                LearnCloud, and added to your LearnCloud index.
                            </p>
                        </div>
                    )}

                    {step === 'issuing' && (
                        <div className="flex flex-col items-center py-8 text-gray-400">
                            <svg className="w-8 h-8 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>

                            <p className="text-sm">
                                Issuing {progress}/{fixtures.length}...
                            </p>

                            {isBulk && (
                                <div className="w-48 h-1.5 bg-gray-800 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all"
                                        style={{ width: `${(progress / fixtures.length) * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-green-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>

                                <span className="text-sm font-medium">
                                    {result.succeeded} issued & stored
                                    {result.failed > 0 && `, ${result.failed} failed`}
                                </span>
                            </div>

                            {result.uris.length > 0 && (
                                <div>
                                    <span className="text-xs text-gray-500">LearnCloud URIs</span>

                                    <div className="mt-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-xs font-mono text-gray-300 overflow-auto max-h-32 space-y-1">
                                        {result.uris.map((uri, i) => (
                                            <div key={i} className="break-all">{uri}</div>
                                        ))}
                                    </div>
                                </div>
                            )}

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

                                <span className="text-sm font-medium">All issuances failed</span>
                            </div>

                            <pre className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-300 font-mono whitespace-pre-wrap overflow-auto max-h-40">
                                {result.errors.join('\n')}
                            </pre>

                            <button
                                onClick={() => { setStep('confirm'); setResult({ succeeded: 0, failed: 0, uris: [], errors: [] }); }}
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
