/**
 * BuildMode — author or edit a pathway.
 *
 * Two-pane shell:
 *
 *   ┌─────────────────┬──────────────────────────┐
 *   │ OUTLINE         │ INSPECTOR                │
 *   │ (steps, add,    │ (Identity, What, Done,   │
 *   │  nest, import)  │  Connections, Danger)    │
 *   └─────────────────┴──────────────────────────┘
 *
 * All pathway mutations still go through pure `buildOps` helpers and
 * commit through `pathwayStore.upsertPathway` at one call site — this
 * preserves the history / offline-queue integration point and keeps
 * the test surface stable. Inspector + sections only *build* new
 * Pathway values; they never write to the store directly.
 *
 * Preview pane (M4) will slot in as a third column behind a media
 * query on wide viewports. Kept out of M1 so the layout ships first.
 */

import React, { useEffect, useMemo, useState } from 'react';

import { IonIcon } from '@ionic/react';
import { AnimatePresence } from 'framer-motion';
import { cloudDownloadOutline } from 'ionicons/icons';

import { pathwayStore } from '../../../stores/pathways';
import { useLearnerDid } from '../hooks/useLearnerDid';
import ImportCtdlModal from '../import/ImportCtdlModal';
import type { Pathway } from '../types';

import InspectorPane from './inspector/InspectorPane';
import OutlinePane from './outline/OutlinePane';
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

    // Auto-select the first node when the pathway becomes available.
    // Preserves a prior selection if the node still exists (switching
    // pathways should land on something even if the ids don't line up).
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

    // Build the summary-context map once per render. Used by the
    // outline's `NodeRow`s so composite refs resolve to real titles
    // ("Complete AI in Finance") rather than the generic fallback.
    // Memoised on the pathways object identity — rebuilds are cheap
    // but React-renders aren't, so we skip the work when nothing
    // changed.
    const summarizeContext = useMemo(
        () => ({
            pathwayTitleById: Object.fromEntries(
                Object.values(allPathways).map(p => [p.id, p.title]),
            ),
        }),
        [allPathways],
    );

    // Commit a freshly-imported pathway: persist, focus it, close the
    // modal. The selected-id wiring via the effect above picks up
    // automatically once `activePathway` changes.
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

    const commit = (next: Pathway) => {
        pathwayStore.set.upsertPathway(next);
    };

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

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 font-poppins">
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
                <OutlinePane
                    pathway={activePathway}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onAddNode={handleAddNode}
                    onAddNestedPathway={handleAddNestedPathway}
                    onOpenImport={() => setImportOpen(true)}
                    summarizeContext={summarizeContext}
                />

                <main className="min-w-0">
                    {selectedNode ? (
                        <InspectorPane
                            pathway={activePathway}
                            node={selectedNode}
                            onChangePathway={commit}
                            onDeleted={handleDeleted}
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

export default BuildMode;
