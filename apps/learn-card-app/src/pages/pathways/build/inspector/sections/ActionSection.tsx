/**
 * ActionSection — "where does the learner go?" (action).
 *
 * Orthogonal to `What happens here` (policy) and `Done when`
 * (termination). The `ActionDescriptor` answers "when the learner
 * taps the CTA, where do they land?": an in-app route, an App
 * Store listing's launcher, the built-in AI tutor, an external
 * URL, an MCP tool, or nothing (reflection-only nodes).
 *
 * ## Why this lives in its own section
 *
 * Before this section existed, `action` was populated only by CTDL
 * imports, the dev-seed bundle, and programmatic authoring.
 * Builder-authored nodes had no way to wire up a launch, which
 * meant author-built pathways couldn't deep-link to an App Store
 * app or the first-party AI tutor — exactly the things we
 * shipped on the consumer side recently. Adding an author surface
 * closes that loop.
 *
 * ## Hidden on composite nodes
 *
 * A composite node's "action" is implicitly "drill into the nested
 * pathway" — the `CompositeNodeBody` handles that rendering and
 * there's no alternative launch to configure. Rather than render
 * a disabled section, we follow `DoneSection`'s lead and return
 * null when policy is composite. Consistent precedent across the
 * inspector.
 *
 * ## AI session lock-step with termination
 *
 * When the node's termination is `session-completed`, the
 * `topicUri` on the termination and the `ai-session` action must
 * match for the reactor to fire. We don't auto-sync them (the
 * author may deliberately diverge; e.g. a debug node), but we do
 * surface a gentle callout when they drift so the author sees the
 * problem before publishing.
 *
 * ## App-listing picker
 *
 * Three-layer pick surface:
 *   1. A text input for the listing id (power users paste directly).
 *   2. Live resolution via `usePublicListing(listingId)` — when the
 *      id resolves, we show the listing's name + icon + category
 *      right below the input so the author knows they picked the
 *      right thing.
 *   3. A quick-pick rail of curated listings (top 20) to avoid
 *      making authors hunt for the id of apps they've already
 *      installed or browsed. Tapping a quick-pick stamps both
 *      `listingId` AND a fresh `AppListingSnapshot` projected from
 *      the listing's current metadata — so the node stays
 *      renderable offline and surfaces a stable display name even
 *      if the listing's name later drifts.
 */

import React, { useMemo, useState } from 'react';

import { IonIcon } from '@ionic/react';
import {
    alertCircleOutline,
    compassOutline,
    informationCircleOutline,
    linkOutline,
    navigateOutline,
    searchOutline,
    sparklesOutline,
    terminalOutline,
} from 'ionicons/icons';
import type { AppStoreListing } from '@learncard/types';

import type {
    ActionDescriptor,
    AiSessionAction,
    AppListingAction,
    ExternalUrlAction,
    InAppRouteAction,
    McpToolAction,
    NoneAction,
    Pathway,
    PathwayNode,
    Termination,
} from '../../../types';
import { buildAppListingSnapshot } from '../../../core/appListingSnapshot';
import useAppStore from '../../../../launchPad/useAppStore';

import { setAction } from '../../buildOps';
import { summarizeAction } from '../../summarize/summarizeAction';
import { INPUT, LABEL } from '../../shared/inputs';
import Section from '../Section';

// ---------------------------------------------------------------------------
// Kind metadata — the dropdown options.
//
// Ordered by expected author frequency:
//   1. App listing    — the flagship demo path (embed a partner app).
//   2. AI session     — first-party tutor.
//   3. External URL   — ad-hoc issuer or marketing pages.
//   4. In-app route   — deep-link into a specific LearnCard surface.
//   5. MCP tool       — power-user agent invocation.
//   6. None           — explicit "no launch" for reflective nodes.
// ---------------------------------------------------------------------------

interface ActionKindMeta {
    kind: ActionDescriptor['kind'];
    label: string;
    icon: string;
    blurb: string;
}

const ACTION_KIND_META: readonly ActionKindMeta[] = [
    {
        kind: 'app-listing',
        label: 'App Store listing',
        icon: compassOutline,
        blurb: 'Launch a registered LearnCard app.',
    },
    {
        kind: 'ai-session',
        label: 'AI tutor session',
        icon: sparklesOutline,
        blurb: "Launch LearnCard's first-party AI tutor on a topic.",
    },
    {
        kind: 'external-url',
        label: 'External URL',
        icon: linkOutline,
        blurb: 'Open a link in a new tab.',
    },
    {
        kind: 'in-app-route',
        label: 'LearnCard page',
        icon: navigateOutline,
        blurb: 'Deep-link into a specific LearnCard screen.',
    },
    {
        kind: 'mcp-tool',
        label: 'MCP tool',
        icon: terminalOutline,
        blurb: 'Invoke an MCP-registered tool.',
    },
    {
        kind: 'none',
        label: 'No launch',
        icon: informationCircleOutline,
        blurb: 'Reflection-only node; the CTA is local.',
    },
];

/**
 * Defaults for each action kind. Consumed when the author switches
 * kinds via the dropdown — we stamp a Zod-shaped (possibly empty)
 * action and let the variant editor fill in the specifics.
 *
 * Zod-invalid empty strings for required fields are intentional
 * here: publish-time validation catches them with the same banner
 * the pathway-level validator uses for other half-filled authoring
 * state. In-flight edit states are allowed to be invalid.
 */
const DEFAULT_ACTION_BY_KIND: Record<
    ActionDescriptor['kind'],
    ActionDescriptor
> = {
    none: { kind: 'none' } satisfies NoneAction,
    'in-app-route': {
        kind: 'in-app-route',
        to: '',
    } satisfies InAppRouteAction,
    'app-listing': {
        kind: 'app-listing',
        listingId: '',
    } satisfies AppListingAction,
    'ai-session': {
        kind: 'ai-session',
        topicUri: '',
    } satisfies AiSessionAction,
    'external-url': {
        kind: 'external-url',
        url: '',
    } satisfies ExternalUrlAction,
    'mcp-tool': {
        kind: 'mcp-tool',
        ref: { serverId: '', toolName: '' },
    } satisfies McpToolAction,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ActionSectionProps {
    pathway: Pathway;
    node: PathwayNode;
    onChangePathway: (next: Pathway) => void;
}

const ActionSection: React.FC<ActionSectionProps> = ({
    pathway,
    node,
    onChangePathway,
}) => {
    // Composite nodes' launch is implicitly "drill into the nested
    // pathway". No action editor is meaningful here — match the
    // pattern DoneSection uses for the same reason.
    if (node.stage.policy.kind === 'composite') return null;

    const action = node.action;
    const summary = summarizeAction(action);

    const commit = (next: ActionDescriptor | null) =>
        onChangePathway(setAction(pathway, node.id, next));

    /**
     * Switch action kind. Stamps the default shape for the new
     * kind so the variant editor below has a non-null value to
     * read. An explicit `'unset'` sentinel clears the action
     * entirely (back to `undefined` on the node).
     */
    const handleKindChange = (raw: string) => {
        if (raw === 'unset') {
            commit(null);
            return;
        }

        const nextKind = raw as ActionDescriptor['kind'];

        if (action?.kind === nextKind) return;

        commit(DEFAULT_ACTION_BY_KIND[nextKind]);
    };

    // `'unset'` is the dropdown's "not configured" option. We
    // surface it as "Not configured — CTA is local only" in the
    // copy below to make author intent explicit (distinct from
    // picking `'none'`, which says "I explicitly chose no launch").
    const selectValue: string = action?.kind ?? 'unset';

    return (
        <Section
            icon={compassOutline}
            title="Where to act"
            summary={summary}
            iconTone="emerald"
            defaultOpen={false}
        >
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className={LABEL} htmlFor="action-kind">
                        Launch destination
                    </label>

                    <select
                        id="action-kind"
                        className={INPUT}
                        value={selectValue}
                        onChange={e => handleKindChange(e.target.value)}
                    >
                        <option value="unset">Not configured</option>

                        {ACTION_KIND_META.map(meta => (
                            <option key={meta.kind} value={meta.kind}>
                                {meta.label}
                            </option>
                        ))}
                    </select>

                    {/*
                        Blurb below the dropdown. When no action is
                        set, say so plainly; otherwise surface the
                        kind's short blurb for author context.
                    */}
                    <p className="text-[11px] text-grayscale-500 leading-snug">
                        {action
                            ? (ACTION_KIND_META.find(m => m.kind === action.kind)
                                  ?.blurb ?? '')
                            : 'Leave unset to let the node fall back to the legacy earn-url / MCP policy path.'}
                    </p>
                </div>

                {/*
                    Variant body — renders the kind-specific fields.
                    Bail early when no action: the dropdown is enough
                    UI on its own for the "not configured" state.
                */}
                {action && (
                    <VariantEditor
                        action={action}
                        termination={node.stage.termination}
                        onChange={commit}
                    />
                )}
            </div>
        </Section>
    );
};

export default ActionSection;

// ---------------------------------------------------------------------------
// VariantEditor — dispatches on action kind.
// ---------------------------------------------------------------------------

interface VariantEditorProps {
    action: ActionDescriptor;
    termination: Termination;
    onChange: (next: ActionDescriptor) => void;
}

const VariantEditor: React.FC<VariantEditorProps> = ({
    action,
    termination,
    onChange,
}) => {
    switch (action.kind) {
        case 'none':
            return <NoneExplainer />;

        case 'in-app-route':
            return <InAppRouteEditor value={action} onChange={onChange} />;

        case 'app-listing':
            return <AppListingEditor value={action} onChange={onChange} />;

        case 'ai-session':
            return (
                <AiSessionEditor
                    value={action}
                    termination={termination}
                    onChange={onChange}
                />
            );

        case 'external-url':
            return <ExternalUrlEditor value={action} onChange={onChange} />;

        case 'mcp-tool':
            return <McpToolEditor value={action} onChange={onChange} />;
    }
};

// ---------------------------------------------------------------------------
// None — explicit "no launch"
// ---------------------------------------------------------------------------

const NoneExplainer: React.FC = () => (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-grayscale-10 border border-grayscale-200">
        <IonIcon
            icon={informationCircleOutline}
            aria-hidden
            className="text-grayscale-500 text-base mt-0.5 shrink-0"
        />

        <p className="text-xs text-grayscale-600 leading-relaxed">
            This step has no external launch. The CTA resolves to "Mark as
            done" in the node overlay — useful for reflection-only steps
            (journalling, committing to a goal, acknowledging a milestone).
        </p>
    </div>
);

// ---------------------------------------------------------------------------
// In-app route
// ---------------------------------------------------------------------------

const InAppRouteEditor: React.FC<{
    value: InAppRouteAction;
    onChange: (next: InAppRouteAction) => void;
}> = ({ value, onChange }) => (
    <div className="space-y-3">
        <div className="space-y-1.5">
            <label className={LABEL} htmlFor="action-in-app-to">
                Path
            </label>

            <input
                id="action-in-app-to"
                type="text"
                className={INPUT}
                value={value.to}
                onChange={e => onChange({ ...value, to: e.target.value })}
                placeholder="/wallet/credentials"
            />

            <p className="text-[11px] text-grayscale-500 leading-snug">
                An in-app path like <code className="font-mono">/chats</code>{' '}
                or <code className="font-mono">/wallet/credentials</code>.
                Don't include the host.
            </p>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// App listing — picker + manual id + live resolve
// ---------------------------------------------------------------------------

const AppListingEditor: React.FC<{
    value: AppListingAction;
    onChange: (next: AppListingAction) => void;
}> = ({ value, onChange }) => {
    const { useCuratedListApps, usePublicListing } = useAppStore();

    const curatedQuery = useCuratedListApps();
    const resolveQuery = usePublicListing(value.listingId);

    const [search, setSearch] = useState('');

    const curatedApps: AppStoreListing[] = curatedQuery.data ?? [];

    // Filter the curated rail by the author's search string. Kept
    // in-memory (no extra network calls) because the curated list is
    // capped at 20 — cheap to walk per keystroke.
    //
    // Note: `AppStoreListing` (from `@learncard/types`) is snake_case
    // over the wire — `display_name`, `icon_url`, `listing_id`. We
    // adapt to the camelCase `ListingSnapshotInput` at the
    // `buildAppListingSnapshot` call below.
    const filteredApps = useMemo(() => {
        const q = search.trim().toLowerCase();

        if (!q) return curatedApps;

        return curatedApps.filter(listing => {
            const name = (listing.display_name ?? '').toLowerCase();
            const tagline = (listing.tagline ?? '').toLowerCase();

            return name.includes(q) || tagline.includes(q);
        });
    }, [curatedApps, search]);

    /**
     * When the author picks a listing from the quick-pick rail,
     * stamp both the listing id AND a fresh snapshot. The snapshot
     * is the "survive offline + survive listing drift" lever — see
     * `types/action.ts:AppListingSnapshotSchema` for why.
     */
    const handlePickListing = (listing: AppStoreListing) => {
        // `ListingSnapshotInput` takes the registry's snake_case
        // field names (`launch_type`, `icon_url`) directly; the
        // snapshot it produces uses camelCase for storage. Adapter
        // happens inside `buildAppListingSnapshot`, not here.
        const snapshot = buildAppListingSnapshot({
            name: listing.display_name ?? '',
            category: listing.category ?? undefined,
            launch_type: listing.launch_type ?? undefined,
            tagline: listing.tagline ?? undefined,
            icon_url: listing.icon_url ?? undefined,
            semanticTags: undefined,
        });

        onChange({
            kind: 'app-listing',
            listingId: listing.listing_id,
            ...(value.deepLinkSection
                ? { deepLinkSection: value.deepLinkSection }
                : {}),
            ...(snapshot ? { snapshot } : {}),
        });
    };

    const handleListingIdChange = (raw: string) => {
        const listingId = raw.trim();

        // Clearing the id also drops the stale snapshot — keeping
        // the old display name around when the author is typing a
        // different id would confuse the live-resolve panel below.
        if (!listingId) {
            onChange({ kind: 'app-listing', listingId: '' });
            return;
        }

        onChange({
            kind: 'app-listing',
            listingId,
            ...(value.deepLinkSection
                ? { deepLinkSection: value.deepLinkSection }
                : {}),
            // Preserve the existing snapshot only if it belongs to
            // the same id — otherwise it's misleading. Since the id
            // is the one thing that changed here, always drop it.
            // The resolve panel below will offer to refresh.
        });
    };

    const handleDeepLink = (raw: string) => {
        const deepLinkSection = raw.trim();

        onChange({
            kind: 'app-listing',
            listingId: value.listingId,
            ...(deepLinkSection ? { deepLinkSection } : {}),
            ...(value.snapshot ? { snapshot: value.snapshot } : {}),
        });
    };

    const resolved = resolveQuery.data ?? null;

    return (
        <div className="space-y-4">
            {/* Listing id input */}
            <div className="space-y-1.5">
                <label className={LABEL} htmlFor="action-listing-id">
                    Listing ID
                </label>

                <input
                    id="action-listing-id"
                    type="text"
                    className={INPUT}
                    value={value.listingId}
                    onChange={e => handleListingIdChange(e.target.value)}
                    placeholder="Paste a listing id or pick one below"
                />

                {/*
                    Live resolve: when the listing id resolves, show
                    the app's icon + name + category so the author
                    sees what they're pointed at. When the id is
                    set but the listing doesn't resolve, show a soft
                    warning — doesn't block saving (the listing
                    might just not be seeded yet in dev) but
                    surfaces the risk.
                */}
                {value.listingId && (
                    <div className="pt-1">
                        {resolveQuery.isLoading ? (
                            <p className="text-[11px] text-grayscale-500">
                                Checking…
                            </p>
                        ) : resolved ? (
                            <ResolvedListingCard listing={resolved} />
                        ) : (
                            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                                <IonIcon
                                    icon={alertCircleOutline}
                                    aria-hidden
                                    className="text-amber-600 text-sm mt-0.5 shrink-0"
                                />

                                <p className="text-[11px] text-amber-800 leading-snug">
                                    This listing id doesn't resolve right now.
                                    That's OK in dev — it'll work at runtime if
                                    the id is valid. If it's a typo, the CTA
                                    will fall back to a safe no-op.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quick-pick rail */}
            <div className="space-y-2">
                <label className={LABEL}>Quick-pick</label>

                <div className="relative">
                    <IonIcon
                        icon={searchOutline}
                        aria-hidden
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-grayscale-400 text-base"
                    />

                    <input
                        type="text"
                        className={`${INPUT} pl-9`}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search curated apps"
                    />
                </div>

                {curatedQuery.isLoading ? (
                    <p className="text-[11px] text-grayscale-500 px-1">
                        Loading apps…
                    </p>
                ) : filteredApps.length === 0 ? (
                    <p className="text-[11px] text-grayscale-500 px-1">
                        {search
                            ? 'No curated apps match that search. Paste a listing id above to use any app.'
                            : 'No curated apps available. Paste a listing id above to use any app.'}
                    </p>
                ) : (
                    <ul className="max-h-48 overflow-y-auto rounded-xl border border-grayscale-200 divide-y divide-grayscale-100 bg-white">
                        {filteredApps.map(listing => {
                            const isCurrent =
                                listing.listing_id === value.listingId;

                            return (
                                <li key={listing.listing_id}>
                                    <button
                                        type="button"
                                        onClick={() => handlePickListing(listing)}
                                        className={`
                                            w-full flex items-start gap-2.5 px-3 py-2 text-left
                                            transition-colors
                                            ${
                                                isCurrent
                                                    ? 'bg-emerald-50'
                                                    : 'hover:bg-grayscale-10'
                                            }
                                        `}
                                    >
                                        {listing.icon_url ? (
                                            <img
                                                src={listing.icon_url}
                                                alt=""
                                                className="shrink-0 w-8 h-8 rounded-lg object-cover bg-grayscale-100"
                                            />
                                        ) : (
                                            <div className="shrink-0 w-8 h-8 rounded-lg bg-grayscale-100" />
                                        )}

                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-semibold text-grayscale-900 truncate">
                                                {listing.display_name ||
                                                    'Untitled app'}
                                            </span>

                                            {listing.tagline && (
                                                <span className="block text-[11px] text-grayscale-500 leading-snug line-clamp-1">
                                                    {listing.tagline}
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Deep-link section — optional */}
            <div className="space-y-1.5">
                <label className={LABEL} htmlFor="action-deep-link">
                    Deep link section{' '}
                    <span className="text-grayscale-400 font-normal">
                        (optional)
                    </span>
                </label>

                <input
                    id="action-deep-link"
                    type="text"
                    className={INPUT}
                    value={value.deepLinkSection ?? ''}
                    onChange={e => handleDeepLink(e.target.value)}
                    placeholder="courses/aws-cloud-essentials"
                />

                <p className="text-[11px] text-grayscale-500 leading-snug">
                    An opaque hint the app's launcher can use to open a
                    specific area inside the app. Unrecognized values
                    degrade to the app's home.
                </p>
            </div>
        </div>
    );
};

const ResolvedListingCard: React.FC<{ listing: AppStoreListing }> = ({
    listing,
}) => (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
        {listing.icon_url ? (
            <img
                src={listing.icon_url}
                alt=""
                className="shrink-0 w-8 h-8 rounded-lg object-cover bg-white"
            />
        ) : (
            <div className="shrink-0 w-8 h-8 rounded-lg bg-white" />
        )}

        <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-emerald-900 truncate">
                {listing.display_name || 'Untitled app'}
            </p>

            {listing.category && (
                <p className="text-[11px] text-emerald-700">
                    {listing.category}
                </p>
            )}
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// AI session — topic + optional pathway + seed prompt
// ---------------------------------------------------------------------------

const AiSessionEditor: React.FC<{
    value: AiSessionAction;
    termination: Termination;
    onChange: (next: AiSessionAction) => void;
}> = ({ value, termination, onChange }) => {
    const patch = (next: Partial<AiSessionAction>) =>
        onChange({
            kind: 'ai-session',
            topicUri: next.topicUri ?? value.topicUri,
            ...(next.pathwayUri !== undefined
                ? next.pathwayUri
                    ? { pathwayUri: next.pathwayUri }
                    : {}
                : value.pathwayUri
                  ? { pathwayUri: value.pathwayUri }
                  : {}),
            ...(next.seedPrompt !== undefined
                ? next.seedPrompt
                    ? { seedPrompt: next.seedPrompt }
                    : {}
                : value.seedPrompt
                  ? { seedPrompt: value.seedPrompt }
                  : {}),
            ...(value.snapshot ? { snapshot: value.snapshot } : {}),
        });

    // Lock-step check: if the termination is `session-completed`,
    // its topicUri must equal the action's topicUri for the
    // reactor to fire. Flag drift with a small amber callout.
    const terminationTopicUri =
        termination.kind === 'session-completed' ? termination.topicUri : null;

    const topicsDrifted =
        terminationTopicUri !== null
        && value.topicUri.trim() !== ''
        && terminationTopicUri.trim() !== ''
        && value.topicUri.trim() !== terminationTopicUri.trim();

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <label className={LABEL} htmlFor="action-ai-topic">
                    Topic URI
                </label>

                <input
                    id="action-ai-topic"
                    type="text"
                    className={INPUT}
                    value={value.topicUri}
                    onChange={e => patch({ topicUri: e.target.value })}
                    placeholder="lc:topic:aws-iam-deep-dive"
                />

                <p className="text-[11px] text-grayscale-500 leading-snug">
                    The URI of the AI Topic boost this session is bound to.
                </p>
            </div>

            {topicsDrifted && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                    <IonIcon
                        icon={alertCircleOutline}
                        aria-hidden
                        className="text-amber-600 text-sm mt-0.5 shrink-0"
                    />

                    <p className="text-[11px] text-amber-800 leading-snug">
                        The <code className="font-mono">topicUri</code> on
                        this action doesn't match the one on the node's
                        "Finish tutor session" termination
                        (<code className="font-mono">{terminationTopicUri}</code>).
                        The step won't auto-complete until they match.
                    </p>
                </div>
            )}

            <div className="space-y-1.5">
                <label className={LABEL} htmlFor="action-ai-pathway">
                    AI Learning Pathway URI{' '}
                    <span className="text-grayscale-400 font-normal">
                        (optional)
                    </span>
                </label>

                <input
                    id="action-ai-pathway"
                    type="text"
                    className={INPUT}
                    value={value.pathwayUri ?? ''}
                    onChange={e => patch({ pathwayUri: e.target.value })}
                    placeholder="lc:ai-pathway:cloud-fundamentals"
                />

                <p className="text-[11px] text-grayscale-500 leading-snug">
                    Optional curriculum spine the tutor walks through.
                    Distinct from this LearnCard pathway.
                </p>
            </div>

            <div className="space-y-1.5">
                <label className={LABEL} htmlFor="action-ai-seed">
                    Seed prompt{' '}
                    <span className="text-grayscale-400 font-normal">
                        (optional)
                    </span>
                </label>

                <textarea
                    id="action-ai-seed"
                    rows={2}
                    className={`${INPUT} resize-none`}
                    value={value.seedPrompt ?? ''}
                    onChange={e => patch({ seedPrompt: e.target.value })}
                    placeholder="Drill IAM cross-account assume-role specifically."
                />

                <p className="text-[11px] text-grayscale-500 leading-snug">
                    Focuses the tutor on a specific angle. Treated as user
                    text, never system — safe against prompt-injection.
                </p>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// External URL
// ---------------------------------------------------------------------------

const ExternalUrlEditor: React.FC<{
    value: ExternalUrlAction;
    onChange: (next: ExternalUrlAction) => void;
}> = ({ value, onChange }) => (
    <div className="space-y-3">
        <div className="space-y-1.5">
            <label className={LABEL} htmlFor="action-external-url">
                URL
            </label>

            <input
                id="action-external-url"
                type="url"
                className={INPUT}
                value={value.url}
                onChange={e => onChange({ ...value, url: e.target.value })}
                placeholder="https://coursera.org/learn/aws-cloud-essentials"
            />
        </div>

        <div className="space-y-1.5">
            <label className={LABEL} htmlFor="action-external-deep">
                Mobile deep link{' '}
                <span className="text-grayscale-400 font-normal">
                    (optional)
                </span>
            </label>

            <input
                id="action-external-deep"
                type="text"
                className={INPUT}
                value={value.mobileDeepLink ?? ''}
                onChange={e => {
                    const trimmed = e.target.value.trim();

                    onChange({
                        kind: 'external-url',
                        url: value.url,
                        ...(trimmed ? { mobileDeepLink: trimmed } : {}),
                    });
                }}
                placeholder="coursera://course/aws-cloud-essentials"
            />

            <p className="text-[11px] text-grayscale-500 leading-snug">
                A custom-scheme fallback tried first on mobile before the
                web URL. Silently ignored if the native app isn't
                installed.
            </p>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// MCP tool
// ---------------------------------------------------------------------------

const McpToolEditor: React.FC<{
    value: McpToolAction;
    onChange: (next: McpToolAction) => void;
}> = ({ value, onChange }) => {
    const patchRef = (next: Partial<McpToolAction['ref']>) =>
        onChange({
            ...value,
            ref: { ...value.ref, ...next },
        });

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <label className={LABEL} htmlFor="action-mcp-server">
                    Server ID
                </label>

                <input
                    id="action-mcp-server"
                    type="text"
                    className={INPUT}
                    value={value.ref.serverId}
                    onChange={e => patchRef({ serverId: e.target.value })}
                    placeholder="com.example.rubric-grader"
                />
            </div>

            <div className="space-y-1.5">
                <label className={LABEL} htmlFor="action-mcp-tool">
                    Tool name
                </label>

                <input
                    id="action-mcp-tool"
                    type="text"
                    className={INPUT}
                    value={value.ref.toolName}
                    onChange={e => patchRef({ toolName: e.target.value })}
                    placeholder="grade_submission"
                />
            </div>
        </div>
    );
};
