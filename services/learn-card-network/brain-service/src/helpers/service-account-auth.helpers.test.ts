import { createHmac, createPrivateKey } from 'node:crypto';
import { SignJWT, decodeJwt, decodeProtectedHeader } from 'jose';
import { describe, expect, it } from 'vitest';
import { environment } from '@environment';
import {
    signServiceAccountToken,
    verifyServiceAccountToken,
    matchesRenewalSecret,
    renewalSecretVerifier,
    hasIntegrationTokenType,
} from './service-account-auth.helpers';

const account = {
    id: 'sa',
    installId: 'install',
    ecosystemId: 'eco',
    credentialGeneration: 1,
    status: 'ENABLED' as const,
    createdAt: new Date().toISOString(),
};

describe('integration token cryptography', () => {
    it('binds a keyed verifier to both account and secret', () => {
        const verifier = renewalSecretVerifier('sa', 'secret');
        expect(matchesRenewalSecret('sa', 'secret', verifier)).toBe(true);
        expect(matchesRenewalSecret('sa2', 'secret', verifier)).toBe(false);
        expect(matchesRenewalSecret('sa', 'wrong', verifier)).toBe(false);
        expect(matchesRenewalSecret('sa', 'secret', 'malformed')).toBe(false);
        expect(matchesRenewalSecret('sa', 'secret')).toBe(false);
    });
    it('signs a distinct, five-minute Ed25519 token and rejects tampering', async () => {
        const token = await signServiceAccountToken(account);
        const claims = await verifyServiceAccountToken(token);
        expect(claims.exp - claims.iat).toBe(300);
        expect(hasIntegrationTokenType(token)).toBe(true);
        expect(hasIntegrationTokenType('malformed')).toBe(false);
        const parts = token.split('.');
        parts[1] = Buffer.from(
            JSON.stringify({ ...decodeJwt(token), ecosystemId: 'forged' })
        ).toString('base64url');
        await expect(verifyServiceAccountToken(parts.join('.'))).rejects.toThrow(
            'Invalid integration token'
        );
    });
    it.each(['aud', 'expired', 'kid', 'typ'])(
        'rejects correctly signed tokens with invalid %s',
        async invalid => {
            const token = await signServiceAccountToken(account);
            const header = decodeProtectedHeader(token);
            const claims = decodeJwt(token);
            const seed = createHmac('sha256', environment.SEED)
                .update('educationos/v1/integration-signing')
                .digest();
            const key = createPrivateKey({
                key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]),
                type: 'pkcs8',
                format: 'der',
            });
            const bad = await new SignJWT({
                ...claims,
                ...(invalid === 'aud' ? { aud: 'learncard' } : {}),
                ...(invalid === 'expired' ? { exp: 1, iat: 0 } : {}),
            })
                .setProtectedHeader({
                    alg: 'EdDSA',
                    kid: invalid === 'kid' ? 'old-key' : header.kid,
                    typ: invalid === 'typ' ? 'JWT' : header.typ,
                })
                .sign(key);
            await expect(verifyServiceAccountToken(bad)).rejects.toThrow(
                'Invalid integration token'
            );
        }
    );
});
