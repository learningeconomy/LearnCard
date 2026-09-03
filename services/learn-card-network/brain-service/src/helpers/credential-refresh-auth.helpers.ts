import crypto from 'crypto';

import jwtDecode from 'jwt-decode';

import cache from '@cache';
import { getEmptyLearnCard } from './learnCard.helpers';
import { enforceRateLimits } from './rateLimit.helpers';

/**
 * Holder authentication for the managed credential refresh endpoint
 * (LC-2117 / LC-2135 / LC-2136).
 *
 * The endpoint issues a short-lived, single-use challenge bound to the requested
 * refreshId. The wallet signs a DID-auth presentation (JWT VP with `nonce` =
 * challenge, `aud` = server domain) and retries with it as a bearer credential.
 * Verification checks the presentation proof, the challenge/domain binding, cache
 * membership (freshness + replay), and nothing else — the caller is responsible
 * for the holder-DID authorization check against the aggregate.
 *
 * Challenges are issued BEFORE any aggregate lookup so the 401 response can never
 * reveal whether a refreshId exists, who its holder is, or what lifecycle state
 * it is in.
 */

export const CREDENTIAL_REFRESH_AUTH_SCHEME = 'LearnCardDIDAuth';

const CHALLENGE_TTL_SECONDS = 300;
const CHALLENGE_BYTES = 32;
const RATE_LIMIT_WINDOW_SECONDS = 60;

export const CREDENTIAL_REFRESH_PRE_AUTH_RATE_LIMIT = 60;
export const CREDENTIAL_REFRESH_HOLDER_RATE_LIMIT = 120;

export const getCredentialRefreshChallengeCacheKey = (refreshId: string, challenge: string) =>
    `credentialRefreshChallenge|${refreshId}|${challenge}`;

export type CredentialRefreshChallengeBody = {
    challenge: string;
    expiresAt: string;
    domain?: string;
    scheme: typeof CREDENTIAL_REFRESH_AUTH_SCHEME;
};

/**
 * Issues a fresh single-use challenge for a refreshId. Contains no holder, issuer,
 * credential, or lifecycle information.
 */
export const issueCredentialRefreshChallenge = async (
    refreshId: string,
    domain: string
): Promise<CredentialRefreshChallengeBody> => {
    const challenge = crypto.randomBytes(CHALLENGE_BYTES).toString('base64url');

    await cache.set(
        getCredentialRefreshChallengeCacheKey(refreshId, challenge),
        'valid',
        CHALLENGE_TTL_SECONDS
    );

    return {
        challenge,
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000).toISOString(),
        domain,
        scheme: CREDENTIAL_REFRESH_AUTH_SCHEME,
    };
};

export type CredentialRefreshAuthResult =
    | { authenticated: true; holderDid: string }
    | { authenticated: false };

type DidAuthJwtPayload = {
    iss?: string;
    nonce?: string;
    aud?: string | string[];
    vp?: { holder?: string };
};

/**
 * Verifies a `Bearer <did-auth VP JWT>` authorization header for a refreshId.
 *
 * Rejects missing/malformed headers, unknown challenges (never issued, expired via
 * cache TTL, or already consumed), wrong audience/domain, and invalid proofs. A
 * challenge is invalidated only after the presentation fully verifies, so a
 * replayed bearer credential is always rejected.
 */
export const verifyCredentialRefreshAuthorization = async (
    refreshId: string,
    authorizationHeader: string | undefined,
    domain: string
): Promise<CredentialRefreshAuthResult> => {
    if (!authorizationHeader) return { authenticated: false };

    const [scheme, jwt] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !jwt) return { authenticated: false };

    let decoded: DidAuthJwtPayload;

    try {
        decoded = jwtDecode<DidAuthJwtPayload>(jwt);
    } catch {
        return { authenticated: false };
    }

    const challenge = decoded.nonce;
    const holderDid = decoded.vp?.holder;

    if (!challenge || !holderDid) return { authenticated: false };

    // Audience/domain binding: the VP must be addressed to this server.
    const aud = decoded.aud;
    const audiences = Array.isArray(aud) ? aud : aud ? [aud] : [];

    if (!audiences.includes(domain)) return { authenticated: false };

    // The nonce must be a live challenge this endpoint issued for this refreshId.
    const cacheKey = getCredentialRefreshChallengeCacheKey(refreshId, challenge);
    const cached = await cache.get(cacheKey);

    if (!cached) return { authenticated: false };

    try {
        const learnCard = await getEmptyLearnCard();

        const result = await learnCard.invoke.verifyPresentation(jwt, {
            proofFormat: 'jwt',
            challenge,
            domain,
        });

        if (
            result.warnings.length !== 0 ||
            result.errors.length !== 0 ||
            !result.checks.includes('JWS')
        ) {
            return { authenticated: false };
        }
    } catch {
        return { authenticated: false };
    }

    // Single-use: invalidate only after the presentation fully verifies.
    await cache.delete([cacheKey]);

    return { authenticated: true, holderDid };
};

/**
 * Coarse pre-authentication abuse limit keyed by network source and refreshId.
 * Throws when the limit is exhausted (callers map this to a non-disclosing 429).
 */
export const enforceCredentialRefreshPreAuthRateLimit = async (
    sourceIp: string,
    refreshId: string,
    limit: number = CREDENTIAL_REFRESH_PRE_AUTH_RATE_LIMIT
): Promise<void> =>
    enforceRateLimits([
        {
            key: `credentialRefresh|preAuth|${sourceIp}|${refreshId}`,
            limit,
            windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
            description: 'credential refresh pre-authentication requests',
        },
    ]);

/**
 * Post-authentication abuse limit keyed by authenticated holder DID and refreshId.
 * Throws when the limit is exhausted (callers map this to a non-disclosing 429).
 */
export const enforceCredentialRefreshHolderRateLimit = async (
    holderDid: string,
    refreshId: string,
    limit: number = CREDENTIAL_REFRESH_HOLDER_RATE_LIMIT
): Promise<void> =>
    enforceRateLimits([
        {
            key: `credentialRefresh|holder|${holderDid}|${refreshId}`,
            limit,
            windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
            description: 'credential refresh holder requests',
        },
    ]);
