import React, { useState } from 'react';

import { prepareFixture, type CredentialFixture } from '@learncard/credential-library';
import { renderSvgMustache, buildPreviewData } from '@learncard/render-method-designer';

import { useWallet } from '../context/WalletContext';

interface AttachAndIssuePanelProps {
    templateValue: string;
    sampleFixture: CredentialFixture | null;
    onClose: () => void;
}

type Step = 'idle' | 'attaching' | 'issuing' | 'roundtripping' | 'done' | 'error';

interface RoundtripResult {
    suite: string;
    mediaType: string;
    decodedTemplateLength: number;
    decodedTemplateMatchesInput: boolean;
    renderedSvg: string;
}

export const AttachAndIssuePanel: React.FC<AttachAndIssuePanelProps> = ({
    templateValue,
    sampleFixture,
    onClose,
}) => {
    const { wallet, did, status } = useWallet();
    const [step, setStep] = useState<Step>('idle');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<RoundtripResult | null>(null);

    const canRun = status === 'connected' && !!sampleFixture && !!templateValue.trim();

    const handleRun = async () => {
        if (!wallet || !did || !sampleFixture) return;
        setError(null);
        setResult(null);
        try {
            setStep('attaching');
            const lc = wallet as {
                invoke: {
                    attachRenderMethod: (
                        vc: Record<string, unknown>,
                        config: { templateValue: string }
                    ) => Record<string, unknown>;
                    issueCredential: (vc: Record<string, unknown>) => Promise<Record<string, unknown>>;
                    findTemplateRenderMethod: (
                        vc: Record<string, unknown>,
                        suite: string
                    ) => {
                        type: string;
                        renderSuite: string;
                        template: string;
                        outputPreference?: { mediaType: string };
                    } | null;
                };
            };

            const unsigned = prepareFixture(sampleFixture, { issuerDid: did });
            const withRender = lc.invoke.attachRenderMethod(unsigned as unknown as Record<string, unknown>, {
                templateValue,
            });

            setStep('issuing');
            const signed = await lc.invoke.issueCredential(withRender);

            setStep('roundtripping');
            const found = lc.invoke.findTemplateRenderMethod(signed, 'svg-mustache');
            if (!found) {
                throw new Error('findTemplateRenderMethod returned null on the signed VC.');
            }

            const decoded = decodeTemplate(found.template);
            const matchesInput = decoded.trim() === templateValue.trim();
            const data = buildPreviewData(signed as unknown as Parameters<typeof buildPreviewData>[0]);
            const renderedSvg = renderSvgMustache(decoded, data);

            setResult({
                suite: found.renderSuite,
                mediaType: found.outputPreference?.mediaType ?? '(unspecified)',
                decodedTemplateLength: decoded.length,
                decodedTemplateMatchesInput: matchesInput,
                renderedSvg,
            });
            setStep('done');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setStep('error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <h2 className="text-sm font-bold text-white">Attach + Issue + Roundtrip</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-sm cursor-pointer"
                    >
                        Close
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Runs the full plugin pipeline against the current sample fixture: attaches the
                        designer template via <code className="text-gray-300">attachRenderMethod</code>,
                        signs the VC via <code className="text-gray-300">issueCredential</code>, then
                        re-reads it via <code className="text-gray-300">findTemplateRenderMethod</code>{' '}
                        and renders it through the package&apos;s sanitizer.
                    </p>

                    {!canRun && (
                        <div className="px-3 py-2 bg-amber-900/30 border border-amber-800/50 text-amber-300 text-xs rounded-lg">
                            {status !== 'connected'
                                ? 'Connect a wallet first.'
                                : !sampleFixture
                                    ? 'Pick a sample VC in the designer toolbar.'
                                    : 'Provide a template.'}
                        </div>
                    )}

                    {step !== 'idle' && step !== 'done' && step !== 'error' && (
                        <div className="px-3 py-2 bg-blue-900/30 border border-blue-800/50 text-blue-300 text-xs rounded-lg">
                            {step === 'attaching' && 'Calling attachRenderMethod…'}
                            {step === 'issuing' && 'Calling issueCredential (this may take a few seconds)…'}
                            {step === 'roundtripping' && 'Calling findTemplateRenderMethod + rendering…'}
                        </div>
                    )}

                    {error && (
                        <div className="px-3 py-2 bg-red-900/30 border border-red-800/50 text-red-300 text-xs rounded-lg whitespace-pre-wrap">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <Stat label="renderSuite" value={result.suite} />
                                <Stat label="mediaType" value={result.mediaType} />
                                <Stat
                                    label="decoded length"
                                    value={`${result.decodedTemplateLength} chars`}
                                />
                                <Stat
                                    label="round-trip match"
                                    value={result.decodedTemplateMatchesInput ? 'yes' : 'no'}
                                    accent={
                                        result.decodedTemplateMatchesInput ? 'emerald' : 'red'
                                    }
                                />
                            </div>
                            <div>
                                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                                    Rendered preview
                                </div>
                                <div
                                    className="bg-white rounded-lg p-4 flex items-center justify-center"
                                    dangerouslySetInnerHTML={{ __html: result.renderedSvg }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg cursor-pointer transition-colors"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={handleRun}
                        disabled={!canRun || (step !== 'idle' && step !== 'done' && step !== 'error')}
                        className="px-3 py-1.5 text-xs font-medium bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {step === 'done' ? 'Run again' : 'Run pipeline'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Stat: React.FC<{ label: string; value: string; accent?: 'emerald' | 'red' }> = ({
    label,
    value,
    accent,
}) => (
    <div className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{label}</div>
        <div
            className={`text-xs font-mono mt-1 ${
                accent === 'emerald'
                    ? 'text-emerald-400'
                    : accent === 'red'
                        ? 'text-red-400'
                        : 'text-gray-200'
            }`}
        >
            {value}
        </div>
    </div>
);

const decodeTemplate = (template: string): string => {
    if (!template.startsWith('data:')) return template;
    const commaIdx = template.indexOf(',');
    const meta = template.slice(0, commaIdx);
    const payload = template.slice(commaIdx + 1);
    if (meta.endsWith(';base64')) {
        return atob(payload);
    }
    return decodeURIComponent(payload);
};
