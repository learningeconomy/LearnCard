/**
 * Transcript issuer assertion signer.
 *
 * Mints a short-lived, did:web-signed JWT that lca-api hands to a partner transcript
 * issuer alongside a transcript request. The issuer verifies the JWT against this
 * service's published `/.well-known/did.json` (`#owner` verification method, see
 * `src/dids.ts`) before trusting the claims it carries — no new key material is
 * created here, and the OIDC RSA signing key (`src/helpers/oidc.helpers.ts`) is a
 * separate, unrelated signer for a different protocol.
 *
 * Signing pattern mirrors `src/helpers/oidc.helpers.ts`'s `mintIdToken` (jose
 * `SignJWT`, absolute-epoch-seconds `iat`/`exp`), swapped from RS256 to EdDSA since
 * the issuer trusts this service's existing Ed25519 SEED key, not a new RSA key.
 */

import { randomUUID } from 'node:crypto';
import { SignJWT, importJWK } from 'jose';

import { getLearnCard } from '@helpers/learnCard.helpers';

/** Lifetime (seconds) of a signed issuer assertion. Replay protection keeps this short. */
export const ISSUER_ASSERTION_TTL_SECONDS = 300;

/** Body claims carried by a signed issuer assertion (beyond the standard JWT claims). */
export interface IssuerAssertionClaims {
    /** The student's DID. Becomes the JWT `sub` claim, never a body claim. */
    sub: string;
    /** This service's network profile id for the student, when one exists. */
    learncard_profile_id?: string;
    /** The issuing tenant's state/region code. Config-driven — never hardcode one. */
    state: string;
    /** The student's state-issued identifier, read server-side from the verified id_token. */
    state_student_id: string;
    /** The upstream SSO tenant id the student authenticated through. */
    classlink_tenant_id: string;
    /** `auth_time` (unix seconds) from the student's verified id_token. */
    classlink_auth_time: number;
    /** When the student opted in to the transcript request (unix seconds). */
    consent_at: number;
}

/** Options for {@link signIssuerAssertion}. */
export interface SignIssuerAssertionOptions {
    /** This service's public domain (e.g. a Fastify request's hostname). */
    domain: string;
    /** The partner issuer's expected `aud` value (`TRANSCRIPT_ISSUER_AUDIENCE`). */
    audience: string;
    /** Override "now" for deterministic tests/replay math. Defaults to `new Date()`. */
    now?: Date;
}

/** Result of {@link signIssuerAssertion}. */
export interface SignedIssuerAssertion {
    jwt: string;
    jti: string;
    exp: number;
}

/**
 * Derive this service's did:web identifier for a given public domain.
 *
 * Intentionally duplicated from `src/dids.ts`'s inline domain derivation rather than
 * extracted into a shared function: `dids.ts` derives its domain from a Fastify
 * request (with an offline/localhost fallback baked in), while this helper takes a
 * plain string from its caller. Sharing a function across those two call shapes
 * risked behavior drift in the already-shipped `/.well-known/did.json` route, which
 * the plan guardrails explicitly forbid. Keep the `:` → `%3A` encoding in sync by
 * hand if it ever changes.
 */
export const getServiceDidWeb = (domain: string): string =>
    `did:web:${domain.replace(/:/g, '%3A')}`;

/**
 * Sign a short-lived EdDSA JWT asserting a student's state-issued identifier to a
 * partner transcript issuer. Signed with this service's SEED-derived Ed25519 key —
 * the same key `src/dids.ts` publishes at `/.well-known/did.json` — never a new key.
 */
export const signIssuerAssertion = async (
    claims: IssuerAssertionClaims,
    opts: SignIssuerAssertionOptions
): Promise<SignedIssuerAssertion> => {
    const { domain, audience, now = new Date() } = opts;
    const { sub, ...bodyClaims } = claims;

    const didWeb = getServiceDidWeb(domain);
    const learnCard = await getLearnCard();
    // `learnCard.id.keypair('ed25519')` returns the SEED-derived Ed25519 JWK with its
    // private `d` component (see `packages/plugins/didkey/src/index.ts` /
    // `packages/learn-card-core/src/types/planes.ts`). It is synchronous, unlike the
    // async `getLearnCard()`/`getSigningAuthorityLearnCard` helpers above.
    const privateKey = await importJWK(learnCard.id.keypair('ed25519'), 'EdDSA');

    const jti = randomUUID();
    const iat = Math.floor(now.getTime() / 1000);
    const exp = iat + ISSUER_ASSERTION_TTL_SECONDS;

    const jwt = await new SignJWT(bodyClaims)
        .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT', kid: `${didWeb}#owner` })
        .setIssuer(didWeb)
        .setAudience(audience)
        .setSubject(sub)
        .setJti(jti)
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .sign(privateKey);

    return { jwt, jti, exp };
};
