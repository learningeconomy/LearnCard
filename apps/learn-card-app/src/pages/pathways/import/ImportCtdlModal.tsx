/**
 * ImportCtdlModal — the Build-mode entry point for loading a pathway
 * from the Credential Engine Registry.
 *
 * Three-phase UX:
 *
 *   1. **Input** — learner pastes a CTID (`ce-...`) or a full registry
 *      URL. A sample is provided for discoverability.
 *   2. **Preview** — we fetch the graph, run the pure importer, and
 *      show what *will* be created: title, node count, destination,
 *      and the `warnings[]` so the learner understands exactly what
 *      was simplified.
 *   3. **Confirm** — commits to `pathwayStore`, sets it active, and
 *      routes the user into Build with their new pathway selected.
 *
 * The fetch is done through `makeCorsProxiedFetch` so this works on
 * both native Capacitor and web (the latter tunneling through
 * `corsproxy.io` using the tenant's `CORS_PROXY_API_KEY`).
 */

import React, { useMemo, useState } from 'react';

import { IonIcon } from '@ionic/react';
import { motion } from 'framer-motion';
import {
    alertCircleOutline,
    checkmarkCircleOutline,
    closeOutline,
    cloudDownloadOutline,
    informationCircleOutline,
    warningOutline,
} from 'ionicons/icons';

import type { Pathway } from '../types';

import {
    CtdlFetchError,
    fetchCtdlPathway,
} from './fetchCtdlPathway';
import { fromCtdlPathway } from './fromCtdlPathway';
import { makeCorsProxiedFetch } from './makeCorsProxiedFetch';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportCtdlModalProps {
    ownerDid: string;
    onImport: (pathway: Pathway) => void;
    onClose: () => void;
}

type PreviewState =
    | { status: 'idle' }
    | { status: 'fetching' }
    | { status: 'error'; message: string }
    | {
          status: 'ready';
          pathway: Pathway;
          warnings: string[];
      };

// Well-known CTIDs surfaced as one-tap examples. Extendable.
const EXAMPLE_CTIDS: ReadonlyArray<{ label: string; ctid: string; note: string }> = [
    {
        label: 'IMA · AI in Finance Micro-credential',
        ctid: 'ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf',
        note: 'Fan-in: four badges earn a certificate.',
    },
];

// ---------------------------------------------------------------------------
// Overlay frame (kept local — mirrors NodeDetail's aesthetic)
// ---------------------------------------------------------------------------

const OverlayFrame: React.FC<{
    children: React.ReactNode;
    onClose: () => void;
}> = ({ children, onClose }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-40 bg-grayscale-900/50 backdrop-blur-md
                   flex items-start sm:items-center justify-center
                   p-0 sm:p-6 overflow-y-auto font-poppins"
        onClick={onClose}
    >
        <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26, mass: 0.9 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-xl min-h-screen sm:min-h-0
                       bg-white/95 backdrop-blur-xl
                       sm:rounded-[28px] shadow-2xl shadow-grayscale-900/20
                       border border-white/60"
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 w-10 h-10 rounded-full
                           bg-white/80 hover:bg-white hover:shadow-md
                           border border-grayscale-200
                           flex items-center justify-center
                           transition-all duration-200 z-10"
            >
                <IonIcon icon={closeOutline} className="text-grayscale-700 text-xl" />
            </button>

            {children}
        </motion.div>
    </motion.div>
);

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

const ImportCtdlModal: React.FC<ImportCtdlModalProps> = ({
    ownerDid,
    onImport,
    onClose,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [preview, setPreview] = useState<PreviewState>({ status: 'idle' });

    // Build the CORS-aware fetch impl once per modal instance.
    const proxiedFetch = useMemo(() => makeCorsProxiedFetch(), []);

    const trimmed = inputValue.trim();
    const canFetch = trimmed.length > 0 && preview.status !== 'fetching';

    const handleFetch = async () => {
        if (!trimmed) return;

        setPreview({ status: 'fetching' });

        try {
            const graph = await fetchCtdlPathway({
                ctidOrUrl: trimmed,
                fetchImpl: proxiedFetch,
            });

            const { pathway, warnings } = fromCtdlPathway({
                graph,
                ownerDid,
                now: new Date().toISOString(),
            });

            setPreview({ status: 'ready', pathway, warnings });
        } catch (err) {
            const message =
                err instanceof CtdlFetchError
                    ? friendlyFetchMessage(err, trimmed)
                    : err instanceof Error
                        ? err.message
                        : 'Something went wrong while importing. Please try again.';

            setPreview({ status: 'error', message });
        }
    };

    const handleConfirm = () => {
        if (preview.status !== 'ready') return;

        onImport(preview.pathway);
    };

    const useExample = (ctid: string) => {
        setInputValue(ctid);
        setPreview({ status: 'idle' });
    };

    return (
        <OverlayFrame onClose={onClose}>
            <div className="p-6 sm:p-8 space-y-5">
                {/* Header */}
                <header className="space-y-1 pr-10">
                    <div className="flex items-center gap-2 text-grayscale-500 text-xs uppercase tracking-wide font-medium">
                        <IonIcon icon={cloudDownloadOutline} className="text-base" />
                        Build · Import
                    </div>

                    <h2 className="text-xl font-semibold text-grayscale-900">
                        Import from Credential Engine
                    </h2>

                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        Load any published pathway from the{' '}
                        <span className="font-medium">Credential Engine Registry</span>.
                        We'll turn it into a walkable version you can refine. Nothing
                        becomes public unless you publish it back.
                    </p>
                </header>

                {/* Input */}
                <div className="space-y-2">
                    <label
                        htmlFor="ctdl-import-input"
                        className="text-xs font-medium text-grayscale-700"
                    >
                        CTID or registry URL
                    </label>

                    <div className="flex gap-2">
                        <input
                            id="ctdl-import-input"
                            type="text"
                            value={inputValue}
                            onChange={e => {
                                setInputValue(e.target.value);
                                if (preview.status === 'error') {
                                    setPreview({ status: 'idle' });
                                }
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && canFetch) handleFetch();
                            }}
                            placeholder="ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf"
                            disabled={preview.status === 'fetching'}
                            className="flex-1 min-w-0 py-3 px-4 border border-grayscale-300 rounded-xl text-sm
                                       text-grayscale-900 placeholder:text-grayscale-400 bg-white
                                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                                       disabled:bg-grayscale-100 disabled:text-grayscale-500"
                        />

                        <button
                            type="button"
                            onClick={handleFetch}
                            disabled={!canFetch}
                            className="shrink-0 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white
                                       font-medium text-sm hover:opacity-90 transition-opacity
                                       disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {preview.status === 'fetching' ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Loading…
                                </span>
                            ) : (
                                'Preview'
                            )}
                        </button>
                    </div>

                    {/* Examples */}
                    {preview.status === 'idle' && (
                        <div className="mt-2 space-y-1.5">
                            <div className="text-xs text-grayscale-500">Try an example:</div>

                            {EXAMPLE_CTIDS.map(ex => (
                                <button
                                    key={ex.ctid}
                                    type="button"
                                    onClick={() => useExample(ex.ctid)}
                                    className="w-full text-left p-3 rounded-xl border border-grayscale-200
                                               bg-grayscale-10 hover:bg-white hover:border-grayscale-300
                                               transition-colors"
                                >
                                    <div className="text-sm font-medium text-grayscale-900">
                                        {ex.label}
                                    </div>

                                    <div className="text-xs text-grayscale-500 mt-0.5">
                                        {ex.note}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Error */}
                {preview.status === 'error' && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                        <IonIcon
                            icon={alertCircleOutline}
                            className="text-red-400 text-lg mt-0.5 shrink-0"
                        />

                        <div className="min-w-0">
                            <div className="text-sm text-red-700 leading-relaxed">
                                {preview.message}
                            </div>

                            <button
                                type="button"
                                onClick={() => setPreview({ status: 'idle' })}
                                className="mt-2 text-xs text-red-700 hover:text-red-900 font-medium underline"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                )}

                {/* Preview */}
                {preview.status === 'ready' && (
                    <PreviewCard pathway={preview.pathway} warnings={preview.warnings} />
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-[20px] border border-grayscale-300
                                   text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                    >
                        Cancel
                    </button>

                    {preview.status === 'ready' && (
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="flex-1 py-3 px-4 rounded-[20px] bg-emerald-600 text-white
                                       font-medium text-sm hover:bg-emerald-700 transition-colors"
                        >
                            Add to my pathways
                        </button>
                    )}
                </div>
            </div>
        </OverlayFrame>
    );
};

// ---------------------------------------------------------------------------
// Preview sub-component
// ---------------------------------------------------------------------------

const PreviewCard: React.FC<{ pathway: Pathway; warnings: string[] }> = ({
    pathway,
    warnings,
}) => {
    const nodeCount = pathway.nodes.length;
    const destinationNode = pathway.nodes.find(
        n => n.id === pathway.destinationNodeId,
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50 space-y-3"
        >
            <div className="flex items-start gap-2.5">
                <IonIcon
                    icon={checkmarkCircleOutline}
                    className="text-emerald-500 text-lg mt-0.5 shrink-0"
                />

                <div className="min-w-0">
                    <div className="text-sm font-semibold text-grayscale-900">
                        {pathway.title}
                    </div>

                    <div className="text-xs text-grayscale-600 mt-0.5">
                        {nodeCount} {nodeCount === 1 ? 'step' : 'steps'}
                        {destinationNode ? ` · ends with ${destinationNode.title}` : ''}
                    </div>
                </div>
            </div>

            {/* Node summary — first 5 titles, then an ellipsis. */}
            <ul className="space-y-1 pl-6">
                {pathway.nodes.slice(0, 5).map(n => (
                    <li
                        key={n.id}
                        className="text-xs text-grayscale-700 flex items-center gap-1.5"
                    >
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${
                                n.id === pathway.destinationNodeId
                                    ? 'bg-emerald-600'
                                    : 'bg-grayscale-400'
                            }`}
                            aria-hidden
                        />

                        <span className="truncate">{n.title}</span>
                    </li>
                ))}

                {pathway.nodes.length > 5 && (
                    <li className="text-xs text-grayscale-500 pl-3">
                        + {pathway.nodes.length - 5} more
                    </li>
                )}
            </ul>

            {/* Warnings — these aren't errors; they're honest notes about
                what was simplified. */}
            {warnings.length > 0 && (
                <details className="pt-1">
                    <summary className="text-xs font-medium text-amber-700 cursor-pointer flex items-center gap-1.5">
                        <IonIcon icon={warningOutline} className="text-base" />
                        {warnings.length} note{warnings.length === 1 ? '' : 's'} about this import
                    </summary>

                    <ul className="mt-2 space-y-1.5 pl-5 border-l-2 border-amber-200">
                        {warnings.map((w, i) => (
                            <li key={i} className="text-xs text-amber-700 leading-relaxed">
                                {w}
                            </li>
                        ))}
                    </ul>
                </details>
            )}

            <div className="pt-2 border-t border-emerald-100 flex items-start gap-1.5">
                <IonIcon
                    icon={informationCircleOutline}
                    className="text-grayscale-500 text-sm mt-0.5 shrink-0"
                />

                <div className="text-xs text-grayscale-600 leading-relaxed">
                    Defaults are a starting shape — tweak policies and termination in
                    Build to fit how <em>you</em> want to walk this.
                </div>
            </div>
        </motion.div>
    );
};

// ---------------------------------------------------------------------------
// Friendlier fetch errors
// ---------------------------------------------------------------------------

const friendlyFetchMessage = (err: CtdlFetchError, input: string): string => {
    const msg = err.message;

    // Malformed input — the error message is already actionable.
    if (/is neither a CTID nor an http/.test(msg)) {
        return `"${input}" doesn't look like a CTID or URL. CTIDs start with "ce-" and URLs start with "https://".`;
    }

    if (/HTTP 404/.test(msg)) {
        return 'That pathway wasn\'t found in the Credential Engine Registry. Double-check the CTID.';
    }

    if (/HTTP 4/.test(msg) || /HTTP 5/.test(msg)) {
        return 'The Credential Engine Registry had trouble responding. Give it a moment and try again.';
    }

    if (/Network error/.test(msg)) {
        return "We couldn't reach the Credential Engine Registry. Check your connection and try again.";
    }

    if (/invalid JSON/.test(msg)) {
        return 'The registry returned something unexpected. The pathway may be malformed.';
    }

    return 'Something went wrong while importing. Please try again.';
};

export default ImportCtdlModal;
