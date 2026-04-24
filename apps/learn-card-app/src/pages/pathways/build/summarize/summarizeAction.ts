/**
 * summarizeAction — one-line author-facing description of a node's
 * `ActionDescriptor`.
 *
 * Mirrors the pattern in `summarizePolicy` / `summarizeTermination`:
 * a single dispatch point consumers call (the inspector's
 * `ActionSection` collapsed header, the outline row, the preview
 * pane) so copy stays terse and consistent across surfaces.
 *
 * Kept as a standalone function (rather than a registry-driven spec
 * like policy/termination) because the action DSL is shallow — six
 * discriminated-union branches, each with 1–3 meaningful fields —
 * and the summarize logic for each branch is a one-liner. A full
 * registry would be more ceremony than the surface area warrants.
 *
 * ## Copy rules
 *
 *   - No jargon (no "descriptor", "discriminator", "dispatch").
 *   - Prefer the author's own strings (listing display name, topic
 *     title, external URL host) over the internal ids where
 *     available.
 *   - Absence is honest: `'none'` is the string "No launch".
 *     `undefined` action summarizes as "Not configured" — distinct
 *     from `'none'` because the former is "author hasn't picked
 *     yet" and the latter is "author explicitly said reflective
 *     node".
 */

import type { ActionDescriptor } from '../../types';

/**
 * Short, human description of an action. Returns an empty string
 * only in the unreachable `never` branch — callers get a non-empty
 * string in every real case.
 */
export const summarizeAction = (
    action: ActionDescriptor | undefined,
): string => {
    if (!action) return 'Not configured';

    switch (action.kind) {
        case 'none':
            return 'No launch — reflection only';

        case 'in-app-route':
            return `Open ${action.to}`;

        case 'app-listing': {
            const display = action.snapshot?.displayName;

            if (display) return `Open ${display}`;

            // Falls back to the raw listing id when the snapshot is
            // absent (author pasted an id directly). Ugly but honest
            // — summary copy should never invent a name it doesn't
            // have evidence for.
            return `Open app listing ${action.listingId}`;
        }

        case 'ai-session': {
            const title = action.snapshot?.topicTitle;

            if (title) return `Start AI tutor: ${title}`;

            if (action.topicUri) return `Start AI tutor on ${action.topicUri}`;

            return 'Start AI tutor session';
        }

        case 'external-url': {
            // Parsing the URL just to extract the hostname is worth
            // it for the copy quality — "Open coursera.org" reads
            // much better than the full URL inline in a summary.
            // Degrades to the raw URL on parse failure.
            try {
                const url = new URL(action.url);

                return `Open ${url.hostname}`;
            } catch {
                return `Open ${action.url}`;
            }
        }

        case 'mcp-tool':
            return `Run ${action.ref.toolName} via ${action.ref.serverId}`;
    }
};
