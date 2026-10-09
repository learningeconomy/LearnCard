/**
 * Stage selection for the Netlify edge functions. Dependency-free so it can be
 * unit tested outside Deno (see scripts/edge-tenant-stage.test.ts).
 */

/**
 * The tenant stage a deploy was built for (`prepare-native-config.ts --stage`).
 * Recorded by scripts/generate-edge-tenant-configs.ts so `/__tenant-config`
 * serves the same overlay as the baked public/tenant-config.json.
 */
export interface PinnedStage {
    tenantId: string;
    stage: string;
}

/**
 * Derive the stage name from a hostname.
 *
 * Examples:
 *   "alpha.vetpass.app"   → "alpha"
 *   "staging.learncard.ai" → "staging"
 *   "learncard.app"       → null  (production, no stage prefix)
 *   "localhost"            → "local"
 */
export function getStageFromHostname(hostname: string): string | null {
    if (hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1')) {
        return 'local';
    }

    const parts = hostname.split('.');

    // 3+ parts and the first part isn't "www" → treat it as a stage
    if (parts.length >= 3 && parts[0] !== 'www') {
        return parts[0];
    }

    return null;
}

/**
 * Pick the stage overlay for a request. A build-time pin wins for its own
 * tenant, so the edge config can't disagree with the baked config (e.g. a
 * staging.learncard.ai deploy built with `--stage keycloak-staging`). Other
 * tenants, and unpinned builds, fall back to the hostname.
 */
export function selectStage(
    hostname: string,
    tenantId: string,
    pinned: PinnedStage | null
): string | null {
    if (pinned && pinned.tenantId === tenantId) return pinned.stage;

    return getStageFromHostname(hostname);
}
