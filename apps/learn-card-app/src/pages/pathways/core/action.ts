/**
 * resolveNodeAction — the one seam that tells the UI how to launch a
 * node's primary CTA.
 *
 * A `PathwayNode` carries an optional `ActionDescriptor` on the
 * `action` field. When present, we dispatch on it directly. When
 * absent, we synthesise a best-effort resolution from the legacy
 * signals the codebase had before this field existed:
 *
 *   1. `credentialProjection.earnUrl` + `earnUrlSource`
 *      (populated by the CTDL importer) → `external-url`
 *   2. `policy.kind === 'external'` + `policy.mcp`
 *      (existing MCP-driven work) → `mcp-tool`
 *   3. otherwise → `none` (local-only node: the overlay and
 *      "Mark as done" button carry the whole experience).
 *
 * The resolver is pure and does not open anything. It returns a
 * `ResolvedAction` the caller renders as an anchor, button, or
 * whatever the surface deems appropriate. Keep it React-free so we
 * can unit-test every branch.
 */

import type { ActionDescriptor, PathwayNode } from '../types';

// -----------------------------------------------------------------
// Result shape
// -----------------------------------------------------------------

/**
 * Why the resolver picked the action it did. Surfaces use this to
 * decide copy ("Open in Figma" vs "Earn this badge") and to flag
 * degraded landing pages (see `landingPage` on earn-url fallbacks).
 */
export type ActionSource =
    | 'explicit' // node.action was populated
    | 'earn-url' // synthesised from credentialProjection.earnUrl
    | 'mcp-policy' // synthesised from policy.external.mcp
    | 'none'; // nothing to launch

export interface ResolvedInAppRoute {
    kind: 'in-app-route';
    to: string;
    params?: Record<string, string | number | boolean>;
    source: ActionSource;
}

export interface ResolvedAppListing {
    kind: 'app-listing';
    listingId: string;
    deepLinkSection?: string;
    source: ActionSource;
}

export interface ResolvedAiSession {
    kind: 'ai-session';
    /** Topic boost URI — what `startTopicWithUri` / `startLearningPathway` consume. */
    topicUri: string;
    /** AI Learning Pathway URI (the tutor's curriculum spine). Optional. */
    pathwayUri?: string;
    /**
     * Author/agent-supplied focus text. Threaded into the chatbot as
     * **user** content, never as a system instruction — the dispatcher
     * is responsible for that contract. See `AiSessionActionSchema`
     * for why.
     */
    seedPrompt?: string;
    source: ActionSource;
}

export interface ResolvedExternalUrl {
    kind: 'external-url';
    url: string;
    mobileDeepLink?: string;
    source: ActionSource;
    /**
     * `true` when the URL resolved from a CTDL `subjectWebpage` rather
     * than `sourceData` — i.e. a marketing / landing page that does
     * NOT award the credential. Surfaces should degrade copy ("View
     * landing page") instead of promising "Earn this." Always `false`
     * for explicit `external-url` actions (authors opting into one
     * are asserting the URL is the real destination).
     */
    landingPage: boolean;
}

export interface ResolvedMcpTool {
    kind: 'mcp-tool';
    ref: { serverId: string; toolName: string; defaultArgs?: Record<string, unknown> };
    source: ActionSource;
}

export interface ResolvedNone {
    kind: 'none';
    source: ActionSource;
}

export type ResolvedAction =
    | ResolvedInAppRoute
    | ResolvedAppListing
    | ResolvedAiSession
    | ResolvedExternalUrl
    | ResolvedMcpTool
    | ResolvedNone;

// -----------------------------------------------------------------
// Dispatcher
// -----------------------------------------------------------------

const resolveExplicit = (descriptor: ActionDescriptor): ResolvedAction => {
    switch (descriptor.kind) {
        case 'in-app-route':
            return {
                kind: 'in-app-route',
                to: descriptor.to,
                params: descriptor.params,
                source: 'explicit',
            };

        case 'app-listing':
            return {
                kind: 'app-listing',
                listingId: descriptor.listingId,
                deepLinkSection: descriptor.deepLinkSection,
                source: 'explicit',
            };

        case 'ai-session':
            return {
                kind: 'ai-session',
                topicUri: descriptor.topicUri,
                pathwayUri: descriptor.pathwayUri,
                seedPrompt: descriptor.seedPrompt,
                source: 'explicit',
            };

        case 'external-url':
            return {
                kind: 'external-url',
                url: descriptor.url,
                mobileDeepLink: descriptor.mobileDeepLink,
                source: 'explicit',
                // An author-declared external-url is asserted as the
                // real destination — not a landing page. CTDL-driven
                // fallbacks below flip this for `subjectWebpage`.
                landingPage: false,
            };

        case 'mcp-tool':
            return {
                kind: 'mcp-tool',
                ref: descriptor.ref,
                source: 'explicit',
            };

        case 'none':
            return { kind: 'none', source: 'explicit' };
    }
};

const resolveFallback = (node: PathwayNode): ResolvedAction => {
    const earnUrl = node.credentialProjection?.earnUrl;
    const earnUrlSource = node.credentialProjection?.earnUrlSource;

    // Prefer the CTDL-imported earn link when present. `sourceData`
    // is a real "go earn it" URL; `subjectWebpage` is a landing page
    // that doesn't promise issuance — we surface both but let the
    // surface soften its copy via `landingPage`.
    if (earnUrl && earnUrlSource) {
        return {
            kind: 'external-url',
            url: earnUrl,
            source: 'earn-url',
            landingPage: earnUrlSource === 'subjectWebpage',
        };
    }

    // `external` policy with an MCP ref → dispatch into the agent
    // rather than navigating. Mirrors the `mcp-tool` action kind so
    // the call site can treat both paths uniformly.
    if (node.stage.policy.kind === 'external') {
        return {
            kind: 'mcp-tool',
            ref: node.stage.policy.mcp,
            source: 'mcp-policy',
        };
    }

    return { kind: 'none', source: 'none' };
};

/**
 * Resolve a node to its launch instruction.
 *
 *   - If `node.action` is set, its `kind` determines the result
 *     directly and `source` becomes `'explicit'`.
 *   - Otherwise we synthesise a fallback from the legacy signals
 *     (`credentialProjection.earnUrl`, `policy.external.mcp`),
 *     tagging `source` so the caller knows the answer was inferred.
 *
 * The function is a total function — every node has *some*
 * ResolvedAction, even if it's `{ kind: 'none', source: 'none' }`.
 */
export const resolveNodeAction = (node: PathwayNode): ResolvedAction => {
    if (node.action) return resolveExplicit(node.action);

    return resolveFallback(node);
};

// -----------------------------------------------------------------
// Route helpers
// -----------------------------------------------------------------

/**
 * Serialise an `in-app-route` ResolvedAction into a path+search the
 * router can consume. Param keys that appear as `:name` slots in the
 * path get substituted; remaining keys land in the query string.
 *
 * Kept here (rather than in a surface) so both Today and NodeDetail
 * produce byte-identical hrefs for the same descriptor, and so the
 * logic stays unit-testable.
 */
export const buildInAppHref = (action: ResolvedInAppRoute): string => {
    let { to } = action;
    const params = action.params ?? {};

    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        const slot = `:${key}`;

        if (to.includes(slot)) {
            to = to.split(slot).join(encodeURIComponent(String(value)));
        } else {
            query.set(key, String(value));
        }
    }

    const q = query.toString();

    return q ? `${to}?${q}` : to;
};
