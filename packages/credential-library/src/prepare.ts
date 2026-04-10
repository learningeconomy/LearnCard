import type { UnsignedVC } from '@learncard/types';

import type { CredentialFixture } from './types';
import { getFixture } from './registry';

// ---------------------------------------------------------------------------
// PrepareOptions — what to inject into a fixture for real issuance
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Deep clone + patch helpers
// ---------------------------------------------------------------------------

const generateUuid = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    throw new Error(
        'crypto.randomUUID is not available in this environment. ' +
        'Please use a modern runtime with Web Crypto API support for secure UUID generation.'
    );
};

const patchIds = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (key === 'id' && typeof value === 'string' && value.startsWith('urn:uuid:')) {
            result[key] = `urn:uuid:${generateUuid()}`;
        } else if (Array.isArray(value)) {
            result[key] = value.map(item =>
                item && typeof item === 'object' && !Array.isArray(item)
                    ? patchIds(item as Record<string, unknown>)
                    : item
            );
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            result[key] = patchIds(value as Record<string, unknown>);
        } else {
            result[key] = value;
        }
    }

    return result;
};

const patchIssuer = (
    issuer: unknown,
    issuerDid: string
): string | Record<string, unknown> => {
    if (typeof issuer === 'string') {
        return issuerDid;
    }

    if (issuer && typeof issuer === 'object') {
        return { ...(issuer as Record<string, unknown>), id: issuerDid };
    }

    return issuerDid;
};

const patchSubject = (
    subject: unknown,
    subjectDid: string
): unknown => {
    if (Array.isArray(subject)) {
        return subject.map(s => patchSubject(s, subjectDid));
    }

    if (subject && typeof subject === 'object') {
        return { ...(subject as Record<string, unknown>), id: subjectDid };
    }

    return subject;
};

// ---------------------------------------------------------------------------
// prepareFixture — make a fixture ready for wallet.invoke.issueCredential()
// ---------------------------------------------------------------------------

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
export const prepareFixture = (
    fixture: CredentialFixture,
    options: PrepareOptions
): UnsignedVC => {
    const { issuerDid, subjectDid, validFrom, validUntil, freshIds = true } = options;

    // Deep clone
    let credential = JSON.parse(JSON.stringify(fixture.credential)) as Record<string, unknown>;

    // Patch UUIDs
    if (freshIds) {
        credential = patchIds(credential);
    }

    // Patch issuer
    credential.issuer = patchIssuer(credential.issuer, issuerDid);

    // Patch subject DID
    if (subjectDid && credential.credentialSubject) {
        credential.credentialSubject = patchSubject(credential.credentialSubject, subjectDid);
    }

    // Patch dates
    const now = new Date().toISOString();

    if (credential.validFrom !== undefined || credential.issuanceDate !== undefined) {
        if (credential.validFrom !== undefined) {
            credential.validFrom = validFrom ?? now;
        }

        if (credential.issuanceDate !== undefined) {
            credential.issuanceDate = validFrom ?? now;
        }
    } else {
        // Default to validFrom for v2-style credentials
        credential.validFrom = validFrom ?? now;
    }

    if (validUntil !== undefined) {
        if (credential.validUntil !== undefined) {
            credential.validUntil = validUntil;
        } else if (credential.expirationDate !== undefined) {
            credential.expirationDate = validUntil;
        } else {
            credential.validUntil = validUntil;
        }
    }

    return credential as UnsignedVC;
};

// ---------------------------------------------------------------------------
// prepareFixtureById — convenience wrapper
// ---------------------------------------------------------------------------

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
export const prepareFixtureById = (
    fixtureId: string,
    options: PrepareOptions
): UnsignedVC => prepareFixture(getFixture(fixtureId), options);
