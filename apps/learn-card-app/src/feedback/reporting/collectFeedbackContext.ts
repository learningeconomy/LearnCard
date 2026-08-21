/**
 * Privacy-safe feedback report context (LC-2086 Task 4).
 *
 * `collectFeedbackContext` builds the diagnostics payload attached to a
 * user-submitted feedback report. It maps a full `VersionInfo` (which
 * deliberately carries support-only fields like the Capgo device id, internal
 * bundle id, and checksum) onto the narrow subset a report is allowed to
 * contain. Redaction is by construction: the allowed keys are enumerated
 * explicitly and `VersionInfo` is never spread, so a future field added to
 * the diagnostics helper can never silently leak into a report.
 *
 * Collection differences by kind (per the LC-2086 spec):
 *
 *   - `bug`   → full diagnostics: app, device, network, and the sanitized
 *               in-memory diagnostic log buffer.
 *   - `idea`  → normalized route, tenant, and app version only. Screenshots,
 *               device details, and logs are never sent for ideas.
 *
 * `FeedbackKind` and `FeedbackContext` mirror the domain types in the LC-2086
 * spec. They are declared here so this module stays self-contained; once the
 * shared domain module (`feedback/reporting/types.ts`) lands, consolidate by
 * re-exporting from there — the shapes must stay identical.
 */

import { getDiagnosticLogs, type DiagnosticLogEntry } from 'learn-card-base';

import { normalizeScreenName } from '../../analytics/useScreenView';
import {
    collectVersionInfo,
    type DeviceSummary,
    type NetworkSummary,
    type Platform,
    type VersionInfo,
} from '../../components/versionInfoModal/versionInfo.helpers';

export type FeedbackKind = 'bug' | 'idea';

/**
 * Privacy-safe diagnostics attached to a feedback report. Built exclusively
 * by `collectFeedbackContext` — never spread from `VersionInfo`.
 */
export interface FeedbackContext {
    currentRoute: string;
    recentRoutes: string[];
    tenantId?: string;
    app?: {
        platform: Platform;
        displayVersion: string;
        nativeVersion?: string;
        nativeBuild?: string;
        bundleVersion?: string;
        channel?: string;
    };
    device?: DeviceSummary;
    network?: NetworkSummary;
    logs?: DiagnosticLogEntry[];
}

export interface CollectFeedbackContextInput {
    kind: FeedbackKind;
    /** Version string to use when the app/plugin calls cannot resolve one. */
    fallbackVersion: string;
    tenantId?: string;
}

export interface CollectFeedbackContextDeps {
    /** Version diagnostics source; defaults to the shared helper. */
    collectVersionInfo?: (fallbackVersion: string) => Promise<VersionInfo>;
    /** Normalized route history snapshot; see `defaultGetRoutes`. */
    getRoutes?: () => string[];
    /** Sanitized diagnostic log snapshot; defaults to `getDiagnosticLogs()`. */
    getLogs?: () => DiagnosticLogEntry[];
}

/**
 * Default route-history source. The bounded route-history module
 * (`feedback/reporting/routeHistory.ts`, LC-2086 Task 3) is the intended
 * provider — wire `getRecentFeedbackRoutes()` in here once that module is
 * merged. Until then this degrades to an empty history; `currentRoute` still
 * resolves from the normalized current location.
 */
const defaultGetRoutes = (): string[] => [];

/**
 * Build a privacy-safe `FeedbackContext` for a feedback report.
 *
 * Every dependency is injectable so tests stay deterministic; the defaults
 * pull from the shared version helper and the sanitized diagnostic log
 * buffer.
 */
export const collectFeedbackContext = async (
    { kind, fallbackVersion, tenantId }: CollectFeedbackContextInput,
    {
        collectVersionInfo: collect = collectVersionInfo,
        getRoutes = defaultGetRoutes,
        getLogs = getDiagnosticLogs,
    }: CollectFeedbackContextDeps = {}
): Promise<FeedbackContext> => {
    const info = await collect(fallbackVersion);
    const routes = getRoutes();

    return {
        currentRoute: routes.at(-1) ?? normalizeScreenName(window.location.pathname),
        recentRoutes: routes,
        tenantId,
        app: {
            platform: info.platform,
            displayVersion: info.displayVersion,
            nativeVersion: info.nativeVersion,
            nativeBuild: info.nativeBuild,
            bundleVersion: info.bundleVersion,
            channel: info.channel,
        },
        ...(kind === 'bug' ? { device: info.device, network: info.network, logs: getLogs() } : {}),
    };
};
