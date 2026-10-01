import {
    createHash,
    createHmac,
    createPrivateKey,
    createPublicKey,
    timingSafeEqual,
} from 'node:crypto';
import { decodeProtectedHeader, jwtVerify, SignJWT } from 'jose';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { environment } from '@environment';
import type { ServiceAccount } from '@learncard/types';

export const INTEGRATION_TOKEN_TYPE = 'educationos-integration+jwt';
export const INTEGRATION_TOKEN_AUDIENCE = 'educationos-integration';
const ISSUER = 'educationos-platform';

// Brain's existing deployment seed is the root; domain separation prevents reuse
// of its DID signing key. Rotate the seed to rotate both this key and verifiers.
// kid is a public-key fingerprint: only the current kid is accepted (no overlap).
const deriveKey = (purpose: string): Buffer => {
    if (!environment.SEED) throw new Error('Brain signing seed is not configured');
    return createHmac('sha256', environment.SEED).update(`educationos/v1/${purpose}`).digest();
};

const signingKey = () => {
    const privateKey = createPrivateKey({
        key: Buffer.concat([
            Buffer.from('302e020100300506032b657004220420', 'hex'),
            deriveKey('integration-signing'),
        ]),
        format: 'der',
        type: 'pkcs8',
    });
    const publicKey = createPublicKey(privateKey);
    const kid = createHash('sha256')
        .update(publicKey.export({ format: 'der', type: 'spki' }))
        .digest('base64url');
    return { privateKey, publicKey, kid };
};

const Claims = z.object({
    sub: z.string().min(1),
    installId: z.string().min(1),
    ecosystemId: z.string().min(1),
    gen: z.number().int().nonnegative(),
    kid: z.string().min(1),
    iat: z.number().int(),
    exp: z.number().int(),
});
export type ServiceAccountClaims = z.infer<typeof Claims>;
export type ServiceAccountPrincipal = { token: string; claims: ServiceAccountClaims };

export const hasIntegrationTokenType = (token: string): boolean => {
    try {
        return decodeProtectedHeader(token).typ === INTEGRATION_TOKEN_TYPE;
    } catch {
        return false;
    }
};

export const verifyServiceAccountToken = async (token: string): Promise<ServiceAccountClaims> => {
    try {
        const { publicKey, kid } = signingKey();
        const { payload, protectedHeader } = await jwtVerify(token, publicKey, {
            algorithms: ['EdDSA'],
            audience: INTEGRATION_TOKEN_AUDIENCE,
            issuer: ISSUER,
            typ: INTEGRATION_TOKEN_TYPE,
            maxTokenAge: '5m',
            requiredClaims: ['sub', 'iat', 'exp', 'installId', 'ecosystemId', 'gen', 'kid'],
        });
        const claims = Claims.parse(payload);
        if (
            protectedHeader.kid !== kid ||
            claims.kid !== kid ||
            payload.aud !== INTEGRATION_TOKEN_AUDIENCE ||
            claims.exp - claims.iat > 300 ||
            claims.exp <= claims.iat
        )
            throw new Error('Invalid claims');
        return claims;
    } catch {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid integration token' });
    }
};

export const signServiceAccountToken = async (account: ServiceAccount): Promise<string> => {
    const { privateKey, kid } = signingKey();
    return new SignJWT({
        installId: account.installId,
        ecosystemId: account.ecosystemId,
        gen: account.credentialGeneration,
        kid,
    })
        .setProtectedHeader({ alg: 'EdDSA', typ: INTEGRATION_TOKEN_TYPE, kid })
        .setIssuer(ISSUER)
        .setAudience(INTEGRATION_TOKEN_AUDIENCE)
        .setSubject(account.id)
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(privateKey);
};

export const renewalSecretVerifier = (accountId: string, secret: string): string =>
    createHmac('sha256', deriveKey('renewal-verifier'))
        .update(JSON.stringify([accountId, secret]))
        .digest('hex');

export const matchesRenewalSecret = (
    accountId: string,
    secret: string,
    verifier?: string
): boolean => {
    const actual = Buffer.from(renewalSecretVerifier(accountId, secret), 'hex');
    const expected = Buffer.from(
        verifier && /^[a-f0-9]{64}$/.test(verifier) ? verifier : '0'.repeat(64),
        'hex'
    );
    return timingSafeEqual(actual, expected) && Boolean(verifier);
};
