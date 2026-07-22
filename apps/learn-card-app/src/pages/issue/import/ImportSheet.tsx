import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    Sparkles,
    Link2,
    FileJson,
    Database,
    Globe,
    Upload,
    X,
    ArrowRight,
    Loader2,
    AlertCircle,
    Check,
} from 'lucide-react';

import { getLogger } from 'learn-card-base';

import { detectSource, type ImportSourceKind } from './detectSource';
import { ingestText, ingestFile, ImportError } from './ingest';
import type { NormalizedImport } from './normalizeToObv3';
import { summarizeObv3 } from './importSummary';
import * as m from '../../../paraglide/messages.js';

const log = getLogger('import-sheet');

const KIND_ICON: Record<ImportSourceKind, React.FC<{ className?: string }>> = {
    empty: Sparkles,
    json: FileJson,
    ctid: Database,
    credentialEngineUrl: Database,
    caseFramework: Globe,
    url: Link2,
    unknown: Sparkles,
};

interface ImportSheetProps {
    onUse: (result: NormalizedImport) => void;
    handleCloseModal: () => void;
}

export const ImportSheet: React.FC<ImportSheetProps> = ({ onUse, handleCloseModal }) => {
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [canPaste, setCanPaste] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [result, setResult] = useState<NormalizedImport | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const detected = useMemo(() => detectSource(text), [text]);
    const Icon = KIND_ICON[detected.kind];
    const canResolve = detected.kind !== 'empty' && detected.kind !== 'unknown';

    const run = useCallback(async (fn: () => Promise<NormalizedImport>) => {
        setBusy(true);
        setError(null);
        setCanPaste(false);
        try {
            setResult(await fn());
        } catch (e) {
            log.warn('import-sheet.resolve_failed', e);
            if (e instanceof ImportError) {
                setError(e.message);
                setCanPaste(e.canPasteInstead);
            } else if (e instanceof Error && e.message) {
                setError(e.message);
            } else {
                setError(m['error.generic']());
            }
        } finally {
            setBusy(false);
        }
    }, []);

    const handleResolve = useCallback(() => {
        if (!text.trim()) return;
        run(() => ingestText(text));
    }, [text, run]);

    const handleFile = useCallback(
        (file: File | undefined) => {
            if (!file) return;
            run(() => ingestFile(file));
        },
        [run]
    );

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
        },
        [handleFile]
    );

    const summary = result ? summarizeObv3(result.obv3Json) : null;

    return (
        <div className="font-poppins w-full max-w-[520px] mx-auto bg-white rounded-[20px] flex flex-col max-h-[85vh] overflow-hidden animate-fade-in-up">
            <div className="px-6 pt-6 pb-4 border-b border-grayscale-100">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-semibold text-grayscale-900">
                        {m['issueFlow.startFromSomething']()}
                    </h2>
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-grayscale-400 hover:text-grayscale-900 hover:bg-grayscale-100 transition-colors"
                        aria-label={m['common.close']()}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {m['issueFlow.importIntro']()}
                </p>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-4">
                {!result && (
                    <>
                        <div
                            onDragOver={e => {
                                e.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={onDrop}
                            className={`relative rounded-2xl border transition-colors ${
                                dragging
                                    ? 'border-emerald-400 bg-emerald-50'
                                    : 'border-grayscale-300 bg-white'
                            }`}
                        >
                            <textarea
                                value={text}
                                onChange={e => {
                                    setText(e.target.value);
                                    setError(null);
                                }}
                                placeholder={m['issueFlow.importPlaceholder']()}
                                rows={4}
                                className="w-full py-3 px-4 bg-transparent rounded-2xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none resize-none"
                            />
                            <div className="flex items-center justify-between px-4 pb-3">
                                {detected.kind !== 'empty' && detected.kind !== 'unknown' ? (
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                                        <Icon className="w-3.5 h-3.5" />
                                        {detected.label}
                                    </span>
                                ) : (
                                    <span className="text-xs text-grayscale-400">
                                        {m['issueFlow.importSupports']()}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="flex items-center gap-1.5 text-xs font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    {m['issueFlow.uploadFile']()}
                                </button>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="application/json,.json"
                                    className="hidden"
                                    onChange={e => handleFile(e.target.files?.[0])}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <span className="block text-sm text-red-700 leading-relaxed">
                                        {error}
                                    </span>
                                    {canPaste && (
                                        <span className="block text-xs text-red-500">
                                            {m['issueFlow.pasteInstead']()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleResolve}
                            disabled={!canResolve || busy}
                            className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {busy ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {m['issueFlow.bringingIn']()}
                                </>
                            ) : (
                                <>
                                    {m['issueFlow.bringItIn']()}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </>
                )}

                {result && summary && (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                            <Check className="w-4 h-4" />
                            {m['issueFlow.foundIt']()}
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-2xl border border-grayscale-200 bg-grayscale-10">
                            {summary.image ? (
                                <img
                                    src={summary.image}
                                    alt=""
                                    className="w-14 h-14 rounded-xl object-cover bg-white shrink-0"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-xl bg-grayscale-100 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-6 h-6 text-grayscale-400" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-semibold text-grayscale-900 truncate">
                                    {summary.name}
                                </h3>
                                {summary.typeLabel && (
                                    <span className="inline-block mt-0.5 text-xs text-grayscale-500">
                                        {summary.typeLabel}
                                    </span>
                                )}
                                {summary.description && (
                                    <p className="mt-1 text-xs text-grayscale-600 leading-relaxed line-clamp-3">
                                        {summary.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {result.provenance.source === 'credential-engine' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-medium text-emerald-700">
                                <Database className="w-3.5 h-3.5" />
                                {m['issueFlow.fromCredEngine']()}
                            </span>
                        )}

                        {result.warnings.length > 0 && (
                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl space-y-1">
                                {result.warnings.map(w => (
                                    <span
                                        key={w}
                                        className="block text-xs text-amber-700 leading-relaxed"
                                    >
                                        {w}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setResult(null);
                                    setError(null);
                                }}
                                className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                            >
                                {m['common.back']()}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onUse(result);
                                    handleCloseModal();
                                }}
                                className="flex-1 py-3 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors"
                            >
                                {m['issueFlow.useThis']()}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
