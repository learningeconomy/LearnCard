import type { VerificationCheck } from '@learncard/types';
import type { DidDocument } from '@learncard/types';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import type { JWK } from 'jose';

import { sha256Hasher } from './hasher';
import { randomSalt } from './salt';
import { createJoseVerifier, decodeJoseHeader } from './signer';
import { parseSdJwtVc } from './parse';
import {
    SdJwtVcError,
    type SdJwtVcDependentLearnCard,
    type SdJwtVcFormat,
    type VerifySdJwtVcOptions,
} from './types';

interface VerificationMethod {
    id?: string;
    type?: string;
    controller?: string;
    publicKeyJwk?: Record<string, unknown>;
    [k: string]: unknown;
}

const extractFragment = (kid: string): string | undefined => {
    const idx = kid.lastIndexOf('#');
    if (idx === -1) return kid.length > 0 ? kid : undefined;
    const frag = kid.slice(idx + 1);
    return frag.length > 0 ? frag : undefined;
};

const findVerificationMethod = (
    doc: DidDocument | undefined,
    kid: string | undefined,
    issuerDid: string
): VerificationMethod => {
    const methods = (doc?.verificationMethod ?? []) as unknown as VerificationMethod[];
    if (methods.length === 0) {
        throw new SdJwtVcError(
            'verification_method_not_found',
            `Issuer DID "${issuerDid}" resolved but document has no verificationMethod entries`
        );
    }

    if (!kid) {
        const first = methods[0]!;
        if (!first.publicKeyJwk) {
            throw new SdJwtVcError(
                'verification_method_not_found',
                `First verificationMethod for issuer "${issuerDid}" has no publicKeyJwk`
            );
        }
        return first;
    }

    const matchFragment = extractFragment(kid);

    for (const method of methods) {
        if (!method.id) continue;
        if (method.id === kid) return method;
        if (method.id === `${issuerDid}${kid}`) return method;
        const methodFragment = extractFragment(method.id);
        if (matchFragment && methodFragment && methodFragment === matchFragment) return method;
    }

    throw new SdJwtVcError(
        'verification_method_not_found',
        `Issuer DID "${issuerDid}" document has no verificationMethod matching kid "${kid}"`
    );
};

const resolveIssuerJwk = async (
    learnCard: SdJwtVcDependentLearnCard,
    issuerDid: string,
    kid: string | undefined
): Promise<{ jwk: JWK; alg: string }> => {
    if (!issuerDid.startsWith('did:')) {
        throw new SdJwtVcError(
            'issuer_resolution_failed',
            `Only DID-based issuers are supported in this build (got "${issuerDid}"). HTTPS-URL issuer identifiers are tracked as a follow-up.`
        );
    }

    let doc: DidDocument;
    try {
        doc = await learnCard.invoke.resolveDid(issuerDid);
    } catch (e) {
        throw new SdJwtVcError(
            'issuer_resolution_failed',
            `Failed to resolve issuer DID "${issuerDid}": ${
                e instanceof Error ? e.message : String(e)
            }`,
            { cause: e }
        );
    }

    const method = findVerificationMethod(doc, kid, issuerDid);
    if (!method.publicKeyJwk) {
        throw new SdJwtVcError(
            'verification_method_not_found',
            `Verification method for "${issuerDid}" / kid "${kid ?? '(none)'}" has no publicKeyJwk`
        );
    }

    const jwk = method.publicKeyJwk as unknown as JWK;
    const alg = (jwk.alg as string | undefined) ?? 'EdDSA';
    return { jwk, alg };
};

const ensureNotExpired = (
    expiresAt: Date | undefined,
    now: Date,
    errors: string[]
): void => {
    if (expiresAt && expiresAt.getTime() <= now.getTime()) {
        errors.push(`Credential expired at ${expiresAt.toISOString()}`);
    }
};

const ensureNotBefore = (
    notBefore: Date | undefined,
    now: Date,
    warnings: string[],
    errors: string[]
): void => {
    if (notBefore && notBefore.getTime() > now.getTime()) {
        const skewMs = notBefore.getTime() - now.getTime();
        if (skewMs > 60_000) {
            errors.push(`Credential not valid until ${notBefore.toISOString()}`);
        } else {
            warnings.push(
                `Credential nbf is in the future by ${skewMs}ms (within clock-skew tolerance)`
            );
        }
    }
};

export const verifySdJwtVc = async (
    learnCard: SdJwtVcDependentLearnCard,
    compact: string,
    options: VerifySdJwtVcOptions = {},
    format: SdJwtVcFormat = 'dc+sd-jwt'
): Promise<VerificationCheck> => {
    const checks: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    let parsed;
    try {
        parsed = await parseSdJwtVc(compact, format);
        checks.push('parse');
        checks.push('disclosure_hash_integrity');
    } catch (e) {
        const message =
            e instanceof SdJwtVcError ? `${e.code}: ${e.message}` : (e as Error).message;
        return { checks, warnings, errors: [...errors, message] };
    }

    let issuerJwk: JWK;
    let issuerAlg: string;
    try {
        const decodedHeader = decodeJoseHeader(compact.split('~')[0]!);
        const kid = typeof decodedHeader.kid === 'string' ? decodedHeader.kid : undefined;
        const resolved = await resolveIssuerJwk(learnCard, parsed.issuer, kid);
        issuerJwk = resolved.jwk;
        issuerAlg = resolved.alg;
        checks.push('issuer_resolved');
    } catch (e) {
        const message =
            e instanceof SdJwtVcError ? `${e.code}: ${e.message}` : (e as Error).message;
        return { checks, warnings, errors: [...errors, message] };
    }

    const verifier = await createJoseVerifier(issuerJwk, issuerAlg);
    const instance = new SDJwtVcInstance({
        hasher: sha256Hasher,
        hashAlg: 'sha-256',
        saltGenerator: randomSalt,
        verifier,
    });

    try {
        await instance.verify(compact);
        checks.push('issuer_signature');
    } catch (e) {
        errors.push(
            `signature_invalid: ${e instanceof Error ? e.message : String(e)}`
        );
        return { checks, warnings, errors };
    }

    const now = options.now ? options.now() : new Date();

    ensureNotExpired(parsed.expiresAt, now, errors);
    if (errors.length === 0) checks.push('expiration');

    ensureNotBefore(parsed.notBefore, now, warnings, errors);

    if (options.expectedVct && parsed.vct !== options.expectedVct) {
        errors.push(`vct_mismatch: expected "${options.expectedVct}", got "${parsed.vct}"`);
    }

    if (options.audience || options.nonce) {
        warnings.push('audience/nonce checks require a KB-JWT (Slice 3); skipped in read path');
    }

    if (!options.skipStatusCheck && parsed.rawPayload.status !== undefined) {
        warnings.push('status_check_deferred: Token Status List checking lands in Slice 4');
    }

    return { checks, warnings, errors };
};
