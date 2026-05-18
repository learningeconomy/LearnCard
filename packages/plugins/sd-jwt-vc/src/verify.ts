import type { VerificationCheck } from '@learncard/types';
import type { DidDocument } from '@learncard/types';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import type { JWK } from 'jose';

import { sha256Hasher } from './hasher';
import { randomSalt } from './salt';
import { createJoseVerifier } from './signer';
import { parseSdJwtVc } from './parse';
import {
    CLOCK_SKEW_MS,
    SdJwtVcError,
    type ParsedSdJwtVc,
    type SdJwtVcDependentLearnCard,
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

const isAuthorizedForAssertion = (
    doc: DidDocument | undefined,
    methodId: string | undefined,
    issuerDid: string
): boolean => {
    const entries = (doc?.assertionMethod ?? []) as Array<unknown>;
    if (entries.length === 0 || !methodId) return false;
    const methodFragment = extractFragment(methodId);
    for (const entry of entries) {
        if (typeof entry === 'string') {
            if (entry === methodId) return true;
            if (entry.startsWith('#') && extractFragment(entry) === methodFragment) return true;
            if (entry === `${issuerDid}${methodFragment ? `#${methodFragment}` : ''}`) return true;
        } else if (entry && typeof entry === 'object') {
            const entryId = (entry as { id?: unknown }).id;
            if (typeof entryId === 'string' && entryId === methodId) return true;
        }
    }
    return false;
};

const resolveIssuerJwk = async (
    learnCard: SdJwtVcDependentLearnCard,
    issuerDid: string,
    parsed: ParsedSdJwtVc
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

    const kid = typeof parsed.header.kid === 'string' ? parsed.header.kid : undefined;
    const method = findVerificationMethod(doc, kid, issuerDid);
    if (!method.publicKeyJwk) {
        throw new SdJwtVcError(
            'verification_method_not_found',
            `Verification method for "${issuerDid}" / kid "${kid ?? '(none)'}" has no publicKeyJwk`
        );
    }

    if (!isAuthorizedForAssertion(doc, method.id, issuerDid)) {
        throw new SdJwtVcError(
            'verification_method_not_authorized',
            `Verification method "${method.id ?? '(none)'}" is not in the assertionMethod set of issuer "${issuerDid}", so it cannot sign credentials per W3C DID Core §5.3.2`
        );
    }

    const jwk = method.publicKeyJwk as unknown as JWK;
    // header.alg is enforced as a non-empty string by parseSdJwtVc, so it is
    // the load-bearing source here; the JWK.alg and 'EdDSA' floors are purely
    // defensive against malformed inputs that bypass parse.
    const alg = parsed.header.alg || (jwk.alg as string | undefined) || 'EdDSA';
    return { jwk, alg };
};

const errorToMessage = (e: unknown): string => {
    if (e instanceof SdJwtVcError) return `${e.code}: ${e.message}`;
    if (e instanceof Error) return e.message;
    return String(e);
};

const ensureNotExpired = (
    expiresAt: Date | undefined,
    now: Date,
    errors: string[]
): void => {
    if (expiresAt && expiresAt.getTime() + CLOCK_SKEW_MS <= now.getTime()) {
        errors.push(`expired: Credential expired at ${expiresAt.toISOString()}`);
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
        if (skewMs > CLOCK_SKEW_MS) {
            errors.push(`not_yet_valid: Credential not valid until ${notBefore.toISOString()}`);
        } else {
            warnings.push(
                `nbf is in the future by ${skewMs}ms (within ${CLOCK_SKEW_MS}ms clock-skew tolerance)`
            );
        }
    }
};

export const verifySdJwtVc = async (
    learnCard: SdJwtVcDependentLearnCard,
    compact: string,
    options: VerifySdJwtVcOptions = {}
): Promise<VerificationCheck> => {
    const checks: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    if (options.audience !== undefined || options.nonce !== undefined) {
        errors.push(
            'audience_or_nonce_requires_kb_jwt: audience/nonce verification needs a Key Binding JWT, which is implemented in Slice 3 (presentation). Do not pass these options in the read path.'
        );
        return { checks, warnings, errors };
    }

    let parsed: ParsedSdJwtVc;
    try {
        parsed = await parseSdJwtVc(compact);
        checks.push('parse');
        checks.push('disclosure_hash_integrity');
    } catch (e) {
        return { checks, warnings, errors: [errorToMessage(e)] };
    }

    let issuerJwk: JWK;
    let issuerAlg: string;
    try {
        const resolved = await resolveIssuerJwk(learnCard, parsed.issuer, parsed);
        issuerJwk = resolved.jwk;
        issuerAlg = resolved.alg;
        checks.push('issuer_resolved');
    } catch (e) {
        return { checks, warnings, errors: [errorToMessage(e)] };
    }

    const { verifier, getLastError } = await createJoseVerifier(issuerJwk, issuerAlg);
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
        const joseError = getLastError();
        const detail = joseError?.message ?? (e instanceof Error ? e.message : String(e));
        errors.push(`signature_invalid: ${detail}`);
        return { checks, warnings, errors };
    }

    const now = options.now ? options.now() : new Date();

    if (options.expectedVct && parsed.vct !== options.expectedVct) {
        errors.push(`vct_mismatch: expected "${options.expectedVct}", got "${parsed.vct}"`);
    }

    ensureNotExpired(parsed.expiresAt, now, errors);
    ensureNotBefore(parsed.notBefore, now, warnings, errors);

    if (errors.length === 0) {
        if (options.expectedVct !== undefined) checks.push('vct');
        checks.push('expiration');
    }

    if (!options.skipStatusCheck && parsed.rawPayload.status !== undefined) {
        warnings.push('status_check_deferred: Token Status List checking lands in Slice 4');
    }

    return { checks, warnings, errors };
};
