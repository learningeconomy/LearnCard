/**
 * BuildMode — author or edit a pathway (docs § 5, § 10).
 *
 * Two panels: the node list on the left, the selected node's editor on
 * the right. All mutations are pure `buildOps` calls — the result is
 * committed to `pathwayStore.upsertPathway` in one place so history and
 * offline-queueing can intercept it later without touching every edit
 * site.
 */

import React, { useEffect, useState } from 'react';

import { IonIcon } from '@ionic/react';
import { AnimatePresence } from 'framer-motion';
import { cloudDownloadOutline, gitBranchOutline } from 'ionicons/icons';

import { pathwayStore } from '../../../stores/pathways';
import { useLearnerDid } from '../hooks/useLearnerDid';
import ImportCtdlModal from '../import/ImportCtdlModal';
import type { Pathway } from '../types';

import NodeEditor from './NodeEditor';
import {
    addNode as addNodeOp,
    setPolicy,
    setTermination,
} from './buildOps';

const BuildMode: React.FC = () => {
    const activePathway = pathwayStore.use.activePathway();
    const learnerDid = useLearnerDid();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [importOpen, setImportOpen] = useState(false);

    // Auto-select the first node when the pathway becomes available.
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

    // Commit a freshly-imported pathway: persist, focus it, pick its
    // first node, close the modal. The selected-id wiring via the
    // effect above picks up automatically once `activePathway` changes.
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
                        className="inline-flex items-center gap-2 py-3 px-4 rounded-[20px]
                                   bg-grayscale-900 text-white font-medium text-sm
                                   hover:opacity-90 transition-opacity"
                    >
                        <IonIcon icon={cloudDownloadOutline} className="text-base" />
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

    // "Add nested pathway" — seed a node with a composite policy +
    // pathway-completed termination, both with empty refs. The state
    // is Zod-invalid in-flight, but NodeEditor's PolicyEditor holds
    // the composite picker in that state and upgrades both refs
    // atomically when the author picks a target pathway (via the
    // composite invariant in `handlePolicyChange`). We commit the
    // incomplete composite so the author can see their in-progress
    // work; it would fail publication but that's intentional — the
    // picker nudges them to complete it before leaving Build.
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
        // After delete, select the first remaining node.
        setSelectedId(null);
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 font-poppins">
            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5">
                <aside className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide">
                            Nodes
                        </h3>

                        <span className="text-xs text-grayscale-500">
                            {activePathway.nodes.length}
                        </span>
                    </div>

                    <ul className="space-y-1.5">
                        {activePathway.nodes.map(n => {
                            const isSelected = n.id === selectedId;

                            return (
                                <li key={n.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedId(n.id)}
                                        className={`w-full text-left py-2.5 px-3 rounded-xl text-sm transition-colors ${
                                            isSelected
                                                ? 'bg-grayscale-900 text-white'
                                                : 'bg-white border border-grayscale-200 text-grayscale-800 hover:bg-grayscale-10'
                                        }`}
                                    >
                                        <span className="block truncate">{n.title || 'Untitled'}</span>

                                        <span
                                            className={`block text-[10px] mt-0.5 uppercase tracking-wide ${
                                                isSelected ? 'text-grayscale-300' : 'text-grayscale-500'
                                            }`}
                                        >
                                            {n.stage.policy.kind} · {n.stage.termination.kind}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    <button
                        type="button"
                        onClick={handleAddNode}
                        className="w-full py-2.5 px-3 rounded-[20px] border border-grayscale-300 text-sm font-medium text-grayscale-700 hover:bg-grayscale-10 transition-colors"
                    >
                        + Add node
                    </button>

                    {/*
                        "Add nested pathway" — peer action to Add node.
                        Same border/weight so discoverability is high, but
                        iconned so the two actions read as distinct. The
                        author picks a target pathway in the inline
                        composite picker that mounts on the right.
                    */}
                    <button
                        type="button"
                        onClick={handleAddNestedPathway}
                        className="w-full inline-flex items-center justify-center gap-1.5
                                   py-2.5 px-3 rounded-[20px] border border-grayscale-300
                                   text-sm font-medium text-grayscale-700
                                   hover:bg-grayscale-10 transition-colors"
                    >
                        <IonIcon icon={gitBranchOutline} className="text-base" />
                        Add nested pathway
                    </button>

                    {/* Secondary action — import another pathway alongside
                        the active one. Kept subtle so it doesn't compete
                        with the two primary add actions visually. */}
                    <button
                        type="button"
                        onClick={() => setImportOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-1.5
                                   py-2.5 px-3 rounded-[20px] text-sm font-medium
                                   text-grayscale-600 hover:text-grayscale-900 hover:bg-grayscale-10
                                   transition-colors"
                    >
                        <IonIcon icon={cloudDownloadOutline} className="text-base" />
                        Import from Credential Engine
                    </button>
                </aside>

                <main className="min-w-0">
                    {selectedNode ? (
                        <div className="p-5 rounded-[24px] border border-grayscale-200 bg-white">
                            <NodeEditor
                                pathway={activePathway}
                                node={selectedNode}
                                onChangePathway={commit}
                                onDeleted={handleDeleted}
                            />
                        </div>
                    ) : (
                        <div className="p-6 rounded-[20px] bg-grayscale-100 border border-grayscale-200 text-center">
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                Pick a node on the left to edit its details, or add a new one.
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
