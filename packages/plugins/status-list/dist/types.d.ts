/**
 * Public type surface for `@learncard/status-list-plugin`.
 *
 * Mirrors the LearnCard plugin contract conventions used elsewhere
 * in the SDK: a base method shape, an "implicit learn-card" that
 * sees the bound methods, and an `*Plugin` alias for the result of
 * `getStatusListPlugin()`.
 *
 * The plugin is intentionally tiny — one method, no host
 * dependencies. It can be added to any LearnCard, including a bare
 * one constructed via `generateLearnCard()`, without bringing in
 * VC issuance, DID resolution, or OID4VP transport.
 */
import type { Plugin, LearnCard } from '@learncard/core';
import type { CheckCredentialStatusOptions, CredentialWithStatus, StatusCheckResult } from './status';
/** @group Status List Plugin */
export type StatusListPluginMethods = {
    /**
     * Check a credential's revocation/suspension status against its
     * declared Status List Credential. See
     * {@link CheckCredentialStatusOptions} for fetch overrides and
     * the `fetchStatusList` injection point used by tests / cached
     * status workflows.
     */
    checkCredentialStatus: (credential: CredentialWithStatus, options?: CheckCredentialStatusOptions) => Promise<StatusCheckResult>;
};
/**
 * Configuration passed to {@link getStatusListPlugin}. All fields
 * optional; sane defaults route through `globalThis.fetch`.
 */
export interface StatusListPluginConfig {
    /**
     * Default fetch implementation used when the caller doesn't
     * provide one in the per-call options. Useful for hosts that
     * proxy network calls through a trust layer (DNS-pinning, mTLS,
     * etc.) — set this once and every status-list lookup honors it.
     */
    fetch?: typeof fetch;
}
/** @group Status List Plugin */
export type StatusListPlugin = Plugin<'StatusList', any, StatusListPluginMethods>;
/**
 * Any LearnCard with the StatusList plugin attached. Re-exposed for
 * callers that want to type-narrow inside their own helpers.
 *
 * @group Status List Plugin
 */
export type StatusListLearnCard = LearnCard<any, any, StatusListPluginMethods>;
//# sourceMappingURL=types.d.ts.map