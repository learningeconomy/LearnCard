import { randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify, errors as JoseErrors } from 'jose';

import type { HcpAccessTokenClaims } from './types';

const encoder = new TextEncoder();

export type TokenSignerConfig = {
    secret: string;
    issuerUrl: string;
    resourceUrl: string;
    /** Access token lifetime in seconds. Draft 3 §13.4 default 1 hour. */
    accessTokenTtlSeconds?: number;
};

export type MintAccessTokenInput = {
    grantId: string;
    clientDid: string;
    oauthClientId: string;
    scope: string;
    now?: Date;
};

const secretKey = (secret: string) => encoder.encode(secret);

export const mintAccessToken = async (
    config: TokenSignerConfig,
    input: MintAccessTokenInput
): Promise<{ accessToken: string; expiresIn: number; claims: HcpAccessTokenClaims }> => {
    const ttl = config.accessTokenTtlSeconds ?? 3600;
    const now = input.now ?? new Date();
    const iat = Math.floor(now.getTime() / 1000);
    const exp = iat + ttl;
    const claims: HcpAccessTokenClaims = {
        iss: config.issuerUrl.replace(/\/$/, ''),
        aud: config.resourceUrl.replace(/\/$/, ''),
        sub: input.clientDid,
        grant_id: input.grantId,
        client_id: input.oauthClientId,
        scope: input.scope,
        iat,
        exp,
        jti: randomUUID(),
    };

    const accessToken = await new SignJWT({
        grant_id: claims.grant_id,
        client_id: claims.client_id,
        scope: claims.scope,
    })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuer(claims.iss)
        .setAudience(claims.aud)
        .setSubject(claims.sub)
        .setIssuedAt(claims.iat)
        .setExpirationTime(claims.exp)
        .setJti(claims.jti)
        .sign(secretKey(config.secret));

    return { accessToken, expiresIn: ttl, claims };
};

export type VerifyAccessTokenResult =
    | { ok: true; claims: HcpAccessTokenClaims }
    | { ok: false; error: 'invalid_token' | 'expired_token' };

export const verifyAccessToken = async (
    config: TokenSignerConfig,
    token: string
): Promise<VerifyAccessTokenResult> => {
    try {
        const { payload } = await jwtVerify(token, secretKey(config.secret), {
            issuer: config.issuerUrl.replace(/\/$/, ''),
            audience: config.resourceUrl.replace(/\/$/, ''),
            algorithms: ['HS256'],
        });

        const grantId = payload.grant_id;
        const clientId = payload.client_id;
        const scope = payload.scope;
        if (
            typeof grantId !== 'string' ||
            typeof clientId !== 'string' ||
            typeof scope !== 'string' ||
            typeof payload.sub !== 'string' ||
            typeof payload.jti !== 'string' ||
            typeof payload.iss !== 'string' ||
            typeof payload.aud !== 'string' ||
            typeof payload.iat !== 'number' ||
            typeof payload.exp !== 'number'
        ) {
            return { ok: false, error: 'invalid_token' };
        }

        return {
            ok: true,
            claims: {
                iss: payload.iss,
                aud: typeof payload.aud === 'string' ? payload.aud : String(payload.aud),
                sub: payload.sub,
                grant_id: grantId,
                client_id: clientId,
                scope,
                iat: payload.iat,
                exp: payload.exp,
                jti: payload.jti,
            },
        };
    } catch (error) {
        if (error instanceof JoseErrors.JWTExpired) {
            return { ok: false, error: 'expired_token' };
        }
        return { ok: false, error: 'invalid_token' };
    }
};
