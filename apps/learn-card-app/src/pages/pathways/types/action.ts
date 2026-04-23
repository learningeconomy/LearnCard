/**
 * ActionDescriptor — where a learner goes to act on a node.
 *
 * Orthogonal to `Policy` and `Termination`:
 *
 *   - **Policy** describes the *shape* of the work ("practice daily",
 *     "pass an assessment", "upload an artifact").
 *   - **ActionDescriptor** describes *where* the learner goes to do it
 *     (an in-app route, an App Store listing, an external URL, an MCP
 *     tool invocation, or nothing at all for pure reflection).
 *   - **Termination** describes *how we know* it's done.
 *   - **AchievementProjection** describes *what credential* represents
 *     the completion.
 *
 * The four axes are independent. A `practice` policy can be launched
 * in-app (our own AI Tutor) OR via an App Store listing (Khanmigo) OR
 * via an external URL (Coursera course) — which is precisely why the
 * launch destination lives on its own field rather than being smuggled
 * into the policy kind.
 *
 * The schema is optional on `PathwayNode` (back-compat with pathways
 * authored before the field existed). `resolveNodeAction` in
 * `core/action.ts` synthesises a best-effort `ResolvedAction` from the
 * legacy fields (`credentialProjection.earnUrl`, `policy.external.mcp`)
 * when `action` is absent, so the UI always has something honest to
 * dispatch on.
 *
 * See architecture doc § 3.7.
 */

import { z } from 'zod';

/**
 * Local, structurally-identical copy of `McpToolRefSchema` from
 * `pathway.ts`. Kept here (rather than imported) to avoid a circular
 * module graph — `pathway.ts` already imports `ActionDescriptorSchema`
 * for `PathwayNode.action`, so importing the MCP ref the other way
 * would deadlock Zod's schema evaluation. The two shapes are held
 * identical by test (`action.test.ts`).
 */
const ActionMcpToolRefSchema = z.object({
    serverId: z.string(),
    toolName: z.string(),
    defaultArgs: z.record(z.string(), z.unknown()).optional(),
});

// -----------------------------------------------------------------
// In-app route
// -----------------------------------------------------------------

/**
 * Primitive query/params shape we're willing to serialize into a
 * router location. Objects and nested values are intentionally
 * excluded — if a surface needs structured state, it should use
 * history state rather than the URL.
 */
const RouteParamValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const InAppRouteActionSchema = z.object({
    kind: z.literal('in-app-route'),
    /**
     * Absolute in-app route path, e.g. `/ai-sessions/new` or
     * `/wallet/credentials/:credentialId`. Dispatcher joins it with
     * `params` at click time. Keep it literal; do not include the
     * origin.
     */
    to: z.string().min(1),
    /** Flat key/value bag appended as query params or used to fill `:name` slots. */
    params: z.record(z.string(), RouteParamValueSchema).optional(),
});
export type InAppRouteAction = z.infer<typeof InAppRouteActionSchema>;

// -----------------------------------------------------------------
// App Store listing
// -----------------------------------------------------------------

/**
 * Minimal snapshot of an AppStoreListing, captured at **bind time** and
 * stored inline on the action. Two reasons to keep the snapshot here
 * instead of re-hydrating from the listing registry on every read:
 *
 *   1. **Agents can read pathways without a network hop.** Planner,
 *      Coach, Recorder all need to reason about what a node *means*
 *      to produce useful proposals. `listingId: 'uuid'` alone is
 *      opaque; the snapshot gives them enough to distinguish "passive
 *      video-lecture" from "timed practice exam" without a listing
 *      fetch per prompt.
 *
 *   2. **Author intent survives listing drift.** If the target listing
 *      mutates ("Coursera Plus — 2025 edition"), the original
 *      authorial intent is preserved in the snapshot. A background job
 *      can surface material drift as a proposal to the learner rather
 *      than silently mutating their pathway.
 *
 *   3. **Pathways remain meaningful offline.** The snapshot is the
 *      difference between "there's an app here" (unusable) and "open
 *      Coursera — AWS Cloud Essentials" (honest copy) when the
 *      network is down.
 *
 * The field is `optional()` — pre-existing nodes, imports from foreign
 * systems, and programmatic authoring that doesn't have the listing
 * metadata handy all remain valid. UI falls back to the live listing
 * fetch when snapshot is absent (see `useListingForNode`).
 *
 * Keep it small. ~200 bytes per action is the sweet spot; anything
 * larger should stay in the listing registry and be fetched on demand.
 */
export const AppListingSnapshotSchema = z.object({
    /** Display name at bind time, e.g. "Coursera — AWS Cloud Essentials". */
    displayName: z.string().min(1),
    /** Category at bind time, e.g. "Learning", "Assessment", "Coaching". */
    category: z.string().optional(),
    /** Launch type at bind time, e.g. "DIRECT_LINK" | "EMBEDDED_IFRAME". */
    launchType: z.string().optional(),
    /** Short tagline for agent context and Map hover affordances. */
    tagline: z.string().optional(),
    /** Icon URL at bind time — lets Map nodes render without a listing fetch. */
    iconUrl: z.string().url().optional(),
    /**
     * Author-provided (or LLM-filled) semantic tags carried from the
     * listing registry. Agents use these to reason about node character
     * (passive vs active, timed vs self-paced, …). Mirrored from
     * `AppStoreListing.semanticTags` when available; empty otherwise.
     */
    semanticTags: z.array(z.string()).optional(),
    /**
     * ISO timestamp of when this snapshot was captured. A refresher
     * job compares this to the listing's `updatedAt` to decide whether
     * to propose a refresh.
     */
    snapshottedAt: z.string().datetime(),
});
export type AppListingSnapshot = z.infer<typeof AppListingSnapshotSchema>;

/**
 * Deep-link into a registered App Store listing. Covers every
 * first-party app that issues credentials, plus external providers
 * we register with `launch_type: DIRECT_LINK` (Khan, Coursera, ETS,
 * Handshake, Common App, …).
 *
 * We reference the listing by `listingId` (brain-service's stable
 * identifier) rather than by URL so a listing's launch config can
 * evolve (upgrade from DIRECT_LINK to EMBEDDED_IFRAME, swap domains,
 * etc.) without invalidating nodes that already reference it.
 *
 * `deepLinkSection` is an optional opaque string the listing's own
 * launcher can use to route inside the app ("courses/statistics",
 * "tutor/biology"). Unrecognized values degrade to the app's home.
 *
 * `snapshot` freezes a minimal view of the listing's metadata at bind
 * time — see `AppListingSnapshotSchema` for the why.
 */
export const AppListingActionSchema = z.object({
    kind: z.literal('app-listing'),
    listingId: z.string().min(1),
    deepLinkSection: z.string().optional(),
    snapshot: AppListingSnapshotSchema.optional(),
});
export type AppListingAction = z.infer<typeof AppListingActionSchema>;

// -----------------------------------------------------------------
// External URL
// -----------------------------------------------------------------

/**
 * Raw external URL. For providers that are *not* yet in the listing
 * registry, or cases where the destination is inherently ad-hoc
 * (a TED talk, a specific CareerOneStop occupation page, a scholarship
 * application form). Promote to `app-listing` when the provider grows
 * a proper listing record.
 *
 * `mobileDeepLink` is an optional custom-scheme fallback we try on
 * mobile before falling back to the web URL — e.g. `coursera://…` —
 * opened inside a `try/catch` that silently degrades to `url` if the
 * native app isn't installed.
 */
export const ExternalUrlActionSchema = z.object({
    kind: z.literal('external-url'),
    url: z.string().url(),
    mobileDeepLink: z.string().optional(),
});
export type ExternalUrlAction = z.infer<typeof ExternalUrlActionSchema>;

// -----------------------------------------------------------------
// MCP tool invocation
// -----------------------------------------------------------------

/**
 * Dispatch to an MCP tool. Distinct from `in-app-route` because the
 * work is agent-driven, not navigable — clicking the CTA runs a tool
 * via the MCP registry rather than opening a page.
 *
 * The referenced tool shape mirrors `McpToolRefSchema` already used by
 * `Policy: external` so the registry stays the single source of truth.
 */
export const McpToolActionSchema = z.object({
    kind: z.literal('mcp-tool'),
    ref: ActionMcpToolRefSchema,
});
export type McpToolAction = z.infer<typeof McpToolActionSchema>;

// -----------------------------------------------------------------
// No launch
// -----------------------------------------------------------------

/**
 * Explicit "no external action" marker. Used for reflection-style
 * nodes whose CTA is purely local ("Mark as done" opens the node
 * detail and that's the whole experience). Setting this rather than
 * leaving `action` undefined makes author intent explicit: the
 * absence of a launch is a choice, not an oversight.
 */
export const NoneActionSchema = z.object({
    kind: z.literal('none'),
});
export type NoneAction = z.infer<typeof NoneActionSchema>;

// -----------------------------------------------------------------
// Discriminated union
// -----------------------------------------------------------------

export const ActionDescriptorSchema = z.discriminatedUnion('kind', [
    InAppRouteActionSchema,
    AppListingActionSchema,
    ExternalUrlActionSchema,
    McpToolActionSchema,
    NoneActionSchema,
]);
export type ActionDescriptor = z.infer<typeof ActionDescriptorSchema>;

/** All `ActionDescriptor.kind` values — useful for exhaustiveness checks. */
export const ACTION_KINDS = [
    'in-app-route',
    'app-listing',
    'external-url',
    'mcp-tool',
    'none',
] as const satisfies ReadonlyArray<ActionDescriptor['kind']>;
