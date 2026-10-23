/**
 * InAppMessagesDebugTab — in-panel replacement for the `__inAppMessages`
 * console devtools (which remain available for scouts / non-panel contexts).
 *
 * Mirrors the shape of the other debug tabs — uses the shared `Section`,
 * `KVRow`, and `useCopyToClipboard` primitives from `debugComponents.tsx`.
 *
 * Sections, top-to-bottom:
 *
 *   1. **Status** — presentation gate result (the #1 "why isn't it showing?"
 *      answer), runtime context (platform/role/versions), flag parse state,
 *      tracing toggle, active override indicator.
 *   2. **Flag messages** — one row per message in the LaunchDarkly flag with
 *      matched/suppressed/willShow state, expandable predicate trace, and a
 *      Force-show button. Header actions reset seen-state.
 *   3. **Preview** — one-click template presets + a raw JSON previewer, both
 *      routed through the debug override store (bypass gate/targeting/
 *      frequency, never mark seen).
 *   4. **Targeting dry-run** — evaluates any flag message or the builder
 *      draft against a matrix of simulated contexts (platform × old/new
 *      versions), catching "matches nobody / everybody" mistakes before a
 *      flag goes live. Powered by the pure `messageMatches` evaluator.
 *   5. **Builder** — form-driven composer producing paste-ready flag JSON.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
    AlertTriangle,
    Eye,
    FlaskConical,
    ListChecks,
    MessageSquare,
    Radio,
    Wand2,
} from 'lucide-react';

import { inAppMessageValidator, type InAppMessage } from '@learncard/types';
import {
    getLastInAppMessages,
    getMessageLastSeen,
    getInAppMessageFatigueState,
    isInAppMessagesDebug,
    clearInAppMessageEvents,
    emitInAppMessageEvent,
    messageMatches,
    resetInAppMessageFatigue,
    resetInAppMessageDismissals,
    setInAppMessageOverride,
    setInAppMessagesDebug,
    useInAppMessagePresentationGate,
    useInAppMessageOverride,
    useInAppMessages,
    type InAppMessageDiagnostic,
    type InAppMessageRuntimeContext,
    type PredicateTrace,
} from 'learn-card-base';

import { KVRow, Section, useCopyToClipboard } from './debugComponents';
import {
    IN_APP_MESSAGE_TEMPLATES,
    IN_APP_MESSAGE_TEMPLATE_CATEGORIES,
} from './inAppMessageTemplates';
import { InAppMessageBuilder, debugFieldInputStyle } from './InAppMessageBuilder';
import {
    CREDENTIAL_LIBRARY_CLR_ISSUER,
    CREDENTIAL_PRESETS,
    buildCredentialDryRunContext,
    explainDryRunFailure,
    summarizeCredentialLibraryClr,
} from './inAppMessageDryRun';

const frequencyLabel = (message: InAppMessage | undefined): string => {
    if (!message) return '—';

    const f = message.frequency;

    return typeof f === 'object' ? `every ${f.everyDays}d` : f;
};

const TraceNode: React.FC<{ trace: PredicateTrace; depth?: number }> = ({ trace, depth = 0 }) => (
    <div style={{ paddingLeft: depth * 10 }}>
        <div className="flex items-start gap-1.5 py-0.5">
            <span
                className={`w-1.5 h-1.5 rounded-full mt-[4px] shrink-0 ${
                    trace.result ? 'bg-emerald-400' : 'bg-red-400'
                }`}
            />

            <span className="text-[9px] text-gray-400 font-mono wrap-break-word">
                {trace.label}
            </span>
        </div>

        {trace.children?.map((child, i) => (
            <TraceNode key={i} trace={child} depth={depth + 1} />
        ))}
    </div>
);

const diagnosticDot = (d: InAppMessageDiagnostic): string => {
    if (!d.enabled) return 'bg-gray-600';
    if (d.willShow) return 'bg-emerald-400';
    if (d.matched && d.suppressed) return 'bg-yellow-400';

    return 'bg-red-400';
};

const diagnosticStatus = (d: InAppMessageDiagnostic): string => {
    if (!d.enabled) return 'disabled';
    if (d.willShow) return 'will show';
    if (!d.triggerSatisfied) return 'trigger waiting';
    if (d.fatigueSuppressed) return 'fatigue suppressed';
    if (d.matched && d.suppressed) return 'suppressed';

    return 'no match';
};

const MessageRow: React.FC<{
    diagnostic: InAppMessageDiagnostic;
    message: InAppMessage | undefined;
    lastSeen: string | undefined;
    copied: string | null;
    onCopy: (key: string, value: unknown) => void;
    onForceShow: (message: InAppMessage) => void;
}> = ({ diagnostic, message, lastSeen, copied, onCopy, onForceShow }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-gray-900/60 rounded-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setExpanded(e => !e)}
                className="w-full px-2 py-1.5 flex items-center gap-2 text-left hover:bg-gray-900/90 transition-colors"
            >
                <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${diagnosticDot(diagnostic)}`}
                />

                <span className="flex-1 min-w-0 text-[11px] text-gray-300 truncate font-mono">
                    {diagnostic.id}
                </span>

                <span className="text-[9px] text-gray-500 font-mono shrink-0">
                    p{diagnostic.priority}
                </span>

                <span className="text-[9px] text-gray-500 shrink-0">
                    {diagnosticStatus(diagnostic)}
                </span>
            </button>

            {expanded && (
                <div className="px-2 pb-2 space-y-v3-1.5">
                    <div className="grid grid-cols-2 gap-x-2 text-[9px] text-gray-500">
                        <span>
                            presentation:{' '}
                            <span className="text-gray-300">{message?.presentation ?? '—'}</span>
                        </span>

                        <span>
                            frequency:{' '}
                            <span className="text-gray-300">{frequencyLabel(message)}</span>
                        </span>

                        <span>
                            matched:{' '}
                            <span
                                className={diagnostic.matched ? 'text-emerald-400' : 'text-red-400'}
                            >
                                {String(diagnostic.matched)}
                            </span>
                        </span>

                        <span>
                            suppressed:{' '}
                            <span
                                className={
                                    diagnostic.suppressed ? 'text-yellow-400' : 'text-gray-300'
                                }
                            >
                                {String(diagnostic.suppressed)}
                            </span>
                        </span>

                        <span className="col-span-2">
                            last seen: <span className="text-gray-300">{lastSeen ?? 'never'}</span>
                        </span>
                    </div>

                    {diagnostic.trace ? (
                        <div>
                            <p className="text-[9px] text-gray-600 uppercase tracking-wider">
                                Targeting trace
                            </p>

                            <div className="bg-gray-950 rounded-sm p-1.5 mt-0.5">
                                <TraceNode trace={diagnostic.trace} />
                            </div>
                        </div>
                    ) : (
                        <p className="text-[9px] text-gray-600 italic">
                            No targeting — matches everyone.
                        </p>
                    )}

                    <div className="flex items-center gap-1.5">
                        {message && (
                            <button
                                type="button"
                                onClick={() => onForceShow(message)}
                                className="flex items-center gap-1 text-[10px] bg-sky-700 hover:bg-sky-600 text-white px-2 py-0.5 rounded-sm transition-colors"
                            >
                                <Eye className="w-2.5 h-2.5" />
                                Force show
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() =>
                                onCopy(
                                    `msg-${diagnostic.id}`,
                                    JSON.stringify(message ?? diagnostic, null, 2)
                                )
                            }
                            className="text-[9px] text-gray-600 hover:text-gray-400"
                        >
                            {copied === `msg-${diagnostic.id}` ? 'Copied!' : 'Copy JSON'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const OLD_VERSION = '0.0.1';
const NEW_VERSION = '999.0.0';

interface DryRunScenario {
    label: string;
    context: Pick<InAppMessageRuntimeContext, 'platform' | 'versions'>;
}

const DRY_RUN_SCENARIOS: DryRunScenario[] = [
    {
        label: 'iOS · old versions',
        context: {
            platform: 'ios',
            versions: { native: OLD_VERSION, capgo: OLD_VERSION, web: OLD_VERSION },
        },
    },
    {
        label: 'iOS · new versions',
        context: {
            platform: 'ios',
            versions: { native: NEW_VERSION, capgo: NEW_VERSION, web: NEW_VERSION },
        },
    },
    {
        label: 'Android · old versions',
        context: {
            platform: 'android',
            versions: { native: OLD_VERSION, capgo: OLD_VERSION, web: OLD_VERSION },
        },
    },
    {
        label: 'Android · new versions',
        context: {
            platform: 'android',
            versions: { native: NEW_VERSION, capgo: NEW_VERSION, web: NEW_VERSION },
        },
    },
    { label: 'Web · old version', context: { platform: 'web', versions: { web: OLD_VERSION } } },
    { label: 'Web · new version', context: { platform: 'web', versions: { web: NEW_VERSION } } },
];

const DRAFT_OPTION = '__builder_draft__';

const DryRunRow: React.FC<{
    label: string;
    matches: boolean;
    highlight?: boolean;
    failure?: string | null;
}> = ({ label, matches, highlight = false, failure }) => (
    <div
        className={`flex items-center justify-between px-2 py-1 rounded text-[10px] ${
            highlight ? 'bg-gray-900/90 border border-gray-800' : 'bg-gray-900/50'
        }`}
    >
        <span className={highlight ? 'text-gray-200' : 'text-gray-400'}>
            {label}
            {failure && <span className="block text-[9px] text-red-400 break-all">{failure}</span>}
        </span>

        <span className={matches ? 'text-emerald-400' : 'text-red-400'}>
            {matches ? '✓ matches' : '✗ no match'}
        </span>
    </div>
);

const TargetingDryRun: React.FC<{
    flagMessages: InAppMessage[];
    draft: InAppMessage | null;
    currentContext: InAppMessageRuntimeContext | null;
}> = ({ flagMessages, draft, currentContext }) => {
    const [selectedId, setSelectedId] = useState<string>('');
    const [role, setRole] = useState<string>('learner');
    const [simulateClaim, setSimulateClaim] = useState(false);
    const [fixtureIssuer, setFixtureIssuer] = useState(CREDENTIAL_LIBRARY_CLR_ISSUER);

    const selected = useMemo(() => {
        if (selectedId === DRAFT_OPTION) return draft;

        return flagMessages.find(m => m.id === selectedId) ?? null;
    }, [selectedId, draft, flagMessages]);

    const fieldSelectClass =
        'text-[10px] bg-gray-950! border border-gray-600! rounded-sm px-1 py-1 text-gray-100! focus:outline-hidden focus:border-sky-500!';

    return (
        <div className="space-y-v3-1.5">
            <div className="flex items-center gap-1.5">
                <select
                    value={selectedId}
                    onChange={e => setSelectedId(e.target.value)}
                    className={`${fieldSelectClass} flex-1 min-w-0`}
                >
                    <option value="">Pick a message…</option>

                    {draft && <option value={DRAFT_OPTION}>Builder draft ({draft.id})</option>}

                    {flagMessages.map(m => (
                        <option key={m.id} value={m.id}>
                            {m.id}
                        </option>
                    ))}
                </select>

                <label className="text-[9px] text-gray-500 shrink-0">role</label>

                <input
                    type="text"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    style={debugFieldInputStyle}
                    className="w-16 text-[10px] font-mono rounded-sm px-1.5 py-1 placeholder:text-gray-500! caret-sky-400 focus:outline-hidden focus:border-sky-500! focus:ring-1 focus:ring-sky-500/40"
                />
            </div>

            {!selected && (
                <p className="text-[9px] text-gray-600 italic">
                    Select a flag message or a valid builder draft to simulate its targeting against
                    common device contexts.
                </p>
            )}

            {selected && (
                <div className="space-y-v3-0.5">
                    <div className="p-3 bg-white rounded-xl space-y-2 font-poppins">
                        <label
                            className="block text-xs text-grayscale-700"
                            htmlFor="iam-fixture-issuer"
                        >
                            Fixture issuer
                        </label>
                        <input
                            id="iam-fixture-issuer"
                            value={fixtureIssuer}
                            onChange={e => setFixtureIssuer(e.target.value)}
                            className="w-full p-2 bg-white text-grayscale-900 border border-grayscale-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                        <label className="flex items-center gap-2 text-xs text-grayscale-700">
                            <input
                                type="checkbox"
                                checked={simulateClaim}
                                onChange={e => setSimulateClaim(e.target.checked)}
                            />
                            Simulate recent claim
                        </label>
                    </div>
                    {currentContext &&
                        CREDENTIAL_PRESETS.map(preset => {
                            const simulated = buildCredentialDryRunContext(
                                currentContext,
                                preset,
                                simulateClaim,
                                fixtureIssuer
                            );
                            return (
                                <DryRunRow
                                    key={preset}
                                    label={preset}
                                    highlight={preset === 'This device'}
                                    matches={messageMatches(selected, simulated)}
                                    failure={explainDryRunFailure(selected, simulated)}
                                />
                            );
                        })}
                    {DRY_RUN_SCENARIOS.map(scenario => (
                        <DryRunRow
                            key={scenario.label}
                            label={scenario.label}
                            matches={messageMatches(selected, {
                                ...scenario.context,
                                role: role.trim() || null,
                                now: Date.now(),
                                credentials: [],
                                credentialsComplete: true,
                                recentEvents: [],
                            })}
                        />
                    ))}

                    <p className="text-[9px] text-gray-600 leading-tight pt-1">
                        {'Old = '}
                        <code className="text-cyan-400">{OLD_VERSION}</code>
                        {', new = '}
                        <code className="text-cyan-400">{NEW_VERSION}</code>
                        {
                            ' for native/web/capgo. All ✗ or all ✓ across rows usually means the targeting is wrong.'
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export const InAppMessagesDebugTab: React.FC = () => {
    const [copied, copyToClipboard] = useCopyToClipboard();

    const { report, ready, context, credentialFacts } = useInAppMessages(undefined, {
        forceCredentialFacts: true,
    });
    const gate = useInAppMessagePresentationGate();
    const override = useInAppMessageOverride();

    const [tracing, setTracing] = useState<boolean>(() => isInAppMessagesDebug());
    const [resetFeedback, setResetFeedback] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [draft, setDraft] = useState<InAppMessage | null>(null);
    const [factsBusy, setFactsBusy] = useState<'backfill' | 'clear' | null>(null);
    const [factsFeedback, setFactsFeedback] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [credentialFilter, setCredentialFilter] = useState('');
    const [simulatedIssuer, setSimulatedIssuer] = useState(CREDENTIAL_LIBRARY_CLR_ISSUER);
    const [simulatedType, setSimulatedType] = useState('ClrCredential');

    const [, setResetCount] = useState(0);
    const flagMessages = getLastInAppMessages();
    const fatigueState = getInAppMessageFatigueState(credentialFacts.accountDid ?? undefined);
    const visibleSummaries = useMemo(() => {
        const needle = credentialFilter.trim().toLowerCase();

        if (!needle) return credentialFacts.summaries ?? [];

        return (credentialFacts.summaries ?? []).filter(summary =>
            [summary.name, summary.issuer, ...summary.types, ...summary.nestedIssuers]
                .filter(Boolean)
                .some(value => value?.toLowerCase().includes(needle))
        );
    }, [credentialFacts.summaries, credentialFilter]);

    const handleToggleTracing = useCallback(() => {
        setTracing(prev => {
            setInAppMessagesDebug(!prev);

            return !prev;
        });
    }, []);

    const handleReset = useCallback(() => {
        resetInAppMessageDismissals();
        setResetCount(c => c + 1);
        setResetFeedback(true);
        setTimeout(() => setResetFeedback(false), 1500);
    }, []);

    const handlePreviewTemplate = useCallback((json: Record<string, unknown>) => {
        const result = inAppMessageValidator.safeParse(json);

        if (result.success) setInAppMessageOverride(result.data);
    }, []);

    const handlePreviewJson = useCallback(() => {
        setJsonError(null);

        let raw: unknown;

        try {
            raw = JSON.parse(jsonInput);
        } catch {
            setJsonError('Invalid JSON — check for trailing commas or unquoted keys.');

            return;
        }

        const withId = { id: `preview-${Date.now()}`, ...(raw as Record<string, unknown>) };
        const result = inAppMessageValidator.safeParse(withId);

        if (!result.success) {
            const issue = result.error.issues[0];

            setJsonError(`${issue.path.join('.') || 'message'}: ${issue.message}`);

            return;
        }

        setInAppMessageOverride(result.data);
    }, [jsonInput]);

    const handleFactsAction = useCallback(
        async (action: 'backfill' | 'clear') => {
            setFactsFeedback(null);
            setFactsBusy(action);

            try {
                if (!credentialFacts.accountDid) {
                    setFactsFeedback({
                        type: 'error',
                        message: 'Sign in to refresh credential facts.',
                    });

                    return;
                }

                if (action === 'backfill') await credentialFacts.backfillNow();
                else await credentialFacts.clearFacts();
                setFactsFeedback({
                    type: 'success',
                    message:
                        action === 'backfill'
                            ? 'Backfill complete. Credential facts refreshed.'
                            : 'Credential facts cleared.',
                });
            } catch {
                setFactsFeedback({
                    type: 'error',
                    message:
                        action === 'backfill'
                            ? 'Backfill failed. Check your connection and try again.'
                            : 'Could not clear credential facts. Please try again.',
                });
            } finally {
                setFactsBusy(null);
            }
        },
        [credentialFacts]
    );

    return (
        <div className="space-y-v3-2">
            <Section
                title="Status"
                icon={<Radio className="w-3 h-3 text-gray-500" />}
                defaultOpen
                badge={
                    <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                            gate.canPresent
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                    >
                        {gate.canPresent ? 'gate open' : gate.reason}
                    </span>
                }
            >
                <div className="space-y-v3-0.5">
                    <KVRow
                        label="Gate"
                        value={`${gate.canPresent ? 'open' : 'closed'} (${gate.reason})`}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="Context ready"
                        value={ready}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="Platform"
                        value={context?.platform}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="Role"
                        value={context?.role}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="native version"
                        value={context?.versions?.native}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="web version"
                        value={context?.versions?.web}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="capgo version"
                        value={context?.versions?.capgo}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="Flag messages"
                        value={report.flagMessageCount}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="Winner"
                        value={report.winnerId}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="Credential facts"
                        value={`${credentialFacts.summaries?.length ?? 0}/${credentialFacts.total} (${
                            credentialFacts.complete ? 'complete' : 'incomplete'
                        })`}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="Decrypt reads"
                        value={`${credentialFacts.readsUsed}/200`}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="Recent events"
                        value={context?.recentEvents.length ?? 0}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="Blocking shown"
                        value={fatigueState.blockingShownThisSession}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="Last blocking shown"
                        value={fatigueState.lastBlockingShown}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="Override active"
                        value={override ? override.id : false}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                </div>

                <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                    <button
                        type="button"
                        onClick={handleToggleTracing}
                        className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                            tracing
                                ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        }`}
                    >
                        Tracing {tracing ? 'ON' : 'OFF'}
                    </button>

                    <button
                        type="button"
                        onClick={() => void handleFactsAction('backfill')}
                        disabled={factsBusy !== null}
                        className="text-xs bg-grayscale-800 hover:bg-grayscale-700 disabled:opacity-40 text-white px-3 py-2 rounded-[20px] transition-colors"
                    >
                        {factsBusy === 'backfill' ? 'Backfilling…' : 'Backfill now'}
                    </button>

                    <button
                        type="button"
                        onClick={() => void handleFactsAction('clear')}
                        disabled={factsBusy !== null}
                        className="text-xs bg-grayscale-800 hover:bg-grayscale-700 disabled:opacity-40 text-white px-3 py-2 rounded-[20px] transition-colors"
                    >
                        {factsBusy === 'clear' ? 'Clearing…' : 'Clear facts'}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            resetInAppMessageFatigue();
                            setResetCount(count => count + 1);
                        }}
                        className="text-xs bg-grayscale-800 hover:bg-grayscale-700 text-white px-3 py-2 rounded-[20px] transition-colors"
                    >
                        Reset cap
                    </button>

                    <button
                        type="button"
                        onClick={handleReset}
                        className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-0.5 rounded-sm transition-colors"
                    >
                        {resetFeedback ? 'Cleared!' : 'Reset seen state'}
                    </button>

                    {override && (
                        <button
                            type="button"
                            onClick={() => setInAppMessageOverride(null)}
                            className="text-[10px] bg-yellow-800/70 hover:bg-yellow-700/70 text-yellow-200 px-2 py-0.5 rounded-sm transition-colors"
                        >
                            Clear override
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() =>
                            copyToClipboard('full-report', JSON.stringify(report, null, 2))
                        }
                        className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-0.5 rounded-sm transition-colors"
                    >
                        {copied === 'full-report' ? 'Copied!' : 'Copy report'}
                    </button>
                </div>

                {factsFeedback && (
                    <div
                        role={factsFeedback.type === 'error' ? 'alert' : 'status'}
                        className={`mt-2 p-3 rounded-2xl border text-xs leading-relaxed ${
                            factsFeedback.type === 'success'
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                : 'bg-red-50 border-red-100 text-red-700'
                        }`}
                    >
                        {factsFeedback.message}
                    </div>
                )}
            </Section>

            <Section
                title="Credential facts & events"
                icon={<FlaskConical className="w-3 h-3 text-grayscale-400" />}
            >
                <p className="text-xs text-grayscale-400 leading-relaxed">
                    Credential data shown here never leaves this device.
                </p>

                <input
                    aria-label="Filter credential facts by name, issuer, or type"
                    type="text"
                    value={credentialFilter}
                    onChange={event => setCredentialFilter(event.target.value)}
                    placeholder="Filter by name, issuer, or type"
                    className="w-full text-xs rounded-xl px-3 py-2 bg-white text-grayscale-900 placeholder:text-grayscale-400 border border-grayscale-300 focus:ring-2 focus:ring-emerald-500"
                />

                <div className="space-y-1 max-h-36 overflow-y-auto">
                    <p className="text-xs text-grayscale-400">
                        {visibleSummaries.length} matching summaries
                    </p>
                    {visibleSummaries.map(summary => (
                        <div key={summary.uri} className="bg-white rounded-xl p-3 font-poppins">
                            {summary.name && (
                                <p className="text-xs font-medium text-grayscale-900 truncate">
                                    {summary.name}
                                </p>
                            )}
                            <p className="text-xs text-grayscale-900 font-mono truncate">
                                {summary.uri}
                            </p>
                            <p className="text-xs text-grayscale-600 truncate">
                                {summary.issuer ?? 'unknown issuer'} ·{' '}
                                {summary.types.join(', ') || 'unknown type'}
                            </p>
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        copyToClipboard('credential-rule', {
                                            credential: {
                                                ...(summary.issuer
                                                    ? { issuers: [summary.issuer] }
                                                    : {}),
                                                ...(summary.types.length > 0
                                                    ? { vcTypes: [summary.types.at(-1)] }
                                                    : {}),
                                            },
                                        })
                                    }
                                    className="text-xs text-grayscale-700 hover:bg-grayscale-100 rounded-[20px] px-2 py-1"
                                >
                                    {copied === 'credential-rule' ? 'Copied!' : 'Copy as rule'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        emitInAppMessageEvent('credential.claimed', {
                                            credential: summary,
                                            ...(credentialFacts.accountDid
                                                ? { accountDid: credentialFacts.accountDid }
                                                : {}),
                                        })
                                    }
                                    className="text-xs text-grayscale-700 hover:bg-grayscale-100 rounded-[20px] px-2 py-1"
                                >
                                    Simulate claim
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            emitInAppMessageEvent('app.opened', {
                                ...(credentialFacts.accountDid
                                    ? { accountDid: credentialFacts.accountDid }
                                    : {}),
                            })
                        }
                        className="text-xs bg-grayscale-800 hover:bg-grayscale-700 text-white px-3 py-2 rounded-[20px]"
                    >
                        Emit app.opened
                    </button>
                    <button
                        type="button"
                        onClick={clearInAppMessageEvents}
                        className="text-xs bg-grayscale-800 hover:bg-grayscale-700 text-white px-3 py-2 rounded-[20px]"
                    >
                        Clear events
                    </button>
                </div>

                <div className="p-3 bg-white rounded-xl space-y-3 font-poppins">
                    <p className="text-xs text-grayscale-700">
                        Simulate a claim without adding a credential.
                    </p>
                    <label className="block text-xs text-grayscale-700" htmlFor="iam-event-issuer">
                        Issuer
                    </label>
                    <input
                        id="iam-event-issuer"
                        value={simulatedIssuer}
                        onChange={e => setSimulatedIssuer(e.target.value)}
                        className="w-full p-2 rounded-xl bg-white text-grayscale-900 border border-grayscale-300 focus:ring-2 focus:ring-emerald-500"
                    />
                    <label className="block text-xs text-grayscale-700" htmlFor="iam-event-type">
                        Credential type
                    </label>
                    <input
                        id="iam-event-type"
                        value={simulatedType}
                        onChange={e => setSimulatedType(e.target.value)}
                        className="w-full p-2 rounded-xl bg-white text-grayscale-900 border border-grayscale-300 focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                        type="button"
                        onClick={() =>
                            emitInAppMessageEvent('credential.claimed', {
                                accountDid: credentialFacts.accountDid ?? undefined,
                                credential: summarizeCredentialLibraryClr(
                                    'debug:claim',
                                    simulatedIssuer,
                                    simulatedType,
                                    new Date().toISOString()
                                ),
                            })
                        }
                        className="py-2 px-3 rounded-[20px] text-xs bg-grayscale-900 text-white hover:opacity-90"
                    >
                        Emit credential.claimed
                    </button>
                </div>

                {(context?.recentEvents ?? []).slice(-10).map((event, index) => (
                    <p
                        key={`${event.occurredAt}-${index}`}
                        className="text-xs text-grayscale-400 font-mono"
                    >
                        {event.event} · {new Date(event.occurredAt).toLocaleTimeString()}
                    </p>
                ))}

                {report.invalid.map((invalid, index) => (
                    <p
                        key={`${invalid.id ?? 'unknown'}-${index}`}
                        className="text-[9px] text-red-400"
                    >
                        Invalid {invalid.id ?? 'message'}: {invalid.error}
                    </p>
                ))}
            </Section>

            <Section
                title="Flag messages"
                icon={<ListChecks className="w-3 h-3 text-gray-500" />}
                defaultOpen
                badge={
                    report.diagnostics.length > 0 ? (
                        <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded-full font-medium">
                            {report.diagnostics.length}
                        </span>
                    ) : undefined
                }
            >
                {report.diagnostics.length === 0 ? (
                    <p className="text-[10px] text-gray-600 italic py-2">
                        {'No messages in the '}
                        <code className="text-cyan-400">inAppMessages</code>
                        {' LaunchDarkly flag (or context not ready yet).'}
                    </p>
                ) : (
                    <div className="space-y-v3-0.5">
                        {report.diagnostics.map(d => (
                            <MessageRow
                                key={d.id}
                                diagnostic={d}
                                message={flagMessages.find(m => m.id === d.id)}
                                lastSeen={getMessageLastSeen(
                                    d.id,
                                    credentialFacts.accountDid ?? undefined
                                )}
                                copied={copied}
                                onCopy={copyToClipboard}
                                onForceShow={m => setInAppMessageOverride(m)}
                            />
                        ))}
                    </div>
                )}
            </Section>

            <Section title="Preview" icon={<Eye className="w-3 h-3 text-gray-500" />}>
                <div className="space-y-v3-2">
                    <div className="space-y-v3-1.5">
                        {IN_APP_MESSAGE_TEMPLATE_CATEGORIES.map(category => (
                            <div key={category}>
                                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">
                                    {category}
                                </p>

                                <div className="grid grid-cols-1 gap-1">
                                    {IN_APP_MESSAGE_TEMPLATES.filter(
                                        t => t.category === category
                                    ).map(t => (
                                        <button
                                            key={t.key}
                                            type="button"
                                            onClick={() => handlePreviewTemplate(t.json)}
                                            title={t.description}
                                            className="flex items-center gap-1.5 text-[11px] bg-gray-800 hover:bg-gray-700 text-gray-200 px-2 py-1 rounded-sm transition-colors text-left"
                                        >
                                            <MessageSquare className="w-3 h-3 shrink-0 text-gray-500" />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-v3-1">
                        <textarea
                            value={jsonInput}
                            onChange={e => setJsonInput(e.target.value)}
                            placeholder='{ "title": "Test", "actions": [{ "label": "OK", "style": "primary", "action": { "type": "dismiss" } }] }'
                            rows={3}
                            style={debugFieldInputStyle}
                            className="w-full text-[10px] font-mono rounded-sm px-1.5 py-1 placeholder:text-gray-500! caret-sky-400 focus:outline-hidden focus:border-sky-500! focus:ring-1 focus:ring-sky-500/40 resize-y"
                        />

                        {jsonError && (
                            <p className="text-[9px] text-red-400 flex items-start gap-1">
                                <AlertTriangle className="w-2.5 h-2.5 shrink-0 mt-0.5" />
                                <span className="wrap-break-word">{jsonError}</span>
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={handlePreviewJson}
                            disabled={!jsonInput.trim()}
                            className="text-[10px] bg-sky-700 hover:bg-sky-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white px-2 py-0.5 rounded-sm transition-colors"
                        >
                            Preview JSON
                        </button>
                    </div>

                    <p className="text-[9px] text-gray-600 leading-tight">
                        Previews bypass the gate, targeting, and frequency, and never mark a message
                        as seen.
                    </p>
                </div>
            </Section>

            <Section
                title="Targeting dry-run"
                icon={<FlaskConical className="w-3 h-3 text-gray-500" />}
            >
                <TargetingDryRun
                    flagMessages={flagMessages}
                    draft={draft}
                    currentContext={context}
                />
            </Section>

            <Section title="Builder" icon={<Wand2 className="w-3 h-3 text-gray-500" />}>
                <InAppMessageBuilder onDraftChange={setDraft} />
            </Section>
        </div>
    );
};

export default InAppMessagesDebugTab;
