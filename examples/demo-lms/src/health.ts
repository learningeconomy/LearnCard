import { importJWK, jwtVerify, type KeyLike } from 'jose';

import type { DemoLmsConfig } from './config';

const PROBE_TYPE = 'educationos-health+jwt';
const ISSUER = 'educationos-platform';

/**
 * Verifies a platform health challenge against the pinned key and this install's identity.
 * Returns the jti to echo, or null when the challenge must be rejected.
 */
export const verifyHealthChallenge = async (
    challenge: string | null,
    config: DemoLmsConfig,
    key?: KeyLike | Uint8Array
): Promise<string | null> => {
    if (!challenge) return null;
    try {
        const platformKey = key ?? (await importJWK(config.platformJwk, 'EdDSA'));
        const { payload, protectedHeader } = await jwtVerify(challenge, platformKey, {
            issuer: ISSUER,
            audience: config.healthUrl,
            typ: PROBE_TYPE,
            algorithms: ['EdDSA'],
        });
        if (
            protectedHeader.typ !== PROBE_TYPE ||
            payload.sub !== config.serviceAccountId ||
            payload.installId !== config.installId ||
            payload.ecosystemId !== config.ecosystemId ||
            typeof payload.jti !== 'string'
        ) {
            return null;
        }
        return payload.jti;
    } catch {
        return null;
    }
};
