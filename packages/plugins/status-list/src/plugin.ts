/**
 * Plugin factory for `@learncard/status-list-plugin`.
 *
 * Wraps the pure {@link checkCredentialStatus} function in a
 * LearnCard plugin so any LearnCard composition automatically picks
 * up `lc.invoke.checkCredentialStatus(credential, options?)`. The
 * factory only injects the configured fetch impl as a default; all
 * other behaviour (caller-supplied `fetchStatusList`, strict-type
 * mode, etc.) flows through per-call options unchanged.
 */
import { checkCredentialStatus } from './status';
import type { StatusListPlugin, StatusListPluginConfig } from './types';

/**
 * Build the StatusList plugin.
 *
 * @example
 * const baseLc = await generateLearnCard();
 * const lc = await baseLc.addPlugin(getStatusListPlugin(baseLc));
 * const result = await lc.invoke.checkCredentialStatus(myCredential);
 *
 * @group Plugins
 */
export const getStatusListPlugin = (
    _learnCard: unknown,
    config: StatusListPluginConfig = {}
): StatusListPlugin => {
    const fetchImpl = config.fetch ?? globalThis.fetch;

    return {
        name: 'StatusList',
        displayName: 'Bitstring Status List',
        description:
            'Verifier-side W3C VC Bitstring Status List checking — ' +
            'revocation and suspension lookups against the credential ' +
            "issuer's published Status List Credential.",
        methods: {
            checkCredentialStatus: async (_lc, credential, options = {}) =>
                checkCredentialStatus(credential, {
                    // The plugin's configured fetch is the default;
                    // per-call options can still override it (or skip
                    // fetch entirely via `fetchStatusList`).
                    fetchImpl,
                    ...options,
                }),
        },
    };
};
