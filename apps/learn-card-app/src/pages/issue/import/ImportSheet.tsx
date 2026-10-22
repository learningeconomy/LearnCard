import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    sparklesOutline,
    linkOutline,
    documentTextOutline,
    libraryOutline,
    globeOutline,
    cloudUploadOutline,
    clipboardOutline,
    closeOutline,
    arrowForwardOutline,
    alertCircleOutline,
    checkmarkOutline,
    eyeOutline,
} from 'ionicons/icons';

import { getLogger } from 'learn-card-base';

import { detectSource, type ImportSourceKind } from './detectSource';
import { ingestText, ingestFile, ImportError } from './ingest';
import type { IssueImportSource, IssueImportResult } from './issueImport';
import { SpreadsheetReview } from '../spreadsheet/SpreadsheetUpload';
import { SpreadsheetError } from '../spreadsheet/parseSpreadsheet';
import { spreadsheetErrorMessage } from '../spreadsheet/messages';
import { summarizeObv3 } from './importSummary';
import * as m from '../../../paraglide/messages.js';
import './import-sheet.scss';

const log = getLogger('import-sheet');

const KIND_ICON: Record<ImportSourceKind, string> = {
    spreadsheet: cloudUploadOutline,
    empty: sparklesOutline,
    json: documentTextOutline,
    ctid: libraryOutline,
    credentialEngineUrl: libraryOutline,
    caseFramework: globeOutline,
    url: linkOutline,
    unknown: sparklesOutline,
};

const sourceLabel = (kind: ImportSourceKind): string => {
    switch (kind) {
        case 'spreadsheet':
            return m['issueFlow.sheet.spreadsheet']();
        case 'json':
            return m['issueFlow.importOptions.detectedJson']();
        case 'ctid':
        case 'credentialEngineUrl':
            return m['issueFlow.importOptions.detectedRegistry']();
        case 'caseFramework':
            return m['issueFlow.importOptions.detectedFramework']();
        case 'url':
            return m['issueFlow.importOptions.detectedLink']();
        default:
            return '';
    }
};

/** Decorative file stack: recognizable spreadsheets and credential data without a bitmap asset. */
const FileArtwork: React.FC = () => (
    <svg
        viewBox="0 0 88 80"
        fill="none"
        aria-hidden="true"
        className="h-20 w-22 shrink-0 text-emerald-600"
    >
        <rect
            x="12"
            y="11"
            width="43"
            height="57"
            rx="8"
            transform="rotate(-12 12 11)"
            className="fill-emerald-100 stroke-emerald-200"
            strokeWidth="1.5"
        />
        <path
            d="M32 9h25l15 15v42a7 7 0 0 1-7 7H32a7 7 0 0 1-7-7V16a7 7 0 0 1 7-7Z"
            className="fill-white"
            stroke="currentColor"
            strokeWidth="1.7"
        />
        <path
            d="M56 10v11a4 4 0 0 0 4 4h11M36 35h24M36 44h24M36 53h15M45 35v18"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
        />
        <circle cx="66" cy="61" r="12" className="fill-emerald-600 stroke-white" strokeWidth="3" />
        <path
            d="m61 61 3 3 6-6"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

interface ImportSheetProps {
    onUse: (result: IssueImportResult) => void | Promise<void>;
    handleCloseModal: () => void;
}

export const ImportSheet: React.FC<ImportSheetProps> = ({ onUse, handleCloseModal }) => {
    const id = useId();
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [canPaste, setCanPaste] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [result, setResult] = useState<IssueImportSource | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const inFlight = useRef(false);
    const [activeSource, setActiveSource] = useState<'file' | 'text' | null>(null);

    const detected = useMemo(() => detectSource(text), [text]);
    const canResolve = detected.kind !== 'empty' && detected.kind !== 'unknown';

    const run = useCallback(
        async (fn: () => Promise<IssueImportSource>, source: 'file' | 'text') => {
            if (inFlight.current) return;
            inFlight.current = true;
            setActiveSource(source);
            setBusy(true);
            setError(null);
            setCanPaste(false);
            try {
                setResult(await fn());
            } catch (e) {
                log.warn('import-sheet.resolve_failed', e);
                if (e instanceof SpreadsheetError) {
                    setError(spreadsheetErrorMessage(e));
                } else if (e instanceof ImportError) {
                    setError(e.message);
                    setCanPaste(e.canPasteInstead);
                } else {
                    setError(m['error.generic']());
                }
            } finally {
                inFlight.current = false;
                setBusy(false);
            }
        },
        []
    );

    const handleResolve = useCallback(() => {
        if (!text.trim()) return;
        void run(() => ingestText(text), 'text');
    }, [text, run]);

    const handleFile = useCallback(
        (file: File | undefined) => {
            if (!file) return;
            void run(() => ingestFile(file), 'file');
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

    const renderError = (source: 'file' | 'text'): React.ReactNode =>
        error && activeSource === source ? (
            <div
                id={`${id}-${source}-error`}
                role="alert"
                className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-3 text-start"
            >
                <IonIcon
                    icon={alertCircleOutline}
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
                />
                <div className="space-y-1">
                    <p className="text-sm leading-relaxed text-red-700">{error}</p>
                    {canPaste && (
                        <p className="text-xs text-red-700">{m['issueFlow.pasteInstead']()}</p>
                    )}
                </div>
            </div>
        ) : null;

    const credential = result?.kind === 'credential' ? result.value : null;
    const summary = credential ? summarizeObv3(credential.obv3Json) : null;
    if (result?.kind === 'spreadsheet')
        return (
            <SpreadsheetReview
                source={result.source}
                onImport={async sheet => {
                    await onUse({ kind: 'spreadsheet', sheet });
                }}
                onClose={handleCloseModal}
            />
        );

    return (
        <div
            className="issue-import-dialog flex h-full min-h-0 w-full flex-col overflow-hidden bg-white font-poppins text-grayscale-900 motion-safe:animate-fade-in-up"
            aria-busy={busy}
        >
            <header className="flex shrink-0 items-start gap-3 border-b border-grayscale-200 px-5 py-5 sm:px-7">
                <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold">{m['issueFlow.startFromSomething']()}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-grayscale-600">
                        {m['issueFlow.importIntro']()}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleCloseModal}
                    aria-label={m['common.close']()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[20px] text-grayscale-600 transition-colors hover:bg-grayscale-100 focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                    <IonIcon icon={closeOutline} aria-hidden="true" className="h-5 w-5" />
                </button>
            </header>

            <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
                {!result && (
                    <>
                        <div className="grid items-stretch gap-4 md:grid-cols-[0.85fr_auto_1.15fr] md:gap-5">
                            <section
                                aria-labelledby={`${id}-upload-title`}
                                onDragOver={e => {
                                    e.preventDefault();
                                    if (!busy) setDragging(true);
                                }}
                                onDragLeave={e => {
                                    if (
                                        !(e.relatedTarget instanceof Node) ||
                                        !e.currentTarget.contains(e.relatedTarget)
                                    )
                                        setDragging(false);
                                }}
                                onDrop={onDrop}
                                className={`flex min-w-0 flex-col justify-center gap-4 rounded-[20px] border-2 border-dashed p-4 transition-colors sm:p-5 ${error && activeSource === 'file' ? 'border-red-300 bg-red-50/30' : dragging ? 'border-emerald-500 bg-emerald-100' : 'border-emerald-200 bg-emerald-50/60'}`}
                            >
                                <div className="flex items-center gap-3 md:flex-col md:text-center">
                                    <FileArtwork />
                                    <div className="min-w-0">
                                        <h3
                                            id={`${id}-upload-title`}
                                            className="text-base font-semibold"
                                        >
                                            {m['issueFlow.importOptions.uploadTitle']()}
                                        </h3>
                                        <p className="mt-1 text-sm leading-relaxed text-grayscale-600">
                                            {m['issueFlow.importOptions.uploadHint']()}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3 text-center">
                                    <p className="text-xs leading-relaxed text-grayscale-700">
                                        {m['issueFlow.importOptions.dropHint']()}
                                    </p>
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => fileRef.current?.click()}
                                        className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {busy && activeSource === 'file' ? (
                                            <span
                                                aria-hidden="true"
                                                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                                            />
                                        ) : (
                                            <IonIcon
                                                icon={cloudUploadOutline}
                                                aria-hidden="true"
                                                className="h-5 w-5"
                                            />
                                        )}
                                        {busy && activeSource === 'file'
                                            ? m['issueFlow.importOptions.readingFile']()
                                            : m['issueFlow.uploadFile']()}
                                    </button>
                                    <p className="text-xs font-medium tracking-wide text-grayscale-600">
                                        {m['issueFlow.importSupports']()}
                                    </p>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="application/json,.json,.csv,.tsv,.xlsx"
                                        data-testid="issue-import-file"
                                        aria-label={m['issueFlow.uploadFile']()}
                                        disabled={busy}
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            e.target.value = '';
                                            handleFile(file);
                                        }}
                                    />
                                </div>
                                {renderError('file')}
                            </section>

                            <div
                                className="flex items-center gap-3 text-xs font-medium text-grayscale-500 md:flex-col md:justify-center"
                                aria-hidden="true"
                            >
                                <span className="h-px flex-1 bg-grayscale-200 md:h-auto md:w-px" />
                                <span>{m['issueFlow.importOptions.or']()}</span>
                                <span className="h-px flex-1 bg-grayscale-200 md:h-auto md:w-px" />
                            </div>

                            <section
                                aria-labelledby={`${id}-paste-title`}
                                className="min-w-0 space-y-4 rounded-[20px] border border-grayscale-200 bg-white p-4 sm:p-5"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-grayscale-100 text-grayscale-700">
                                        <IonIcon
                                            icon={clipboardOutline}
                                            aria-hidden="true"
                                            className="h-6 w-6"
                                        />
                                    </span>
                                    <div className="min-w-0">
                                        <h3
                                            id={`${id}-paste-title`}
                                            className="text-base font-semibold"
                                        >
                                            {m['issueFlow.importOptions.pasteTitle']()}
                                        </h3>
                                        <p className="mt-1 text-xs leading-relaxed text-grayscale-600">
                                            {m['issueFlow.importOptions.pasteHint']()}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label
                                        htmlFor={`${id}-content`}
                                        className="mb-1.5 block text-xs font-medium text-grayscale-700"
                                    >
                                        {m['issueFlow.importOptions.contentLabel']()}
                                    </label>
                                    <textarea
                                        id={`${id}-content`}
                                        value={text}
                                        disabled={busy}
                                        onChange={e => {
                                            setText(e.target.value);
                                            setError(null);
                                        }}
                                        placeholder={m['issueFlow.importPlaceholder']()}
                                        rows={5}
                                        aria-invalid={Boolean(error && activeSource === 'text')}
                                        aria-describedby={`${id}-paste-help${error && activeSource === 'text' ? ` ${id}-text-error` : ''}`}
                                        className={`block w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm leading-relaxed text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 disabled:opacity-60 ${error && activeSource === 'text' ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-grayscale-300 focus:border-transparent focus:ring-emerald-500'}`}
                                    />
                                    <p
                                        id={`${id}-paste-help`}
                                        className="mt-2 text-xs leading-relaxed text-grayscale-600"
                                    >
                                        {m['issueFlow.importOptions.pasteHelp']()}
                                    </p>
                                </div>
                                {renderError('text')}
                                <div aria-live="polite" className="text-xs">
                                    {canResolve ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                                            <IonIcon
                                                icon={KIND_ICON[detected.kind]}
                                                aria-hidden="true"
                                                className="h-4 w-4"
                                            />
                                            {sourceLabel(detected.kind)}
                                        </span>
                                    ) : text.trim() ? (
                                        <p className="text-grayscale-600">
                                            {m['issueFlow.importOptions.unrecognized']()}
                                        </p>
                                    ) : null}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleResolve}
                                    disabled={!canResolve || busy}
                                    className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {busy && activeSource === 'text' ? (
                                        <>
                                            <span
                                                aria-hidden="true"
                                                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                                            />
                                            {m['issueFlow.bringingIn']()}
                                        </>
                                    ) : (
                                        <>
                                            {m['issueFlow.bringItIn']()}
                                            <IonIcon
                                                icon={arrowForwardOutline}
                                                aria-hidden="true"
                                                className="h-4 w-4 rtl:rotate-180"
                                            />
                                        </>
                                    )}
                                </button>
                                <details className="text-xs text-grayscale-600">
                                    <summary className="cursor-pointer py-1 font-medium text-grayscale-700 focus-visible:outline-emerald-500">
                                        {m['issueFlow.importOptions.examplesTitle']()}
                                    </summary>
                                    <dl className="mt-3 space-y-3 leading-relaxed">
                                        <div>
                                            <dt className="font-medium text-grayscale-900">
                                                {m['issueFlow.importOptions.exampleLinkTitle']()}
                                            </dt>
                                            <dd>
                                                {m['issueFlow.importOptions.exampleLinkBody']()}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-medium text-grayscale-900">
                                                {m['issueFlow.importOptions.exampleRowsTitle']()}
                                            </dt>
                                            <dd>
                                                {m['issueFlow.importOptions.exampleRowsBody']()}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-medium text-grayscale-900">
                                                {m['issueFlow.importOptions.exampleJsonTitle']()}
                                            </dt>
                                            <dd>
                                                {m['issueFlow.importOptions.exampleJsonBody']()}
                                            </dd>
                                        </div>
                                    </dl>
                                    <p className="mt-3 leading-relaxed">
                                        {m['issueFlow.importOptions.exampleRegistry']()}
                                    </p>
                                </details>
                            </section>
                        </div>
                        <p className="mt-5 flex items-start justify-center gap-2 text-xs leading-relaxed text-grayscale-600">
                            <IonIcon
                                icon={eyeOutline}
                                aria-hidden="true"
                                className="h-4 w-4 shrink-0"
                            />
                            {m['issueFlow.importOptions.reviewNote']()}
                        </p>
                    </>
                )}

                {result?.kind === 'credential' && credential && summary && (
                    <div className="space-y-v3-4 animate-fade-in-up">
                        {error && (
                            <p
                                role="alert"
                                className="p-3 bg-red-50 text-sm text-red-700 rounded-2xl"
                            >
                                {error}
                            </p>
                        )}
                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                            <IonIcon
                                icon={checkmarkOutline}
                                aria-hidden="true"
                                className="w-4 h-4"
                            />
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
                                    <IonIcon
                                        icon={sparklesOutline}
                                        aria-hidden="true"
                                        className="w-6 h-6 text-grayscale-400"
                                    />
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

                        {credential.provenance.source === 'credential-engine' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-medium text-emerald-700">
                                <IonIcon
                                    icon={libraryOutline}
                                    aria-hidden="true"
                                    className="w-3.5 h-3.5"
                                />
                                {m['issueFlow.fromCredEngine']()}
                            </span>
                        )}

                        {credential.warnings.length > 0 && (
                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl space-y-v3-1">
                                {credential.warnings.map(w => (
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
                                disabled={busy}
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
                                disabled={busy}
                                onClick={async () => {
                                    setBusy(true);
                                    try {
                                        await onUse(result);
                                        handleCloseModal();
                                    } catch {
                                        setError(m['error.generic']());
                                    } finally {
                                        setBusy(false);
                                    }
                                }}
                                className="flex-1 py-3 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors"
                            >
                                {busy ? m['common.loading']() : m['issueFlow.useThis']()}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
