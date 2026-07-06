/**
 * QuickBuildWizard — mobile-first pathway sketcher for live demos.
 *
 * Turns someone's spoken idea into a live pathway in under a minute:
 * name it, list the steps, optionally link a real network app to a
 * step or bring in a whole Credential Engine pathway as a nested
 * sub-route, go. Simple steps get a default `artifact` + `self-attest`
 * stage so the author never touches the CST primitive.
 *
 * Nodes are hand-built here rather than via `assembleBundle` because
 * two headline features need node fields `NodeSpec` doesn't carry: an
 * app-listing `action`, and a `composite` policy referencing an
 * imported pathway. The output shape matches `instantiateTemplate`.
 *
 * A Credential Engine step reuses the existing `ImportCtdlModal`; the
 * imported pathway(s) are held in wizard state and only committed at
 * "Create" (upserted before the parent so the composite ref resolves).
 * App picks stamp an `AppListingSnapshot` for instant/offline render.
 * Commit is direct `upsertPathway` (learner-authored, not the agent
 * proposal queue).
 */

import React, { useMemo, useState } from 'react';

import { IonIcon } from '@ionic/react';
import {
    addOutline,
    arrowBackOutline,
    checkmarkOutline,
    closeOutline,
    layersOutline,
    libraryOutline,
    linkOutline,
    searchOutline,
    sparklesOutline,
    trashOutline,
} from 'ionicons/icons';
import { AnimatePresence } from 'motion/react';
import { useHistory } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import type { AppStoreListing } from '@learncard/types';

import { AnalyticsEvents, useAnalytics } from '../../../analytics';
import { pathwayStore } from '../../../stores/pathways';
import useAppStore from '../../launchPad/useAppStore';

import { makeCompositeStage } from '../build/buildOps';
import { seedChosenRoute } from '../core/chosenRoute';
import { buildAppListingSnapshot } from '../core/appListingSnapshot';
import { useLearnerDid } from '../hooks/useLearnerDid';
import ImportCtdlModal from '../import/ImportCtdlModal';
import type { AppListingAction, Edge, Pathway, PathwayNode } from '../types';
import { CURRENT_PATHWAY_SCHEMA_VERSION } from '../types';

interface NestedRef {
    /** Id of the imported primary pathway the composite node points at. */
    primaryId: string;
    /** Primary + supporting pathways to upsert before the parent. */
    pathways: Pathway[];
    nodeCount: number;
}

interface DraftStep {
    key: string;
    kind: 'simple' | 'nested';
    title: string;
    description: string;
    action?: AppListingAction;
    nested?: NestedRef;
}

type Stage = 'idea' | 'steps';

const makeStep = (): DraftStep => ({
    key: uuid(),
    kind: 'simple',
    title: '',
    description: '',
});

const FALLBACK_ICON_URL = 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';

const TEXT_INPUT =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 ' +
    'placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ' +
    'focus:border-transparent bg-white font-poppins';

interface QuickBuildWizardProps {
    onExit: () => void;
}

const QuickBuildWizard: React.FC<QuickBuildWizardProps> = ({ onExit }) => {
    const history = useHistory();
    const analytics = useAnalytics();
    const learnerDid = useLearnerDid();

    const { useCuratedListApps } = useAppStore();
    const curatedQuery = useCuratedListApps();
    const curatedApps: AppStoreListing[] = curatedQuery.data ?? [];

    const [stage, setStage] = useState<Stage>('idea');
    const [title, setTitle] = useState('');
    const [goal, setGoal] = useState('');
    const [steps, setSteps] = useState<DraftStep[]>([makeStep(), makeStep()]);
    const [creating, setCreating] = useState(false);
    const [importOpen, setImportOpen] = useState(false);

    const trimmedTitle = title.trim();
    const namedSteps = useMemo(() => steps.filter(s => s.title.trim().length > 0), [steps]);

    const canContinueFromIdea = trimmedTitle.length > 0;
    const canCreate = trimmedTitle.length > 0 && namedSteps.length > 0;

    const patchStep = (key: string, patch: Partial<DraftStep>): void =>
        setSteps(prev => prev.map(s => (s.key === key ? { ...s, ...patch } : s)));

    const addStep = (): void => setSteps(prev => [...prev, makeStep()]);

    const removeStep = (key: string): void =>
        setSteps(prev => (prev.length <= 1 ? prev : prev.filter(s => s.key !== key)));

    const handleCeImported = (primary: Pathway, supporting: Pathway[] = []): void => {
        setSteps(prev => [
            ...prev,
            {
                key: uuid(),
                kind: 'nested',
                title: primary.title,
                description: '',
                nested: {
                    primaryId: primary.id,
                    pathways: [primary, ...supporting],
                    nodeCount: primary.nodes.length,
                },
            },
        ]);
        setImportOpen(false);
    };

    const handleCreate = (): void => {
        if (!canCreate || creating) return;

        setCreating(true);

        const now = new Date().toISOString();
        const pathwayId = uuid();

        const nodes: PathwayNode[] = namedSteps.map(s => {
            const stepTitle = s.title.trim();
            const stepDescription = s.description.trim();

            const base = {
                id: uuid(),
                pathwayId,
                title: stepTitle,
                ...(stepDescription ? { description: stepDescription } : {}),
                endorsements: [],
                progress: {
                    status: 'not-started' as const,
                    artifacts: [],
                    reviewsDue: 0,
                    streak: { current: 0, longest: 0 },
                },
                createdBy: 'learner' as const,
                createdAt: now,
                updatedAt: now,
            };

            if (s.kind === 'nested' && s.nested) {
                const { policy, termination } = makeCompositeStage(
                    s.nested.primaryId,
                    'inline-expandable'
                );

                return { ...base, stage: { initiation: [], policy, termination } };
            }

            return {
                ...base,
                stage: {
                    initiation: [],
                    policy: {
                        kind: 'artifact',
                        prompt: stepTitle,
                        expectedArtifact: 'text',
                    },
                    termination: {
                        kind: 'self-attest',
                        prompt: 'Mark as done when this step is complete.',
                    },
                },
                ...(s.action ? { action: s.action } : {}),
            };
        });

        const edges: Edge[] = [];
        for (let i = 1; i < nodes.length; i += 1) {
            edges.push({
                id: uuid(),
                from: nodes[i - 1]!.id,
                to: nodes[i]!.id,
                type: 'prerequisite',
            });
        }

        const destinationNodeId = nodes[nodes.length - 1]?.id;

        const pathway: Pathway = {
            id: pathwayId,
            ownerDid: learnerDid,
            revision: 0,
            schemaVersion: CURRENT_PATHWAY_SCHEMA_VERSION,
            title: trimmedTitle,
            goal: goal.trim() || trimmedTitle,
            nodes,
            edges,
            status: 'active',
            visibility: {
                self: true,
                mentors: false,
                guardians: false,
                publicProfile: false,
            },
            source: 'authored',
            ...(destinationNodeId ? { destinationNodeId } : {}),
            createdAt: now,
            updatedAt: now,
        };

        const route = seedChosenRoute(pathway);
        const finalPathway = route.length > 0 ? { ...pathway, chosenRoute: route } : pathway;

        // Imported pathways must exist before the parent so composite
        // refs resolve on first Map render. Dedupe across steps by id.
        const importedById = new Map<string, Pathway>();
        for (const s of namedSteps) {
            if (s.kind === 'nested' && s.nested) {
                for (const p of s.nested.pathways) importedById.set(p.id, p);
            }
        }
        for (const p of importedById.values()) pathwayStore.set.upsertPathway(p);

        pathwayStore.set.upsertPathway(finalPathway);
        pathwayStore.set.setActivePathway(finalPathway.id);

        analytics.track(AnalyticsEvents.PATHWAYS_CTDL_IMPORTED, {
            ctid: 'quick-build',
            nodeCount: finalPathway.nodes.length,
            warningCount: 0,
            hasDestination: !!finalPathway.destinationNodeId,
            importSource: 'onboard',
        });

        history.replace('/pathways/map');
    };

    return (
        <>
            <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 font-poppins">
                <WizardHeader
                    stage={stage}
                    onBack={stage === 'idea' ? onExit : () => setStage('idea')}
                    disabled={creating}
                />

                {stage === 'idea' ? (
                    <IdeaStage
                        title={title}
                        goal={goal}
                        onTitleChange={setTitle}
                        onGoalChange={setGoal}
                        canContinue={canContinueFromIdea}
                        onContinue={() => setStage('steps')}
                    />
                ) : (
                    <StepsStage
                        steps={steps}
                        curatedApps={curatedApps}
                        curatedLoading={curatedQuery.isLoading}
                        onPatchStep={patchStep}
                        onAddStep={addStep}
                        onRemoveStep={removeStep}
                        onAddFromCe={() => setImportOpen(true)}
                        canCreate={canCreate}
                        creating={creating}
                        onCreate={handleCreate}
                    />
                )}
            </div>

            <AnimatePresence>
                {importOpen && (
                    <ImportCtdlModal
                        ownerDid={learnerDid}
                        onImport={handleCeImported}
                        onClose={() => setImportOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default QuickBuildWizard;

const WizardHeader: React.FC<{
    stage: Stage;
    onBack: () => void;
    disabled: boolean;
}> = ({ stage, onBack, disabled }) => (
    <div className="flex items-center gap-3 mb-6">
        <button
            type="button"
            onClick={onBack}
            disabled={disabled}
            aria-label="Go back"
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center
                       text-grayscale-600 hover:text-grayscale-900 hover:bg-grayscale-10
                       transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
            <IonIcon icon={arrowBackOutline} className="text-xl" aria-hidden />
        </button>

        <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-grayscale-900 leading-tight">Quick build</h1>
            <p className="text-xs text-grayscale-500">
                {stage === 'idea' ? 'Name the journey' : 'Add the steps'}
            </p>
        </div>

        <div className="flex items-center gap-1.5" aria-hidden>
            <span
                className={`h-1.5 rounded-full transition-all duration-200 ${
                    stage === 'idea' ? 'w-5 bg-grayscale-900' : 'w-2 bg-grayscale-300'
                }`}
            />
            <span
                className={`h-1.5 rounded-full transition-all duration-200 ${
                    stage === 'steps' ? 'w-5 bg-grayscale-900' : 'w-2 bg-grayscale-300'
                }`}
            />
        </div>
    </div>
);

const IdeaStage: React.FC<{
    title: string;
    goal: string;
    onTitleChange: (v: string) => void;
    onGoalChange: (v: string) => void;
    canContinue: boolean;
    onContinue: () => void;
}> = ({ title, goal, onTitleChange, onGoalChange, canContinue, onContinue }) => (
    <div className="space-y-6">
        <div className="space-y-1.5">
            <label htmlFor="qb-title" className="text-xs font-medium text-grayscale-700">
                What's the journey?
            </label>

            <input
                id="qb-title"
                type="text"
                value={title}
                onChange={e => onTitleChange(e.target.value)}
                placeholder="e.g. Learn to fly a drone"
                maxLength={80}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                onKeyDown={e => {
                    if (e.key === 'Enter' && canContinue) onContinue();
                }}
                className={TEXT_INPUT}
            />
        </div>

        <div className="space-y-1.5">
            <label htmlFor="qb-goal" className="text-xs font-medium text-grayscale-700">
                What does done look like?{' '}
                <span className="text-grayscale-400 font-normal">(optional)</span>
            </label>

            <textarea
                id="qb-goal"
                value={goal}
                onChange={e => onGoalChange(e.target.value)}
                placeholder="e.g. Fly a full course confidently and land clean"
                rows={2}
                maxLength={160}
                className={`${TEXT_INPUT} resize-none`}
            />

            <p className="text-xs text-grayscale-400">
                Leave this blank and we'll use the journey name.
            </p>
        </div>

        <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm
                       hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
            Next: add steps
        </button>
    </div>
);

const StepsStage: React.FC<{
    steps: DraftStep[];
    curatedApps: AppStoreListing[];
    curatedLoading: boolean;
    onPatchStep: (key: string, patch: Partial<DraftStep>) => void;
    onAddStep: () => void;
    onRemoveStep: (key: string) => void;
    onAddFromCe: () => void;
    canCreate: boolean;
    creating: boolean;
    onCreate: () => void;
}> = ({
    steps,
    curatedApps,
    curatedLoading,
    onPatchStep,
    onAddStep,
    onRemoveStep,
    onAddFromCe,
    canCreate,
    creating,
    onCreate,
}) => (
    <div className="space-y-3">
        {steps.map((step, index) =>
            step.kind === 'nested' ? (
                <NestedStepCard
                    key={step.key}
                    step={step}
                    index={index}
                    canRemove={steps.length > 1}
                    onPatch={patch => onPatchStep(step.key, patch)}
                    onRemove={() => onRemoveStep(step.key)}
                />
            ) : (
                <StepCard
                    key={step.key}
                    step={step}
                    index={index}
                    canRemove={steps.length > 1}
                    curatedApps={curatedApps}
                    curatedLoading={curatedLoading}
                    onPatch={patch => onPatchStep(step.key, patch)}
                    onRemove={() => onRemoveStep(step.key)}
                />
            )
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
                type="button"
                onClick={onAddStep}
                disabled={creating}
                className="py-3 px-4 rounded-[20px] border border-dashed border-grayscale-300
                           text-grayscale-700 font-medium text-sm hover:bg-grayscale-10
                           transition-colors flex items-center justify-center gap-2
                           disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <IonIcon icon={addOutline} className="text-base" aria-hidden />
                Add a step
            </button>

            <button
                type="button"
                onClick={onAddFromCe}
                disabled={creating}
                className="py-3 px-4 rounded-[20px] border border-dashed border-emerald-300
                           text-emerald-700 font-medium text-sm hover:bg-emerald-50
                           transition-colors flex items-center justify-center gap-2
                           disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <IonIcon icon={libraryOutline} className="text-base" aria-hidden />
                Add a pathway
            </button>
        </div>

        <div className="pt-3">
            <button
                type="button"
                onClick={onCreate}
                disabled={!canCreate || creating}
                className="w-full py-3 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm
                           hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2
                           disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {creating ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Building…
                    </>
                ) : (
                    <>
                        <IonIcon icon={sparklesOutline} className="text-base" aria-hidden />
                        Create journey
                    </>
                )}
            </button>

            {!canCreate && (
                <p className="text-xs text-grayscale-400 text-center mt-2">
                    Name at least one step to continue.
                </p>
            )}
        </div>
    </div>
);

const NestedStepCard: React.FC<{
    step: DraftStep;
    index: number;
    canRemove: boolean;
    onPatch: (patch: Partial<DraftStep>) => void;
    onRemove: () => void;
}> = ({ step, index, canRemove, onPatch, onRemove }) => (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3.5">
        <div className="flex items-start gap-2.5">
            <span
                aria-hidden
                className="shrink-0 mt-1 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700
                           text-xs font-semibold flex items-center justify-center"
            >
                {index + 1}
            </span>

            <div className="min-w-0 flex-1 space-y-1.5">
                <input
                    type="text"
                    value={step.title}
                    onChange={e => onPatch({ title: e.target.value })}
                    placeholder="Name this sub-route"
                    maxLength={80}
                    className="w-full py-2 px-3 border border-grayscale-300 rounded-xl text-sm
                               text-grayscale-900 placeholder:text-grayscale-400 bg-white font-poppins
                               focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />

                <p className="text-[11px] text-emerald-700 flex items-center gap-1.5">
                    <IonIcon icon={layersOutline} aria-hidden />
                    {step.nested?.nodeCount ?? 0} steps · Credential Engine pathway
                </p>
            </div>

            <button
                type="button"
                onClick={onRemove}
                disabled={!canRemove}
                aria-label={`Remove step ${index + 1}`}
                className="shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center
                           text-grayscale-400 hover:text-red-500 hover:bg-red-50 transition-colors
                           disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent
                           disabled:hover:text-grayscale-400"
            >
                <IonIcon icon={trashOutline} className="text-base" aria-hidden />
            </button>
        </div>
    </div>
);

const StepCard: React.FC<{
    step: DraftStep;
    index: number;
    canRemove: boolean;
    curatedApps: AppStoreListing[];
    curatedLoading: boolean;
    onPatch: (patch: Partial<DraftStep>) => void;
    onRemove: () => void;
}> = ({ step, index, canRemove, curatedApps, curatedLoading, onPatch, onRemove }) => {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [search, setSearch] = useState('');

    const attached = step.action?.snapshot;

    const filteredApps = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return curatedApps;

        return curatedApps.filter(listing => {
            const name = (listing.display_name ?? '').toLowerCase();
            const tagline = (listing.tagline ?? '').toLowerCase();
            return name.includes(q) || tagline.includes(q);
        });
    }, [curatedApps, search]);

    const handlePickListing = (listing: AppStoreListing): void => {
        const snapshot = buildAppListingSnapshot({
            name: listing.display_name ?? '',
            category: listing.category ?? undefined,
            launch_type: listing.launch_type ?? undefined,
            tagline: listing.tagline ?? undefined,
            icon_url: listing.icon_url ?? undefined,
        });

        const action: AppListingAction = {
            kind: 'app-listing',
            listingId: listing.listing_id,
            ...(snapshot ? { snapshot } : {}),
        };

        onPatch({ action });
        setPickerOpen(false);
        setSearch('');
    };

    const clearListing = (): void => {
        onPatch({ action: undefined });
        setPickerOpen(false);
    };

    return (
        <div className="rounded-2xl border border-grayscale-200 bg-white p-3.5 space-y-3">
            <div className="flex items-start gap-2.5">
                <span
                    aria-hidden
                    className="shrink-0 mt-1 w-6 h-6 rounded-full bg-grayscale-100
                               text-grayscale-700 text-xs font-semibold
                               flex items-center justify-center"
                >
                    {index + 1}
                </span>

                <input
                    type="text"
                    value={step.title}
                    onChange={e => onPatch({ title: e.target.value })}
                    placeholder={`Step ${index + 1} — what happens here?`}
                    maxLength={80}
                    className="flex-1 min-w-0 py-2 px-3 border border-grayscale-300 rounded-xl text-sm
                               text-grayscale-900 placeholder:text-grayscale-400 bg-white font-poppins
                               focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />

                <button
                    type="button"
                    onClick={onRemove}
                    disabled={!canRemove}
                    aria-label={`Remove step ${index + 1}`}
                    className="shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center
                               text-grayscale-400 hover:text-red-500 hover:bg-red-50 transition-colors
                               disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent
                               disabled:hover:text-grayscale-400"
                >
                    <IonIcon icon={trashOutline} className="text-base" aria-hidden />
                </button>
            </div>

            {attached ? (
                <div className="flex items-center gap-2.5 pl-8">
                    <img
                        src={attached.iconUrl || FALLBACK_ICON_URL}
                        alt=""
                        className="shrink-0 w-8 h-8 rounded-lg object-cover bg-grayscale-100 border border-grayscale-200"
                        onError={e => {
                            (e.currentTarget as HTMLImageElement).src = FALLBACK_ICON_URL;
                        }}
                    />

                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-grayscale-900 truncate">
                            {attached.displayName}
                        </p>
                        <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                            <IonIcon icon={checkmarkOutline} aria-hidden />
                            Linked app
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={clearListing}
                        aria-label="Remove linked app"
                        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                                   text-grayscale-400 hover:text-grayscale-900 hover:bg-grayscale-10 transition-colors"
                    >
                        <IonIcon icon={closeOutline} className="text-base" aria-hidden />
                    </button>
                </div>
            ) : pickerOpen ? (
                <div className="pl-8 space-y-2">
                    <div className="relative">
                        <IonIcon
                            icon={searchOutline}
                            aria-hidden
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-grayscale-400 text-base"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search apps"
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus
                            className="w-full py-2 pl-9 pr-3 border border-grayscale-300 rounded-xl text-sm
                                       text-grayscale-900 placeholder:text-grayscale-400 bg-white font-poppins
                                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>

                    {curatedLoading ? (
                        <p className="text-[11px] text-grayscale-500 px-1 py-2">Loading apps…</p>
                    ) : filteredApps.length === 0 ? (
                        <p className="text-[11px] text-grayscale-500 px-1 py-2">
                            No apps match that search.
                        </p>
                    ) : (
                        <ul className="max-h-44 overflow-y-auto rounded-xl border border-grayscale-200 divide-y divide-grayscale-100 bg-white">
                            {filteredApps.map(listing => (
                                <li key={listing.listing_id}>
                                    <button
                                        type="button"
                                        onClick={() => handlePickListing(listing)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-grayscale-10 transition-colors"
                                    >
                                        <img
                                            src={listing.icon_url || FALLBACK_ICON_URL}
                                            alt=""
                                            className="shrink-0 w-8 h-8 rounded-lg object-cover bg-grayscale-100"
                                            onError={e => {
                                                (e.currentTarget as HTMLImageElement).src =
                                                    FALLBACK_ICON_URL;
                                            }}
                                        />

                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-medium text-grayscale-900 truncate">
                                                {listing.display_name || 'Untitled app'}
                                            </span>
                                            {listing.tagline && (
                                                <span className="block text-[11px] text-grayscale-500 leading-snug line-clamp-1">
                                                    {listing.tagline}
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setPickerOpen(false);
                            setSearch('');
                        }}
                        className="text-xs text-grayscale-500 hover:text-grayscale-900 transition-colors px-1"
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <div className="pl-8">
                    <button
                        type="button"
                        onClick={() => setPickerOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium
                                   text-grayscale-500 hover:text-grayscale-900 transition-colors"
                    >
                        <IonIcon icon={linkOutline} className="text-sm" aria-hidden />
                        Link an app (optional)
                    </button>
                </div>
            )}
        </div>
    );
};
