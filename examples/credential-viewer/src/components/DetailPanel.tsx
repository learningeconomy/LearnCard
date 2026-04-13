import React, { useMemo, useState } from 'react';

import type { CredentialFixture } from '@learncard/credential-library';

import { Badge } from './Badge';
import { JsonViewer } from './JsonViewer';
import { IssuePanel } from './IssuePanel';
import { SendPanel } from './SendPanel';
import { SPEC_COLORS, SPEC_LABELS, PROFILE_LABELS, VALIDITY_COLORS, CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../lib/colors';
import { useWallet } from '../context/WalletContext';
import { getCategoryForCredential } from '../lib/category';

interface DetailPanelProps {
    fixture: CredentialFixture;
    onClose: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ fixture, onClose }) => {
    const { status } = useWallet();
    const isConnected = status === 'connected';

    const [showValidation, setShowValidation] = useState(false);
    const [showIssuePanel, setShowIssuePanel] = useState(false);
    const [showSendPanel, setShowSendPanel] = useState(false);

    const validationResult = useMemo(() => {
        if (!fixture.validator) return null;

        const result = fixture.validator.safeParse(fixture.credential);

        return result;
    }, [fixture]);

    const specColor = SPEC_COLORS[fixture.spec];
    const validityColor = VALIDITY_COLORS[fixture.validity];
    const category = getCategoryForCredential(fixture.credential as Record<string, unknown>);
    const catColor = CATEGORY_COLORS[category] ?? DEFAULT_CATEGORY_COLOR;

    const credentialJson = JSON.stringify(fixture.credential, null, 2);
    const lineCount = credentialJson.split('\n').length;
    const byteSize = new TextEncoder().encode(credentialJson).length;

    return (
        <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800">
            {/* Header */}
            <div className="flex-shrink-0 p-5 border-b border-gray-800">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="text-lg font-bold text-white leading-tight">
                        {fixture.name}
                    </h2>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {isConnected && fixture.validity === 'valid' && (
                            <>
                                <button
                                    onClick={() => setShowIssuePanel(true)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Issue
                                </button>

                                <button
                                    onClick={() => setShowSendPanel(true)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Send
                                </button>
                            </>
                        )}

                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                    {fixture.description}
                </p>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span className="text-gray-500 text-xs">Spec</span>
                        <div className="mt-0.5">
                            <Badge bg={specColor.bg} text={specColor.text} border={specColor.border}>
                                {SPEC_LABELS[fixture.spec]}
                            </Badge>
                        </div>
                    </div>

                    <div>
                        <span className="text-gray-500 text-xs">Profile</span>
                        <div className="mt-0.5">
                            <Badge>{PROFILE_LABELS[fixture.profile]}</Badge>
                        </div>
                    </div>

                    <div>
                        <span className="text-gray-500 text-xs">Wallet Category</span>
                        <div className="mt-0.5">
                            <Badge bg={catColor.bg} text={catColor.text}>
                                {category}
                            </Badge>
                        </div>
                    </div>

                    <div>
                        <span className="text-gray-500 text-xs">Validity</span>
                        <div className="mt-0.5">
                            <Badge bg={validityColor.bg} text={validityColor.text}>
                                {fixture.validity}
                            </Badge>
                        </div>
                    </div>

                    <div>
                        <span className="text-gray-500 text-xs">Source</span>
                        <div className="mt-0.5">
                            <Badge>{fixture.source}</Badge>
                        </div>
                    </div>

                    <div>
                        <span className="text-gray-500 text-xs">Signed</span>
                        <div className="mt-0.5 text-gray-300">
                            {fixture.signed ? 'Yes' : 'No'}
                        </div>
                    </div>

                    <div>
                        <span className="text-gray-500 text-xs">Size</span>
                        <div className="mt-0.5 text-gray-300 font-mono text-xs">
                            {lineCount} lines / {byteSize.toLocaleString()} bytes
                        </div>
                    </div>
                </div>

                {/* Features */}
                {fixture.features.length > 0 && (
                    <div className="mt-3">
                        <span className="text-gray-500 text-xs">Features</span>

                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {fixture.features.map(f => (
                                <Badge key={f} bg="bg-gray-800" text="text-gray-300">
                                    {f}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tags */}
                {fixture.tags && fixture.tags.length > 0 && (
                    <div className="mt-3">
                        <span className="text-gray-500 text-xs">Tags</span>

                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {fixture.tags.map(t => (
                                <Badge key={t} bg="bg-gray-800/60" text="text-gray-400">
                                    #{t}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* ID */}
                <div className="mt-3">
                    <span className="text-gray-500 text-xs">Fixture ID</span>
                    <div className="mt-0.5 font-mono text-xs text-gray-400">{fixture.id}</div>
                </div>

                {/* Validation */}
                {fixture.validator && (
                    <div className="mt-4">
                        <button
                            onClick={() => setShowValidation(!showValidation)}
                            className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <span
                                className={`inline-block w-2 h-2 rounded-full ${
                                    validationResult?.success ? 'bg-green-500' : 'bg-red-500'
                                }`}
                            />

                            Zod validation: {validationResult?.success ? 'PASS' : 'FAIL'}

                            <svg
                                className={`w-3 h-3 transition-transform ${showValidation ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showValidation && !validationResult?.success && validationResult && (
                            <pre className="mt-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-300 font-mono overflow-auto max-h-40">
                                {'error' in validationResult
                                    ? JSON.stringify(validationResult.error.issues, null, 2)
                                    : 'Unknown error'}
                            </pre>
                        )}

                        {showValidation && validationResult?.success && (
                            <div className="mt-2 p-3 bg-green-950/30 border border-green-900/50 rounded-lg text-xs text-green-300">
                                Credential passes its declared Zod validator.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* JSON viewer */}
            <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-300">Credential JSON</h3>

                    <button
                        onClick={() => navigator.clipboard.writeText(credentialJson)}
                        className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy
                    </button>
                </div>

                <JsonViewer data={fixture.credential} />
            </div>

            {/* Issue modal */}
            {showIssuePanel && (
                <IssuePanel
                    fixtures={[fixture]}
                    onClose={() => setShowIssuePanel(false)}
                />
            )}

            {/* Send modal */}
            {showSendPanel && (
                <SendPanel
                    fixtures={[fixture]}
                    onClose={() => setShowSendPanel(false)}
                />
            )}
        </div>
    );
};
