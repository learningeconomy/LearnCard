import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { randomSalt, sha256Hasher } from '@learncard/sd-jwt-vc-plugin';
import type { StoredCredentialEnvelope } from '@learncard/types';

import type { SdJwtVcFixture } from './types';

export type SdJwtVcSigner = (signingInput: string) => Promise<string>;

export interface MaterializeSdJwtVcOptions {
    issuerDid: string;
    issuerKid: string;
    issuerSigner: SdJwtVcSigner;
    holderPublicJwk: Record<string, unknown>;
    issuedAt?: number;
}

export interface MaterializedSdJwtVcFixture {
    compact: string;
    envelope: StoredCredentialEnvelope;
    vct: string;
}

const RESERVED_CLAIMS = new Set(['iss', 'iat', 'nbf', 'exp', 'vct', 'cnf', '_sd', '_sd_alg']);

type MaterializedPayload = Record<string, unknown> & {
    iss: string;
    iat: number;
    vct: string;
    cnf: { jwk: Record<string, unknown> };
};

const validateNonEmptyIssuerValue = (value: string, name: string): void => {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${name} must be a non-empty string`);
    }
};

const validateHolderPublicJwk = (holderPublicJwk: Record<string, unknown>): void => {
    if (
        holderPublicJwk &&
        typeof holderPublicJwk === 'object' &&
        Object.prototype.hasOwnProperty.call(holderPublicJwk, 'd')
    ) {
        throw new Error('holder key must be public and must not include private key material');
    }

    if (
        !holderPublicJwk ||
        typeof holderPublicJwk !== 'object' ||
        holderPublicJwk.kty !== 'OKP' ||
        holderPublicJwk.crv !== 'Ed25519' ||
        typeof holderPublicJwk.x !== 'string' ||
        holderPublicJwk.x.trim().length === 0
    ) {
        throw new Error('holderPublicJwk must be an Ed25519 OKP public JWK with a non-empty x');
    }
};

const validateReservedClaims = (claims: Record<string, unknown>): void => {
    for (const claim of Object.keys(claims)) {
        if (RESERVED_CLAIMS.has(claim)) {
            throw new Error(`SD-JWT fixture claims cannot declare reserved claim "${claim}"`);
        }
    }
};

/**
 * Materializes an SD-JWT VC fixture with a caller-supplied issuer signer and holder key.
 * The returned compact credential is canonical `dc+sd-jwt` and never includes a KB-JWT.
 */
export const materializeSdJwtVcFixture = async (
    fixture: SdJwtVcFixture,
    options: MaterializeSdJwtVcOptions
): Promise<MaterializedSdJwtVcFixture> => {
    validateNonEmptyIssuerValue(options.issuerDid, 'issuerDid');
    validateNonEmptyIssuerValue(options.issuerKid, 'issuerKid');
    validateHolderPublicJwk(options.holderPublicJwk);
    validateReservedClaims(fixture.template.claims);

    const instance = new SDJwtVcInstance({
        hasher: sha256Hasher,
        hashAlg: 'sha-256',
        saltGenerator: randomSalt,
        signer: options.issuerSigner,
        signAlg: 'EdDSA',
    });

    const payload: MaterializedPayload = {
        ...fixture.template.claims,
        iss: options.issuerDid,
        iat: options.issuedAt ?? Math.floor(Date.now() / 1000),
        vct: fixture.template.vct,
        cnf: { jwk: options.holderPublicJwk },
    };

    const compact = await instance.issue<MaterializedPayload>(
        payload,
        // Fixture claims are intentionally dynamic, so TypeScript cannot statically enumerate
        // their disclosure-frame keys. Runtime fixture validation and the SD-JWT library do.
        { _sd: fixture.template.selectivelyDisclosable } as never,
        {
            header: {
                typ: 'dc+sd-jwt',
                alg: 'EdDSA',
                kid: options.issuerKid,
            },
        }
    );

    return {
        compact,
        envelope: { format: 'dc+sd-jwt', data: compact },
        vct: fixture.template.vct,
    };
};
