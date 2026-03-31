import type { UnsignedVC } from '@learncard/types';
import type { CredentialFixture } from './types';
export interface PrepareOptions {
    /** Issuer DID — e.g. from wallet.id.did() */
    issuerDid: string;
    /** Recipient DID — who the credential is being issued to */
    subjectDid?: string;
    /** Override validFrom date (defaults to now) */
    validFrom?: string;
    /** Override validUntil / expirationDate */
    validUntil?: string;
    /** Generate fresh UUIDs for id fields (defaults to true) */
    freshIds?: boolean;
}
/**
 * Takes a fixture's credential and returns a fresh unsigned VC with real DIDs,
 * current timestamps, and fresh UUIDs — ready to pass to
 * `wallet.invoke.issueCredential()`.
 *
 * @example
 * ```typescript
 * import { getFixture, prepareFixture } from '@learncard/credential-library';
 *
 * const fixture = getFixture('obv3/full-badge');
 * const unsigned = prepareFixture(fixture, {
 *     issuerDid: wallet.id.did(),
 *     subjectDid: recipientDid,
 * });
 * const signed = await wallet.invoke.issueCredential(unsigned);
 * await wallet.store.LearnCloud.uploadEncrypted(signed);
 * ```
 */
export declare const prepareFixture: (fixture: CredentialFixture, options: PrepareOptions) => UnsignedVC;
/**
 * Shorthand that combines getFixture + prepareFixture.
 *
 * @example
 * ```typescript
 * import { prepareFixtureById } from '@learncard/credential-library';
 *
 * const unsigned = prepareFixtureById('boost/basic', {
 *     issuerDid: wallet.id.did(),
 *     subjectDid: recipientDid,
 * });
 * const signed = await wallet.invoke.issueCredential(unsigned);
 * ```
 */
export declare const prepareFixtureById: (fixtureId: string, options: PrepareOptions) => UnsignedVC;
//# sourceMappingURL=prepare.d.ts.map