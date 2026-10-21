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
 * The report-domain types live in `feedback/reporting/types.ts`; this module
 * only constructs that shared shape.
 */

import { getDiagnosticLogs, type DiagnosticLogEntry } from 'learn-card-base';

import { normalizeScreenName } from '../../analytics/useScreenView';
import {
    collectVersionInfo,
    type VersionInfo,
} from '../../components/versionInfoModal/versionInfo.helpers';
import type { FeedbackContext, FeedbackKind } from './types';

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
 * The root coordinator injects its active-profile-owned route history. Other
 * callers degrade safely to the normalized current location.
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
