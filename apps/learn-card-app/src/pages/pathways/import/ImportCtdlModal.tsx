/**
 * ImportCtdlModal — the Build-mode entry point for loading a pathway
 * from the Credential Engine Registry.
 *
 * UX shape:
 *
 *   1. **Browse** (default) — a search-driven grid over the curated
 *      catalog (`catalog/catalog.ts`). The learner can type a query,
 *      pick topic chips, and click any card to preview. A disclosure
 *      at the bottom reveals the legacy "paste a CTID / URL" input
 *      for power users who already know what they want.
 *   2. **Fetching** — skeleton/spinner over the chosen entry's card
 *      metadata while `fetchCtdlPathway` resolves the CTDL graph.
 *   3. **Preview** — we run the pure importer and show what *will* be
 *      created: title, node count, destination, `warnings[]`, plus
 *      the catalog entry's hero image / issuer if we came through
 *      browse. Clicking "Add to my pathways" commits.
 *   4. **Error** — friendly retry with a "← Back to browse" escape.
 *
 * Architecture note: the browse view reads from a `PathwaySearchSource`
 * (currently `createStaticCatalogSource` wrapping a hand-curated JSON
 * catalog). When a backend proxy for CE's Graph Search API lands we
 * swap in a live source behind the same interface — the modal itself
 * doesn't need to change.
 *
 * The network fetch goes through `makeCorsProxiedFetch` so both native
 * Capacitor and web paths resolve (the latter tunneling through
 * `corsproxy.io` using the tenant's `CORS_PROXY_API_KEY`).
 */

import React, { useEffect, useMemo, useState } from 'react';

import { IonIcon } from '@ionic/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    alertCircleOutline,
    arrowBackOutline,
    checkmarkCircleOutline,
    chevronDownOutline,
    closeOutline,
    cloudDownloadOutline,
    informationCircleOutline,
    layersOutline,
    libraryOutline,
    searchOutline,
    warningOutline,
} from 'ionicons/icons';

import { AnalyticsEvents, useAnalytics } from '../../../analytics';
import type { Pathway } from '../types';

import { CATALOG } from './catalog/catalog';
import { searchCatalog } from './catalog/searchCatalog';
import { createStaticCatalogSource } from './catalog/staticCatalogSource';
import type { CatalogEntry } from './catalog/types';
import {
    CtdlFetchError,
    fetchCtdlPathway,
} from './fetchCtdlPathway';
import { fromCtdlPathway } from './fromCtdlPathway';
import { makeCorsProxiedFetch } from './makeCorsProxiedFetch';
import { SHOWCASES } from './showcase';
import type { ShowcaseDefinition, ShowcasePreview } from './showcase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportCtdlModalProps {
    ownerDid: string;

    /**
     * Commit an imported pathway. `supporting` carries extra
     * pathways that must be persisted *before* the primary pathway
     * activates — used by the showcase bundle so composite refs
     * resolve on first render. Defaults to an empty array for
     * catalog / direct imports (single pathway, no sub-pathways).
     */
    onImport: (pathway: Pathway, supporting?: Pathway[]) => void;
    onClose: () => void;
}

/**
 * Finite-state view for the modal. The `origin` on non-browse views
 * tracks whether we got here from a catalog card (so the preview can
 * show the card's metadata) or a direct paste (so we fall back to
 * the pathway's own title). It's also what gets reported to analytics
 * at import time — see `PATHWAYS_CTDL_IMPORTED`.
 */
type View =
    | { kind: 'browse' }
    | {
        kind: 'fetching';
        origin: 'catalog' | 'direct';
        entry?: CatalogEntry;
    }
    | {
        kind: 'preview';
        origin: 'catalog' | 'direct';
        pathway: Pathway;
        warnings: string[];
        entry?: CatalogEntry;
    }
    | {
        kind: 'error';
        origin: 'catalog' | 'direct';
        message: string;
        entry?: CatalogEntry;
        directInput?: string;
    };

// Build the search source once at module scope — the catalog is a
// static import, so there's no reason to instantiate per modal. A
// future live source will be constructed the same way (with its own
// HTTP client) and also keyed here.
const CATALOG_SOURCE = createStaticCatalogSource(CATALOG);

// ---------------------------------------------------------------------------
// Overlay frame (kept local — mirrors NodeDetail's aesthetic)
// ---------------------------------------------------------------------------

const OverlayFrame: React.FC<{
    children: React.ReactNode;
    onClose: () => void;
}> = ({ children, onClose }) => (
    // Backdrop — a separate, full-viewport scroll container. The inner
    // flex wrapper uses `min-h-full` so short modals still center
    // vertically while tall modals (like the catalog list, which can
    // exceed viewport height on desktop) grow the flex item past the
    // viewport — and because the SCROLL lives on this outer div, the
    // top of the modal stays reachable. Previously the wrapper itself
    // was both the flex container AND the scroll container, so
    // `items-center` pushed the top of a tall modal off-screen where
    // overflow scroll couldn't reach it. Classic Tailwind modal bug.
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-40 bg-grayscale-900/50 backdrop-blur-md
                   overflow-y-auto font-poppins"
        onClick={onClose}
    >
        <div
            className="flex min-h-full items-start sm:items-center justify-center
                       p-0 sm:p-6"
        >
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 220, damping: 26, mass: 0.9 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-xl
                           bg-white/95 backdrop-blur-xl
                           sm:rounded-[28px] shadow-2xl shadow-grayscale-900/20
                           border border-white/60"
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="sticky top-3 float-right mr-3 w-10 h-10 rounded-full
                               bg-white/80 hover:bg-white hover:shadow-md
                               border border-grayscale-200
                               flex items-center justify-center
                               transition-all duration-200 z-10"
                >
                    <IonIcon icon={closeOutline} className="text-grayscale-700 text-xl" />
                </button>

                {children}
            </motion.div>
        </div>
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
    // Destructure the stable `track` callback rather than depending
    // on the whole `useAnalytics()` return value. The hook returns a
    // fresh object literal every render (each inner callback is
    // wrapped in `useCallback`, but the *wrapper object* is not
    // memoized), so passing it to a `useEffect` dep array would
    // re-run the effect every render → re-fetch the catalog →
    // setState → re-render → re-run → PostHog rate-limit hell.
    const { track } = useAnalytics();

    // Build the CORS-aware fetch impl once per modal instance. This is
    // the only network channel the modal uses — whether the user came
    // through a catalog card or pasted a CTID directly, the downstream
    // `fetchCtdlPathway` is the same.
    const proxiedFetch = useMemo(() => makeCorsProxiedFetch(), []);

    // ---- View state (finite state machine across the flow) ------------
    const [view, setView] = useState<View>({ kind: 'browse' });

    // ---- Browse-mode inputs --------------------------------------------
    const [query, setQuery] = useState('');
    const [activeTags, setActiveTags] = useState<string[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [directInput, setDirectInput] = useState('');

    // The full catalog + tag universe — loaded once. We use the async
    // source API even though the static impl is synchronous under the
    // hood, so swapping to a networked source later doesn't need
    // component changes.
    const [allEntries, setAllEntries] = useState<CatalogEntry[]>([]);
    const [allTags, setAllTags] = useState<string[]>([]);

    useEffect(() => {
        let cancelled = false;

        Promise.all([CATALOG_SOURCE.search(''), CATALOG_SOURCE.allTags()])
            .then(([entries, tags]) => {
                if (cancelled) return;

                setAllEntries(entries);
                setAllTags(tags);

                track(AnalyticsEvents.PATHWAYS_CATALOG_BROWSED, {
                    entryCount: entries.length,
                });
            });

        return () => { cancelled = true; };
    }, [track]);

    // Live-filtered catalog. `searchCatalog` is pure + cheap (O(N) over
    // a small N) so we don't bother debouncing the render path — the
    // keystroke feels snappier without it. Analytics IS debounced so
    // we don't flood on every keystroke.
    const filtered = useMemo(
        () => searchCatalog(allEntries, { query, filters: { tags: activeTags } }),
        [allEntries, query, activeTags],
    );

    useEffect(() => {
        // Only emit a search event if the user has *done* something —
        // the initial empty-state browse is already tracked by
        // PATHWAYS_CATALOG_BROWSED.
        if (query.length === 0 && activeTags.length === 0) return;

        const timer = setTimeout(() => {
            track(AnalyticsEvents.PATHWAYS_CATALOG_SEARCHED, {
                queryLength: query.length,
                tagCount: activeTags.length,
                resultCount: filtered.length,
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [query, activeTags, filtered.length, track]);

    // ---- Flow actions ---------------------------------------------------

    /**
     * Kick off a fetch + preview. Shared between catalog cards and the
     * direct-paste input — both converge on the same state machine.
     * The `entry` + `origin` are remembered on the view so the preview
     * can render the catalog card's image/issuer when available.
     */
    const beginImport = async (
        ctidOrUrl: string,
        origin: 'catalog' | 'direct',
        entry?: CatalogEntry,
    ) => {
        const trimmed = ctidOrUrl.trim();

        if (!trimmed) return;

        setView({ kind: 'fetching', origin, entry });

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

            setView({ kind: 'preview', origin, pathway, warnings, entry });
        } catch (err) {
            const message =
                err instanceof CtdlFetchError
                    ? friendlyFetchMessage(err, trimmed)
                    : err instanceof Error
                        ? err.message
                        : 'Something went wrong while importing. Please try again.';

            setView({
                kind: 'error',
                origin,
                message,
                entry,
                directInput: origin === 'direct' ? trimmed : undefined,
            });
        }
    };

    const handleConfirm = () => {
        if (view.kind !== 'preview') return;

        // Fire telemetry BEFORE commit so we capture the event even
        // if `onImport` later triggers a navigation that unmounts
        // this component.
        track(AnalyticsEvents.PATHWAYS_CTDL_IMPORTED, {
            ctid: view.pathway.sourceCtid ?? '',
            nodeCount: view.pathway.nodes.length,
            warningCount: view.warnings.length,
            hasDestination: !!view.pathway.destinationNodeId,
            importSource: view.origin,
        });

        onImport(view.pathway);
    };

    /**
     * Showcase import — instantiate the hand-authored multi-pathway
     * bundle for the chosen showcase and commit it in one shot. We
     * skip the fetching / preview states because these bundles are
     * always-local and always valid; sending the author through a
     * two-step preview would add friction for a flow whose whole
     * point is "see everything working end-to-end in one click."
     *
     * The primary pathway is the plan the learner lands on; any
     * supporting pathways are upserted first so composite refs
     * resolve on first render of the Map (see
     * `BuildMode.handleImported`).
     */
    const handleShowcaseImport = (showcase: ShowcaseDefinition) => {
        const { primary, supporting } = showcase.build({
            ownerDid,
            now: new Date().toISOString(),
        });

        track(AnalyticsEvents.PATHWAYS_CTDL_IMPORTED, {
            ctid: `showcase:${showcase.id}`,
            nodeCount: primary.nodes.length,
            warningCount: 0,
            hasDestination: !!primary.destinationNodeId,
            importSource: 'catalog',
        });

        onImport(primary, supporting);
    };

    const backToBrowse = () => setView({ kind: 'browse' });

    const toggleTag = (tag: string) =>
        setActiveTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
        );

    const clearFilters = () => {
        setQuery('');
        setActiveTags([]);
    };

    // ---- Render ---------------------------------------------------------

    return (
        <OverlayFrame onClose={onClose}>
            <AnimatePresence mode="wait">
                {view.kind === 'browse' ? (
                    <motion.div
                        key="browse"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="p-6 sm:p-8 space-y-5"
                    >
                        {/* Header */}
                        <header className="space-y-1 pr-10">
                            <div className="flex items-center gap-2 text-grayscale-500 text-xs uppercase tracking-wide font-medium">
                                <IonIcon icon={cloudDownloadOutline} className="text-base" />
                                Build · Import
                            </div>

                            <h2 className="text-xl font-semibold text-grayscale-900">
                                Browse pathways
                            </h2>

                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                Pick a curated pathway from the{' '}
                                <span className="font-medium">Credential Engine Registry</span>.
                                We'll turn it into a walkable version you can refine. Nothing
                                becomes public unless you publish it back.
                            </p>
                        </header>

                        {/*
                            Showcases — hand-authored demo bundles that
                            sit above the CE catalog. Shown first so
                            reviewers / new users can see every
                            advanced feature (composite sub-pathways,
                            nested drill-in, shared-prereq collections,
                            routes, ETA) without stitching imports
                            together themselves. Visually distinct from
                            the CE cards (emerald gradient, "Demo" tag)
                            so they're not confused with real registry
                            records. Each showcase tells a different
                            narrative — higher-ed, workforce, etc. —
                            so reviewers can pick whichever arc lands
                            best with their audience.
                        */}
                        {SHOWCASES.length > 0 && (
                            <div className="space-y-2.5">
                                {SHOWCASES.map(showcase => (
                                    <ShowcaseCard
                                        key={showcase.id}
                                        preview={showcase.preview}
                                        onImport={() => handleShowcaseImport(showcase)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Search input */}
                        <div className="relative">
                            <IonIcon
                                icon={searchOutline}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grayscale-400 text-lg pointer-events-none"
                            />

                            <input
                                type="search"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search by name, issuer, topic…"
                                className="w-full py-3 pl-11 pr-4 border border-grayscale-300 rounded-xl text-sm
                                           text-grayscale-900 placeholder:text-grayscale-400 bg-white
                                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>

                        {/* Tag chips */}
                        {allTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {allTags.map(tag => {
                                    const active = activeTags.includes(tag);

                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleTag(tag)}
                                            className={`py-1.5 px-3 rounded-full font-medium text-xs transition-colors ${
                                                active
                                                    ? 'bg-grayscale-900 text-white'
                                                    : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                            }`}
                                        >
                                            {tag}
                                        </button>
                                    );
                                })}

                                {(activeTags.length > 0 || query.length > 0) && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="py-1.5 px-3 rounded-full text-xs font-medium
                                                   text-grayscale-500 hover:text-grayscale-900 transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Results grid — or empty state */}
                        {filtered.length > 0 ? (
                            <div className="space-y-2.5">
                                {filtered.map(entry => (
                                    <CatalogCard
                                        key={entry.ctid}
                                        entry={entry}
                                        onClick={() =>
                                            beginImport(entry.ctid, 'catalog', entry)
                                        }
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                hasQuery={query.length > 0 || activeTags.length > 0}
                                onClear={clearFilters}
                            />
                        )}

                        {/* Advanced: direct CTID paste ------------------- */}
                        <div className="pt-2 border-t border-grayscale-200">
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(prev => !prev)}
                                className="w-full flex items-center justify-between gap-2 py-2 text-left
                                           text-xs font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors"
                            >
                                <span>Know a specific CTID? Import it directly</span>

                                <IonIcon
                                    icon={chevronDownOutline}
                                    className={`text-base transition-transform duration-200 ${
                                        showAdvanced ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>

                            {showAdvanced && (
                                <div className="mt-2 space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={directInput}
                                            onChange={e => setDirectInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && directInput.trim()) {
                                                    beginImport(directInput.trim(), 'direct');
                                                }
                                            }}
                                            placeholder="ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf"
                                            className="flex-1 min-w-0 py-2.5 px-3 border border-grayscale-300 rounded-xl text-xs
                                                       text-grayscale-900 placeholder:text-grayscale-400 bg-white
                                                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                directInput.trim()
                                                && beginImport(directInput.trim(), 'direct')
                                            }
                                            disabled={!directInput.trim()}
                                            className="shrink-0 py-2.5 px-4 rounded-[20px] bg-grayscale-900 text-white
                                                       font-medium text-xs hover:opacity-90 transition-opacity
                                                       disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Import
                                        </button>
                                    </div>

                                    <p className="text-xs text-grayscale-500 leading-relaxed">
                                        Paste any <code className="font-mono text-[11px]">ce-...</code> CTID
                                        or a full <code className="font-mono text-[11px]">credentialengineregistry.org</code> URL.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="flow"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="p-6 sm:p-8 space-y-5"
                    >
                        {/* Back-to-browse anchor */}
                        <button
                            type="button"
                            onClick={backToBrowse}
                            className="flex items-center gap-1.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                        >
                            <IonIcon icon={arrowBackOutline} className="text-base" />
                            Back to browse
                        </button>

                        {/* Context card (catalog entry metadata) */}
                        {view.entry && <CatalogEntryContext entry={view.entry} />}

                        {view.kind === 'fetching' && (
                            <div className="flex items-center gap-3 p-4 rounded-2xl
                                            bg-grayscale-10 border border-grayscale-200">
                                <span className="w-5 h-5 border-2 border-grayscale-300 border-t-grayscale-900 rounded-full animate-spin" />

                                <div className="text-sm text-grayscale-700">
                                    Fetching pathway from the registry…
                                </div>
                            </div>
                        )}

                        {view.kind === 'error' && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                                <IonIcon
                                    icon={alertCircleOutline}
                                    className="text-red-400 text-lg mt-0.5 shrink-0"
                                />

                                <div className="min-w-0 flex-1">
                                    <div className="text-sm text-red-700 leading-relaxed">
                                        {view.message}
                                    </div>

                                    <div className="mt-2 flex gap-3 text-xs font-medium">
                                        {/* Retry: catalog cards re-fetch the same CTID;
                                            direct entries re-fetch whatever was pasted. */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (view.origin === 'catalog' && view.entry) {
                                                    beginImport(view.entry.ctid, 'catalog', view.entry);
                                                } else if (view.directInput) {
                                                    beginImport(view.directInput, 'direct');
                                                }
                                            }}
                                            className="text-red-700 hover:text-red-900 underline"
                                        >
                                            Try again
                                        </button>

                                        <button
                                            type="button"
                                            onClick={backToBrowse}
                                            className="text-grayscale-600 hover:text-grayscale-900"
                                        >
                                            Back to browse
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {view.kind === 'preview' && (
                            <PreviewCard
                                pathway={view.pathway}
                                warnings={view.warnings}
                            />
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

                            {view.kind === 'preview' && (
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
                    </motion.div>
                )}
            </AnimatePresence>
        </OverlayFrame>
    );
};

// ---------------------------------------------------------------------------
// ShowcaseCard — hand-authored demo bundle entry, shown at the top of
// the browse view. Purposefully distinct from the CE catalog cards:
// emerald gradient + "Demo" pill + feature tags (rather than CE tags)
// so nobody mistakes it for a real registry record.
// ---------------------------------------------------------------------------

const ShowcaseCard: React.FC<{
    preview: ShowcasePreview;
    onImport: () => void;
}> = ({ preview, onImport }) => (
    <button
        type="button"
        onClick={onImport}
        className="w-full text-left p-4 rounded-2xl
                   bg-gradient-to-br from-emerald-50 via-white to-emerald-50
                   border border-emerald-200 hover:border-emerald-400
                   hover:shadow-md transition-all duration-150
                   flex gap-3 items-start group"
    >
        <div
            aria-hidden
            className="shrink-0 w-14 h-14 rounded-xl
                       bg-gradient-to-br from-emerald-500 to-emerald-700
                       text-white flex items-center justify-center
                       shadow-sm shadow-emerald-700/20
                       group-hover:shadow-md group-hover:shadow-emerald-700/30
                       transition-shadow"
        >
            <IonIcon icon={layersOutline} className="text-2xl" />
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                    Demo · Try everything
                </span>

                {preview.audience && (
                    <span className="text-[10px] font-medium text-emerald-900/70">
                        · {preview.audience}
                    </span>
                )}
            </div>

            <div className="text-sm font-semibold text-grayscale-900 leading-tight">
                {preview.title}
            </div>

            <div className="text-xs text-grayscale-500">
                <span className="inline-flex items-center gap-0.5">
                    <IonIcon icon={layersOutline} className="text-[11px]" />
                    {preview.totalStepCount} steps · {preview.subPathwayCount} sub-pathways
                </span>
            </div>

            <div className="text-xs text-grayscale-600 leading-relaxed">
                {preview.description}
            </div>

            <div className="flex flex-wrap gap-1 pt-0.5">
                {preview.featureTags.map(tag => (
                    <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800
                                   text-[10px] font-medium"
                    >
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    </button>
);

// ---------------------------------------------------------------------------
// CatalogCard — one row in the browse grid
// ---------------------------------------------------------------------------

const CatalogCard: React.FC<{
    entry: CatalogEntry;
    onClick: () => void;
}> = ({ entry, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="w-full text-left p-3 rounded-2xl border border-grayscale-200
                   bg-white hover:border-grayscale-300 hover:shadow-sm
                   transition-all duration-150 flex gap-3 items-start"
    >
        {entry.image ? (
            <img
                src={entry.image}
                alt=""
                className="shrink-0 w-14 h-14 rounded-xl bg-grayscale-10 border border-grayscale-200
                           object-contain p-1"
                loading="lazy"
                onError={e => { e.currentTarget.style.display = 'none'; }}
            />
        ) : (
            <div className="shrink-0 w-14 h-14 rounded-xl bg-grayscale-100
                            flex items-center justify-center">
                <IonIcon icon={libraryOutline} className="text-grayscale-400 text-2xl" />
            </div>
        )}

        <div className="flex-1 min-w-0 space-y-1">
            <div className="text-sm font-semibold text-grayscale-900 leading-tight">
                {entry.name}
            </div>

            <div className="text-xs text-grayscale-500">
                {entry.issuer}
                {entry.componentCount !== undefined && (
                    <>
                        {' · '}
                        <span className="inline-flex items-center gap-0.5">
                            <IonIcon icon={layersOutline} className="text-[11px]" />
                            ~{entry.componentCount} steps
                        </span>
                    </>
                )}
            </div>

            <div className="text-xs text-grayscale-600 leading-relaxed line-clamp-2">
                {entry.description}
            </div>

            {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                    {entry.tags.map(tag => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-grayscale-100 text-grayscale-700
                                       text-[10px] font-medium"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    </button>
);

// ---------------------------------------------------------------------------
// CatalogEntryContext — the "you picked this" strip shown at the top of
// the preview / fetching / error view when we came from a catalog card.
// ---------------------------------------------------------------------------

const CatalogEntryContext: React.FC<{ entry: CatalogEntry }> = ({ entry }) => (
    <div className="flex gap-3 items-start p-3 rounded-2xl bg-grayscale-10 border border-grayscale-200">
        {entry.image && (
            <img
                src={entry.image}
                alt=""
                className="shrink-0 w-12 h-12 rounded-xl bg-white border border-grayscale-200
                           object-contain p-1"
                loading="lazy"
                onError={e => { e.currentTarget.style.display = 'none'; }}
            />
        )}

        <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-grayscale-900 leading-tight">
                {entry.name}
            </div>

            <div className="text-xs text-grayscale-500 mt-0.5">{entry.issuer}</div>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// EmptyState — shown when the search yields nothing
// ---------------------------------------------------------------------------

const EmptyState: React.FC<{
    hasQuery: boolean;
    onClear: () => void;
}> = ({ hasQuery, onClear }) => (
    <div className="p-6 rounded-2xl bg-grayscale-10 border border-grayscale-200 text-center space-y-2">
        <div className="text-sm text-grayscale-700">
            {hasQuery
                ? 'No pathways match your search yet.'
                : 'The catalog is empty right now.'}
        </div>

        <div className="text-xs text-grayscale-500 leading-relaxed">
            {hasQuery ? (
                <>
                    Try clearing filters, or{' '}
                    <button
                        type="button"
                        onClick={onClear}
                        className="font-medium text-grayscale-900 hover:underline"
                    >
                        reset your search
                    </button>
                    .
                </>
            ) : (
                'More curated pathways are on the way — or paste any CTID below.'
            )}
        </div>
    </div>
);

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
