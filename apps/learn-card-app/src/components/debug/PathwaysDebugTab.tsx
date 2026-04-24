/**
 * PathwaysDebugTab — dev-only in-app observability for the pathway-
 * progress reactor architecture.
 *
 * Mirrors the shape of the other debug tabs (`AuthDebugTab`,
 * `ConfigDebugTab`, `ThemeDebugTab`) — uses the shared `Section`,
 * `KVRow`, `EventTimeline`, and `useCopyToClipboard` primitives from
 * `debugComponents.tsx` so the layout stays visually consistent.
 *
 * Five sections, top-to-bottom:
 *
 *   1. **Reactor status** — is the reactor mounted? how many
 *      dispatches has it seen this session? what's the last one?
 *   2. **Active pathway snapshot** — every node with its termination
 *      kind + progress status; click to expand the termination JSON.
 *   3. **Event timeline** — a live feed of every reactor dispatch,
 *      classified as `success` / `info`, with the full record
 *      payload copy-pasteable as a reproducer.
 *   4. **Simulator buttons** — one-click fires for common scenarios
 *      (AWS CCP claim, IAM tutor finish, non-matching credential)
 *      plus a small custom-event form.
 *   5. **Danger zone** — seed AWS demo, reset everything.
 *
 * ## Why this is a tab and not a separate page
 *
 * The debug panel already manages discoverability, dev-mode gating
 * (`WIDGET_ENABLED`), and screen real-estate (`z-[2147483647]`
 * overlay). Adding a tab keeps all dev tooling in one place, which
 * is how the auth team, the config team, and the theme team already
 * think about their respective debug surfaces.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
    Activity,
    AlertTriangle,
    Award,
    GitBranch,
    Hammer,
    Package,
    Play,
    RefreshCw,
    Target,
    Zap,
} from 'lucide-react';

import { pathwayStore, proposalStore } from '../../stores/pathways';
import type { Pathway, PathwayNode, Termination } from '../../pages/pathways/types';

import {
    clearPathwayDebugEvents,
    emitPathwayDebugEvent,
    getPathwayDebugEvents,
    installPathwayDebugRecorder,
    subscribeToPathwayDebugEvents,
    type PathwayDebugEvent,
} from './pathwayDebugEvents';

import {
    EventTimeline,
    KVRow,
    Section,
    type TimelineEvent,
    useCopyToClipboard,
} from './debugComponents';

import type { PathwaysDevGlobals } from '../../pages/pathways/dev/pathwaysDevGlobals';

// ---------------------------------------------------------------------------
// Window bridge
// ---------------------------------------------------------------------------

/**
 * Read the dev globals off window. Typed via the interface exported
 * from `pathwaysDevGlobals.ts` so the tab doesn't duplicate the
 * simulator signatures. Returns `null` if the globals haven't been
 * installed yet (can happen briefly during initial hydration before
 * `PathwaysShell` has mounted).
 */
const getDev = (): PathwaysDevGlobals | null => {
    if (typeof window === 'undefined') return null;

    return (window as unknown as { __pathwaysDev?: PathwaysDevGlobals }).__pathwaysDev
        ?? null;
};

// ---------------------------------------------------------------------------
// Termination summary — shared with the pathway-snapshot section
// ---------------------------------------------------------------------------

const terminationLabel = (termination: Termination): string => {
    switch (termination.kind) {
        case 'artifact-count':
            return `${termination.count} × ${termination.artifactType}`;
        case 'endorsement':
            return `${termination.minEndorsers} vouch${termination.minEndorsers === 1 ? '' : 'es'}`;
        case 'self-attest':
            return 'self-attest';
        case 'assessment-score':
            return `score ≥ ${termination.min}`;
        case 'pathway-completed':
            return 'nested pathway';
        case 'composite':
            return `${termination.require} of ${termination.of.length}`;
        case 'requirement-satisfied':
            return `req (${termination.requirement.kind})`;
        case 'session-completed':
            return 'session';
    }
};

const statusColor = (status: string): string => {
    switch (status) {
        case 'completed':
            return 'text-emerald-400';
        case 'in-progress':
            return 'text-sky-400';
        case 'blocked':
            return 'text-red-400';
        default:
            return 'text-gray-500';
    }
};

const statusDot = (status: string): string => {
    switch (status) {
        case 'completed':
            return 'bg-emerald-400';
        case 'in-progress':
            return 'bg-sky-400';
        case 'blocked':
            return 'bg-red-400';
        default:
            return 'bg-gray-600';
    }
};

// ---------------------------------------------------------------------------
// Node row — collapsible, shows termination JSON on expand
// ---------------------------------------------------------------------------

const NodeRow: React.FC<{
    node: PathwayNode;
    copied: string | null;
    onCopy: (key: string, value: unknown) => void;
}> = ({ node, copied, onCopy }) => {
    const [expanded, setExpanded] = useState(false);

    const status = node.progress.status;
    const termination = node.stage.termination;

    return (
        <div className="bg-gray-900/60 rounded overflow-hidden">
            <button
                type="button"
                onClick={() => setExpanded(e => !e)}
                className="w-full px-2 py-1.5 flex items-center gap-2 text-left hover:bg-gray-900/90 transition-colors"
            >
                <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(status)}`}
                    title={status}
                />

                <span className="flex-1 min-w-0 text-[11px] text-gray-300 truncate">
                    {node.title}
                </span>

                <span className="text-[9px] text-gray-500 font-mono shrink-0">
                    {terminationLabel(termination)}
                </span>

                <span className={`text-[9px] shrink-0 ${statusColor(status)}`}>
                    {status === 'not-started' ? '—' : status}
                </span>
            </button>

            {expanded && (
                <div className="px-2 pb-2 space-y-1.5">
                    <div>
                        <p className="text-[9px] text-gray-600 uppercase tracking-wider">
                            Termination
                        </p>

                        <pre className="text-[9px] text-gray-400 bg-gray-950 rounded p-1.5 mt-0.5 overflow-x-auto">
                            {JSON.stringify(termination, null, 2)}
                        </pre>

                        <button
                            type="button"
                            className="text-[9px] text-gray-600 hover:text-gray-400 mt-0.5"
                            onClick={e => {
                                e.stopPropagation();
                                onCopy(
                                    `termination-${node.id}`,
                                    JSON.stringify(termination, null, 2),
                                );
                            }}
                        >
                            {copied === `termination-${node.id}` ? 'Copied!' : 'Copy JSON'}
                        </button>
                    </div>

                    {node.progress.completedAt && (
                        <p className="text-[9px] text-gray-500">
                            Completed {node.progress.completedAt}
                        </p>
                    )}

                    {/*
                     * `terminationEvidence` is an auxiliary field
                     * written by `applyNodeCompletions` via an
                     * intersection type (the Zod schema of NodeProgress
                     * deliberately doesn't surface it so structural
                     * mutations stay narrow). Read it through the same
                     * intersection so the field is visible without
                     * loosening the store types.
                     */}
                    {(() => {
                        const progressWithEvidence = node.progress as typeof node.progress & {
                            terminationEvidence?: unknown;
                        };

                        if (!progressWithEvidence.terminationEvidence) return null;

                        return (
                            <div>
                                <p className="text-[9px] text-gray-600 uppercase tracking-wider">
                                    Evidence
                                </p>

                                <pre className="text-[9px] text-gray-400 bg-gray-950 rounded p-1.5 mt-0.5 overflow-x-auto">
                                    {JSON.stringify(
                                        progressWithEvidence.terminationEvidence,
                                        null,
                                        2,
                                    )}
                                </pre>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Pathway-snapshot section
// ---------------------------------------------------------------------------

const PathwaySnapshot: React.FC<{
    pathway: Pathway | null;
    copied: string | null;
    onCopy: (key: string, value: unknown) => void;
}> = ({ pathway, copied, onCopy }) => {
    if (!pathway) {
        return (
            <p className="text-[10px] text-gray-600 italic py-2">
                No active pathway. Run <code className="text-cyan-400">seedAws(did)</code> or
                pick one from the pathways shell.
            </p>
        );
    }

    const completed = pathway.nodes.filter(n => n.progress.status === 'completed').length;
    const bound = pathway.outcomes?.filter(o => o.binding).length ?? 0;
    const totalOutcomes = pathway.outcomes?.length ?? 0;

    return (
        <div className="space-y-2">
            <div className="text-[10px] text-gray-400">
                <span className="text-gray-200 font-medium">{pathway.title}</span>{' '}
                <span className="text-gray-600">
                    · rev {pathway.revision ?? 0} · {pathway.nodes.length} nodes · {completed} done
                </span>
            </div>

            <div className="space-y-0.5">
                {pathway.nodes.map(node => (
                    <NodeRow key={node.id} node={node} copied={copied} onCopy={onCopy} />
                ))}
            </div>

            {totalOutcomes > 0 && (
                <div className="pt-1 mt-1 border-t border-gray-800">
                    <p className="text-[10px] text-gray-500">
                        <Target className="w-2.5 h-2.5 inline-block mr-1 text-gray-600" />
                        Outcomes: <span className="text-gray-300">{bound} / {totalOutcomes}</span>{' '}
                        bound
                    </p>
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Simulator form — the custom-event tail of section 4
// ---------------------------------------------------------------------------

interface CustomClaimForm {
    type: string;
    issuer: string;
    boostUri: string;
    tags: string;
}

const emptyForm: CustomClaimForm = {
    type: '',
    issuer: 'did:example:demo-issuer',
    boostUri: '',
    tags: '',
};

const CustomClaimForm: React.FC<{
    onFire: (form: CustomClaimForm) => void;
}> = ({ onFire }) => {
    const [form, setForm] = useState<CustomClaimForm>(emptyForm);
    const [open, setOpen] = useState(false);

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-[10px] text-gray-500 hover:text-gray-300 underline underline-offset-2"
            >
                Custom claim event →
            </button>
        );
    }

    return (
        <div className="space-y-1.5 bg-gray-900/40 rounded p-2">
            <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-medium">Custom claim</span>

                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-[9px] text-gray-600 hover:text-gray-400"
                >
                    hide
                </button>
            </div>

            {(['type', 'issuer', 'boostUri', 'tags'] as const).map(field => (
                <div key={field} className="flex items-center gap-1.5">
                    <label className="text-[9px] text-gray-500 w-14 shrink-0">{field}</label>

                    <input
                        type="text"
                        value={form[field]}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                        placeholder={
                            field === 'type'
                                ? 'AWSCertifiedCloudPractitioner'
                                : field === 'issuer'
                                  ? 'did:web:aws.example'
                                  : field === 'boostUri'
                                    ? 'boost:aws-ccp-credential'
                                    : 'IAM,security (comma-separated)'
                        }
                        className="flex-1 text-[10px] font-mono bg-gray-950 border border-gray-800 rounded px-1.5 py-0.5 text-gray-200 placeholder:text-gray-700 focus:outline-none focus:border-sky-700"
                    />
                </div>
            ))}

            <div className="flex items-center gap-1.5 pt-1">
                <button
                    type="button"
                    onClick={() => onFire(form)}
                    disabled={!form.type && !form.boostUri && !form.tags}
                    className="text-[10px] bg-sky-700 hover:bg-sky-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white px-2 py-0.5 rounded"
                >
                    Fire event
                </button>

                <button
                    type="button"
                    onClick={() => setForm(emptyForm)}
                    className="text-[10px] text-gray-500 hover:text-gray-300"
                >
                    reset
                </button>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main tab component
// ---------------------------------------------------------------------------

export const PathwaysDebugTab: React.FC = () => {
    const [copied, copyToClipboard] = useCopyToClipboard();
    const [exportCopied, setExportCopied] = useState(false);

    // Install the recorder once on first render so the timeline captures
    // dispatches the whole time the debug panel is mounted. Idempotent
    // inside the installer — safe against React strict-mode double-mount.
    useEffect(() => {
        installPathwayDebugRecorder();
    }, []);

    // -----------------------------------------------------------------
    // Event timeline state
    // -----------------------------------------------------------------

    const [events, setEvents] = useState<PathwayDebugEvent[]>(() =>
        getPathwayDebugEvents(),
    );

    useEffect(() => {
        // Seed with any pre-existing buffered events on mount — the
        // recorder may have captured dispatches before this tab was
        // first rendered.
        setEvents(getPathwayDebugEvents());

        const unsubscribe = subscribeToPathwayDebugEvents(() => {
            setEvents(getPathwayDebugEvents());
        });

        return unsubscribe;
    }, []);

    // Translate debug events → TimelineEvent (rename `timestamp` stays
    // identical; both types share the shape. Map level, type, message
    // verbatim; expose data as the JSON blob.)
    const timelineEvents: TimelineEvent[] = useMemo(
        () =>
            events.map(e => ({
                id: e.id,
                type: e.type.replace('pathway:', ''),
                message: e.message,
                timestamp: e.timestamp,
                level: e.level,
                data: e.data,
            })),
        [events],
    );

    // -----------------------------------------------------------------
    // Reactive pathway state
    // -----------------------------------------------------------------

    const pathways = pathwayStore.use.pathways();
    const activePathway = pathwayStore.use.activePathway();
    const proposals = proposalStore.use.proposals();

    const openProposalCount = useMemo(
        () => Object.values(proposals).filter(p => p.status === 'open').length,
        [proposals],
    );

    const lastEvent = events.length > 0 ? events[0] : null;

    // -----------------------------------------------------------------
    // Simulator handlers
    // -----------------------------------------------------------------

    const dev = getDev();

    const handleAwsClaim = useCallback(() => {
        const d = getDev();

        if (!d) {
            emitPathwayDebugEvent(
                'pathway:simulator-fired',
                'Dev globals not available — are you on /pathways?',
                { level: 'warning' },
            );

            return;
        }

        emitPathwayDebugEvent(
            'pathway:simulator-fired',
            'Preset: AWS CCP claim',
            { level: 'info', data: { type: 'AWSCertifiedCloudPractitioner' } },
        );

        d.simulateCredentialClaim({
            type: 'AWSCertifiedCloudPractitioner',
            issuer: 'did:web:aws.example',
        });
    }, []);

    const handleIamSession = useCallback(() => {
        const d = getDev();

        if (!d) return;

        emitPathwayDebugEvent(
            'pathway:simulator-fired',
            'Preset: IAM tutor finish',
            { level: 'info', data: { topicUri: 'boost:aws-iam-deep-dive' } },
        );

        d.simulateAiSessionFinish({
            topicUri: 'boost:aws-iam-deep-dive',
            durationSec: 420,
        });
    }, []);

    const handleNonMatching = useCallback(() => {
        const d = getDev();

        if (!d) return;

        emitPathwayDebugEvent(
            'pathway:simulator-fired',
            'Preset: non-matching credential (control)',
            { level: 'info', data: { type: 'UnrelatedCourseCertificate' } },
        );

        d.simulateCredentialClaim({
            type: 'UnrelatedCourseCertificate',
            issuer: 'did:example:random',
        });
    }, []);

    const handleCustomFire = useCallback((form: CustomClaimForm) => {
        const d = getDev();

        if (!d) return;

        emitPathwayDebugEvent('pathway:simulator-fired', 'Custom claim fired', {
            level: 'info',
            data: { ...form },
        });

        d.simulateCredentialClaim({
            ...(form.type ? { type: form.type } : {}),
            ...(form.issuer ? { issuer: form.issuer } : {}),
            ...(form.boostUri ? { boostUri: form.boostUri } : {}),
            ...(form.tags
                ? {
                      tags: form.tags
                          .split(',')
                          .map(t => t.trim())
                          .filter(Boolean),
                  }
                : {}),
        });
    }, []);

    // -----------------------------------------------------------------
    // Danger-zone handlers
    // -----------------------------------------------------------------

    const handleSeedAws = useCallback(() => {
        const d = getDev();

        if (!d) return;

        // Prefer the DID from any existing pathway so reseeding on the
        // same account doesn't create an orphan with a mismatched owner.
        const existingDid = Object.values(pathwayStore.get.pathways())[0]?.ownerDid;
        const did = existingDid ?? 'did:example:alice';

        d.seedAws(did);

        emitPathwayDebugEvent('pathway:manual-note', `Seeded AWS demo for ${did}`, {
            level: 'success',
            data: { ownerDid: did },
        });
    }, []);

    const handleResetAll = useCallback(() => {
        const d = getDev();

        if (!d) return;

        d.resetAll();
        clearPathwayDebugEvents();

        emitPathwayDebugEvent('pathway:manual-note', 'Reset pathways + proposals', {
            level: 'warning',
        });
    }, []);

    // -----------------------------------------------------------------
    // Timeline actions
    // -----------------------------------------------------------------

    const handleExportEvents = useCallback(async () => {
        const payload = JSON.stringify(
            events.map(e => ({
                ...e,
                timestamp: e.timestamp.toISOString(),
            })),
            null,
            2,
        );

        try {
            await navigator.clipboard.writeText(payload);
            setExportCopied(true);
            setTimeout(() => setExportCopied(false), 1500);
        } catch {
            // ignore — clipboard not available
        }
    }, [events]);

    // -----------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------

    return (
        <div className="space-y-2">
            {/* ─── Section 1: Reactor status ─── */}
            <Section
                title="Reactor"
                icon={<Activity className="w-3 h-3 text-gray-500" />}
                defaultOpen
                badge={
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                        live
                    </span>
                }
            >
                <div className="space-y-0.5">
                    <KVRow
                        label="Dev globals"
                        value={dev ? 'attached' : 'not available'}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />

                    <KVRow
                        label="Pathways loaded"
                        value={Object.keys(pathways).length}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />

                    <KVRow
                        label="Open proposals"
                        value={openProposalCount}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />

                    <KVRow
                        label="Dispatches (session)"
                        value={events.length}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />

                    <KVRow
                        label="Last dispatch"
                        value={
                            lastEvent
                                ? `${lastEvent.message} · ${lastEvent.timestamp.toLocaleTimeString()}`
                                : '—'
                        }
                        mono={false}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                </div>
            </Section>

            {/* ─── Section 2: Active pathway snapshot ─── */}
            <Section
                title="Active pathway"
                icon={<GitBranch className="w-3 h-3 text-gray-500" />}
                defaultOpen
                badge={
                    activePathway ? (
                        <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded-full font-medium">
                            {activePathway.nodes.length} nodes
                        </span>
                    ) : undefined
                }
            >
                <PathwaySnapshot
                    pathway={activePathway}
                    copied={copied}
                    onCopy={copyToClipboard}
                />
            </Section>

            {/* ─── Section 3: Event timeline ─── */}
            <EventTimeline
                events={timelineEvents}
                copied={copied}
                onCopy={copyToClipboard}
                onClear={clearPathwayDebugEvents}
                onExport={handleExportEvents}
                exportCopied={exportCopied}
                title="Dispatches"
                emptyMessage="Dispatches appear as events flow through the reactor"
            />

            {/* ─── Section 4: Simulator ─── */}
            <Section
                title="Simulator"
                icon={<Zap className="w-3 h-3 text-gray-500" />}
                defaultOpen
            >
                <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-1">
                        <button
                            type="button"
                            onClick={handleAwsClaim}
                            disabled={!dev}
                            className="flex items-center gap-1.5 text-[11px] bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-600 text-white px-2 py-1 rounded transition-colors"
                        >
                            <Award className="w-3 h-3" />
                            Claim AWS CCP credential
                        </button>

                        <button
                            type="button"
                            onClick={handleIamSession}
                            disabled={!dev}
                            className="flex items-center gap-1.5 text-[11px] bg-sky-700 hover:bg-sky-600 disabled:bg-gray-800 disabled:text-gray-600 text-white px-2 py-1 rounded transition-colors"
                        >
                            <Play className="w-3 h-3" />
                            Finish IAM tutor session
                        </button>

                        <button
                            type="button"
                            onClick={handleNonMatching}
                            disabled={!dev}
                            className="flex items-center gap-1.5 text-[11px] bg-gray-800 hover:bg-gray-700 disabled:text-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
                        >
                            <Package className="w-3 h-3" />
                            Non-matching credential (control)
                        </button>
                    </div>

                    <CustomClaimForm onFire={handleCustomFire} />

                    {!dev && (
                        <p className="text-[9px] text-yellow-500 flex items-start gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 shrink-0 mt-0.5" />
                            <span>
                                Dev globals not loaded. Navigate to{' '}
                                <code className="text-cyan-400">/pathways</code> once to install
                                them.
                            </span>
                        </p>
                    )}
                </div>
            </Section>

            {/* ─── Section 5: Danger zone ─── */}
            <Section
                title="Danger zone"
                icon={<Hammer className="w-3 h-3 text-red-500" />}
            >
                <div className="space-y-1">
                    <button
                        type="button"
                        onClick={handleSeedAws}
                        disabled={!dev}
                        className="w-full flex items-center gap-1.5 text-[11px] bg-gray-800 hover:bg-gray-700 disabled:text-gray-600 text-gray-200 px-2 py-1 rounded transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Seed AWS demo pathway
                    </button>

                    <button
                        type="button"
                        onClick={handleResetAll}
                        disabled={!dev}
                        className="w-full flex items-center gap-1.5 text-[11px] bg-red-900/60 hover:bg-red-800/80 disabled:bg-gray-800 disabled:text-gray-600 text-red-200 px-2 py-1 rounded transition-colors"
                    >
                        <AlertTriangle className="w-3 h-3" />
                        Reset all (pathways + proposals + timeline)
                    </button>

                    <p className="text-[9px] text-gray-600 leading-tight pt-0.5">
                        Reset clears the pathway store, proposal store, reactor dispatch history,
                        and this timeline. Use before a fresh seed.
                    </p>
                </div>
            </Section>
        </div>
    );
};

export default PathwaysDebugTab;
