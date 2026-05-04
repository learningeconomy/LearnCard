/**
 * `@learncard/status-list-plugin` — public surface.
 *
 * The plugin factory + the pure `checkCredentialStatus` function
 * are both exported so callers can either:
 *
 *   1. Add the plugin to a LearnCard and use `lc.invoke.checkCredentialStatus(...)`,
 *      or
 *   2. Import `checkCredentialStatus` directly when they want to
 *      check status without composing a LearnCard (e.g., a server
 *      verifier with no host wallet).
 *
 * The wire-format encoder used by tests lives in `./test-helpers`
 * and is intentionally NOT re-exported here \u2014 production builds
 * have no reason to ship the encode pipeline.
 */
export { getStatusListPlugin } from './plugin';

export {
    checkCredentialStatus,
    StatusCheckError,
} from './status';

export type {
    CheckCredentialStatusOptions,
    CredentialStatusEntry,
    CredentialWithStatus,
    StatusCheckErrorCode,
    StatusCheckOutcome,
    StatusCheckResult,
    StatusListCredential,
    StatusListCredentialSubject,
} from './status';

export type {
    StatusListLearnCard,
    StatusListPlugin,
    StatusListPluginConfig,
    StatusListPluginMethods,
} from './types';
