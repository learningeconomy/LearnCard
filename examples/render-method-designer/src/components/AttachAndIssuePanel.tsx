import React, { useMemo, useState } from 'react';

import { prepareFixture, type CredentialFixture } from '@learncard/credential-library';
import { renderSvgMustache, buildPreviewData } from '@learncard/render-method-designer';

import { useWallet } from '../context/WalletContext';

interface AttachAndIssuePanelProps {
    templateValue: string;
    sampleFixture: CredentialFixture | null;
    onClose: () => void;
}

type ActionStep =
    | 'idle'
    | 'preparing'
    | 'copying'
    | 'issuing'
    | 'storing'
    | 'roundtripping'
    | 'done'
    | 'error';

interface RoundtripResult {
    suite: string;
    mediaType: string;
    decodedTemplateLength: number;
    decodedTemplateMatchesInput: boolean;
    renderedSvg: string;
}

interface ActionArtifacts {
    unsignedWithRender?: Record<string, unknown>;
    signed?: Record<string, unknown>;
    renderMethod?: Record<string, unknown>;
    storedUri?: string;
    storedCategory?: string;
    roundtrip?: RoundtripResult;
}

interface LearnCardLike {
    id: { did: () => string };
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
    store?: {
        LearnCloud?: {
            uploadEncrypted?: (vc: Record<string, unknown>) => Promise<string>;
        };
    };
    index?: {
        LearnCloud?: {
            add?: (input: { id: string; uri: string; category: string }) => Promise<void>;
        };
    };
}

export const AttachAndIssuePanel: React.FC<AttachAndIssuePanelProps> = ({
    templateValue,
    sampleFixture,
    onClose,
}) => {
    const { wallet, did, status } = useWallet();
    const [step, setStep] = useState<ActionStep>('idle');
    const [error, setError] = useState<string | null>(null);
    const [artifacts, setArtifacts] = useState<ActionArtifacts>({});
    const [message, setMessage] = useState<string | null>(null);

    const canRun = status === 'connected' && !!sampleFixture && !!templateValue.trim();
    const isBusy = step !== 'idle' && step !== 'done' && step !== 'error';

    const fixtureWarning = useMemo(() => {
        if (!sampleFixture) return null;
        if (sampleFixture.validity !== 'valid') {
            return `This fixture is marked ${sampleFixture.validity}. Preview/copy actions still work, but issue/roundtrip may fail intentionally.`;
        }
        return null;
    }, [sampleFixture]);

    const prepareArtifacts = async (): Promise<{
        lc: LearnCardLike;
        unsigned: Record<string, unknown>;
        withRender: Record<string, unknown>;
        renderMethod: Record<string, unknown> | undefined;
    }> => {
        if (!wallet || !did || !sampleFixture) throw new Error('Wallet, DID, or fixture missing.');
        const lc = wallet as LearnCardLike;
        const unsigned = prepareFixture(sampleFixture, {
            issuerDid: did,
            subjectDid: did,
        }) as unknown as Record<string, unknown>;
        const withRender = lc.invoke.attachRenderMethod(unsigned, { templateValue });
        const rawRenderMethod = withRender.renderMethod;
        const renderMethod = Array.isArray(rawRenderMethod)
            ? (rawRenderMethod[rawRenderMethod.length - 1] as Record<string, unknown> | undefined)
            : (rawRenderMethod as Record<string, unknown> | undefined);
        return { lc, unsigned, withRender, renderMethod };
    };

    const copyText = async (text: string): Promise<void> => {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
        throw new Error('Clipboard API unavailable in this browser.');
    };

    const handlePreviewRoundtrip = async () => {
        if (!canRun) return;
        setError(null);
        setMessage(null);
        try {
            setStep('preparing');
            const { lc, withRender, renderMethod } = await prepareArtifacts();
            setArtifacts(prev => ({ ...prev, unsignedWithRender: withRender, renderMethod }));

            setStep('issuing');
            const signed = await lc.invoke.issueCredential(withRender);

            setStep('roundtripping');
            const found = lc.invoke.findTemplateRenderMethod(signed, 'svg-mustache');
            if (!found) throw new Error('findTemplateRenderMethod returned null on the signed VC.');

            const decoded = decodeTemplate(found.template);
            const matchesInput = decoded.trim() === templateValue.trim();
            const data = buildPreviewData(signed as unknown as Parameters<typeof buildPreviewData>[0]);
            const renderedSvg = renderSvgMustache(decoded, data);

            setArtifacts(prev => ({
                ...prev,
                signed,
                roundtrip: {
                    suite: found.renderSuite,
                    mediaType: found.outputPreference?.mediaType ?? '(unspecified)',
                    decodedTemplateLength: decoded.length,
                    decodedTemplateMatchesInput: matchesInput,
                    renderedSvg,
                },
            }));
            setStep('done');
            setMessage('Preview roundtrip completed.');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setStep('error');
        }
    };

    const handleCopyUnsigned = async () => {
        if (!canRun) return;
        setError(null);
        try {
            setStep('preparing');
            const { withRender, renderMethod } = await prepareArtifacts();
            await copyText(JSON.stringify(withRender, null, 2));
            setArtifacts(prev => ({ ...prev, unsignedWithRender: withRender, renderMethod }));
            setStep('done');
            setMessage('Copied unsigned VC JSON with renderMethod attached.');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setStep('error');
        }
    };

    const handleCopyRenderMethod = async () => {
        if (!canRun) return;
        setError(null);
        try {
            setStep('preparing');
            const { renderMethod, withRender } = await prepareArtifacts();
            if (!renderMethod) throw new Error('No renderMethod was attached to the VC.');
            await copyText(JSON.stringify(renderMethod, null, 2));
            setArtifacts(prev => ({ ...prev, unsignedWithRender: withRender, renderMethod }));
            setStep('done');
            setMessage('Copied renderMethod JSON.');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setStep('error');
        }
    };

    const handleIssueToSelf = async () => {
        if (!canRun) return;
        setError(null);
        setMessage(null);
        try {
            setStep('preparing');
            const { lc, withRender, renderMethod } = await prepareArtifacts();
            setArtifacts(prev => ({ ...prev, unsignedWithRender: withRender, renderMethod }));

            setStep('issuing');
            const signed = await lc.invoke.issueCredential(withRender);

            let storedUri: string | undefined;
            let storedCategory: string | undefined;

            const uploadEncrypted = lc.store?.LearnCloud?.uploadEncrypted;
            const addIndex = lc.index?.LearnCloud?.add;
            if (uploadEncrypted && addIndex) {
                setStep('storing');
                storedUri = await uploadEncrypted(signed);
                storedCategory = sampleFixture?.profile ?? 'credential';
                const id = (signed.id as string | undefined) ?? storedUri;
                await addIndex({ id, uri: storedUri, category: storedCategory });
            }

            setArtifacts(prev => ({
                ...prev,
                signed,
                storedUri,
                storedCategory,
            }));

            setStep('done');
            setMessage(
                storedUri
                    ? 'Issued to self and stored/indexed successfully.'
                    : 'Issued to self successfully. This wallet has no LearnCloud store/index configured, so nothing was uploaded.'
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setStep('error');
        }
    };

    const handleCopySigned = async () => {
        if (!artifacts.signed) return;
        try {
            setStep('copying');
            await copyText(JSON.stringify(artifacts.signed, null, 2));
            setStep('done');
            setMessage('Copied signed VC JSON.');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setStep('error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <div>
                        <h2 className="text-sm font-bold text-white">Render Method Developer Actions</h2>
                        <p className="text-[11px] text-gray-500 mt-1">
                            Validate roundtrip, copy artifacts, or issue to self.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-sm cursor-pointer"
                    >
                        Close
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="text-xs text-gray-400 leading-relaxed space-y-1">
                        <p>
                            <strong className="text-gray-200">Preview Roundtrip</strong> proves the
                            attach → issue → read → render loop.
                        </p>
                        <p>
                            <strong className="text-gray-200">Copy VC JSON</strong> gives you the
                            unsigned VC with <code className="text-gray-300">renderMethod</code>{' '}
                            attached.
                        </p>
                        <p>
                            <strong className="text-gray-200">Issue to Self</strong> signs the VC and,
                            when available, uploads and indexes it in LearnCloud.
                        </p>
                    </div>

                    {!canRun && (
                        <div className="px-3 py-2 bg-amber-900/30 border border-amber-800/50 text-amber-300 text-xs rounded-lg">
                            {status !== 'connected'
                                ? 'Connect a wallet first.'
                                : !sampleFixture
                                    ? 'Pick a pipeline VC first.'
                                    : 'Provide a template.'}
                        </div>
                    )}

                    {fixtureWarning && (
                        <div className="px-3 py-2 bg-amber-900/20 border border-amber-800/40 text-amber-200 text-xs rounded-lg">
                            {fixtureWarning}
                        </div>
                    )}

                    {isBusy && (
                        <div className="px-3 py-2 bg-blue-900/30 border border-blue-800/50 text-blue-300 text-xs rounded-lg">
                            {step === 'preparing' && 'Preparing unsigned VC + renderMethod…'}
                            {step === 'copying' && 'Copying JSON to clipboard…'}
                            {step === 'issuing' && 'Calling issueCredential…'}
                            {step === 'storing' && 'Uploading to LearnCloud + indexing…'}
                            {step === 'roundtripping' && 'Reading renderMethod back + rendering preview…'}
                        </div>
                    )}

                    {error && (
                        <div className="px-3 py-2 bg-red-900/30 border border-red-800/50 text-red-300 text-xs rounded-lg whitespace-pre-wrap">
                            {error}
                        </div>
                    )}

                    {message && !error && (
                        <div className="px-3 py-2 bg-emerald-900/30 border border-emerald-800/50 text-emerald-300 text-xs rounded-lg whitespace-pre-wrap">
                            {message}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <ActionButton
                            label="Preview Roundtrip"
                            description="Attach → sign → read → render"
                            onClick={handlePreviewRoundtrip}
                            disabled={!canRun || isBusy}
                        />
                        <ActionButton
                            label="Copy VC JSON"
                            description="Unsigned VC with renderMethod"
                            onClick={handleCopyUnsigned}
                            disabled={!canRun || isBusy}
                        />
                        <ActionButton
                            label="Copy renderMethod"
                            description="TemplateRenderMethod object only"
                            onClick={handleCopyRenderMethod}
                            disabled={!canRun || isBusy}
                        />
                        <ActionButton
                            label="Issue to Self"
                            description="Sign, then store/index if available"
                            onClick={handleIssueToSelf}
                            disabled={!canRun || isBusy}
                        />
                    </div>

                    {(artifacts.unsignedWithRender || artifacts.renderMethod || artifacts.signed || artifacts.roundtrip) && (
                        <div className="space-y-4">
                            {artifacts.roundtrip && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <Stat label="renderSuite" value={artifacts.roundtrip.suite} />
                                        <Stat label="mediaType" value={artifacts.roundtrip.mediaType} />
                                        <Stat
                                            label="decoded length"
                                            value={`${artifacts.roundtrip.decodedTemplateLength} chars`}
                                        />
                                        <Stat
                                            label="round-trip match"
                                            value={artifacts.roundtrip.decodedTemplateMatchesInput ? 'yes' : 'no'}
                                            accent={artifacts.roundtrip.decodedTemplateMatchesInput ? 'emerald' : 'red'}
                                        />
                                    </div>
                                    <ArtifactPanel title="Rendered preview">
                                        <div
                                            className="bg-white rounded-lg p-4 flex items-center justify-center"
                                            dangerouslySetInnerHTML={{ __html: artifacts.roundtrip.renderedSvg }}
                                        />
                                    </ArtifactPanel>
                                </div>
                            )}

                            {artifacts.renderMethod && (
                                <ArtifactPanel
                                    title="renderMethod JSON"
                                    actions={
                                        <MiniButton onClick={handleCopyRenderMethod}>Copy</MiniButton>
                                    }
                                >
                                    <JsonPreview value={artifacts.renderMethod} />
                                </ArtifactPanel>
                            )}

                            {artifacts.unsignedWithRender && (
                                <ArtifactPanel
                                    title="Unsigned VC with renderMethod"
                                    actions={
                                        <MiniButton onClick={handleCopyUnsigned}>Copy</MiniButton>
                                    }
                                >
                                    <JsonPreview value={artifacts.unsignedWithRender} />
                                </ArtifactPanel>
                            )}

                            {artifacts.signed && (
                                <ArtifactPanel
                                    title="Signed VC JSON"
                                    actions={<MiniButton onClick={handleCopySigned}>Copy</MiniButton>}
                                >
                                    <JsonPreview value={artifacts.signed} />
                                </ArtifactPanel>
                            )}

                            {(artifacts.storedUri || artifacts.storedCategory) && (
                                <ArtifactPanel title="Issue to Self result">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                        {artifacts.storedUri && (
                                            <Stat label="stored URI" value={artifacts.storedUri} />
                                        )}
                                        {artifacts.storedCategory && (
                                            <Stat label="index category" value={artifacts.storedCategory} />
                                        )}
                                    </div>
                                </ArtifactPanel>
                            )}
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
                </div>
            </div>
        </div>
    );
};

const ActionButton: React.FC<{
    label: string;
    description: string;
    onClick: () => void;
    disabled: boolean;
}> = ({ label, description, onClick, disabled }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="text-left px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">{description}</div>
    </button>
);

const ArtifactPanel: React.FC<{
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}> = ({ title, children, actions }) => (
    <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{title}</div>
            {actions}
        </div>
        <div className="p-4">{children}</div>
    </div>
);

const JsonPreview: React.FC<{ value: unknown }> = ({ value }) => (
    <pre className="text-[11px] leading-relaxed text-gray-200 font-mono whitespace-pre-wrap break-all max-h-64 overflow-auto">
        {JSON.stringify(value, null, 2)}
    </pre>
);

const MiniButton: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="px-2.5 py-1 text-[11px] font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md cursor-pointer transition-colors"
    >
        {children}
    </button>
);

const Stat: React.FC<{ label: string; value: string; accent?: 'emerald' | 'red' }> = ({
    label,
    value,
    accent,
}) => (
    <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 overflow-hidden">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{label}</div>
        <div
            className={`text-xs font-mono mt-1 break-all ${
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
