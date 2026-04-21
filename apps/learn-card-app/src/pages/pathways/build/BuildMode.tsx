/**
 * BuildMode — author or edit a pathway.
 *
 * Layout:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  Toolbar: pathway title · undo / redo                        │
 *   ├──────────────┬──────────────────────┬────────────────────────┤
 *   │  OUTLINE     │  INSPECTOR           │  PREVIEW (xl+ only)    │
 *   │  (steps,     │  (Identity, What,    │  (learner-card mock    │
 *   │   add, nest) │   Done, Conn., Dgr.) │   of the selected step)│
 *   └──────────────┴──────────────────────┴────────────────────────┘
 *
 * Three shipwide invariants survive M4:
 *
 *   1. Every pathway mutation still flows through the single
 *      `commit()` seam. In M4 that seam is the `useHistory` hook's
 *      `commit` — it wraps `pathwayStore.set.upsertPathway` with an
 *      undo/redo-aware reducer but preserves the store contract
 *      (one commit = one persisted pathway).
 *
 *   2. `buildOps` stays pure. Identity-preserving no-ops (e.g.
 *      setting the same destination twice) don't pollute the undo
 *      stack — `historyReducer.commit` skips them.
 *
 *   3. The composite invariant (policy ⇔ pathway-completed termination)
 *      is still owned by `WhatSection`. M4 doesn't touch it.
 *
 * ## Keyboard shortcuts
 *
 * Cmd/Ctrl+Z = undo, Cmd/Ctrl+Shift+Z = redo. We deliberately do
 * *not* intercept these while an `<input>` or `<textarea>` has focus:
 * the browser's native text undo inside form fields is what the
 * author wants in that moment, and fighting for it produces worse
 * UX than deferring.
 */

import React, { useEffect, useMemo, useState } from 'react';

import { IonIcon } from '@ionic/react';
import { AnimatePresence } from 'framer-motion';
import {
    arrowRedoOutline,
    arrowUndoOutline,
    cloudDownloadOutline,
} from 'ionicons/icons';

import { pathwayStore } from '../../../stores/pathways';
import { useLearnerDid } from '../hooks/useLearnerDid';
import ImportCtdlModal from '../import/ImportCtdlModal';
import type { Pathway } from '../types';

import InspectorPane from './inspector/InspectorPane';
import OutlinePane from './outline/OutlinePane';
import PreviewPane from './preview/PreviewPane';
import { useHistory } from './history/useHistory';
import { validatePathway } from './validate/validatePathway';
import {
    addNode as addNodeOp,
    setPolicy,
    setTermination,
} from './buildOps';

const BuildMode: React.FC = () => {
    const activePathway = pathwayStore.use.activePathway();
    const allPathways = pathwayStore.use.pathways();
    const learnerDid = useLearnerDid();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [importOpen, setImportOpen] = useState(false);

    // -------------------------------------------------------------
    // History: wraps `pathwayStore.set.upsertPathway` with an
    // undo/redo stack. Resets when `activePathway.id` changes so
    // undo never teleports into another pathway's edit history.
    // -------------------------------------------------------------
    const { commit, undo, redo, canUndo, canRedo } = useHistory<Pathway>(
        activePathway,
        pathwayStore.set.upsertPathway,
        { idKey: activePathway?.id ?? null },
    );

    // Keyboard shortcuts (Cmd+Z / Cmd+Shift+Z). Deferred to the
    // browser's native input-undo when focus is on a text field —
    // fighting for it is worse UX than letting the browser handle it.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const isMeta = e.metaKey || e.ctrlKey;
            if (!isMeta || e.key.toLowerCase() !== 'z') return;

            const target = document.activeElement;
            const editing =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                (target as HTMLElement | null)?.isContentEditable === true;

            if (editing) return;

            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [undo, redo]);

    // -------------------------------------------------------------
    // Auto-select the first node when a pathway becomes available.
    // Preserves prior selection when the node still exists.
    // -------------------------------------------------------------
    useEffect(() => {
        if (!activePathway) {
            setSelectedId(null);
            return;
        }

        setSelectedId(prev => {
            if (prev && activePathway.nodes.some(n => n.id === prev)) return prev;
            return activePathway.nodes[0]?.id ?? null;
        });
    }, [activePathway]);

    // -------------------------------------------------------------
    // Summarizer title-map. Memoised on the pathways object identity
    // so composite refs resolve to real titles without a rebuild per
    // keystroke.
    // -------------------------------------------------------------
    const pathwayTitleById = useMemo(
        () =>
            Object.fromEntries(Object.values(allPathways).map(p => [p.id, p.title])),
        [allPathways],
    );

    const summarizeContext = useMemo(() => ({ pathwayTitleById }), [pathwayTitleById]);

    // -------------------------------------------------------------
    // Validation. Recomputed when the pathway (or the cross-pathway
    // map it's checked against) changes. Cheap for realistic
    // pathways; no memo-key juggling needed.
    // -------------------------------------------------------------
    const issues = useMemo(
        () => (activePathway ? validatePathway(activePathway, allPathways) : []),
        [activePathway, allPathways],
    );

    // Commit a freshly-imported pathway: persist, focus it, close
    // the modal. Imports bypass the history stack intentionally —
    // an imported pathway represents a new session, not a reversible
    // edit.
    const handleImported = (pathway: Pathway) => {
        pathwayStore.set.upsertPathway(pathway);
        pathwayStore.set.setActivePathway(pathway.id);
        setImportOpen(false);
    };

    if (!activePathway) {
        return (
            <>
                <div className="max-w-md mx-auto px-4 py-12 font-poppins text-center">
                    <h2 className="text-xl font-semibold text-grayscale-900 mb-2">
                        No pathway to edit
                    </h2>

                    <p className="text-sm text-grayscale-600 leading-relaxed mb-6">
                        Start one from Today, or bring in an existing one from the
                        Credential Engine Registry.
                    </p>

                    <button
                        type="button"
                        onClick={() => setImportOpen(true)}
                        className="inline-flex items-center gap-2 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                        <IonIcon icon={cloudDownloadOutline} aria-hidden className="text-base" />
                        Import from Credential Engine
                    </button>
                </div>

                <AnimatePresence>
                    {importOpen && (
                        <ImportCtdlModal
                            ownerDid={learnerDid}
                            onImport={handleImported}
                            onClose={() => setImportOpen(false)}
                        />
                    )}
                </AnimatePresence>
            </>
        );
    }

    const selectedNode = selectedId
        ? activePathway.nodes.find(n => n.id === selectedId) ?? null
        : null;

    const handleAddNode = () => {
        const next = addNodeOp(activePathway, { title: 'New step' });
        commit(next);

        const justAdded = next.nodes[next.nodes.length - 1];
        setSelectedId(justAdded.id);
    };

    /**
     * Seed a node already-wired for compositing: a `composite` policy
     * with no ref selected yet + the paired `pathway-completed`
     * termination. The `composite` invariant in `WhatSection` flips
     * both refs atomically when the author later picks a target
     * pathway. The in-flight state is Zod-invalid, but committing
     * it lets the author see their in-progress work; publish-time
     * validation catches the incomplete ref separately.
     */
    const handleAddNestedPathway = () => {
        let next = addNodeOp(activePathway, { title: 'Nested pathway' });
        const justAdded = next.nodes[next.nodes.length - 1];

        next = setPolicy(next, justAdded.id, {
            kind: 'composite',
            pathwayRef: '',
            renderStyle: 'inline-expandable',
        });

        next = setTermination(next, justAdded.id, {
            kind: 'pathway-completed',
            pathwayRef: '',
        });

        commit(next);
        setSelectedId(justAdded.id);
    };

    const handleDeleted = () => {
        // After delete, let the auto-select effect re-run and pick
        // the first remaining node (if any).
        setSelectedId(null);
    };

    /**
     * Drill into a nested pathway from the outline (or back out via
     * breadcrumb). Switches the active pathway and, when a node id
     * is provided, targets it for selection. The auto-select effect
     * on `activePathway` falls through for us if no id is given.
     */
    const handleDrillIn = (pathwayId: string, nodeId?: string) => {
        pathwayStore.set.setActivePathway(pathwayId);

        if (nodeId) setSelectedId(nodeId);
        else setSelectedId(null);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 font-poppins">
            {/*
                Toolbar — thin row above the panes with pathway title
                and undo/redo. Kept minimal (no breadcrumbs, no tabs)
                because the existing TopBar in the containing route
                already carries the top-level nav.
            */}
            <div className="mb-4 flex items-center justify-between gap-3 px-1">
                <h1
                    className="text-sm font-semibold text-grayscale-900 truncate"
                    title={activePathway.title}
                >
                    {activePathway.title}
                </h1>

                <div className="shrink-0 flex items-center gap-1">
                    <ToolbarIconButton
                        icon={arrowUndoOutline}
                        label="Undo (Cmd/Ctrl+Z)"
                        onClick={undo}
                        disabled={!canUndo}
                    />

                    <ToolbarIconButton
                        icon={arrowRedoOutline}
                        label="Redo (Cmd/Ctrl+Shift+Z)"
                        onClick={redo}
                        disabled={!canRedo}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_360px] gap-6">
                <OutlinePane
                    pathway={activePathway}
                    allPathways={allPathways}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onAddNode={handleAddNode}
                    onAddNestedPathway={handleAddNestedPathway}
                    onOpenImport={() => setImportOpen(true)}
                    onDrillIn={handleDrillIn}
                    summarizeContext={summarizeContext}
                />

                <main className="min-w-0">
                    {selectedNode ? (
                        <InspectorPane
                            pathway={activePathway}
                            node={selectedNode}
                            onChangePathway={commit}
                            onDeleted={handleDeleted}
                            issues={issues}
                        />
                    ) : (
                        <div className="p-6 rounded-[20px] bg-grayscale-10 border border-grayscale-200 text-center">
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                Pick a step on the left to edit its details, or add
                                a new one.
                            </p>
                        </div>
                    )}
                </main>

                {/*
                    PreviewPane is only rendered on xl+ viewports
                    (see the grid's xl:grid-cols template). On narrower
                    screens the column collapses and the preview is
                    hidden — authors edit without it rather than
                    trying to cram three panes into 1024px.
                */}
                <div className="hidden xl:block min-w-0">
                    <PreviewPane
                        pathway={activePathway}
                        node={selectedNode}
                        pathwayTitleById={pathwayTitleById}
                    />
                </div>
            </div>

            <AnimatePresence>
                {importOpen && (
                    <ImportCtdlModal
                        ownerDid={learnerDid}
                        onImport={handleImported}
                        onClose={() => setImportOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// ---------------------------------------------------------------------------
// ToolbarIconButton — small icon-only control with hover + disabled states.
// ---------------------------------------------------------------------------

const ToolbarIconButton: React.FC<{
    icon: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}> = ({ icon, label, onClick, disabled = false }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className="
            inline-flex items-center justify-center
            w-8 h-8 rounded-lg
            text-grayscale-700
            hover:bg-grayscale-100 hover:text-grayscale-900
            transition-colors
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-grayscale-700
        "
    >
        <IonIcon icon={icon} aria-hidden className="text-lg" />
    </button>
);

export default BuildMode;
