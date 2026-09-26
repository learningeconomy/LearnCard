/**
 * Bounded, sanitized diagnostics for share-link service composition.
 *
 * The owner and public APIs fail closed for two states that are otherwise
 * indistinguishable to an operator:
 *
 * - intentionally absent configuration (`status: 'disabled'`) is silent and
 *   inert; it is a supported deployment;
 * - malformed/partial service wiring (`status: 'invalid'`) or a failed
 *   dependency build emits one fixed category so a misconfiguration is
 *   distinguishable from an unconfigured deployment.
 *
 * The reporter is bounded per process: each category is emitted at most once,
 * so a flood of requests against a misconfigured deployment cannot flood logs.
 * The event carries only a fixed allowlisted category string: never an
 * environment value, URL, request body, DID key, title, note or ciphertext.
 */

export const SHARE_LINK_COMPOSITION_DIAGNOSTIC = {
    OWNER_CONFIGURATION_INVALID: 'share_link_owner_configuration_invalid',
    OWNER_INITIALIZATION_FAILED: 'share_link_owner_initialization_failed',
    PUBLIC_CONFIGURATION_INVALID: 'share_link_public_configuration_invalid',
    PUBLIC_INITIALIZATION_FAILED: 'share_link_public_initialization_failed',
} as const;

export type ShareLinkCompositionDiagnosticCategory =
    (typeof SHARE_LINK_COMPOSITION_DIAGNOSTIC)[keyof typeof SHARE_LINK_COMPOSITION_DIAGNOSTIC];

export type ShareLinkDiagnosticSink = (category: ShareLinkCompositionDiagnosticCategory) => void;

/** Aggregate-only sink matching the existing route reporting convention. */
export const defaultShareLinkDiagnosticSink: ShareLinkDiagnosticSink = category => {
    console.warn('share_link_composition_diagnostic', { category });
};

/** Wrap a sink so each category is emitted at most once per process. */
export const createBoundedShareLinkDiagnosticReporter = (
    sink: ShareLinkDiagnosticSink = defaultShareLinkDiagnosticSink
): ShareLinkDiagnosticSink => {
    const reported = new Set<ShareLinkCompositionDiagnosticCategory>();

    return category => {
        if (reported.has(category)) return;
        reported.add(category);
        sink(category);
    };
};

type ShareLinkConfigStatus = { status: 'disabled' } | { status: 'invalid' } | { status: 'enabled' };

/**
 * Compose the lazy getter a share-link router uses around a pure config
 * resolution and a retryable initializer.
 *
 * Disabled configuration returns `null` silently. Invalid configuration reports
 * a single sanitized diagnostic and returns `null`, preserving the anonymous
 * not_found behavior. An enabled but failing build reports a single sanitized
 * diagnostic and rethrows so the caller maps it to a generic error while the
 * retryable initializer clears the failed attempt cache.
 */
export const createShareLinkDependencyResolver = <TDependencies>(options: {
    readonly resolveConfig: () => ShareLinkConfigStatus;
    readonly initializeDependencies: () => Promise<TDependencies>;
    readonly reportDiagnostic: ShareLinkDiagnosticSink;
    readonly configurationInvalidCategory: ShareLinkCompositionDiagnosticCategory;
    readonly initializationFailedCategory: ShareLinkCompositionDiagnosticCategory;
}): (() => Promise<TDependencies | null>) => {
    return async () => {
        const config = options.resolveConfig();

        // Intentionally absent configuration: inert and silent.
        if (config.status === 'disabled') return null;

        // Malformed/partial wiring: one bounded diagnostic, still fail closed.
        if (config.status === 'invalid') {
            options.reportDiagnostic(options.configurationInvalidCategory);
            return null;
        }

        try {
            return await options.initializeDependencies();
        } catch (error) {
            // The initializer has already cleared its failed attempt; report the
            // category once and let the caller surface a sanitized error.
            options.reportDiagnostic(options.initializationFailedCategory);
            throw error;
        }
    };
};
